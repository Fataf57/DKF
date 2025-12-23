import React, { useState, useEffect } from 'react';
import { FileText, ShoppingCart, Users, TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { getSales, getExpenses, getInvoices } from '../../services/api';

export function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const [salesData, expensesData, invoicesData] = await Promise.all([
          getSales({ limit: 5 }),
          getExpenses({ limit: 3 }),
          getInvoices({ limit: 2 }),
        ]);

        const sales = Array.isArray(salesData) ? salesData : salesData.results || [];
        const expenses = Array.isArray(expensesData) ? expensesData : expensesData.results || [];
        const invoices = Array.isArray(invoicesData) ? invoicesData : invoicesData.results || [];

        const activitiesList = [];

        // Ajouter les ventes récentes
        sales.slice(0, 3).forEach((sale) => {
          const saleDate = new Date(sale.sale_date);
          const timeAgo = getTimeAgo(saleDate);
          activitiesList.push({
            id: `sale-${sale.id}`,
            type: "sale",
            icon: ShoppingCart,
            title: "Nouvelle vente",
            description: `Vente #${sale.id} - ${parseFloat(sale.total_amount || 0).toLocaleString()} FCFA`,
            time: timeAgo,
            color: "text-success",
            date: saleDate,
          });
        });

        // Ajouter les dépenses récentes
        expenses.slice(0, 2).forEach((expense) => {
          const expenseDate = new Date(expense.date);
          const timeAgo = getTimeAgo(expenseDate);
          activitiesList.push({
            id: `expense-${expense.id}`,
            type: "expense",
            icon: TrendingDown,
            title: "Dépense enregistrée",
            description: `${expense.description || 'Dépense'} - ${parseFloat(expense.amount || 0).toLocaleString()} FCFA`,
            time: timeAgo,
            color: "text-destructive",
            date: expenseDate,
          });
        });

        // Ajouter les factures récentes
        invoices.slice(0, 2).forEach((invoice) => {
          const invoiceDate = new Date(invoice.date);
          const timeAgo = getTimeAgo(invoiceDate);
          activitiesList.push({
            id: `invoice-${invoice.id}`,
            type: "invoice",
            icon: FileText,
            title: "Facture créée",
            description: `Facture ${invoice.invoice_number} - ${invoice.customer_name || 'Client'}`,
            time: timeAgo,
            color: "text-accent",
            date: invoiceDate,
          });
        });

        // Trier par date (plus récent en premier)
        activitiesList.sort((a, b) => b.date - a.date);

        // Prendre les 4 plus récents
        setActivities(activitiesList.slice(0, 4));
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-64 bg-muted rounded"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Activité récente</h3>
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucune activité récente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Activité récente</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("p-2 rounded-lg bg-muted", activity.color)}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-card-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
