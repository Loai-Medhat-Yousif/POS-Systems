import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart2,
  Settings,
  ChevronRight,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav config ────────────────────────────────────────────────────────────────
const navItems = [
  { to: "/",         icon: LayoutDashboard, label: "الرئيسية",   end: true  },
  { to: "/products", icon: Package,         label: "المنتجات",   end: false },
  { to: "/pos",      icon: ShoppingCart,    label: "فواتير الشراء", end: false },
  { to: "/reports",  icon: BarChart2,       label: "التقارير",   end: false },
  { to: "/settings", icon: Settings,        label: "الإعدادات",  end: false },
];

// ─── Component ─────────────────────────────────────────────────────────────────
const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      dir="rtl"
      className={cn(
        // layout
        "relative h-screen flex flex-col shrink-0",
        // visuals
        "bg-white border-l border-blue-100 shadow-sm",
        // smooth width transition
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-56"
      )}
    >
      {/* ── Toggle pill ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
        className={cn(
          "absolute -left-3.5 top-7 z-20",
          "w-7 h-7 rounded-full",
          "bg-blue-600 hover:bg-blue-700 active:scale-95",
          "text-white shadow-md shadow-blue-200",
          "flex items-center justify-center",
          "transition-all duration-200"
        )}
      >
        {collapsed
          ? <ChevronLeft  className="w-3.5 h-3.5" />
          : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* ── Logo ────────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-blue-50 overflow-hidden",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl shadow-lg shadow-blue-200">
          <Zap className="w-4 h-4 text-white" />
        </div>

        {/* Label fades + slides out when collapsed */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
        >
          <p className="text-sm font-extrabold text-blue-800 leading-tight">Pos Flow</p>
          <p className="text-[10px] text-gray-400 font-medium">نظام نقطة البيع</p>
        </div>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium",
                "transition-all duration-150 group relative",
                "px-3 py-2.5",
                collapsed && "justify-center px-0 py-3",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200/60"
                  : "text-gray-500 hover:bg-blue-50 hover:text-blue-700"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "w-[18px] h-[18px] shrink-0 transition-colors duration-150",
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-blue-600"
                  )}
                />

                {/* Label — hidden when collapsed */}
                <span
                  className={cn(
                    "whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden",
                    collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  )}
                >
                  {label}
                </span>

                {/* Tooltip shown only when collapsed */}
                {collapsed && (
                  <span
                    className={cn(
                      "absolute right-full mr-3 px-2.5 py-1",
                      "bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap",
                      "opacity-0 group-hover:opacity-100 pointer-events-none",
                      "transition-opacity duration-150 shadow-lg",
                      "translate-x-0" // RTL: tooltip appears to the right
                    )}
                  >
                    {label}
                    {/* Arrow */}
                    <span className="absolute top-1/2 -translate-y-1/2 -left-1.5 border-4 border-transparent border-r-gray-900" />
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "border-t border-blue-50 overflow-hidden transition-all duration-300",
          collapsed ? "px-2 py-3" : "px-4 py-3"
        )}
      >
        {collapsed ? (
          // Collapsed: show a small dot indicator
          <div className="flex justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-200" />
          </div>
        ) : (
          <p className="text-[10px] text-gray-400 text-center tracking-wide">
            v1.0.0 · Pos Flow
          </p>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;