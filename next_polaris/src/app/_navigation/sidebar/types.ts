import { PermissionKey } from "@/lib/permissions"

export interface NavItem {
  title: string;
  icon: React.ReactElement<{ className: string }>;
  href: string;
  separator?: boolean;
  permission?: PermissionKey;
}