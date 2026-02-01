import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { closest } from 'fastest-levenshtein'
import { AxiosError } from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}




export const getActivePath = (path: string, paths: string[], ignorePaths?: string[]) => {
    const closestPath = closest(path, paths.concat(ignorePaths || []));
    const index = paths.indexOf(closestPath);
    
    return { active: closestPath, activeIndex: index };
}

export function isAxiosError(error: unknown): error is AxiosError<any> {
  return typeof error === "object" && error !== null && "response" in error
}
