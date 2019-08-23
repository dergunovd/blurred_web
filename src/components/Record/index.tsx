import React, { Component } from "react";
import css from "./Record.module.sass";
import { StoreContext } from "../../store/StoreContext";

interface State {
  isRec: boolean;
}

export default class Record extends Component<{}, State> {
  static contextType = StoreContext;

  readonly state = {
    isRec: false
  };

  onClick = () => {
    const { isRec } = this.state;
    const { mediaRecorder } = this.context;
    if (!mediaRecorder) {
      return;
    }
    this.setState({ isRec: !isRec });
    if (isRec) {
      mediaRecorder.stopRecord();
      setTimeout(mediaRecorder.downloadVideo, 100);
    } else {
      mediaRecorder.clear();
      mediaRecorder.startRecord();
    }
  };

  render() {
    const { isRec } = this.state;
    return (
      <button
        id="recButton"
        className={`${css.buttonRec} ${isRec ? css.isRec : ""}`}
        onClick={this.onClick}
      />
    );
  }
}
