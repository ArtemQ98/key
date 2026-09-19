import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ExternalLink, Globe2, Car as CarIcon } from "lucide-react";
import { PageHead } from "@/components/layout";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Skeleton,
  Textarea,
  Checkbox,
} from "@/components/ui";
import { useFleetProfile, useUpdateFleetProfile } from "@/hooks/useFleetProfile";
import { useCars, useUpdateCar } from "@/hooks/useCars";
import { money } from "@/lib/format";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Укажите название"),
  slug: z
    .string()
    .min(1, "Укажите slug")
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  description: z.string().optional(),
  city: z.string().optional(),
  published: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function StorefrontPage() {
  const profileQuery = useFleetProfile();
  const updateProfile = useUpdateFleetProfile();
  const carsQuery = useCars();
  const updateCar = useUpdateCar();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      city: "",
      published: true,
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        title: profileQuery.data.title || "",
        slug: profileQuery.data.slug || "",
        description: profileQuery.data.description || "",
        city: profileQuery.data.city || "",
        published: profileQuery.data.published,
      });
    }
  }, [profileQuery.data, reset]);

  async function onSubmit(values: FormValues) {
    await updateProfile.mutateAsync(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleCarPublic(carId: number, current: boolean) {
    updateCar.mutate(
      { id: carId, patch: { public_enabled: !current } },
      {
        onSuccess: () =>
          toast.success(current ? "Скрыто из каталога" : "Добавлено в каталог"),
      },
    );
  }

  const cars = carsQuery.data ?? [];
  const publicCarsCount = cars.filter((c) => c.public_enabled).length;

  return (
    <>
      <PageHead
        eyebrow="Marketplace"
        title="Витрина автопарка"
        description="Управляйте тем, как ваш парк выглядит в публичном каталоге KEY."
        action={
          profileQuery.data?.published && (
            <Button
              variant="outline"
              onClick={() => window.open("/", "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              Открыть каталог
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              Публичная страница
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profileQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field label="Название" required error={errors.title?.message}>
                  <Input
                    placeholder="KEY Fleet"
                    invalid={!!errors.title}
                    {...register("title")}
                  />
                </Field>

                <Field label="Slug (URL)" required error={errors.slug?.message}>
                  <Input
                    placeholder="key-fleet"
                    invalid={!!errors.slug}
                    {...register("slug")}
                  />
                </Field>

                <Field label="Описание">
                  <Textarea
                    placeholder="Коротко о вашем автопарке"
                    {...register("description")}
                  />
                </Field>

                <Field label="Город">
                  <Input placeholder="Санкт-Петербург" {...register("city")} />
                </Field>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                  <Checkbox
                    className="mt-0.5"
                    checked={watch("published")}
                    onCheckedChange={(v) =>
                      setValue("published", v === true, { shouldDirty: true })
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      Показывать в KEY Marketplace
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Клиенты смогут находить ваши машины по городу и датам.
                    </span>
                  </span>
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={!isDirty || isSubmitting}
                    loading={isSubmitting}
                  >
                    <Check className="h-4 w-4" />
                    Сохранить витрину
                  </Button>
                  {saved && (
                    <span className="text-xs text-[hsl(var(--success))]">
                      Сохранено
                    </span>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CarIcon className="h-4 w-4 text-muted-foreground" />
              Инвентарь
            </CardTitle>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {publicCarsCount}/{cars.length}
            </span>
          </CardHeader>
          <CardContent>
            {carsQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : cars.length ? (
              <div className="space-y-1">
                {cars.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {c.brand} {c.model}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {money(c.daily_price)}/сут · {c.location}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCarPublic(c.id, c.public_enabled)}
                      disabled={updateCar.isPending}
                      className={
                        "shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors " +
                        (c.public_enabled
                          ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/20"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/70")
                      }
                    >
                      {c.public_enabled ? "В каталоге" : "Скрыто"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Сначала добавьте автомобили в разделе «Автопарк».
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}