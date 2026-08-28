"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Brain,
  ClipboardList,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";

type UserRole =
  | "ADMIN"
  | "PHARMACIST"
  | "INVENTORY_MANAGER"
  | "BUSINESS_ANALYST";

type SidebarProps = {
  role: UserRole;
};

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: UserRole[];
};

const navigationItems: NavigationItem[] = [
  {
    name: "Point of Sale",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["ADMIN", "PHARMACIST"],
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [
      "ADMIN",
      "INVENTORY_MANAGER",
      "BUSINESS_ANALYST",
    ],
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
    roles: ["ADMIN", "INVENTORY_MANAGER"],
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Warehouse,
    roles: ["ADMIN", "INVENTORY_MANAGER"],
  },
  {
    name: "Batches",
    href: "/batches",
    icon: Boxes,
    roles: ["ADMIN", "INVENTORY_MANAGER"],
  },
  {
    name: "Sales",
    href: "/sales",
    icon: ShoppingCart,
    roles: [
      "ADMIN",
      "PHARMACIST",
      "BUSINESS_ANALYST",
    ],
  },
  {
    name: "Purchases",
    href: "/purchases",
    icon: ClipboardList,
    roles: ["ADMIN", "INVENTORY_MANAGER"],
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
    roles: [
      "ADMIN",
      "PHARMACIST",
      "BUSINESS_ANALYST",
    ],
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["ADMIN", "BUSINESS_ANALYST"],
  },
  {
    name: "Predictions",
    href: "/predictions",
    icon: Brain,
    roles: [
      "ADMIN",
      "INVENTORY_MANAGER",
      "BUSINESS_ANALYST",
    ],
  },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const allowedItems = navigationItems.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="border-b px-6 py-5">
        <h1 className="text-2xl font-bold">
          Pharmix
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Pharmacy Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {allowedItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={20} />

              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Current User Role */}
      <div className="border-t p-4">
        <p className="text-xs font-medium text-gray-500">
          Signed in as
        </p>

        <p className="mt-1 text-sm font-semibold">
          {role}
        </p>
      </div>
    </aside>
  );
}