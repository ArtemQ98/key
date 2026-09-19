import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeApi, type AddExpenseInput } from "@/api/finance";
import { carsKeys } from "./useCars";

export const carFinanceKeys = {
  all: ["car-finance"] as const,
  detail: (carId: number) => [...carFinanceKeys.all, carId] as const,
};

export function useCarFinance(carId: number | null) {
  return useQuery({
    queryKey: carFinanceKeys.detail(carId ?? 0),
    queryFn: () => financeApi.car(carId!),
    enabled: carId !== null,
    staleTime: 30_000,
  });
}

export function useAddCarExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ carId, input }: { carId: number; input: AddExpenseInput }) =>
      financeApi.addExpense(carId, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: carFinanceKeys.detail(vars.carId) });
      qc.invalidateQueries({ queryKey: carsKeys.list() });
    },
  });
}

export function useRemoveCarExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ carId, expenseId }: { carId: number; expenseId: number }) =>
      financeApi.removeExpense(carId, expenseId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: carFinanceKeys.detail(vars.carId) });
      qc.invalidateQueries({ queryKey: carsKeys.list() });
    },
  });
}