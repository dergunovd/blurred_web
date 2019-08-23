import BlobEvent from "../interfaces/BlobEvent.interface";
import { MediaRecorder as MediaRecorderInterface } from "../interfaces/MediaRecorder.interface";

export class ThanosarMediaRecorder {
  stream: MediaStream;
  mediaRecorder: MediaRecorderInterface;
  blobs: Blob[] = [];

  constructor(stream: MediaStream) {
    this.stream = stream;
    // @ts-ignore
    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
      console.log('ondataavailable');
      this.blobs.push(e.data);
    }
  }

  startRecord = () => {
    this.mediaRecorder.start();
    console.log("start");
  };

  stopRecord = () => {
    this.mediaRecorder.stop();
    console.log("stop");
  };

  getBlob = () => new Blob(this.blobs, { type: this.mediaRecorder.mimeType });

  downloadVideo = () => {
    console.log("download");
    const blob = this.getBlob();
    console.log(blob);

    if (blob.size) {
      const saveButtonElement = document.createElement("a");
      document.body.append(saveButtonElement);
      saveButtonElement.href = URL.createObjectURL(blob);
      saveButtonElement.download = "thanosAr.webm";
      saveButtonElement.click();
      saveButtonElement.remove();
      this.clear();
    }
  };

  clear = () => {
    this.blobs = [];
  };
}
