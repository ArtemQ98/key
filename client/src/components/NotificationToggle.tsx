import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import OneSignal from "react-onesignal";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";
import { useCustomerAuthStore } from "@/stores/customerAuth";
import { toast } from "sonner";

export function NotificationToggle() {
  const owner = useAuthStore((s) => s.user);
  const customer = useCustomerAuthStore((s) => s.customer);
  const me = owner ?? customer;

  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!me) return;
    try {
      const optedIn = OneSignal.Notifications.permission;
      setEnabled(optedIn === true);
    } catch {
      setEnabled(false);
    }
  }, [me]);

  if (!me) return null;
  if (enabled) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      await OneSignal.login(me.id.toString()).catch(() => {});
      await OneSignal.Notifications.requestPermission();
      const optedIn = OneSignal.Notifications.permission;
      if (optedIn) {
        setEnabled(true);
        toast.success("Уведомления включены");
      } else {
        toast.error("Уведомления не разрешены");
      }
    } catch (e) {
      console.error(e);
      toast.error("Не удалось включить уведомления");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
        variant="ghost"
        size="sm"
        onClick={handleEnable}
        loading={loading}
        className="relative"
        >
        <Bell className="h-4 w-4 animate-bell-shake" />
        <span className="hidden sm:inline">Уведомления</span>
        <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-primary" />
    </Button>
  );
}
