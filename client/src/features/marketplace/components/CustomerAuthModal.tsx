import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { Button, Field, Input, Modal, ModalBody } from "@/components/ui";
import { Logo } from "@/components/layout";
import { useCustomerAuthStore } from "@/stores/customerAuth";
import { isApiError } from "@/lib/apiError";

const loginSchema = z.object({
  identifier: z.string().min(3, "Введите телефон или email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Укажите имя"),
  phone: z.string().min(10, "Укажите телефон"),
  email: z.string().email("Некорректный email").or(z.literal("")).optional(),
  password: z.string().min(8, "Минимум 8 символов"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

interface CustomerAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CustomerAuthModal({
  open,
  onOpenChange,
  onSuccess,
}: CustomerAuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [serverError, setServerError] = useState("");
  const login = useCustomerAuthStore((s) => s.login);
  const register = useCustomerAuthStore((s) => s.register);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", phone: "", email: "", password: "" },
  });

  async function onLogin(values: LoginValues) {
    setServerError("");
    try {
      await login(values.identifier, values.password);
      onSuccess();
    } catch (e) {
      setServerError(
        isApiError(e) ? e.message : "Не удалось войти",
      );
    }
  }

  async function onRegister(values: RegisterValues) {
    setServerError("");
    try {
      await register({
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        password: values.password,
      });
      onSuccess();
    } catch (e) {
      setServerError(
        isApiError(e) ? e.message : "Не удалось зарегистрироваться",
      );
    }
  }

  function switchMode(next: "login" | "register") {
    setMode(next);
    setServerError("");
    loginForm.reset();
    registerForm.reset();
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalBody className="pt-8">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="mb-6 space-y-1 text-center">
          <h2 className="text-xl font-semibold tracking-tight">
            {mode === "login" ? "Вход в KEY" : "Создать аккаунт"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Войдите, чтобы бронировать автомобили."
              : "Минута — и вы сможете бронировать."}
          </p>
        </div>

        {mode === "login" ? (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
            <Field
              label="Телефон или email"
              error={loginForm.formState.errors.identifier?.message}
            >
              <Input
                autoFocus
                autoComplete="username"
                placeholder="+7 999 123-45-67"
                invalid={!!loginForm.formState.errors.identifier}
                {...loginForm.register("identifier")}
              />
            </Field>
            <Field
              label="Пароль"
              error={loginForm.formState.errors.password?.message}
            >
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="Минимум 8 символов"
                invalid={!!loginForm.formState.errors.password}
                {...loginForm.register("password")}
              />
            </Field>

            {serverError && <ErrorBox>{serverError}</ErrorBox>}

            <Button
              type="submit"
              className="w-full"
              loading={loginForm.formState.isSubmitting}
            >
              Войти
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <form
            onSubmit={registerForm.handleSubmit(onRegister)}
            className="space-y-4"
          >
            <Field
              label="Имя"
              error={registerForm.formState.errors.name?.message}
            >
              <Input
                autoFocus
                placeholder="Иван Петров"
                invalid={!!registerForm.formState.errors.name}
                {...registerForm.register("name")}
              />
            </Field>
            <Field
              label="Телефон"
              error={registerForm.formState.errors.phone?.message}
            >
              <Input
                placeholder="+7 999 123-45-67"
                invalid={!!registerForm.formState.errors.phone}
                {...registerForm.register("phone")}
              />
            </Field>
            <Field
              label="Email · необязательно"
              error={registerForm.formState.errors.email?.message}
            >
              <Input
                placeholder="you@mail.ru"
                invalid={!!registerForm.formState.errors.email}
                {...registerForm.register("email")}
              />
            </Field>
            <Field
              label="Пароль"
              error={registerForm.formState.errors.password?.message}
            >
              <Input
                type="password"
                placeholder="Минимум 8 символов"
                invalid={!!registerForm.formState.errors.password}
                {...registerForm.register("password")}
              />
            </Field>

            {serverError && <ErrorBox>{serverError}</ErrorBox>}

            <Button
              type="submit"
              className="w-full"
              loading={registerForm.formState.isSubmitting}
            >
              Создать аккаунт
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "login"
            ? "Нет аккаунта? Создать →"
            : "Уже есть аккаунт? Войти →"}
        </button>
      </ModalBody>
    </Modal>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {children}
    </div>
  );
}