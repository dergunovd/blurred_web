import React, { Component } from "react";
import Record from "../Record";
import { StoreContext } from "../../store/StoreContext";
import { BlurredMediaRecorder } from "../../utils/createMediaRecorder";
import css from "./Screen.module.sass";
import { RouteComponentProps, withRouter } from "react-router";

interface ScreenProps extends RouteComponentProps<{ type: string }> {}

class Screen extends Component<ScreenProps> {
  static contextType = StoreContext;

  private rtcConnection: RTCPeerConnection = new RTCPeerConnection();

  private dataChannel: RTCDataChannel = this.rtcConnection.createDataChannel(
    "stream",
    { ordered: true }
  );

  private messageId: number = 0;

  private videoRef = React.createRef<HTMLVideoElement>();

  private checkIceGatheringState: (
    rtcConnection: RTCPeerConnection
  ) => Promise<void> = rtcConnection =>
    new Promise(resolve => {
      if (rtcConnection.iceGatheringState === "complete") {
        resolve();
      } else {
        const checkState: () => void = () => {
          if (rtcConnection.iceGatheringState === "complete") {
            rtcConnection.removeEventListener(
              "icegatheringstatechange",
              checkState
            );
            resolve();
          }
        };

        rtcConnection.addEventListener("icegatheringstatechange", checkState);

        rtcConnection.addEventListener("track", e => {
          const videoElement = this.videoRef.current;

          if (!videoElement) {
            throw new Error("Can not get videoElement");
          }
          videoElement.srcObject = e.streams[0];
          e.streams[0]
            .getTracks()
            .forEach(track => track.applyConstraints({ frameRate: 2 }));
          this.context.mediaRecorder = new BlurredMediaRecorder(e.streams[0]);
          this.forceUpdate();
        });
      }
    });

  componentDidMount() {
    // navigator.getUserMedia =
    // navigator.getUserMedia ||
    // @ts-ignore
    // navigator.webkitGetUserMedia ||
    // @ts-ignore
    // navigator.mozGetUserMedia;

    navigator.getUserMedia(
      {
        audio: false,
        video: { width: 640, height: 480, frameRate: { ideal: 2, max: 2 } }
      },
      (stream: MediaStream): void => {
        const videoElement = this.videoRef.current;
        if (!videoElement) {
          throw new Error("Can not get videoElement");
        }
        videoElement.srcObject = stream;

        this.context.mediaRecorder = new BlurredMediaRecorder(stream);
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
            fetch("http://0.0.0.0:5000/offer", {
              body: JSON.stringify({
                sdp: offer.sdp,
                type: offer.type,
                video_transform: {
                  name: "inpaint",
                  src: ["all"],
                  frame_size: [640, 480]
                }
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

  generateMessageId = (): number => this.messageId++;

  clickHandler = (): void => {
    this.dataChannel.onopen = () => {
      const dataChannelMessage = {
        message_id: this.generateMessageId(),
        name: "inpaint",
        src: ["all"]
      };

      this.dataChannel.send(JSON.stringify(dataChannelMessage));
    };
  };

  render() {
    return (
      <div className={css.videoWrap}>
        <video
          id="videoLayout"
          className={css.video}
          autoPlay
          ref={this.videoRef}
          onClick={this.clickHandler}
        />
        <Record />
      </div>
    );
  }
}

export default withRouter(Screen);
