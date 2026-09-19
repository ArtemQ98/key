export interface PlanMeta {
  id: "free" | "pro" | "business";
  name: string;
  price: number;
  limit: number;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: PlanMeta[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    limit: 3,
    features: [
      "До 3 автомобилей",
      "Витрина в Marketplace",
      "Аренды и клиенты",
      "Базовые финансы",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 3000,
    limit: 12,
    features: [
      "До 12 автомобилей",
      "Витрина в Marketplace",
      "Аренды и клиенты",
      "Базовые финансы",
      "Приоритетная поддержка",
    ],
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: 6000,
    limit: 24,
    features: [
      "До 24 автомобилей",
      "Витрина в Marketplace",
      "Аренды и клиенты",
      "Расширенные финансы",
      "Приоритетная поддержка",
      "Ранний доступ к фичам",
    ],
  },
];

export const planLabel: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};