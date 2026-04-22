import { appSettingsPath, bookingsPath, dashboardPath, paymentsPath, productsPath, promoCodesPath, reportsPath, servicesPath } from "@/app/paths";
import { NavItem } from "./types";
import {
  Home,
  Calendar,
  CreditCard,
  Scissors,
  ClipboardList,
  Settings,
  Tag,
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
