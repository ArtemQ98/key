import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout";
import { RegisterForm } from "@/features/auth";
import { useAuthStore } from "@/stores/auth";

export function RegisterPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  return (
    <AuthLayout>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link
          to="/app/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Войти
        </Link>
      </p>
    </AuthLayout>
  );
}