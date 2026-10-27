import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { US_CURRENCY, US_LOCALE } from "@/lib/us-region";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat(US_LOCALE, {
    style: "currency",
    currency: US_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
