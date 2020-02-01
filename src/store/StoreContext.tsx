import React from "react";
import GlobalStore from "../interfaces/GlobalStore.interface";

const globalStore: GlobalStore = {
  mediaRecorder: null
};

export const StoreContext = React.createContext(globalStore);

export const StoreContextProvider = (props: object) => (
  <StoreContext.Provider value={globalStore} {...props} />
);
