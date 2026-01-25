#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      ping,
      midi_list_devices,
      midi_send
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn ping(ts: Option<u64>) -> u64 {
  ts.unwrap_or_else(|| {
    std::time::SystemTime::now()
      .duration_since(std::time::UNIX_EPOCH)
      .unwrap_or_default()
      .as_millis() as u64
  })
}

#[derive(serde::Serialize, serde::Deserialize)]
struct MidiDevice {
  id: String,
  name: String,
  manufacturer: Option<String>,
  state: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct MidiDevices {
  inputs: Vec<MidiDevice>,
  outputs: Vec<MidiDevice>,
}

#[tauri::command]
fn midi_list_devices() -> MidiDevices {
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

#[tauri::command(rename_all = "camelCase")]
fn midi_send(port_id: String, bytes: Vec<u8>) -> Result<(), String> {
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
  Ok(())
}
