import { Users, Truck, Package, FileText, Zap, LayoutDashboard, Menu, X, ShoppingCart } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Ventes", url: "/ventes", icon: ShoppingCart },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Fournisseurs", url: "/fournisseurs", icon: Truck },
  { title: "Stocks", url: "/stocks", icon: Package },
  { title: "Factures", url: "/factures", icon: FileText },
  { title: "Actions", url: "/actions", icon: Zap },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden transition-opacity",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={() => setCollapsed(true)}
      />

      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-sidebar text-sidebar-foreground shadow-lg"
      >
        {collapsed ? <Menu size={20} /> : <X size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground z-40 transition-all duration-300 flex flex-col",
          "lg:relative lg:translate-x-0",
          collapsed ? "-translate-x-full lg:w-20" : "translate-x-0 w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <Package size={18} className="text-accent-foreground" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-lg tracking-tight">MaBoutique</span>
            )}
          </div>
        </div>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        >
          <Menu size={12} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.title}>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-muted transition-all duration-200",
                    "hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                  activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                >
                  <item.icon size={20} />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium">
              A
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin</p>
                <p className="text-xs text-sidebar-muted truncate">admin@boutique.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
