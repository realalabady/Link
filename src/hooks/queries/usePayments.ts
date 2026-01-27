// React Query hooks for Payments
import { useMutation } from "@tanstack/react-query";
import { createPayment, updatePayment } from "@/lib/firestore";
import { Payment } from "@/types";

export const useCreatePayment = () => {
  return useMutation({
    mutationFn: (payment: Omit<Payment, "id" | "createdAt">) =>
      createPayment(payment),
  });
};

export const useUpdatePayment = () => {
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Payment> }) =>
      updatePayment(id, updates),
  });
};
