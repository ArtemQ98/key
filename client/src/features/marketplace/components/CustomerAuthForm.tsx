import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Mail } from "lucide-react";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { publicApi, tokens } from "@/api/client";
import { useCustomerAuthStore } from "@/stores/customerAuth";
import { isApiError } from "@/lib/apiError";

const schema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Некорректный email"),
});

type FormValues = z.infer<typeof schema>;

interface CustomerAuthFormProps {
  onSuccess: () => void;
  compact?: boolean;
}

export function CustomerAuthForm({ onSuccess, compact }: CustomerAuthFormProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"form" | "code">("form");
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [code, setCode] = useState("");
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const fetchMe = useCustomerAuthStore((s) => s.fetchMe);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "" },
  });

  async function onRequestCode(values: FormValues) {
    if (busy) return;
    setServerError("");

    if (mode === "register") {
      if (!values.name?.trim()) {
        setServerError("Укажите имя");
        return;
      }
      if (!values.phone || values.phone.trim().length < 10) {
        setServerError("Укажите телефон");
        return;
      }
      if (!agreed) {
        setServerError("Подтвердите согласие на обработку персональных данных");
        return;
      }
    }

    setBusy(true);
    try {
      // Вход — проверяем, что клиент существует.
      // Регистрация — общий эндпоинт, создаёт нового пользователя.
      const endpoint =
        mode === "login"
          ? "/auth/customer/login-request-code"
          : "/auth/request-code";

      await publicApi.post(endpoint, { email: values.email });
      setFormData({
        name: values.name || "",
        phone: values.phone || "",
        email: values.email,
      });
      setStep("code");
    } catch (e) {
      setServerError(isApiError(e) ? e.message : "Не удалось отправить код");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy || code.length !== 6) return;
    setServerError("");
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        email: formData.email,
        code,
        name: formData.name || undefined,
      };
      if (mode === "register" && formData.phone) {
        payload.phone = formData.phone;
      }

      const endpoint =
        mode === "login"
          ? "/auth/customer/login-verify-code"
          : "/auth/verify-code";

      const res = await publicApi.post<{ token: string }>(endpoint, payload);
      tokens.customer.set(res.token);
      await fetchMe();
      onSuccess();
    } catch (e) {
      if (isApiError(e) && e.status === 403) {
        setServerError(
          e.message + ". Используйте страницу владельца /app/login",
        );
      } else if (isApiError(e) && e.status === 404) {
        setServerError("Пользователь с таким email не найден. Зарегистрируйтесь.");
      } else {
        setServerError(isApiError(e) ? e.message : "Неверный код");
      }
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: "login" | "register") {
    setMode(next);
    setStep("form");
    setCode("");
    setServerError("");
    setAgreed(false);
    setFormData({ name: "", phone: "", email: "" });
  }

  return (
    <>
      <div className={compact ? "mb-4 space-y-1" : "mb-6 space-y-1 text-center"}>
        <h2 className="text-xl font-semibold tracking-tight">
          {step === "code"
            ? "Проверьте почту"
            : mode === "login"
              ? "Вход в KEY"
              : "Создать аккаунт"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {step === "code"
            ? `Код отправлен на ${formData.email}`
            : mode === "login"
              ? "Введите email — отправим код для входа."
              : "Заполните данные — отправим код на почту."}
        </p>
      </div>

      {step === "form" ? (
        <form onSubmit={handleSubmit(onRequestCode)} className="space-y-4">
          {mode === "register" && (
            <>
              <Field label="Имя" required error={errors.name?.message}>
                <Input
                  autoFocus
                  placeholder="Иван Петров"
                  invalid={!!errors.name}
                  {...register("name")}
                />
              </Field>

              <Field label="Телефон" required error={errors.phone?.message}>
                <Input
                  type="tel"
                  autoComplete="tel"
                  placeholder="+7 999 123-45-67"
                  invalid={!!errors.phone}
                  {...register("phone")}
                />
              </Field>
            </>
          )}

          <Field label="Email" required error={errors.email?.message}>
            <Input
              autoFocus={mode === "login"}
              type="email"
              autoComplete="email"
              placeholder="you@mail.ru"
              invalid={!!errors.email}
              {...register("email")}
            />
          </Field>

          {mode === "register" && (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
              <Checkbox
                className="mt-0.5"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
              />
              <span className="text-xs leading-relaxed text-muted-foreground">
                Я принимаю{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  пользовательское соглашение
                </Link>{" "}
                и даю согласие на{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  обработку персональных данных
                </Link>
              </span>
            </label>
          )}

          {serverError && <ErrorBox>{serverError}</ErrorBox>}

          <Button
            type="submit"
            className="w-full"
            loading={busy}
            disabled={busy || (mode === "register" && !agreed)}
          >
            Получить код
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <form onSubmit={onVerifyCode} className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm">
              {formData.email}
            </span>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setCode("");
                setServerError("");
              }}
              className="shrink-0 text-xs font-medium text-primary hover:text-primary/80"
            >
              Изменить
            </button>
          </div>

          <Field label="Код из почты" required>
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
            disabled={code.length !== 6 || busy}
          >
            {mode === "login" ? "Войти" : "Создать аккаунт"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      {step === "form" && (
        <button
          type="button"
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "login"
            ? "Нет аккаунта? Зарегистрироваться →"
            : "Уже есть аккаунт? Войти →"}
        </button>
      )}
    </>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </div>
  );
}