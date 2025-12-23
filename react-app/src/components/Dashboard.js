import React, { useState } from 'react';
import { DashboardLayout } from './layout/DashboardLayout';
import { PageHeader } from './ui/PageHeader';
import StatsCards from './StatsCards';
import Products from './Products';
import Customers from './Customers';
import Sales from './Sales';
import Expenses from './Expenses';
import Invoices from './Invoices';
import InvoiceForm from './InvoiceForm';
import Settings from './Settings';
import { RecentActivity } from './dashboard/RecentActivity';
import { RevenueChart } from './dashboard/RevenueChart';

function Dashboard({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [invoiceId, setInvoiceId] = useState(null);

  const handleNavigate = (page, id = null) => {
    setCurrentPage(page);
    if (page === 'invoice-edit' || page === 'invoice-new') {
      setInvoiceId(id);
    } else {
      setInvoiceId(null);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'products':
        return <Products onNavigate={handleNavigate} />;
      case 'customers':
        return <Customers />;
      case 'sales':
        return <Sales onNavigate={handleNavigate} activeItem={currentPage} user={user} onLogout={onLogout} />;
      case 'expenses':
        return <Expenses />;
      case 'invoices':
        return <Invoices onNavigate={handleNavigate} />;
      case 'invoice-new':
        return <InvoiceForm onNavigate={handleNavigate} />;
      case 'invoice-edit':
        return <InvoiceForm invoiceId={invoiceId} onNavigate={handleNavigate} />;
      case 'settings':
        return <Settings />;
      case 'settings-old':
        return (
          <div>
            <PageHeader
              title="Hors stocks"
              description="Gérez les paramètres de votre application"
            />
            <div className="bg-card rounded-xl border border-border p-6">
              <p className="text-muted-foreground">Fonctionnalité à venir</p>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <PageHeader
              title="Tableau de bord"
              description="Vue d'ensemble de votre boutique"
            />

            {/* Stats Grid */}
            <div className="mb-8">
              <StatsCards />
            </div>

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RevenueChart />

              {/* Recent Activity */}
              <RecentActivity />
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout 
      user={user} 
      onLogout={onLogout}
      activeItem={currentPage}
      onNavigate={handleNavigate}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

export default Dashboard;
