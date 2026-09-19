import { api } from "@/api/client";

export interface CarFinanceExpense {
  id: number;
  amount: number;
  category: string;
  note: string;
  created_at: string;
}

export interface CarFinanceDeal {
  id: number;
  code: string;
  client: string;
  amount: number;
  starts_at: string | null;
}

export interface CarFinanceResponse {
  earnings: number;
  expenses_total: number;
  net: number;
  expenses: CarFinanceExpense[];
  deals: CarFinanceDeal[];
}

export interface AddExpenseInput {
  amount: number;
  category?: string;
  note?: string;
}

export const financeApi = {
  car: (carId: number) =>
    api.get<CarFinanceResponse>(`/car-finance/${carId}`),

  addExpense: (carId: number, input: AddExpenseInput) =>
    api.post<{ ok: true }>(`/car-finance/${carId}`, input),

  removeExpense: (carId: number, expenseId: number) =>
    api.delete<{ ok: true }>(
      `/car-finance/${carId}?expense_id=${expenseId}`,
    ),
};