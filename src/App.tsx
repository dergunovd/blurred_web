import React, { Component } from "react";
import Index from "./components/Screen";
import { StoreContextProvider } from "./store/StoreContext";
import "./App.sass";

class App extends Component {
  render() {
    return (
      <StoreContextProvider>
        <Index />
      </StoreContextProvider>
    );
  }
}

export default App;
