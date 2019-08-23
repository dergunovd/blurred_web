import BlobEvent from './BlobEvent.interface';

interface MediaRecorderErrorEvent extends ErrorEvent {}

export interface MediaRecorder {
  mimeType: string;
  state: 'inactive' | 'recording' | 'paused';
  stream: MediaStream;
  ignoreMutedMedia: boolean;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;

  isTypeSupported: () => boolean;
  pause: () => void;
  requestData: () => Blob;
  resume: () => void;
  start: () => void;
  stop: () => void;

  ondataavailable: (event: BlobEvent) => void;
  onerror: (event: MediaRecorderErrorEvent) => void;
  onpause: () => void;
  onresume: () => void;
  onstart: () => void;
  onstop: () => void;
}
