export type ProgressStatus = "not-started" | "in-progress" | "completed";
export interface DocumentInfo {
  contentHash?: string;
  path: string;
  title: string;
  category: "education" | "learner" | "state" | "configuration";
  id?: string;
  cycle?: string;
  week?: string;
  units: string[];
  status?: ProgressStatus;
}
export interface Unit {
  id: string;
  title: string;
  phase: string;
  content: string;
}
export interface Project {
  preferences: import("./preferences.js").Preferences | null;
  documents: DocumentInfo[];
  units: Unit[];
  phases: { id: string; title: string }[];
  activeCycle: string;
  cycleStatus: string;
  revision: string;
  priorities: string;
  recent: string;
  warnings: string[];
}
export interface AgentEvent {
  seq: number;
  type: string;
  text: string;
  at: string;
}
export interface ProviderStatus {
  id: string;
  name: string;
  installed: boolean;
  available: boolean;
  version: string;
  authentication: string;
  reason: string;
  capabilities: {
    streaming: boolean;
    continuation: boolean;
    cancellation: boolean;
    approvals: boolean;
    readOnly: boolean;
    mutation: boolean;
  };
}
export interface Session {
  id: string;
  provider: string;
  workflow: string;
  status: string;
  providerSessionId?: string;
  events: AgentEvent[];
  created: string;
  mutating: boolean;
  changes?: string[];
}
