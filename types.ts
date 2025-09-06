// Fix: Provide full implementation for the types.ts file, which was previously empty.
export interface ImageFile {
  name: string;
  type: string;
  mimeType: string;
  base64: string;
}

export type ViewType = 'front' | 'side' | 'back' | 'full' | 'video';

export interface ImageViews {
  front: string | null;
  side: string | null;
  back: string | null;
  full: string | null;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  READY = 'READY',
  EDITING = 'EDITING',
  ERROR = 'ERROR',
  GENERATING_VIDEO = 'GENERATING_VIDEO',
}
