import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";
import { isApiError } from "@/lib/apiError";

const schema = z.object({
  identifier: z.string().min(3, "Введите телефон или email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError("");
    try {
      await login(values.identifier, values.password);
    } catch (e) {
      if (isApiError(e)) {
        setServerError(e.message);
      } else if (e instanceof Error) {
        setServerError(e.message);
      } else {
        setServerError("Не удалось войти");
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
    >
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Вход в KEY
        </h1>
        <p className="text-sm text-muted-foreground">
          Войдите по телефону или email.
        </p>
      </div>

      <div className="space-y-4">
        <Field label="Телефон или email" error={errors.identifier?.message}>
          <Input
            autoFocus
            autoComplete="username"
            placeholder="+7 999 123-45-67"
            invalid={!!errors.identifier}
            {...register("identifier")}
          />
        </Field>

        <Field label="Пароль" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Минимум 8 символов"
            invalid={!!errors.password}
            {...register("password")}
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
          loading={isSubmitting}
        >
          Войти
          {!isSubmitting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  );
}