import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';

function StatsCards() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-destructive">Erreur de chargement des statistiques</div>;
  }

  const statsData = [
    { 
      title: 'Total Produits', 
      value: stats.products?.total || 0,
      change: stats.products?.low_stock > 0 ? `${stats.products.low_stock} stock faible` : 'OK',
      changeType: stats.products?.low_stock > 0 ? 'negative' : 'positive',
      icon: Package,
    },
    { 
      title: 'Ventes', 
      value: stats.sales?.total || 0,
      change: stats.sales?.recent > 0 ? `+${stats.sales.recent} ce mois` : 'Aucune',
      changeType: stats.sales?.recent > 0 ? 'positive' : 'neutral',
      icon: ShoppingCart,
    },
    { 
      title: 'Clients', 
      value: stats.customers?.total || 0,
      change: stats.customers?.recent > 0 ? `+${stats.customers.recent} ce mois` : 'Stable',
      changeType: stats.customers?.recent > 0 ? 'positive' : 'neutral',
      icon: Users,
    },
    { 
      title: 'Revenus Net', 
      value: `${parseFloat(stats.revenue?.net || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`,
      change: stats.expenses?.total > 0 ? `${stats.expenses.total} dépenses` : 'Aucune dépense',
      changeType: 'neutral',
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={index} 
            className="bg-card rounded-xl p-6 border border-border hover-lift animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold text-card-foreground">{stat.value}</p>
                {stat.change && (
                  <p
                    className={cn(
                      "text-sm font-medium",
                      stat.changeType === "positive" && "text-success",
                      stat.changeType === "negative" && "text-destructive",
                      stat.changeType === "neutral" && "text-muted-foreground"
                    )}
                  >
                    {stat.change}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-accent/10">
                <Icon size={24} className="text-accent" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsCards;

