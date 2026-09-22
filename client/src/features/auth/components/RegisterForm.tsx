import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Mail } from "lucide-react";
import { Button, Checkbox, Field, Input } from "@/components/ui";
import { api, tokens } from "@/api/client";
import { useAuthStore } from "@/stores/auth";
import { isApiError } from "@/lib/apiError";

const schema = z.object({
  name: z.string().min(1, "Укажите имя"),
  company_name: z.string().optional(),
  phone: z.string().min(10, "Укажите телефон"),
  email: z.string().email("Некорректный email"),
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const [step, setStep] = useState<"form" | "code">("form");
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    phone: "",
    email: "",
  });
  const [code, setCode] = useState("");
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const fetchMe = useAuthStore((s) => s.fetchMe);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", company_name: "", phone: "", email: "" },
  });

  async function onRequestCode(values: FormValues) {
    if (busy) return;
    setServerError("");

    if (!agreed) {
      setServerError("Подтвердите согласие на обработку персональных данных");
      return;
    }

    setBusy(true);
    try {
      await api.post("/auth/request-code", { email: values.email });
      setFormData({
        name: values.name,
        company_name: values.company_name || "",
        phone: values.phone,
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
      const res = await api.post<{ token: string }>("/auth/owner/verify-code", {
        email: formData.email,
        code,
        name: formData.name,
        phone: formData.phone,
        company_name: formData.company_name,
      });
      tokens.owner.set(res.token);
      await fetchMe();
    } catch (e) {
      setServerError(isApiError(e) ? e.message : "Неверный код");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={step === "form" ? handleSubmit(onRequestCode) : onVerifyCode}
      className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
    >
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === "form" ? "Запустим ваш автопарк" : "Проверьте почту"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === "form"
            ? "Email — основной идентификатор для входа."
            : `Код отправлен на ${formData.email}`}
        </p>
      </div>

      <div className="space-y-4">
        {step === "form" ? (
          <>
            <Field label="Ваше имя" required error={errors.name?.message}>
              <Input
                autoFocus
                placeholder="Алексей"
                invalid={!!errors.name}
                {...register("name")}
              />
            </Field>

            <Field label="Email" required error={errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@company.ru"
                invalid={!!errors.email}
                {...register("email")}
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

            <Field label="Название автопарка · необязательно">
              <Input placeholder="KEY Fleet" {...register("company_name")} />
            </Field>

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

            {serverError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={busy}
              disabled={busy || !agreed}
            >
              Получить код
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
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

            {serverError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={busy}
              disabled={code.length !== 6 || busy}
            >
              Создать аккаунт
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </form>
  );
}