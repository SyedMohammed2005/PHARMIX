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
  RotateCcw,
  ShoppingCart,
  Users,
  Warehouse,
  Pill,
  Stethoscope,
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
  name: "Purchase Returns",
  href: "/purchase-returns",
  icon: RotateCcw,
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

  // Role-based color schemes
  const roleColors = {
    ADMIN: {
      gradient: "from-emerald-600 to-teal-600",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: "text-emerald-600",
      pill: "bg-emerald-100 text-emerald-700",
    },
    PHARMACIST: {
      gradient: "from-blue-600 to-cyan-600",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: "text-blue-600",
      pill: "bg-blue-100 text-blue-700",
    },
    INVENTORY_MANAGER: {
      gradient: "from-purple-600 to-indigo-600",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      icon: "text-purple-600",
      pill: "bg-purple-100 text-purple-700",
    },
    BUSINESS_ANALYST: {
      gradient: "from-amber-600 to-orange-600",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: "text-amber-600",
      pill: "bg-amber-100 text-amber-700",
    },
  };

  const roleStyle = roleColors[role] || roleColors.ADMIN;

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-gray-100/80 bg-gradient-to-b from-white via-white to-emerald-50/30 shadow-xl shadow-emerald-100/10 backdrop-blur-sm">
      {/* Logo */}
      <div className="relative border-b border-gray-100/80 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 blur-md opacity-30"></div>
            <div className={`relative rounded-xl bg-gradient-to-r ${roleStyle.gradient} p-2.5 shadow-lg shadow-emerald-200/50`}>
              <Pill className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Pharmix
            </h1>
            <p className="mt-0.5 text-xs font-medium text-gray-500 tracking-wider">
              PHARMACY MANAGEMENT
            </p>
          </div>
        </div>
        
        {/* Decorative element */}
        <div className="absolute -right-0 top-1/2 -translate-y-1/2 h-12 w-0.5 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-full opacity-30"></div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent">
        {allowedItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r ${roleStyle.gradient} text-white shadow-lg shadow-emerald-200/50 scale-[1.02]`
                  : "text-gray-600 hover:bg-white/80 hover:text-gray-900 hover:shadow-md hover:shadow-emerald-100/30 hover:scale-[1.02] hover:border hover:border-emerald-100/50"
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-white/60 shadow-lg shadow-white/50"></span>
              )}
              
              {/* Icon container */}
              <span className={`relative transition-all duration-300 ${
                isActive 
                  ? "text-white" 
                  : "text-gray-500 group-hover:text-emerald-600 group-hover:scale-110"
              }`}>
                <Icon size={20} />
              </span>

              {/* Item name */}
              <span className="flex-1 transition-all duration-300">
                {item.name}
              </span>

              {/* Hover indicator */}
              {!isActive && (
                <span className="absolute right-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}

              {/* Hover background effect */}
              {!isActive && (
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-50/0 via-emerald-50/0 to-emerald-50/0 transition-all duration-300 group-hover:from-emerald-50/20 group-hover:via-emerald-50/10 group-hover:to-emerald-50/0 -z-10"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Current User Role */}
      <div className="relative border-t border-gray-100/80 p-5">
        <div className={`rounded-xl ${roleStyle.bg} border ${roleStyle.border} p-4`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-full ${roleStyle.pill} p-2`}>
              <Stethoscope className={`h-4 w-4 ${roleStyle.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Signed in as
              </p>
              <p className={`mt-0.5 text-sm font-bold ${roleStyle.text} truncate`}>
                {role.replace('_', ' ')}
              </p>
            </div>
            <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${roleStyle.gradient} animate-pulse`}></div>
          </div>
        </div>
        
        {/* Decorative dots */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          <span className="h-1 w-1 rounded-full bg-emerald-300/50"></span>
          <span className="h-1 w-1 rounded-full bg-teal-300/50"></span>
          <span className="h-1 w-1 rounded-full bg-emerald-300/50"></span>
        </div>
      </div>
    </aside>
  );
}