import { useEffect } from "react";
import OneSignal from "react-onesignal";

const ONESIGNAL_APP_ID = "2322c35b-d793-447a-b389-223f6530ea1e";

export function OneSignalInitializer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
    }).catch((e) => {
      console.error("OneSignal init failed:", e);
    });
  }, []);

  return null;
}