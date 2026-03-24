import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
const SALTROUNDS = 10;

export const hashPassword = async (password: string) => {
  // const saltRounds = 10;
  const hash = await bcrypt.hash(password, SALTROUNDS);
  return hash;
};


export const comparePassword = async (
  password: string,
  passwordHash: string
) => {
  return await bcrypt.compare(password, passwordHash);
};


export function generateBookingReference(): string {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const randomPart = randomBytes(4)
    .toString("hex")
    .slice(0, 6)
    .toUpperCase();

  return `BK-${datePart}-${randomPart}`;
}

export function isTimeWithinRange(
  time: string,
  start: string,
  end: string
) {
  return time >= start && time <= end
}


export function isTime24HoursInAdvance(date: Date, time: string): boolean {
  const [h, m] = time.split(":").map(Number)

  const bookingSlot = new Date(date)
  bookingSlot.setHours(h, m, 0, 0)

  const now = new Date()
  const hoursUntilBooking = (bookingSlot.getTime() - now.getTime()) / (1000 * 60 * 60)

  console.log(`Current time: ${now.toISOString()}`)
  console.log(`Booking time: ${bookingSlot.toISOString()}`)
  console.log(`Hours until booking: ${hoursUntilBooking}`)

  return hoursUntilBooking >= 24
}

export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(minutes: number): string {
  if (!minutes || minutes < 0) return '00:00';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
