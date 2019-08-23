import {ThanosarMediaRecorder} from '../utils/createMediaRecorder';

export default interface GlobalStore {
  mediaRecorder: ThanosarMediaRecorder | null;
}
