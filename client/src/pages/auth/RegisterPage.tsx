import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/layout";
import { RegisterForm } from "@/features/auth";
import { useAuthStore } from "@/stores/auth";

export function RegisterPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan");

  useEffect(() => {
    if (user) {
      // Если пришли с ?plan=pro — вернуть на тарифы, чтобы завершить оплату
      navigate(plan ? "/pricing" : "/app", { replace: true });
    }
  }, [user, navigate, plan]);

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
