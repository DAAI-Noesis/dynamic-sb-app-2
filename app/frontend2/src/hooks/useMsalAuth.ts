import { useEffect, useState } from "react";
import {
  PublicClientApplication,
  EventType,
  AccountInfo
} from "@azure/msal-browser";
import { msalConfig, useLogin } from "../authConfig";

export default function useMsalAuth() {
  const [msalInstance, setMsalInstance] = useState<
    PublicClientApplication | undefined
  >(undefined);

  useEffect(() => {
    if (useLogin) {
      const instance = new PublicClientApplication(msalConfig);

      // Default to using the first account if no account is active on page load
      if (
        !instance.getActiveAccount() &&
        instance.getAllAccounts().length > 0
      ) {
        // Account selection logic is app dependent. Adjust as needed for different use cases.
        instance.setActiveAccount(instance.getActiveAccount());
      }

      // Listen for sign-in event and set active account
      instance.addEventCallback(event => {
        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
          const account = event.payload as AccountInfo;
          instance.setActiveAccount(account);
        }
      });

      setMsalInstance(instance);
    }
  }, []);

  return { msalInstance, useLogin };
}
