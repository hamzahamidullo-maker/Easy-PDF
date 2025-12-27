
export interface FileItem {
  id: string;
  file: File;
  previewUrl?: string;
  type: 'image' | 'text' | 'document';
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

export interface ConversionOptions {
  fileName: string;
  pageSize: 'a4' | 'letter';
  orientation: 'p' | 'l';
}
