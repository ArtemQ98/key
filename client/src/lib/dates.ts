const pad = (n: number) => String(n).padStart(2, "0");

export const dateOnly = (d: Date | string): string => {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

export const formatDate = (d: Date | string | null | undefined): string => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateShort = (
  d: Date | string | null | undefined,
): string => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
};

export const formatDateTime = (
  d: Date | string | null | undefined,
): string => {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatRange = (
  a: Date | string | null | undefined,
  b: Date | string | null | undefined,
): string => {
  if (!a || !b) return "—";
  return `${formatDate(a)} — ${formatDate(b)}`;
};

export const daysBetween = (from: string, to: string): number => {
  if (!from || !to) return 0;
  return Math.max(
    1,
    Math.ceil(
      (new Date(`${to}T00:00:00Z`).getTime() -
        new Date(`${from}T00:00:00Z`).getTime()) /
        86_400_000,
    ),
  );
};

export const todayISO = (): string => dateOnly(new Date());

export const addDaysISO = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dateOnly(d);
};