import { useState, useRef, useCallback } from 'react';
import { useStore } from './store';
import type { WorkflowNode, WorkflowNodeType } from './store/workflows';
import './WorkflowCanvas.css';

interface DragState {
  nodeId: string | null;
  offset: { x: number; y: number };
}

interface ConnectionDrag {
  sourceNodeId: string;
  position: { x: number; y: number };
}

export default function WorkflowCanvas() {
  const workflows = useStore((s) => s.workflows);
  const activeWorkflowId = useStore((s) => s.activeWorkflowId);
  const updateNode = useStore((s) => s.updateNode);
  const removeNode = useStore((s) => s.removeNode);
  const addConnection = useStore((s) => s.addConnection);

  const [dragState, setDragState] = useState<DragState>({ nodeId: null, offset: { x: 0, y: 0 } });
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDrag | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNodeId(null);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = activeWorkflow?.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setSelectedNodeId(nodeId);
    setDragState({
      nodeId,
      offset: {
        x: e.clientX - node.position.x,
        y: e.clientY - node.position.y,
      },
    });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragState.nodeId && activeWorkflowId) {
        const newX = e.clientX - dragState.offset.x;
        const newY = e.clientY - dragState.offset.y;
        const node = activeWorkflow?.nodes.find((n) => n.id === dragState.nodeId);
        if (node) {
          updateNode(activeWorkflowId, {
            ...node,
            position: { x: newX, y: newY },
          });
        }
      }
      if (connectionDrag) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setConnectionDrag({
            ...connectionDrag,
            position: { x: e.clientX - rect.left, y: e.clientY - rect.top },
          });
        }
      }
    },
    [dragState, activeWorkflowId, activeWorkflow, updateNode, connectionDrag]
  );

  const handleMouseUp = () => {
    setDragState({ nodeId: null, offset: { x: 0, y: 0 } });
    setConnectionDrag(null);
  };

  const handleConnectionStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = activeWorkflow?.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setConnectionDrag({
      sourceNodeId: nodeId,
      position: { x: node.position.x + 100, y: node.position.y + 30 },
    });
  };

  const handleConnectionEnd = (targetNodeId: string) => {
    if (connectionDrag && activeWorkflowId) {
      const connectionId = `${connectionDrag.sourceNodeId}-${targetNodeId}-${Date.now()}`;
      addConnection(activeWorkflowId, {
        id: connectionId,
        source: connectionDrag.sourceNodeId,
        target: targetNodeId,
      });
    }
    setConnectionDrag(null);
  };

  const handleDeleteNode = () => {
    if (selectedNodeId && activeWorkflowId) {
      removeNode(activeWorkflowId, selectedNodeId);
      setSelectedNodeId(null);
    }
  };

  const getNodeColor = (type: WorkflowNodeType): string => {
    const colors: Record<WorkflowNodeType, string> = {
      start: '#00ff00',
      action: '#00aaff',
      delay: '#ffaa00',
      condition: '#ff00ff',
      loop: '#aa00ff',
      midi_send: '#ff0088',
      macro_call: '#00ffaa',
      end: '#ff0000',
    };
    return colors[type] || '#888888';
  };

  const getNodeLabel = (node: WorkflowNode): string => {
    if (node.data.label) return node.data.label;
    const labels: Record<WorkflowNodeType, string> = {
      start: 'START',
      action: 'Action',
      delay: `Delay ${node.data.delay || 100}ms`,
      condition: 'Condition',
      loop: `Loop x${node.data.iterations || 1}`,
      midi_send: 'MIDI Out',
      macro_call: 'Call Macro',
      end: 'END',
    };
    return labels[node.type];
  };

  if (!activeWorkflow) {
    return (
      <div className="workflow-canvas-empty">
        <p>No workflow selected. Create or select a workflow to begin.</p>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className="workflow-canvas"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Render connections */}
      <svg className="workflow-connections">
        {activeWorkflow.connections.map((conn) => {
          const sourceNode = activeWorkflow.nodes.find((n) => n.id === conn.source);
          const targetNode = activeWorkflow.nodes.find((n) => n.id === conn.target);
          if (!sourceNode || !targetNode) return null;

          const x1 = sourceNode.position.x + 100;
          const y1 = sourceNode.position.y + 30;
          const x2 = targetNode.position.x;
          const y2 = targetNode.position.y + 30;

          const midX = (x1 + x2) / 2;

          return (
            <g key={conn.id}>
              <path
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                stroke="var(--highlight)"
                strokeWidth="2"
                fill="none"
                className="workflow-connection-path"
              />
              <circle
                cx={x2}
                cy={y2}
                r="4"
                fill="var(--highlight)"
              />
            </g>
          );
        })}
        {/* Drag connection preview */}
        {connectionDrag && (
          <line
            x1={
              activeWorkflow.nodes.find((n) => n.id === connectionDrag.sourceNodeId)?.position.x! + 100
            }
            y1={
              activeWorkflow.nodes.find((n) => n.id === connectionDrag.sourceNodeId)?.position.y! + 30
            }
            x2={connectionDrag.position.x}
            y2={connectionDrag.position.y}
            stroke="var(--highlight)"
            strokeWidth="2"
            strokeDasharray="4"
          />
        )}
      </svg>

      {/* Render nodes */}
      {activeWorkflow.nodes.map((node) => (
        <div
          key={node.id}
          className={`workflow-node ${selectedNodeId === node.id ? 'selected' : ''}`}
          style={{
            left: node.position.x,
            top: node.position.y,
            borderColor: getNodeColor(node.type),
          }}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
        >
          <div className="workflow-node-header" style={{ background: getNodeColor(node.type) }}>
            <span className="workflow-node-type">{node.type.toUpperCase()}</span>
            <div className="workflow-node-actions">
              <button
                className="workflow-node-connect"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleConnectionStart(e, node.id);
                }}
                title="Create connection"
              >
                →
              </button>
            </div>
          </div>
          <div className="workflow-node-body">
            <div className="workflow-node-label">{getNodeLabel(node)}</div>
          </div>
          {/* Connection target */}
          <div
            className="workflow-node-input"
            onMouseUp={(e) => {
              e.stopPropagation();
              handleConnectionEnd(node.id);
            }}
          />
        </div>
      ))}

      {/* Delete button */}
      {selectedNodeId && (
        <div className="workflow-toolbar" style={{ position: 'absolute', top: 10, right: 10 }}>
          <button className="retro-button btn-sm" onClick={handleDeleteNode}>
            DELETE NODE
          </button>
        </div>
      )}
    </div>
  );
}
