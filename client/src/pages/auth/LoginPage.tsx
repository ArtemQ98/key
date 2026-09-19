import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout";
import { LoginForm } from "@/features/auth";
import { useAuthStore } from "@/stores/auth";

export function LoginPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  // Если уже вошли — сразу в /app
  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  return (
    <AuthLayout>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link
          to="/app/register"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Создать автопарк
        </Link>
      </p>
    </AuthLayout>
  );
}