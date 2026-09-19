import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Check, LogOut, Mail, Phone, ShieldCheck } from "lucide-react";
import { PageHead } from "@/components/layout";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PlanModal, PlanUsageCard } from "@/features/plans";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
} from "@/components/ui";
import { useAuthStore } from "@/stores/auth";
import { useUpdateProfile } from "@/hooks/useProfile";

const schema = z.object({
  name: z.string().min(1, "Укажите имя"),
  email: z.string().email("Некорректный email").or(z.literal("")),
  city: z.string(),
  company_name: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      city: user?.city || "",
      company_name: user?.company_name || "",
    },
  });

  async function onSubmit(values: FormValues) {
    await updateProfile.mutateAsync(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <PageHead
        eyebrow="Аккаунт"
        title="Настройки"
        description="Профиль владельца, тема интерфейса и безопасность аккаунта."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Данные владельца
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Field label="Имя" error={errors.name?.message}>
                <Input {...register("name")} invalid={!!errors.name} />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Город">
                  <Input {...register("city")} />
                </Field>
                <Field label="Автопарк">
                  <Input {...register("company_name")} />
                </Field>
              </div>

              <Field label="Email" error={errors.email?.message}>
                <Input
                  type="email"
                  placeholder="you@company.ru"
                  {...register("email")}
                  invalid={!!errors.email}
                />
              </Field>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  loading={isSubmitting}
                >
                  <Check className="h-4 w-4" />
                  Сохранить
                </Button>
                {saved && (
                  <span className="text-xs text-[hsl(var(--success))]">
                    Сохранено
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <PlanUsageCard onUpgrade={() => setPlanOpen(true)} />
          <Card>
            <CardHeader>
              <CardTitle>Тема интерфейса</CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeToggle />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Аккаунт
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Row icon={Phone} label="Телефон" value={user?.phone || "—"} />
              <Row
                icon={Mail}
                label="Email"
                value={user?.email || "не указан"}
              />

              <div className="border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Выйти из аккаунта?")) logout();
                  }}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Выйти из аккаунта
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <PlanModal open={planOpen} onOpenChange={setPlanOpen} />
    </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm">{value}</div>
      </div>
    </div>
  );
}