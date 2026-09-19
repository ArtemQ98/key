export const money = (v: number | string | null | undefined): string =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

export const num = (v: number | string | null | undefined): string =>
  new Intl.NumberFormat("ru-RU").format(Number(v || 0));

export const percent = (v: number | string | null | undefined): string =>
  `${Math.round(Number(v || 0))}%`;

export const plural = (
  n: number,
  forms: [string, string, string],
): string => {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
};

export const initials = (name: string | null | undefined): string => {
  const s = (name || "").trim();
  if (!s) return "?";
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
};