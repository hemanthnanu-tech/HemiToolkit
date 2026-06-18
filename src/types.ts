export interface ToolCategory {
  id: string;
  label: string;
}

export interface ToolDefinition {
  id: string;
  cat: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
}

export interface ApplicationState {
  activeTool: string | null;
  files: File[];
  downloadBlob: Blob | null;
  downloadName: string;
}
