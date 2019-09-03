import React, { Component } from "react";
import Record from "../Record";
import { StoreContext } from "../../store/StoreContext";
import { ThanosarMediaRecorder } from "../../utils/createMediaRecorder";
import css from "./Screen.module.sass";
import { RouteComponentProps, withRouter } from "react-router";

interface ScreenProps extends RouteComponentProps<{ type: string }> {}

class Screen extends Component<ScreenProps> {
  static contextType = StoreContext;

  private rtcConnection: RTCPeerConnection = new RTCPeerConnection();

  private videoRef = React.createRef<HTMLVideoElement>();

  private checkIceGatheringState: (rtcConnection: RTCPeerConnection) => Promise<void> = (rtcConnection) =>
    new Promise(resolve => {
      if (rtcConnection.iceGatheringState === "complete") {
        resolve();
      } else {
        const checkState: () => void = () => {
          console.log(rtcConnection.iceGatheringState);
          if (rtcConnection.iceGatheringState === "complete") {
            rtcConnection.removeEventListener(
              "icegatheringstatechange",
              checkState
            );
            resolve();
          }
        };

        rtcConnection.addEventListener(
          "icegatheringstatechange",
          checkState
        );

        rtcConnection.addEventListener("track", e => {
          const videoElement = this.videoRef.current;

          if (!videoElement) {
            throw new Error("Can not get videoElement");
          }
          videoElement.srcObject = e.streams[0];
          console.log('NOT SAVE', e.streams[0]);
          this.context.mediaRecorder = new ThanosarMediaRecorder(e.streams[0]);
          this.forceUpdate();
        });
      }
    });

  componentDidMount() {
    // @ts-ignore
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    navigator.getUserMedia(
      {
        audio: false,
        video: { width: 640, height: 480 }
      },
      (stream: MediaStream): void => {
        const videoElement = this.videoRef.current;
        if (!videoElement) {
          throw new Error("Can not get videoElement");
        }
        videoElement.srcObject = stream;
console.log('SAVE', stream);
        this.context.mediaRecorder = new ThanosarMediaRecorder(stream);
        stream.getTracks().forEach((track: MediaStreamTrack): void => {
          this.rtcConnection.addTrack(track, stream);
        });
        // return;
        this.rtcConnection
          .createOffer()
          .then(offer => this.rtcConnection.setLocalDescription(offer))
          .then(() => this.checkIceGatheringState(this.rtcConnection))
          .then(() => {
            const offer = this.rtcConnection.localDescription;
            if (!offer) {
              throw new Error("localDescription is null");
            }
            fetch("http://192.168.1.64:5000/offer", {
              body: JSON.stringify({
                sdp: offer.sdp,
                type: offer.type,
                video_transform: 'cartoon'
              }),
              method: "POST"
            })
              .then(res => res.json())
              .then(answer => this.rtcConnection.setRemoteDescription(answer))
              .then(() => {
                console.log(this.rtcConnection.remoteDescription);
              })
              .catch(error => console.error(error));
          })
          .catch(error => console.error(error));
      },
      error => console.error(error)
    );
  }

  componentWillUnmount(): void {
    this.rtcConnection.close();
    this.context.mediaRecorder.stopRecord();
  }

  render() {
    return (
      <div className={css.videoWrap}>
        <video
          id="videoLayout"
          className={css.video}
          autoPlay
          ref={this.videoRef}
        />
        <Record />
      </div>
    );
  }
}

export default withRouter(Screen);
