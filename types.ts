
export interface AnimationState {
  isGenerating: boolean;
  progressMessage: string;
  error: string | null;
  videoUrl: string | null;
}

export interface ImagePreview {
  file: File;
  base64: string;
  url: string;
}

export enum GenerationStep {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  FETCHING = 'FETCHING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
