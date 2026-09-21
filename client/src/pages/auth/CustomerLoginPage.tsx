import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/layout";
import { CustomerAuthForm } from "@/features/marketplace/components/CustomerAuthForm";
import { useCustomerAuthStore } from "@/stores/customerAuth";

export function CustomerLoginPage() {
  const customer = useCustomerAuthStore((s) => s.customer);
  const navigate = useNavigate();

  useEffect(() => {
    if (customer) navigate("/account", { replace: true });
  }, [customer, navigate]);

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>
        <CustomerAuthForm onSuccess={() => navigate("/account")} />
      </div>
    </AuthLayout>
  );
}