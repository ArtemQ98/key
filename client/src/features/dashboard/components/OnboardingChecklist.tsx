import { Link } from "react-router-dom";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui";
import { useCars } from "@/hooks/useCars";
import { useRentals } from "@/hooks/useRentals";
import { useFleetProfile } from "@/hooks/useFleetProfile";
import { cn } from "@/lib/cn";

interface Step {
  key: string;
  title: string;
  description: string;
  to: string;
  done: boolean;
}

export function OnboardingChecklist() {
  const carsQuery = useCars();
  const rentalsQuery = useRentals();
  const fleetQuery = useFleetProfile();

  if (carsQuery.isLoading || rentalsQuery.isLoading || fleetQuery.isLoading) {
    return null;
  }

  const cars = carsQuery.data ?? [];
  const rentals = rentalsQuery.data ?? [];
  const fleet = fleetQuery.data;

  const hasCar = cars.length > 0;
  const hasPublicCar = cars.some((c) => c.public_enabled);
  const hasFleetProfile = !!(
    fleet?.title &&
    fleet.title.trim().length > 0 &&
    fleet?.description &&
    fleet.description.trim().length > 0
  );
  const hasFirstBooking = rentals.some((r) => r.car_id !== null);

  const steps: Step[] = [
    {
      key: "car",
      title: "Добавить первый автомобиль",
      description:
        "Машина появится в вашем автопарке и станет доступна для брони.",
      to: "/app/cars",
      done: hasCar,
    },
    {
      key: "public",
      title: "Опубликовать машину в каталоге",
      description:
        "Включите видимость — и клиенты найдут вас через поиск KEY.",
      to: "/app/cars",
      done: hasPublicCar,
    },
    {
      key: "fleet",
      title: "Заполнить витрину автопарка",
      description:
        "Название, описание и аватарка — лицо вашего парка на публичной странице.",
      to: "/app/storefront",
      done: hasFleetProfile,
    },
    {
      key: "booking",
      title: "Получить первую бронь",
      description:
        "Когда клиент оставит заявку, она появится в разделе «Аренды».",
      to: "/app/rentals",
      done: hasFirstBooking,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnimatePresence mode="wait">
        {allDone ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5">
              <CardContent className="flex items-center gap-3 p-4">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                >
                  <Check className="h-4 w-4" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">Всё настроено</div>
                  <div className="text-xs text-muted-foreground">
                    Ваш автопарк готов принимать заявки.
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="checklist"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <CardContent className="p-5">
                {/* Шапка */}
                <div className="flex items-start gap-3">
                  <motion.div
                    initial={{ scale: 0.85, rotate: -8 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white"
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold">
                        Настройка автопарка
                      </h3>
                      <motion.span
                        key={completedCount}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="text-xs text-muted-foreground"
                      >
                        {completedCount} из {steps.length}
                      </motion.span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Осталось несколько шагов, чтобы получать заявки.
                    </p>
                  </div>
                </div>

                {/* Прогресс-бар */}
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full bg-primary"
                    initial={false}
                    animate={{
                      width: `${(completedCount / steps.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                {/* Шаги */}
                <ul className="mt-4 space-y-1">
                  {steps.map((step, idx) => (
                    <motion.li
                      key={step.key}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.05 * idx,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
                        to={step.to}
                        className={cn(
                          "group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/60",
                          step.done && "opacity-60",
                        )}
                      >
                        {/* Чекбокс с анимацией при переключении */}
                        <div
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            step.done
                              ? "border-[hsl(var(--success))] bg-[hsl(var(--success))] text-white"
                              : "border-border bg-background",
                          )}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {step.done ? (
                              <motion.span
                                key="check"
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0 }}
                                transition={{
                                  duration: 0.3,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </motion.span>
                            ) : (
                              <motion.span
                                key="dot"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.2 }}
                                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
                              />
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div
                            className={cn(
                              "text-sm font-medium transition-all",
                              step.done &&
                                "line-through decoration-muted-foreground/40",
                            )}
                          >
                            {step.title}
                          </div>
                          {!step.done && (
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {step.description}
                            </div>
                          )}
                        </div>

                        {!step.done && (
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        )}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}