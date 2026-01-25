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
  MidiDevices {
    inputs: Vec::new(),
    outputs: Vec::new(),
  }
}

#[tauri::command(rename_all = "camelCase")]
fn midi_send(port_id: String, _bytes: Vec<u8>) -> Result<(), String> {
  if port_id.trim().is_empty() {
    return Err("port_id is required".to_string());
  }
  Ok(())
}
