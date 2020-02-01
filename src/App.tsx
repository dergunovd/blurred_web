import React, { Component } from "react";
import Index from "./components/Screen";
import { StoreContextProvider } from "./store/StoreContext";
import "./App.sass";
import { BrowserRouter, Route } from "react-router-dom";

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <StoreContextProvider>
          <Route path="/" component={Index} />
          <Route path="/:type" component={Index} />
        </StoreContextProvider>
      </BrowserRouter>
    );
  }
}

export default App;
