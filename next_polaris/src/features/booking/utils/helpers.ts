import { User } from "@generated/prisma/client";
import { BookingWithService } from "../types";


export function isPastSlot(date: Date, time: string) {
  const [h, m] = time.split(":").map(Number)

  const slot = new Date(date)
  slot.setHours(h, m, 0, 0)

  return slot.getTime() < Date.now()
}


export function getMinBookingDate(): string {
  const now = new Date()
  const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return minDate.toISOString().split("T")[0]
}


export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
) {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };

  const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;
  
  return new Date(date).toLocaleDateString('en-US', finalOptions);
}



export function formatTime(time24: string) {
  // Parse the time string (e.g., "14:00")
  const [hours, minutes] = time24.split(':').map(Number);
  
  // Determine AM or PM
  const period = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  const hours12 = hours % 12 || 12;
  
  // Format with leading zero for minutes
  const formattedMinutes = String(minutes).padStart(2, '0');
  
  return `${hours12}:${formattedMinutes} ${period}`;
}


export function isBookingOwner(booking: BookingWithService, user: User): boolean{
  if(!booking || !booking.createdById) return false

  if(booking.createdById !== user.id) return false

  return true
}