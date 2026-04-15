import { appSettingsPath, availabilityPath, bookingsPath, dashboardPath, paymentsPath, reportsPath, serviceCategoriesPath, servicesPath } from "@/app/paths";
import { NavItem } from "./types";
import {
  Home,
  Calendar,
  CreditCard,
  Scissors,
  Timer,
  ClipboardList,
  Layers,
  Settings,
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
    title: "Categories",
    icon: <Layers />,
    href: serviceCategoriesPath(),
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
  },
  {
    separator: true,
    title: "App Settings",
    icon: <Settings />,
    href: appSettingsPath(),
  },
]