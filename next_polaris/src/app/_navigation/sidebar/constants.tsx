import { availabilityPath, bookingsPath, dashboardPath, paymentsPath, reportsPath, servicesPath } from "@/app/paths";
import { NavItem } from "./types";
import {
  Home,
  Calendar,
  CreditCard,
  Scissors,
  Timer,
  ClipboardList
} from 'lucide-react';


export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: <Home />,
    href: dashboardPath(),
  },
  {
    title: "Bookings",
    icon: <Calendar />,
    href: bookingsPath(),
  },
  {
    title: "Payments",
    icon: <CreditCard />,
    href: paymentsPath(),
  },
  {
    separator: true,
    title: "Services",
    icon: <Scissors />,
    href: servicesPath(),
  },
  {
    title: "Availability",
    icon: <Timer />,
    href: availabilityPath(),
  },
  {
    title: "Reports",
    icon: <ClipboardList />,
    href: reportsPath(),
  }
]