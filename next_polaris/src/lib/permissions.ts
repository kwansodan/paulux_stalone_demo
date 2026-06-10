export const PERMISSIONS = {
  DASHBOARD_VIEW:   { key: "dashboard.view",   label: "Dashboard",            area: "Core" },
  BOOKINGS_VIEW:    { key: "bookings.view",     label: "Bookings",             area: "Core" },
  PAYMENTS_VIEW:    { key: "payments.view",     label: "Payments",             area: "Core" },
  SERVICES_VIEW:    { key: "services.view",     label: "Services",             area: "Catalog" },
  PRODUCTS_VIEW:    { key: "products.view",     label: "Products",             area: "Catalog" },
  REPORTS_VIEW:     { key: "reports.view",      label: "Reports",              area: "Analytics" },
  PROMO_CODES_VIEW: { key: "promo_codes.view",  label: "Promo Codes",          area: "Marketing" },
  GIFT_CARDS_VIEW:   { key: "gift_cards.view",   label: "Gift Cards",          area: "Marketing" },
  GIFT_CARDS_MANAGE: { key: "gift_cards.manage", label: "Manage Gift Cards",   area: "Marketing" },
  SETTINGS_VIEW:    { key: "settings.view",     label: "App Settings",         area: "Administration" },
  ROLES_MANAGE:     { key: "roles.manage",      label: "Roles & Permissions",  area: "Administration" },
} as const

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS]["key"]

export type PermissionArea = {
  area: string
  items: Array<{ key: PermissionKey; label: string }>
}

export const PERMISSION_AREAS: PermissionArea[] = Object.values(PERMISSIONS).reduce(
  (acc, p) => {
    let group = acc.find((a) => a.area === p.area)
    if (!group) { group = { area: p.area, items: [] }; acc.push(group) }
    group.items.push({ key: p.key as PermissionKey, label: p.label })
    return acc
  },
  [] as PermissionArea[]
)
