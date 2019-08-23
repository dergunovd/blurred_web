import React, { Component } from "react";
import Screen from "./components/Screen";
import { StoreContextProvider } from "./store/StoreContext";

class App extends Component {
  render() {
    return (
      <StoreContextProvider>
        <Screen />
      </StoreContextProvider>
    );
  }
}

export default App;
