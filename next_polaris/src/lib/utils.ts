import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { closest } from 'fastest-levenshtein'
import { AxiosError } from "axios"
import type { ApiError } from "@/types/api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}




export const getActivePath = (path: string, paths: string[], ignorePaths?: string[]) => {
  const closestPath = closest(path, paths.concat(ignorePaths || []));
  const index = paths.indexOf(closestPath);

  return { active: closestPath, activeIndex: index };
}

/**
 * Type guard for Axios errors. Narrows to AxiosError<ApiError> so that
 * err.response?.data?.message is always typed as string | undefined —
 * never as unknown or {}.
 */
export function isAxiosError(error: unknown): error is AxiosError<ApiError> {
  return typeof error === "object" && error !== null && "response" in error
}
