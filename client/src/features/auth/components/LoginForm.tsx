import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Mail } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { api, tokens } from "@/api/client";
import { useAuthStore } from "@/stores/auth";
import { isApiError } from "@/lib/apiError";
import { User } from "@/api";

const schema = z.object({
  email: z.string().email("Некорректный email"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchMe = useAuthStore((s) => s.fetchMe);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onRequestCode(values: FormValues) {
    setServerError("");
    setBusy(true);
    try {
      await api.post("/auth/owner/login-request-code", { email: values.email });
      setEmail(values.email);
      setStep("code");
    } catch (e) {
      setServerError(isApiError(e) ? e.message : "Не удалось отправить код");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setBusy(true);
    try {
      const res = await api.post<{ token: string; user: User }>(
        "/auth/owner/login-verify-code",
        { email, code },
      );
      tokens.owner.set(res.token);
      await fetchMe();
    } catch (e) {
      if (isApiError(e) && e.status === 403) {
        setServerError(e.message + ". Используйте страницу маркетплейса keyfleet.ru");
      } else if (isApiError(e) && e.status === 404) {
        setServerError("Пользователь с таким email не найден. Зарегистрируйтесь.");
      } else {
        setServerError(isApiError(e) ? e.message : "Неверный код");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === "email" ? "Вход в KEY" : "Проверьте почту"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === "email"
            ? "Введите email — отправим код для входа."
            : `Код отправлен на ${email}`}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleSubmit(onRequestCode)} className="space-y-4">
          <Field label="Email" error={errors.email?.message}>
            <Input
              autoFocus
              type="email"
              autoComplete="email"
              placeholder="you@company.ru"
              invalid={!!errors.email}
              {...register("email")}
            />
          </Field>

          {serverError && <ErrorBox>{serverError}</ErrorBox>}

          <Button type="submit" className="w-full" loading={busy}>
            Получить код
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <form onSubmit={onVerifyCode} className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm">{email}</span>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setServerError("");
              }}
              className="shrink-0 text-xs font-medium text-primary hover:text-primary/80"
            >
              Изменить
            </button>
          </div>

          <Field label="Код из почты">
            <Input
              autoFocus
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-widest"
            />
          </Field>

          {serverError && <ErrorBox>{serverError}</ErrorBox>}

          <Button
            type="submit"
            className="w-full"
            loading={busy}
            disabled={code.length !== 6}
          >
            Войти
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </div>
  );
}
