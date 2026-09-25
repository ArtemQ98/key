import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  CarFront,
  Calendar,
  Wallet,
  Store,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { Logo } from "@/components/layout";
import { api } from "@/api";
import { useAuthStore } from "@/stores/auth";

type Step = "welcome" | "tour-1" | "tour-2" | "tour-3" | "tour-4";

const TOUR_STEPS: {
  id: Step;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}[] = [
  {
    id: "tour-1",
    icon: CarFront,
    title: "Кабинет — это ваш командный пункт",
    text: "Здесь вы управляете парком: добавляете машины, принимаете заявки, видите загрузку и деньги. Всё в одном месте — не нужно Excel и мессенджеров.",
  },
  {
    id: "tour-2",
    icon: CarFront,
    title: "Добавьте первую машину",
    text: "Одна карточка — и машина появляется в публичном каталоге KEY. Заполните характеристики, тариф и депозит — система сама посчитает брони и учтёт доходы.",
  },
  {
    id: "tour-3",
    icon: Calendar,
    title: "Принимайте заявки и ведите сделки",
    text: "Клиент бронирует — вы видите заявку в календаре. Ведите её по этапам: подтвердить, подготовить, выдать, принять возврат. Никаких потерянных заявок.",
  },
  {
    id: "tour-4",
    icon: Wallet,
    title: "Смотрите, что зарабатывает",
    text: "Доходы и расходы по каждой машине — отдельно. Видно, окупается ли каждая единица парка и где теряются деньги.",
  },
];

// Общие настройки анимаций — вынесены, чтобы не дублировать
const fadeSlide = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
};

const iconPop = {
  initial: { opacity: 0, scale: 0.85, rotate: -8 },
  animate: { opacity: 1, scale: 1, rotate: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

export function WelcomePage() {
  const navigate = useNavigate();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [step, setStep] = useState<Step>("welcome");
  const [busy, setBusy] = useState(false);

  async function finish(thenGoTo: string) {
    setBusy(true);
    try {
      await api.post("/profile/onboarded");
      await fetchMe();
    } catch (e) {
      console.error("markOnboarded failed:", e);
    }
    navigate(thenGoTo, { replace: true });
  }

  function next() {
    if (step === "welcome") return setStep("tour-1");
    const idx = TOUR_STEPS.findIndex((s) => s.id === step);
    if (idx < TOUR_STEPS.length - 1) {
      setStep(TOUR_STEPS[idx + 1].id);
    } else {
      void finish("/app");
    }
  }

  function back() {
    if (step === "welcome") return;
    const idx = TOUR_STEPS.findIndex((s) => s.id === step);
    if (idx === 0) {
      setStep("welcome");
    } else {
      setStep(TOUR_STEPS[idx - 1].id);
    }
  }

  function skip() {
    void finish("/app");
  }

  const currentTourIndex = TOUR_STEPS.findIndex((s) => s.id === step);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Декоративные пятна на фоне — статичные, для объёма */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/15 to-blue-500/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 blur-3xl"
      />

      {/* Шапка */}
      <header className="relative z-10 flex h-16 items-center justify-between px-6">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Logo size="md" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={skip}
            disabled={busy}
            className="text-muted-foreground"
          >
            Пропустить
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      </header>

      {/* Прогресс-бар с анимацией заливки */}
      <AnimatePresence>
        {step !== "welcome" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 mx-auto flex w-full max-w-md items-center justify-center gap-2 px-6"
          >
            {TOUR_STEPS.map((s, i) => (
              <div
                key={s.id}
                className="h-1 flex-1 overflow-hidden rounded-full bg-secondary"
              >
                <motion.div
                  className="h-full bg-primary"
                  initial={false}
                  animate={{ width: i <= currentTourIndex ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Контент с переключением шагов */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        <AnimatePresence mode="wait">
          {step === "welcome" ? (
            <motion.div
              key="welcome"
              {...fadeSlide}
              className="mx-auto max-w-lg text-center"
            >
              <motion.div
                {...iconPop}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-elevated"
              >
                <Store className="h-8 w-8" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Добро пожаловать в KEY
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-4 text-base text-muted-foreground"
              >
                Вы сделали первый шаг к порядку в автопарке. Давайте коротко
                покажем, как всё устроено — это займёт минуту.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
              >
                <Button onClick={next} className="w-full sm:w-auto">
                  Пройти короткий курс
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={skip} disabled={busy}>
                  Я разберусь сам
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            (() => {
              const current = TOUR_STEPS.find((s) => s.id === step);
              if (!current) return null;
              const Icon = current.icon;
              return (
                <motion.div
                  key={current.id}
                  {...fadeSlide}
                  className="mx-auto max-w-lg text-center"
                >
                  <motion.div
                    {...iconPop}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary"
                  >
                    <Icon className="h-8 w-8" />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl"
                  >
                    {current.title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.2,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="mt-4 text-base text-muted-foreground"
                  >
                    {current.text}
                  </motion.p>
                </motion.div>
              );
            })()
          )}
        </AnimatePresence>
      </main>

      {/* Навигация внизу */}
      <footer className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-6 pb-10">
        <AnimatePresence mode="wait">
          {step !== "welcome" ? (
            <motion.div
              key="back"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Button variant="ghost" onClick={back} disabled={busy}>
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
            </motion.div>
          ) : (
            <motion.span
              key="spacer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Button onClick={next} loading={busy}>
            {step === "tour-4" ? "Начать работу" : "Далее"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </footer>
    </div>
  );
}
