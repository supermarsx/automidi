import { useState } from 'react';
import { useStore } from './store';
import type { Workflow, WorkflowNodeType } from './store/workflows';
import WorkflowCanvas from './WorkflowCanvas';
import { useToastStore } from './toastStore';
import './WorkflowManager.css';

const NODE_TYPES: Array<{ type: WorkflowNodeType; label: string; icon: string }> = [
  { type: 'start', label: 'Start', icon: '▶' },
  { type: 'action', label: 'Action', icon: '⚡' },
  { type: 'delay', label: 'Delay', icon: '⏱' },
  { type: 'condition', label: 'Condition', icon: '❓' },
  { type: 'loop', label: 'Loop', icon: '🔄' },
  { type: 'midi_send', label: 'MIDI Out', icon: '🎹' },
  { type: 'macro_call', label: 'Call Macro', icon: '📋' },
  { type: 'end', label: 'End', icon: '⏹' },
];

export default function WorkflowManager() {
  const workflows = useStore((s) => s.workflows);
  const activeWorkflowId = useStore((s) => s.activeWorkflowId);
  const addWorkflow = useStore((s) => s.addWorkflow);
  const removeWorkflow = useStore((s) => s.removeWorkflow);
  const setActiveWorkflow = useStore((s) => s.setActiveWorkflow);
  const addNode = useStore((s) => s.addNode);
  const addToast = useToastStore((s) => s.addToast);
  const macros = useStore((s) => s.macros);

  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<WorkflowNodeType>('action');
  const [nodeConfig, setNodeConfig] = useState({
    label: '',
    macroId: '',
    delay: 100,
    iterations: 1,
    midiBytes: '',
  });

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId);

  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) {
      addToast('Please enter a workflow name', 'error');
      return;
    }
    const workflow: Workflow = {
      id: Date.now().toString(),
      name: newWorkflowName.trim(),
      nodes: [],
      connections: [],
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addWorkflow(workflow);
    setActiveWorkflow(workflow.id);
    setNewWorkflowName('');
    setShowCreateForm(false);
    addToast(`Workflow "${workflow.name}" created`, 'success');
  };

  const handleDeleteWorkflow = (id: string) => {
    const workflow = workflows.find((w) => w.id === id);
    if (workflow && confirm(`Delete workflow "${workflow.name}"?`)) {
      removeWorkflow(id);
      addToast(`Workflow deleted`, 'success');
    }
  };

  const handleAddNode = () => {
    if (!activeWorkflowId) {
      addToast('Please select a workflow first', 'error');
      return;
    }

    const nodeData: any = { label: nodeConfig.label || undefined };

    if (selectedNodeType === 'macro_call') {
      if (!nodeConfig.macroId) {
        addToast('Please select a macro', 'error');
        return;
      }
      nodeData.macroId = nodeConfig.macroId;
    } else if (selectedNodeType === 'delay') {
      nodeData.delay = nodeConfig.delay;
    } else if (selectedNodeType === 'loop') {
      nodeData.iterations = nodeConfig.iterations;
    } else if (selectedNodeType === 'midi_send') {
      if (!nodeConfig.midiBytes.trim()) {
        addToast('Please enter MIDI bytes', 'error');
        return;
      }
      try {
        const bytes = nodeConfig.midiBytes
          .split(/[,\s]+/)
          .map((b) => parseInt(b.trim(), 16))
          .filter((b) => !isNaN(b) && b >= 0 && b <= 255);
        if (bytes.length === 0) throw new Error();
        nodeData.midiBytes = bytes;
      } catch {
        addToast('Invalid MIDI bytes format', 'error');
        return;
      }
    }

    const existingNodes = activeWorkflow?.nodes || [];
    const xOffset = (existingNodes.length % 4) * 250 + 50;
    const yOffset = Math.floor(existingNodes.length / 4) * 150 + 50;

    addNode(activeWorkflowId, {
      id: `node-${Date.now()}`,
      type: selectedNodeType,
      position: { x: xOffset, y: yOffset },
      data: nodeData,
    });

    setNodeConfig({
      label: '',
      macroId: '',
      delay: 100,
      iterations: 1,
      midiBytes: '',
    });
    addToast('Node added', 'success');
  };

  return (
    <div className="workflow-manager">
      <div className="workflow-header">
        <h3>🎼 MACRO WORKFLOWS</h3>
        <button
          className="retro-button btn-sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'CANCEL' : 'NEW WORKFLOW'}
        </button>
      </div>

      {showCreateForm && (
        <div className="workflow-create-form">
          <input
            className="form-control retro-input"
            placeholder="Workflow name"
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
          />
          <button className="retro-button" onClick={handleCreateWorkflow}>
            CREATE
          </button>
        </div>
      )}

      <div className="workflow-list">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className={`workflow-item ${workflow.id === activeWorkflowId ? 'active' : ''}`}
            onClick={() => setActiveWorkflow(workflow.id)}
          >
            <div className="workflow-item-info">
              <span className="workflow-item-name">{workflow.name}</span>
              <span className="workflow-item-meta">
                {workflow.nodes.length} nodes • {workflow.connections.length} connections
              </span>
            </div>
            <button
              className="retro-button btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteWorkflow(workflow.id);
              }}
            >
              DEL
            </button>
          </div>
        ))}
      </div>

      <div className="workflow-content">
        <div className="workflow-sidebar">
          <h4>ADD NODE</h4>
          <div className="node-palette">
            {NODE_TYPES.map((nodeType) => (
              <button
                key={nodeType.type}
                className={`node-palette-item ${selectedNodeType === nodeType.type ? 'active' : ''}`}
                onClick={() => setSelectedNodeType(nodeType.type)}
              >
                <span className="node-palette-icon">{nodeType.icon}</span>
                <span className="node-palette-label">{nodeType.label}</span>
              </button>
            ))}
          </div>

          <div className="node-config">
            <input
              className="form-control retro-input mb-2"
              placeholder="Node label (optional)"
              value={nodeConfig.label}
              onChange={(e) => setNodeConfig({ ...nodeConfig, label: e.target.value })}
            />

            {selectedNodeType === 'delay' && (
              <input
                type="number"
                className="form-control retro-input mb-2"
                placeholder="Delay (ms)"
                value={nodeConfig.delay}
                onChange={(e) =>
                  setNodeConfig({ ...nodeConfig, delay: parseInt(e.target.value) || 100 })
                }
              />
            )}

            {selectedNodeType === 'loop' && (
              <input
                type="number"
                className="form-control retro-input mb-2"
                placeholder="Iterations"
                value={nodeConfig.iterations}
                onChange={(e) =>
                  setNodeConfig({ ...nodeConfig, iterations: parseInt(e.target.value) || 1 })
                }
              />
            )}

            {selectedNodeType === 'macro_call' && (
              <select
                className="form-control retro-select mb-2"
                value={nodeConfig.macroId}
                onChange={(e) => setNodeConfig({ ...nodeConfig, macroId: e.target.value })}
              >
                <option value="">Select macro...</option>
                {macros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            {selectedNodeType === 'midi_send' && (
              <input
                className="form-control retro-input mb-2"
                placeholder="MIDI bytes (hex, e.g., 90 3C 7F)"
                value={nodeConfig.midiBytes}
                onChange={(e) => setNodeConfig({ ...nodeConfig, midiBytes: e.target.value })}
              />
            )}

            <button className="retro-button w-100" onClick={handleAddNode}>
              ADD TO CANVAS
            </button>
          </div>
        </div>

        <div className="workflow-canvas-container">
          <WorkflowCanvas />
        </div>
      </div>
    </div>
  );
}
