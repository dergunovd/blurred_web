import { BlurredMediaRecorder } from "../utils/createMediaRecorder";

export default interface GlobalStore {
  mediaRecorder: BlurredMediaRecorder | null;
}
