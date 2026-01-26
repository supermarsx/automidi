import { type StateCreator } from 'zustand';
import type { StoreState } from './index';

export type WorkflowNodeType =
  | 'start'
  | 'action'
  | 'delay'
  | 'condition'
  | 'loop'
  | 'midi_send'
  | 'macro_call'
  | 'end';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: {
    label?: string;
    // Action node
    macroId?: string;
    // Delay node
    delay?: number;
    // Condition node
    condition?: string;
    // Loop node
    iterations?: number;
    // MIDI send node
    midiBytes?: number[];
  };
}

export interface WorkflowConnection {
  id: string;
  source: string; // node id
  target: string; // node id
  sourcePort?: string;
  targetPort?: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowsSlice {
  workflows: Workflow[];
  activeWorkflowId: string | null;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (workflow: Workflow) => void;
  removeWorkflow: (id: string) => void;
  setActiveWorkflow: (id: string | null) => void;
  addNode: (workflowId: string, node: WorkflowNode) => void;
  updateNode: (workflowId: string, node: WorkflowNode) => void;
  removeNode: (workflowId: string, nodeId: string) => void;
  addConnection: (workflowId: string, connection: WorkflowConnection) => void;
  removeConnection: (workflowId: string, connectionId: string) => void;
}

export const createWorkflowsSlice: StateCreator<
  StoreState,
  [],
  [],
  WorkflowsSlice
> = (set) => ({
  workflows: [],
  activeWorkflowId: null,
  addWorkflow: (workflow) =>
    set((state) => ({ workflows: [...state.workflows, workflow] })),
  updateWorkflow: (workflow) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflow.id ? workflow : w
      ),
    })),
  removeWorkflow: (id) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
      activeWorkflowId: state.activeWorkflowId === id ? null : state.activeWorkflowId,
    })),
  setActiveWorkflow: (id) => set({ activeWorkflowId: id }),
  addNode: (workflowId, node) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId
          ? { ...w, nodes: [...w.nodes, node], updatedAt: Date.now() }
          : w
      ),
    })),
  updateNode: (workflowId, node) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              nodes: w.nodes.map((n) => (n.id === node.id ? node : n)),
              updatedAt: Date.now(),
            }
          : w
      ),
    })),
  removeNode: (workflowId, nodeId) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              nodes: w.nodes.filter((n) => n.id !== nodeId),
              connections: w.connections.filter(
                (c) => c.source !== nodeId && c.target !== nodeId
              ),
              updatedAt: Date.now(),
            }
          : w
      ),
    })),
  addConnection: (workflowId, connection) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              connections: [...w.connections, connection],
              updatedAt: Date.now(),
            }
          : w
      ),
    })),
  removeConnection: (workflowId, connectionId) =>
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === workflowId
          ? {
              ...w,
              connections: w.connections.filter((c) => c.id !== connectionId),
              updatedAt: Date.now(),
            }
          : w
      ),
    })),
});
