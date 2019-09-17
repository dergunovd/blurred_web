import React, { Component } from "react";
import { RouteComponentProps, withRouter } from "react-router";
import Record from "../Record";
import { StoreContext } from "../../store/StoreContext";
import { ThanosarMediaRecorder } from "../../utils/createMediaRecorder";
import css from "./Screen.module.sass";

interface ScreenProps extends RouteComponentProps<{ type: string }> {}

class Screen extends Component<ScreenProps> {
  static contextType = StoreContext;

  private rtcConnection: RTCPeerConnection = new RTCPeerConnection();

  private videoRef = React.createRef<HTMLVideoElement>();

  private checkIceGatheringState: () => Promise<void> = () =>
    new Promise(resolve => {
      if (this.rtcConnection.iceGatheringState === "complete") {
        resolve();
      } else {
        const checkState: () => void = () => {
          console.log(this.rtcConnection.iceGatheringState);
          if (this.rtcConnection.iceGatheringState === "complete") {
            this.rtcConnection.removeEventListener(
              "icegatheringstatechange",
              checkState
            );
            resolve();
          }
        };

        this.rtcConnection.addEventListener(
          "icegatheringstatechange",
          checkState
        );

        this.rtcConnection.addEventListener("track", e => {
          console.log("track", e.streams[0]);
          console.log(e.streams[0]);
          const videoElement = this.videoRef.current;
          if (!videoElement) {
            throw new Error("Can not get videoElement");
          }
          videoElement.srcObject = e.streams[0];
          this.context.mediaRecorder = new ThanosarMediaRecorder(e.streams[0]);
          console.log("out");
        });
      }
    });

  componentDidMount() {
    navigator.getUserMedia(
      {
        audio: false,
        video: true
      },
      (stream: MediaStream): void => {
        const videoElement = this.videoRef.current;
        if (!videoElement) {
          throw new Error("Can not get videoElement");
        }
        videoElement.srcObject = stream;

        this.context.mediaRecorder = new ThanosarMediaRecorder(stream);

        this.rtcConnect();
      },
      error => console.error(error)
    );
  }

  componentDidUpdate(prevProps: Readonly<ScreenProps>): void {
    const { type } = this.props.match.params;
    console.log("cdu");
    if (type !== prevProps.match.params.type) {
      this.rtcConnect();
    }
  }

  rtcConnect() {
    const { type } = this.props.match.params;
    console.log("rtc", type);
    if (!type) {
      return;
    }
    const videoElement = this.videoRef.current;
    if (!videoElement) {
      throw new Error("Can not get video element");
    }
    const stream = videoElement.srcObject;
    if (!stream || !(stream instanceof MediaStream)) {
      throw new Error("Incorrect video element source");
    }
    stream.getTracks().forEach((track: MediaStreamTrack): void => {
      this.rtcConnection.addTrack(track, stream);
    });
    this.rtcConnection
      .createOffer()
      .then(offer => this.rtcConnection.setLocalDescription(offer))
      .then(this.checkIceGatheringState)
      .then(() => {
        const offer = this.rtcConnection.localDescription;
        if (!offer) {
          throw new Error("localDescription is null");
        }
        fetch("http://0.0.0.0:5000/offer", {
          body: JSON.stringify({
            sdp: offer.sdp,
            type: offer.type,
            video_transform: type
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
