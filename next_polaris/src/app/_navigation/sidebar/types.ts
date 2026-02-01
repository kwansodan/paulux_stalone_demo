export interface NavItem {
  title: string;
  icon: React.ReactElement<{ className: string }>;
  href: string;
  separator?: boolean;
}