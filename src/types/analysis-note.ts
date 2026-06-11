export type AnalysisNoteType =
  | "personal"
  | "assumption"
  | "follow_up"
  | "counter_thesis"
  | "lesson";

export interface AnalysisNote {
  id: string;
  stockSymbol?: string;
  moduleId: string;
  moduleName: string;
  type: AnalysisNoteType;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  linkedChecklistItemId?: string;
  linkedWatchlistItemId?: string;
  linkedSimulationId?: string;
}
