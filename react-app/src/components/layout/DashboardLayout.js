import React from 'react';
import Sidebar from '../Sidebar';

export function DashboardLayout({ children, user, onLogout, activeItem, onNavigate }) {
  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar activeItem={activeItem} onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <main className="ml-0 lg:ml-64 overflow-y-auto h-screen">
        <div className="p-6 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}

