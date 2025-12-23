import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names using clsx and merge Tailwind classes with tailwind-merge
 * @param {...any} inputs - Class names to combine
 * @returns {string} Combined class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

