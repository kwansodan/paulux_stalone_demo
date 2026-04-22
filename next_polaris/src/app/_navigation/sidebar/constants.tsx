import { appSettingsPath, availabilityPath, bookingsPath, dashboardPath, paymentsPath, productsPath, promoCodesPath, reportsPath, servicesPath, staffPath } from "@/app/paths";
import { NavItem } from "./types";
import {
  Home,
  Calendar,
  CreditCard,
  Scissors,
  Timer,
  ClipboardList,
  Settings,
  Tag,
  Users,
  ShoppingBag,
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
    title: "Products",
    icon: <ShoppingBag />,
    href: productsPath(),
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