import { appSettingsPath, availabilityPath, bookingsPath, dashboardPath, paymentsPath, promoCodesPath, reportsPath, serviceCategoriesPath, servicesPath, staffPath } from "@/app/paths";
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
  Tag,
  Users,
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
    title: "Staff",
    icon: <Users />,
    href: staffPath(),
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
    title: "Promo Codes",
    icon: <Tag />,
    href: promoCodesPath(),
  },
  {
    separator: true,
    title: "App Settings",
    icon: <Settings />,
    href: appSettingsPath(),
  },
]