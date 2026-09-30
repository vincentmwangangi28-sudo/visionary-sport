import * as React from "react";
import { toast as sonnerToast } from "sonner";

export interface ToastOptions {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}

type ToastInput = ToastOptions | string;

function toast(input: ToastInput, options?: Record<string, unknown>) {
  if (typeof input === "string") {
    const id = sonnerToast(input, options);
    return {
      id: String(id),
      dismiss: () => sonnerToast.dismiss(id),
      update: () => {},
    };
  }

  const { title, description, variant, duration } = input;
  const primaryText = title ?? description ?? "";
  const secondaryText = title && description ? description : undefined;

  const id =
    variant === "destructive"
      ? sonnerToast.error(primaryText, { description: secondaryText, duration })
      : sonnerToast(primaryText, { description: secondaryText, duration });

  return {
    id: String(id),
    dismiss: () => sonnerToast.dismiss(id),
    update: () => {},
  };
}

// Attach sonner convenience methods so callers using toast.success / toast.error work seamlessly
toast.success = sonnerToast.success;
toast.error = sonnerToast.error;
toast.info = sonnerToast.info;
toast.warning = sonnerToast.warning;
toast.loading = sonnerToast.loading;
toast.dismiss = sonnerToast.dismiss;

function useToast() {
  return {
    toasts: [],
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
