import React from 'react';

interface Props {
  onClose: () => void;
}

export default function MacroInstructions({ onClose }: Props) {
  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content modal-retro">
          <div className="modal-header">
            <h5 className="modal-title">MACRO HELP</h5>
          </div>
          <div className="modal-body">
            <p>
              Macros automate actions when triggered by pads. Each macro is one
              of the following types:
            </p>
            <ul>
              <li>
                <strong>Keys</strong> – sends a space separated key sequence to
                the operating system with a configurable delay between keys.
              </li>
              <li>
                <strong>Application</strong> – launches an application or file
                path.
              </li>
              <li>
                <strong>Shell</strong> – executes a command via the system
                shell.
              </li>
              <li>
                <strong>Shell (Window)</strong> – spawns a command in a visible
                terminal window.
              </li>
              <li>
                <strong>Shell (Hidden)</strong> – runs a shell command without a
                window.
              </li>
            </ul>
            <p>
              Build new macros using the <em>Macro Builder</em> or load existing
              ones using the import option in the sequencer. Macros are stored
              in your browser so you can export them as a JSON file for sharing
              or backup.
            </p>
          </div>
          <div className="modal-footer">
            <button className="retro-button" onClick={onClose}>
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
