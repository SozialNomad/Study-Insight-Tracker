import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function minutesToHuman(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours && mins) return `${hours} sa ${mins} dk`;
  if (hours) return `${hours} sa`;
  return `${mins} dk`;
}

export function formatDateTR(date: string | Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(
    typeof date === "string"
      ? new Date(date.includes("T") ? date : `${date}T00:00:00`)
      : date
  );
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function getWeekStartISO(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay() || 7;
  current.setDate(current.getDate() - day + 1);
  return current.toISOString().slice(0, 10);
}

export function getWeekdayTR(date: string) {
  return new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(
    new Date(`${date}T00:00:00`)
  );
}
