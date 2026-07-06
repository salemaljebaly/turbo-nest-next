import { ApiError } from "@/lib/api";
import { translateError, type Locale } from "@/lib/i18n";

export type ToastMessage = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function apiErrorToast(
  error: unknown,
  locale: Locale = "en",
): ToastMessage {
  if (error instanceof ApiError) {
    return {
      title: translateError(error.code, error.message, locale),
      description: error.code,
      variant: "destructive",
    };
  }

  if (error instanceof Error) {
    return {
      title: error.message,
      variant: "destructive",
    };
  }

  return {
    title: translateError("INTERNAL_SERVER_ERROR", "Request failed", locale),
    variant: "destructive",
  };
}
