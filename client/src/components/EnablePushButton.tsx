// client/src/components/EnablePushButton.tsx
import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";
import { Button } from "@/components/ui";

export function EnablePushButton() {
  const [granted, setGranted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Проверяем текущий статус
    const check = () => {
      const isGranted =
        typeof Notification !== "undefined" &&
        Notification.permission === "granted";
      setGranted(isGranted);
    };
    check();
  }, []);

  if (granted) return null;

  const request = async () => {
    try {
      setBusy(true);
      await OneSignal.Notifications.requestPermission();
      setGranted(Notification.permission === "granted");
    } catch (e) {
      console.error("Push permission failed:", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={request} loading={busy} variant="outline" size="sm">
      Включить уведомления
    </Button>
  );
}