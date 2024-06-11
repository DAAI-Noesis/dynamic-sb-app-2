import React from "react";

import { MsalProvider } from "@azure/msal-react";
import AppRouter from "./Router";
import useMsalAuth from "./hooks/useMsalAuth";

export default function App() {
  const { msalInstance, useLogin } = useMsalAuth();

  return (
    <React.StrictMode>
      {useLogin && msalInstance ? (
        <MsalProvider instance={msalInstance}>
          <AppRouter />
        </MsalProvider>
      ) : (
        <AppRouter />
      )}
    </React.StrictMode>
  );
}
