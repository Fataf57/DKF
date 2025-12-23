import React, { useState } from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, 
  TrendingUp, FileText, DollarSign, AlertTriangle, Menu, X, LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';

function Sidebar({ activeItem, onNavigate, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { id: 'products', icon: Package, label: 'Produits' },
    { id: 'customers', icon: Users, label: 'Clients' },
    { id: 'sales', icon: DollarSign, label: 'Ventes' },
    { id: 'expenses', icon: TrendingUp, label: 'Dépenses' },
    { id: 'invoices', icon: FileText, label: 'Factures' },
    { id: 'settings', icon: AlertTriangle, label: 'Hors stocks' },
  ];

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
          collapsed ? "-translate-x-full lg:w-20 lg:translate-x-0" : "translate-x-0 w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center overflow-hidden">
              <img src="/logo-dkf.jpeg" alt="Super DKF" className="w-full h-full object-cover" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-lg tracking-tight">Super DKF</span>
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
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-muted transition-all duration-200",
                      "hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      isActive && "bg-sidebar-accent text-sidebar-foreground font-medium"
                    )}
                  >
                    <Icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {user && (
          <div className="p-4 border-t border-sidebar-border space-y-2">
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-medium">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <p className="text-xs text-sidebar-muted truncate">{user.email || 'Utilisateur'}</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 text-sm"
              >
                <LogOut size={16} />
                <span>Déconnexion</span>
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;

