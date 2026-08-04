import { appSettingsPath, bookingsPath, dashboardPath, giftCardOrdersPath, materialsPath, paymentsPath, productsPath, promoCodesPath, reportsPath, servicesPath } from "@/app/paths";
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
  Gift,
  Boxes,
} from 'lucide-react';


export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: <Home />,
    href: dashboardPath(),
    permission: "dashboard.view",
  },
  {
    title: "Bookings",
    icon: <Calendar />,
    href: bookingsPath(),
    permission: "bookings.view",
  },
  {
    title: "Payments",
    icon: <CreditCard />,
    href: paymentsPath(),
    permission: "payments.view",
  },
  {
    separator: true,
    title: "Services",
    icon: <Scissors />,
    href: servicesPath(),
    permission: "services.view",
  },
  {
    title: "Products",
    icon: <ShoppingBag />,
    href: productsPath(),
    permission: "products.view",
  },
  {
    title: "Materials",
    icon: <Boxes />,
    href: materialsPath(),
    permission: "materials.view",
  },
  {
    title: "Reports",
    icon: <ClipboardList />,
    href: reportsPath(),
    permission: "reports.view",
  },
  {
    title: "Promo Codes",
    icon: <Tag />,
    href: promoCodesPath(),
    permission: "promo_codes.view",
  },
  {
    title: "Gift Cards",
    icon: <Gift />,
    href: giftCardOrdersPath(),
    permission: "gift_cards.view",
  },
  {
    separator: true,
    title: "App Settings",
    icon: <Settings />,
    href: appSettingsPath(),
    permission: "settings.view",
  },
]
