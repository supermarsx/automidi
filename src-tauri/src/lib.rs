use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use enigo::KeyboardControllable;
use tauri::{AppHandle, Emitter, Manager, State};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      ping,
      midi_list_devices,
      midi_send,
      midi_set_listening,
      run_app,
      run_shell,
      run_shell_bg,
      run_shell_win,
      keys_type,
      notify
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      app.handle().plugin(tauri_plugin_notification::init())?;

      let state = AppState::from_env();
      app.manage(state);
      start_device_watcher(app.handle().clone());

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn ping(ts: Option<u64>) -> u64 {
  ts.unwrap_or_else(now_ms)
}

fn now_ms() -> u64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis() as u64
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct MidiDevice {
  id: String,
  name: String,
  manufacturer: Option<String>,
  state: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct MidiDevices {
  inputs: Vec<MidiDevice>,
  outputs: Vec<MidiDevice>,
}

#[derive(serde::Serialize, Clone)]
struct DevicesMessage {
  r#type: &'static str,
  inputs: Vec<MidiDevice>,
  outputs: Vec<MidiDevice>,
}

#[derive(serde::Serialize, Clone)]
struct MidiEventMessage {
  r#type: &'static str,
  direction: &'static str,
  message: Vec<u8>,
  timestamp: u64,
  source: Option<String>,
  target: Option<String>,
  port: Option<String>,
  pressure: Option<u8>,
}

#[derive(serde::Serialize, Clone)]
struct ShellOutputMessage {
  r#type: &'static str,
  cmd: String,
  stream: &'static str,
  data: String,
}

struct TokenBucket {
  count: usize,
  last: Instant,
}

impl TokenBucket {
  fn new() -> Self {
    Self {
      count: 0,
      last: Instant::now(),
    }
  }

  fn consume(&mut self, limit: usize, interval_ms: u64) -> bool {
    let now = Instant::now();
    if now.duration_since(self.last) > Duration::from_millis(interval_ms) {
      self.count = 0;
      self.last = now;
    }
    if self.count >= limit {
      return false;
    }
    self.count += 1;
    true
  }
}

struct MidiRuntime {
  listening: bool,
  input_connections: Vec<midir::MidiInputConnection<()>>,
  last_signature: String,
}

impl Default for MidiRuntime {
  fn default() -> Self {
    Self {
      listening: false,
      input_connections: Vec::new(),
      last_signature: String::new(),
    }
  }
}

struct AppState {
  allowed_cmds: Vec<String>,
  cmd_rate_limit: usize,
  cmd_rate_interval_ms: u64,
  cmd_bucket: Mutex<TokenBucket>,
  midi: Mutex<MidiRuntime>,
}

impl AppState {
  fn from_env() -> Self {
    let allowed_cmds = std::env::var("ALLOWED_CMDS")
      .unwrap_or_default()
      .split(',')
      .map(|cmd| cmd.trim().to_string())
      .filter(|cmd| !cmd.is_empty())
      .collect();

    let cmd_rate_limit = std::env::var("CMD_RATE_LIMIT")
      .ok()
      .and_then(|value| value.parse::<usize>().ok())
      .unwrap_or(5);
    let cmd_rate_interval_ms = std::env::var("CMD_RATE_INTERVAL_MS")
      .ok()
      .and_then(|value| value.parse::<u64>().ok())
      .unwrap_or(1000);

    Self {
      allowed_cmds,
      cmd_rate_limit,
      cmd_rate_interval_ms,
      cmd_bucket: Mutex::new(TokenBucket::new()),
      midi: Mutex::new(MidiRuntime::default()),
    }
  }

  fn check_rate_limit(&self) -> bool {
    if let Ok(mut bucket) = self.cmd_bucket.lock() {
      return bucket.consume(self.cmd_rate_limit, self.cmd_rate_interval_ms);
    }
    false
  }
}

fn list_devices_internal() -> MidiDevices {
  let input = match midir::MidiInput::new("automidi") {
    Ok(input) => input,
    Err(err) => {
      eprintln!("Failed to init MIDI input: {err}");
      return MidiDevices {
        inputs: Vec::new(),
        outputs: Vec::new(),
      };
    }
  };
  let output = match midir::MidiOutput::new("automidi") {
    Ok(output) => output,
    Err(err) => {
      eprintln!("Failed to init MIDI output: {err}");
      return MidiDevices {
        inputs: Vec::new(),
        outputs: Vec::new(),
      };
    }
  };

  let inputs = input
    .ports()
    .iter()
    .enumerate()
    .map(|(idx, port)| MidiDevice {
      id: idx.to_string(),
      name: input.port_name(port).unwrap_or_else(|_| "Unknown".to_string()),
      manufacturer: None,
      state: None,
    })
    .collect();

  let outputs = output
    .ports()
    .iter()
    .enumerate()
    .map(|(idx, port)| MidiDevice {
      id: idx.to_string(),
      name: output.port_name(port).unwrap_or_else(|_| "Unknown".to_string()),
      manufacturer: None,
      state: None,
    })
    .collect();

  MidiDevices { inputs, outputs }
}

fn signature_for_devices(devices: &MidiDevices) -> String {
  let mut entries: Vec<String> = Vec::new();
  for input in &devices.inputs {
    entries.push(format!("in:{}:{}", input.id, input.name));
  }
  for output in &devices.outputs {
    entries.push(format!("out:{}:{}", output.id, output.name));
  }
  entries.join("|")
}

#[tauri::command]
fn midi_list_devices() -> MidiDevices {
  list_devices_internal()
}

#[tauri::command(rename_all = "camelCase")]
fn midi_send(
  app: AppHandle,
  port_id: String,
  bytes: Vec<u8>,
) -> Result<(), String> {
  if port_id.trim().is_empty() {
    return Err("port_id is required".to_string());
  }
  let port_index = port_id
    .parse::<usize>()
    .map_err(|_| "port_id must be a numeric index".to_string())?;

  let output = midir::MidiOutput::new("automidi")
    .map_err(|err| format!("Failed to init MIDI output: {err}"))?;
  let ports = output.ports();
  let port = ports
    .get(port_index)
    .ok_or_else(|| format!("output port index {port_index} not found"))?;

  let mut conn = output
    .connect(port, "automidi-send")
    .map_err(|err| format!("Failed to connect MIDI output: {err}"))?;

  conn
    .send(&bytes)
    .map_err(|err| format!("Failed to send MIDI: {err}"))?;

  let message = MidiEventMessage {
    r#type: "midi",
    direction: "out",
    message: bytes,
    timestamp: now_ms(),
    source: None,
    target: None,
    port: Some(port_id),
    pressure: None,
  };
  let _ = app.emit("midi:event", message);

  Ok(())
}

#[tauri::command(rename_all = "camelCase")]
fn midi_set_listening(
  app: AppHandle,
  state: State<AppState>,
  enabled: bool,
) -> Result<(), String> {
  let mut midi = state
    .midi
    .lock()
    .map_err(|_| "failed to lock MIDI state".to_string())?;

  if !enabled {
    midi.listening = false;
    midi.input_connections.clear();
    return Ok(());
  }

  midi.listening = true;
  midi.input_connections.clear();
  rebuild_input_connections(&app, &mut midi)?;
  Ok(())
}

fn rebuild_input_connections(
  app: &AppHandle,
  runtime: &mut MidiRuntime,
) -> Result<(), String> {
  let probe = midir::MidiInput::new("automidi")
    .map_err(|err| format!("Failed to init MIDI input: {err}"))?;
  let port_count = probe.ports().len();
  let mut connections: Vec<midir::MidiInputConnection<()>> = Vec::new();

  for idx in 0..port_count {
    let mut input = midir::MidiInput::new("automidi")
      .map_err(|err| format!("Failed to init MIDI input: {err}"))?;
    input.ignore(midir::Ignore::None);
    let ports = input.ports();
    let port = ports
      .get(idx)
      .ok_or_else(|| format!("input port index {idx} not found"))?;
    let port_id = idx.to_string();
    let port_name = input
      .port_name(port)
      .unwrap_or_else(|_| "Unknown".to_string());
    let app_handle = app.clone();
    let port_id_clone = port_id.clone();
    let port_name_clone = port_name.clone();

    let connection = input
      .connect(
        port,
        "automidi-input",
        move |_timestamp, message, _| {
          let pressure = if message.len() >= 3
            && (message[0] & 0xf0 == 0xa0 || message[0] & 0xf0 == 0xd0)
          {
            Some(message[2])
          } else {
            None
          };
          let event = MidiEventMessage {
            r#type: "midi",
            direction: "in",
            message: message.to_vec(),
            timestamp: now_ms(),
            source: Some(port_name_clone.clone()),
            target: None,
            port: Some(port_id_clone.clone()),
            pressure,
          };
          let _ = app_handle.emit("midi:event", event);
        },
        (),
      )
      .map_err(|err| format!("Failed to connect MIDI input: {err}"))?;

    connections.push(connection);
  }

  runtime.input_connections = connections;
  Ok(())
}

fn start_device_watcher(app: AppHandle) {
  std::thread::spawn(move || loop {
    let devices = list_devices_internal();
    let signature = signature_for_devices(&devices);

    let should_emit = {
      if let Ok(mut midi) = app.state::<AppState>().midi.lock() {
        if midi.last_signature != signature {
          midi.last_signature = signature.clone();
          true
        } else {
          false
        }
      } else {
        false
      }
    };

    if should_emit {
      let message = DevicesMessage {
        r#type: "devices",
        inputs: devices.inputs.clone(),
        outputs: devices.outputs.clone(),
      };
      let _ = app.emit("midi:devices", message);

      if let Ok(mut midi) = app.state::<AppState>().midi.lock() {
        if midi.listening {
          midi.input_connections.clear();
          let _ = rebuild_input_connections(&app, &mut midi);
        }
      }
    }

    std::thread::sleep(Duration::from_millis(1500));
  });
}

#[tauri::command]
fn run_app(state: State<AppState>, app_path: String) -> Result<(), String> {
  if !state.check_rate_limit() {
    return Err("command rate limit exceeded".to_string());
  }
  if !is_valid_cmd(&app_path, &state.allowed_cmds) {
    return Err("command not allowed".to_string());
  }
  Command::new(app_path)
    .spawn()
    .map_err(|err| format!("Failed to launch app: {err}"))?;
  Ok(())
}

#[tauri::command]
fn run_shell(
  app: AppHandle,
  state: State<AppState>,
  cmd: String,
) -> Result<(), String> {
  if !state.check_rate_limit() {
    return Err("command rate limit exceeded".to_string());
  }
  if !is_valid_cmd(&cmd, &state.allowed_cmds) {
    return Err("command not allowed".to_string());
  }

  let mut child = command_for_shell(&cmd, ShellMode::Foreground)
    .stdout(Stdio::piped())
    .stderr(Stdio::piped())
    .spawn()
    .map_err(|err| format!("Failed to spawn shell: {err}"))?;

  if let Some(stdout) = child.stdout.take() {
    let app_handle = app.clone();
    let cmd_clone = cmd.clone();
    std::thread::spawn(move || {
      let reader = BufReader::new(stdout);
      for line in reader.lines().flatten() {
        let message = ShellOutputMessage {
          r#type: "shellOutput",
          cmd: cmd_clone.clone(),
          stream: "stdout",
          data: line,
        };
        let _ = app_handle.emit("shell:output", message);
      }
    });
  }

  if let Some(stderr) = child.stderr.take() {
    let app_handle = app.clone();
    let cmd_clone = cmd.clone();
    std::thread::spawn(move || {
      let reader = BufReader::new(stderr);
      for line in reader.lines().flatten() {
        let message = ShellOutputMessage {
          r#type: "shellOutput",
          cmd: cmd_clone.clone(),
          stream: "stderr",
          data: line,
        };
        let _ = app_handle.emit("shell:output", message);
      }
    });
  }

  Ok(())
}

#[tauri::command]
fn run_shell_bg(state: State<AppState>, cmd: String) -> Result<(), String> {
  if !state.check_rate_limit() {
    return Err("command rate limit exceeded".to_string());
  }
  if !is_valid_cmd(&cmd, &state.allowed_cmds) {
    return Err("command not allowed".to_string());
  }
  command_for_shell(&cmd, ShellMode::Background)
    .spawn()
    .map_err(|err| format!("Failed to spawn shell: {err}"))?;
  Ok(())
}

#[tauri::command]
fn run_shell_win(state: State<AppState>, cmd: String) -> Result<(), String> {
  if !state.check_rate_limit() {
    return Err("command rate limit exceeded".to_string());
  }
  if !is_valid_cmd(&cmd, &state.allowed_cmds) {
    return Err("command not allowed".to_string());
  }
  command_for_shell(&cmd, ShellMode::Windowed)
    .spawn()
    .map_err(|err| format!("Failed to spawn shell: {err}"))?;
  Ok(())
}

#[tauri::command(rename_all = "camelCase")]
fn keys_type(sequence: Vec<String>, interval: Option<u64>) -> Result<(), String> {
  let mut enigo = enigo::Enigo::new();
  let delay = interval.unwrap_or(50);

  for key in sequence {
    if let Some(mapped) = map_key(&key) {
      enigo.key_click(mapped);
    } else {
      enigo.key_sequence(&key);
    }
    if delay > 0 {
      std::thread::sleep(Duration::from_millis(delay));
    }
  }
  Ok(())
}

#[tauri::command]
fn notify(app: AppHandle, title: Option<String>, message: String) -> Result<(), String> {
  use tauri_plugin_notification::NotificationExt;

  let title_text = title.unwrap_or_else(|| "Automidi".to_string());
  app
    .notification()
    .builder()
    .title(title_text)
    .body(message)
    .show()
    .map_err(|err| format!("Failed to show notification: {err}"))?;
  Ok(())
}

fn map_key(input: &str) -> Option<enigo::Key> {
  match input.trim().to_lowercase().as_str() {
    "enter" | "return" => Some(enigo::Key::Return),
    "tab" => Some(enigo::Key::Tab),
    "space" => Some(enigo::Key::Space),
    "backspace" => Some(enigo::Key::Backspace),
    "escape" | "esc" => Some(enigo::Key::Escape),
    "up" => Some(enigo::Key::UpArrow),
    "down" => Some(enigo::Key::DownArrow),
    "left" => Some(enigo::Key::LeftArrow),
    "right" => Some(enigo::Key::RightArrow),
    _ => None,
  }
}

enum ShellMode {
  Foreground,
  Background,
  Windowed,
}

fn command_for_shell(cmd: &str, mode: ShellMode) -> Command {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let mut command = Command::new("cmd");
    command.args(["/C", cmd]);

    if matches!(mode, ShellMode::Background) {
      command.creation_flags(CREATE_NO_WINDOW);
    }

    command
  }

  #[cfg(not(target_os = "windows"))]
  {
    let mut command = Command::new("sh");
    command.args(["-c", cmd]);
    let _ = mode;
    command
  }
}

fn is_valid_cmd(cmd: &str, allowed_cmds: &[String]) -> bool {
  let trimmed = cmd.trim();
  if trimmed.is_empty() {
    return false;
  }
  if trimmed
    .chars()
    .any(|c| matches!(c, ';' | '&' | '|' | '<' | '>' | '`' | '$' | '\r' | '\n'))
  {
    return false;
  }

  let base = if trimmed.starts_with('"') {
    trimmed[1..]
      .split('"')
      .next()
      .unwrap_or("")
      .to_string()
  } else {
    trimmed
      .split_whitespace()
      .next()
      .unwrap_or("")
      .to_string()
  };

  allowed_cmds.iter().any(|cmd| cmd == &base)
}

#[cfg(test)]
mod tests {
  use super::is_valid_cmd;

  #[test]
  fn valid_cmd_requires_allowlist_match() {
    let allowed = vec!["ffmpeg".to_string(), "ls".to_string()];
    assert!(is_valid_cmd("ffmpeg -i input.wav output.mp3", &allowed));
    assert!(!is_valid_cmd("convert input.png output.jpg", &allowed));
  }

  #[test]
  fn valid_cmd_rejects_injection_chars() {
    let allowed = vec!["ffmpeg".to_string()];
    assert!(!is_valid_cmd("ffmpeg && rm -rf /", &allowed));
    assert!(!is_valid_cmd("ffmpeg | cat", &allowed));
  }
}
