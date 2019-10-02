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

  private dataChannelTimer?: number = undefined;

  private videoTransformName: string = '';

  private videoTransformSrc: string[] = [];

  private videoRef = React.createRef<HTMLVideoElement>();

  private startDataChannelTimer = () =>
    this.dataChannelTimer = +setInterval(this.sendDataChannelMessage, 2000);

  private stopDataChannelTimer = () => {
    clearInterval(this.dataChannelTimer);
    this.dataChannelTimer = undefined;
  };

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

    this.dataChannel.onmessage = (message: MessageEvent) => {
      const videoElement = this.videoRef.current;
      const jsonMessage = JSON.parse(message.data.replace(/'/g, '"'));
      console.log('DataChannel message:', jsonMessage);
      if (videoElement && videoElement.srcObject instanceof MediaStream) {
        videoElement.srcObject.getTracks().forEach(track =>
          track.applyConstraints({ frameRate: jsonMessage.fps })
        );
      }
    };

    navigator.getUserMedia(
      {
        audio: false,
        video: { width: 640, height: 480, frameRate: { ideal: 30, max: 30 } }
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
            setTimeout(() => {
              fetch("http://0.0.0.0:5000/offer", {
                body: JSON.stringify({
                  sdp: offer.sdp,
                  type: offer.type,
                  video_transform: {
                    name: this.videoTransformName,
                    src: this.videoTransformSrc,
                    frame_size: [640, 480]
                  }
                }),
                method: "POST"
              })
                .then(res => res.json())
                .then(answer => this.rtcConnection.setRemoteDescription(answer))
                .then(() => {
                  this.videoTransformName = 'boxes';
                  this.videoTransformSrc = [''];
                  this.sendDataChannelMessage();
                  this.startDataChannelTimer();
                  console.log(this.rtcConnection.remoteDescription);
                })
                .catch(error => console.error(error));
            }, 3000);
          })
          .catch(error => console.error(error));
      },
      error => console.error(error)
    );
  }

  componentWillUnmount(): void {
    this.rtcConnection.close();
    this.context.mediaRecorder.stopRecord();
    this.stopDataChannelTimer();
  }

  generateMessageId = (): number => this.messageId++;

  sendDataChannelMessage = (): void => {
    const dataChannelMessage = {
      message_id: this.generateMessageId(),
      name: this.videoTransformName,
      src: this.videoTransformSrc,
    };
    console.log('dataChannelMessage', dataChannelMessage);
    const sendMessage = () => this.dataChannel.send(JSON.stringify(dataChannelMessage));

    if (this.dataChannel.readyState === 'open') {
      sendMessage();
    } else {
      this.dataChannel.onopen = sendMessage;
    }
  };

  clickHandler = (): void => {
    this.videoTransformName = 'inpaint';
    this.videoTransformSrc = ['all'];
    this.sendDataChannelMessage();
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
