"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Brain,
  Boxes,
  ChartNoAxesCombined,
  LayoutDashboard,
  Package,
  PanelLeft,
  Pill,
  ReceiptText,
  RotateCcw,
  ScrollText,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Stethoscope,
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
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;
  roles: UserRole[];
};

const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "INVENTORY_MANAGER", "BUSINESS_ANALYST"],
  },
  {
    name: "Point of Sale",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["ADMIN", "PHARMACIST"],
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
    roles: [
      "ADMIN",
      "PHARMACIST",
      "INVENTORY_MANAGER",
      "BUSINESS_ANALYST",
    ],
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
    roles: [
      "ADMIN",
      "PHARMACIST",
      "INVENTORY_MANAGER",
      "BUSINESS_ANALYST",
    ],
  },
  {
    name: "Batch Alerts",
    href: "/batches/alerts",
    icon: AlertTriangle,
    roles: [
      "ADMIN",
      "PHARMACIST",
      "INVENTORY_MANAGER",
      "BUSINESS_ANALYST",
    ],
  },
  {
    name: "Sales",
    href: "/sales",
    icon: ReceiptText,
    roles: ["ADMIN", "PHARMACIST", "BUSINESS_ANALYST"],
  },
  {
    name: "Purchases",
    href: "/purchases",
    icon: ShoppingBag,
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
    roles: ["ADMIN", "PHARMACIST", "BUSINESS_ANALYST"],
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: ChartNoAxesCombined,
    roles: ["ADMIN", "BUSINESS_ANALYST"],
  },
  {
    name: "Predictions",
    href: "/predictions",
    icon: Brain,
    roles: ["ADMIN", "INVENTORY_MANAGER", "BUSINESS_ANALYST"],
  },
  {
    name: "AI Demand Intelligence",
    href: "/ai",
    icon: Sparkles,
    roles: ["ADMIN", "INVENTORY_MANAGER", "BUSINESS_ANALYST"],
  },
  {
    name: "Audit Logs",
    href: "/audit-logs",
    icon: ScrollText,
    roles: ["ADMIN", "BUSINESS_ANALYST"],
  },
];

const ROW_HEIGHT = 44;

const ACTIVE_COLOR = "#059669";

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const navRef = useRef<HTMLElement | null>(null);

  const sidebarExpanded = sidebarOpen || isHovered;

  const allowedItems = navigationItems.filter((item) =>
    item.roles.includes(role),
  );

  const roleColors = {
    ADMIN: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      pill: "bg-emerald-100 text-emerald-700",
    },

    PHARMACIST: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      pill: "bg-blue-100 text-blue-700",
    },

    INVENTORY_MANAGER: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      pill: "bg-purple-100 text-purple-700",
    },

    BUSINESS_ANALYST: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      pill: "bg-amber-100 text-amber-700",
    },
  };

  const roleStyle = roleColors[role] || roleColors.ADMIN;

  /*
   * Close mobile/sidebar overlay whenever route changes.
   */
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  /*
   * Prevent body scrolling while the sidebar is manually opened.
   */
  useEffect(() => {
    if (!sidebarOpen) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [sidebarOpen]);

  /*
   * Automatically scroll the active navigation item into view.
   */
  useEffect(() => {
    if (!navRef.current) return;

    const active = navRef.current.querySelector<HTMLElement>(
      '[data-active="true"]',
    );

    if (!active) return;

    active.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [pathname, sidebarExpanded]);

  /*
   * Determines which navigation item owns the current route.
   *
   * Example:
   * /batches/alerts -> Batch Alerts
   * instead of Batches.
   */
  const isActiveRoute = (href: string) => {
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) &&
        !navigationItems.some(
          (otherItem) =>
            otherItem.href !== href &&
            pathname.startsWith(otherItem.href) &&
            otherItem.href.length > href.length,
        ))
    );
  };

  const activeIndex = allowedItems.findIndex((item) =>
    isActiveRoute(item.href),
  );

  const hasActive = activeIndex !== -1;

  return (
    <>
      {/* =========================================================
          NAVIGATION BUTTON
      ========================================================= */}
      <button
        type="button"
        onClick={() => setSidebarOpen((previous) => !previous)}
        aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        className="
          fixed left-2.5 top-3 z-[70]
          flex h-10 w-10 items-center justify-center
          rounded-xl border border-emerald-100 bg-white
          shadow-md shadow-emerald-900/5
          transition-all duration-200
          hover:border-emerald-200
          hover:bg-emerald-50
          hover:shadow-lg
          active:scale-95
        "
      >
        <div
          className="
            flex h-7 w-7 items-center justify-center
            rounded-lg bg-emerald-600
            shadow-sm
          "
        >
          <PanelLeft
            size={16}
            strokeWidth={2.2}
            className="text-white"
          />
        </div>
      </button>

      {/* =========================================================
          BACKDROP
      ========================================================= */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="
            fixed inset-0 z-40
            bg-gray-950/30
            backdrop-blur-[1px]
          "
        />
      )}

      {/* =========================================================
          SIDEBAR
      ========================================================= */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col bg-white
          shadow-xl shadow-gray-900/[0.06]
          transition-[width] duration-300 ease-out
          ${sidebarExpanded ? "w-[224px]" : "w-[56px]"}
        `}
      >
        {/* =======================================================
            BRAND HEADER
        ======================================================= */}
        <div
          className={`
            relative flex h-[68px] shrink-0 items-center
            ${sidebarExpanded ? "px-3.5" : "justify-center px-2"}
          `}
        >
          <div
            className={`
              flex items-center
              ${sidebarExpanded ? "gap-2.5" : "justify-center"}
            `}
          >
            <div className="relative shrink-0">
              <div
                className="
                  absolute inset-0
                  rounded-xl
                  bg-emerald-400/25
                  blur-md
                "
              />

              <div
                className="
                  relative flex h-9 w-9
                  items-center justify-center
                  rounded-xl
                  bg-emerald-600
                  shadow-md
                "
              >
                <Pill
                  size={20}
                  strokeWidth={2.2}
                  className="text-white"
                />
              </div>
            </div>

            <div
              className={`
                overflow-hidden whitespace-nowrap
                transition-all duration-300
                ${sidebarExpanded ? "w-[145px] opacity-100" : "w-0 opacity-0"}
              `}
            >
              <div className="flex items-center gap-1.5">
                <h1
                  className="
                    text-xl font-extrabold
                    tracking-tight
                    text-emerald-700
                  "
                >
                  PHARMIX
                </h1>

                <span
                  className="
                    rounded-full
                    bg-emerald-100
                    px-1.5 py-0.5
                    text-[7px] font-bold
                    uppercase tracking-wider
                    text-emerald-700
                  "
                >
                  AI
                </span>
              </div>

              <p
                className="
                  mt-0.5
                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-gray-400
                "
              >
                Intelligent Pharmacy
              </p>
            </div>
          </div>
        </div>

        {/* =======================================================
            NAVIGATION
        ======================================================= */}
        <nav
          ref={navRef}
          className="
            relative flex-1
            overflow-y-auto overflow-x-visible
            px-2 py-4
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {/* SECTION LABEL */}
          <div
            className={`
              relative z-10
              mb-2
              overflow-hidden
              px-2
              transition-all duration-300
              ${sidebarExpanded ? "h-4 opacity-100" : "h-0 opacity-0"}
            `}
          >
            <p
              className="
                whitespace-nowrap
                text-[9px]
                font-bold
                uppercase
                tracking-[0.15em]
                text-gray-400
              "
            >
              Pharmacy Operations
            </p>
          </div>

          {/* =====================================================
              ACTIVE INDICATOR SYSTEM

              IMPORTANT:

              The rail is NOT a separate scrollbar.

              It consists of:

              1. Top vertical segment
              2. Active item's horizontal connector
              3. Active icon
              4. Bottom vertical segment

              Everything uses the SAME emerald color.
          ===================================================== */}
          <div className="relative">
            {/* ===================================================
                TOP VERTICAL LINE

                Ends exactly at the top of the active row.
            =================================================== */}
            {hasActive && (
              <span
                aria-hidden
                className="
                  pointer-events-none
                  absolute
                  right-[-8px]
                  top-0
                  z-[2]
                  w-[4px]
                  rounded-t-full
                  bg-emerald-600
                "
                style={{
                  height: `${activeIndex * ROW_HEIGHT}px`,
                }}
              />
            )}

            {/* ===================================================
                BOTTOM VERTICAL LINE

                IMPORTANT FIX:

                This begins exactly at the BOTTOM of the active
                navigation row.

                Because the active connector and this line use
                exactly the same color, there is no visible break.
            =================================================== */}
            {hasActive && (
              <span
                aria-hidden
                className="
                  pointer-events-none
                  absolute
                  right-[-8px]
                  z-[2]
                  w-[4px]
                  rounded-b-full
                  bg-emerald-600
                "
                style={{
                  top: `${(activeIndex + 1) * ROW_HEIGHT}px`,
                  bottom: 0,
                }}
              />
            )}

            {/* ===================================================
                NAVIGATION ITEMS
            =================================================== */}
            <div className="relative z-10 space-y-1">
              {allowedItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    title={!sidebarExpanded ? item.name : undefined}
                    data-active={isActive ? "true" : "false"}
                    className={`
                      group
                      relative
                      flex
                      h-10
                      items-center
                      overflow-visible
                      ${
                        sidebarExpanded
                          ? "gap-2.5 px-2.5"
                          : "justify-center px-0"
                      }
                    `}
                  >
                    {/* =================================================
                        INACTIVE HOVER BACKGROUND
                    ================================================= */}
                    {!isActive && (
                      <>
                        <span
                          aria-hidden
                          className="
                            pointer-events-none
                            absolute
                            inset-y-0
                            left-0
                            right-0
                            z-0
                            rounded-l-[20px]
                            bg-emerald-600
                            opacity-0
                            transition-opacity duration-200
                            group-hover:opacity-[0.07]
                          "
                        />

                        <span
                          aria-hidden
                          className="
                            pointer-events-none
                            absolute
                            right-[-8px]
                            top-1
                            bottom-1
                            z-0
                            w-[3px]
                            rounded-full
                            bg-emerald-600
                            opacity-0
                            transition-opacity duration-200
                            group-hover:opacity-60
                          "
                        />
                      </>
                    )}

                    {/* =================================================
                        ACTIVE ITEM

                        EVERYTHING BELOW IS THE SAME COLOR.

                        The connector begins at the RIGHT SIDE of
                        the active icon and travels to the vertical
                        rail.

                        This is what makes the rail look physically
                        connected to the icon.
                    ================================================= */}
                    {isActive && (
                      <>
                        {/* -----------------------------------------
                            ACTIVE BACKGROUND
                        ----------------------------------------- */}
                        <span
                          aria-hidden
                          className="
                            pointer-events-none
                            absolute
                            inset-y-0
                            left-0
                            right-0
                            z-0
                            rounded-l-[22px]
                            bg-emerald-600
                            shadow-sm
                          "
                        />

                        {/* -----------------------------------------
                            HORIZONTAL CONNECTOR

                            Expanded:
                            icon right edge ≈ 46px

                            Collapsed:
                            icon right edge ≈ 42px

                            The connector goes all the way to the
                            vertical rail.
                        ----------------------------------------- */}
                        <span
                          aria-hidden
                          className={`
                            pointer-events-none
                            absolute
                            z-[4]
                            top-1/2
                            h-[4px]
                            -translate-y-1/2
                            rounded-full
                            bg-emerald-600
                            ${
                              sidebarExpanded
                                ? "left-[46px]"
                                : "left-[42px]"
                            }
                            right-[-8px]
                          `}
                        />

                        {/* -----------------------------------------
                            SMALL CENTER JOIN

                            This makes the connector visually merge
                            directly into the icon instead of leaving
                            a tiny gap around the icon edge.
                        ----------------------------------------- */}
                        <span
                          aria-hidden
                          className="
                            pointer-events-none
                            absolute
                            z-[5]
                            top-1/2
                            left-[40px]
                            h-[8px]
                            w-[8px]
                            -translate-y-1/2
                            rounded-full
                            bg-emerald-600
                          "
                        />

                        {/* -----------------------------------------
                            TOP CURVE INTO ACTIVE ROW

                            Same emerald color.
                        ----------------------------------------- */}
                        <span
                          aria-hidden
                          className="
                            pointer-events-none
                            absolute
                            right-[-8px]
                            top-0
                            z-[3]
                            h-5
                            w-6
                            rounded-bl-[24px]
                            bg-emerald-600
                          "
                        />

                        {/* -----------------------------------------
                            BOTTOM CURVE OUT OF ACTIVE ROW

                            Same emerald color.

                            This is the important part that prevents
                            the bottom vertical line from looking
                            disconnected.
                        ----------------------------------------- */}
                        <span
                          aria-hidden
                          className="
                            pointer-events-none
                            absolute
                            right-[-8px]
                            bottom-0
                            z-[3]
                            h-5
                            w-6
                            rounded-tl-[24px]
                            bg-emerald-600
                          "
                        />
                      </>
                    )}

                    {/* =================================================
                        ICON

                        ACTIVE ICON IS ALSO THE SAME EMERALD COLOR.

                        White icon sits inside the emerald active
                        indicator.
                    ================================================= */}
                    <span
                      className={`
                        relative
                        z-20
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        transition-all duration-200
                        ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-gray-500 group-hover:text-gray-900"
                        }
                      `}
                    >
                      <Icon
                        size={16}
                        strokeWidth={2}
                      />
                    </span>

                    {/* =================================================
                        TEXT
                    ================================================= */}
                    <span
                      className={`
                        relative
                        z-20
                        min-w-0
                        flex-1
                        truncate
                        whitespace-nowrap
                        text-[11px]
                        font-medium
                        transition-all duration-300
                        ${
                          sidebarExpanded
                            ? "opacity-100"
                            : "w-0 flex-none opacity-0"
                        }
                        ${
                          isActive
                            ? "text-white"
                            : "text-gray-600 group-hover:text-gray-900"
                        }
                      `}
                    >
                      {item.name}
                    </span>

                    {/* =================================================
                        ARROW
                    ================================================= */}
                    {sidebarExpanded && !isActive && (
                      <span
                        className="
                          relative
                          z-10
                          translate-x-1
                          text-[11px]
                          text-gray-300
                          opacity-0
                          transition-all duration-200
                          group-hover:translate-x-0
                          group-hover:opacity-100
                        "
                      >
                        →
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* =======================================================
            FOOTER / ROLE
        ======================================================= */}
        <div
          className={`
            shrink-0
            border-t
            border-gray-100
            bg-white
            ${sidebarExpanded ? "p-2.5" : "p-2"}
          `}
        >
          <div
            className={`
              rounded-xl
              border
              ${roleStyle.border}
              ${roleStyle.bg}
              ${
                sidebarExpanded
                  ? "px-2.5 py-2"
                  : "flex justify-center p-1.5"
              }
            `}
            title={
              !sidebarExpanded
                ? role.replace("_", " ")
                : undefined
            }
          >
            <div
              className={`
                flex items-center
                ${sidebarExpanded ? "gap-2" : "justify-center"}
              `}
            >
              <div
                className={`
                  shrink-0
                  rounded-lg
                  ${roleStyle.pill}
                  p-1.5
                `}
              >
                <Stethoscope
                  className={`h-3.5 w-3.5 ${roleStyle.text}`}
                  strokeWidth={2}
                />
              </div>

              <div
                className={`
                  min-w-0
                  overflow-hidden
                  transition-all duration-300
                  ${
                    sidebarExpanded
                      ? "w-[120px] opacity-100"
                      : "w-0 opacity-0"
                  }
                `}
              >
                <p
                  className="
                    whitespace-nowrap
                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-gray-400
                  "
                >
                  Signed in as
                </p>

                <p
                  className={`
                    mt-0.5
                    truncate
                    whitespace-nowrap
                    text-[10px]
                    font-bold
                    ${roleStyle.text}
                  `}
                >
                  {role.replace("_", " ")}
                </p>
              </div>

              {sidebarExpanded && (
                <span
                  className="
                    ml-auto
                    h-1.5
                    w-1.5
                    shrink-0
                    rounded-full
                    bg-emerald-600
                  "
                />
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}