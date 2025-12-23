import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../services/api';
import { TrendingUp, Euro } from 'lucide-react';

export function RevenueChart() {
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
      <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="h-48 bg-muted rounded"></div>
      </div>
    );
  }

  const monthlyRevenue = stats?.monthly_revenue || [];
  const maxRevenue = Math.max(...monthlyRevenue, 1);
  const totalRevenue = monthlyRevenue.reduce((sum, val) => sum + val, 0);

  // Calculer le pourcentage de croissance (comparaison des 2 derniers mois)
  const lastMonth = monthlyRevenue[monthlyRevenue.length - 1] || 0;
  const previousMonth = monthlyRevenue[monthlyRevenue.length - 2] || 0;
  const growth = previousMonth > 0 
    ? ((lastMonth - previousMonth) / previousMonth * 100).toFixed(1)
    : 0;

  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  const currentMonthIndex = new Date().getMonth();
  const displayMonths = months.slice(-12);

  return (
    <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Revenus mensuels</h3>
        {growth !== 0 && (
          <div className={`flex items-center gap-2 ${parseFloat(growth) >= 0 ? 'text-success' : 'text-destructive'}`}>
            <TrendingUp size={16} />
            <span className="text-sm font-medium">{parseFloat(growth) >= 0 ? '+' : ''}{growth}%</span>
          </div>
        )}
      </div>
      <div className="relative">
        {/* Axe Y (valeurs) */}
        <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-muted-foreground pr-2">
          {[100, 75, 50, 25, 0].map((percent) => (
            <span key={percent}>{percent}%</span>
          ))}
        </div>
        
        {/* Graphique en barres */}
        <div className="flex items-end justify-between h-48 px-8 ml-8 gap-2">
          {displayMonths.map((month, i) => {
            const revenue = monthlyRevenue[i] || 0;
            const height = maxRevenue > 0 ? (revenue / maxRevenue * 100) : 0;
            const isCurrentMonth = i === displayMonths.length - 1;
            return (
              <div key={month} className="flex flex-col items-center gap-2 flex-1 group">
                <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                  {/* Barre */}
                  <div
                    className={`w-full rounded-t transition-all hover:opacity-90 cursor-pointer shadow-sm ${
                      isCurrentMonth 
                        ? 'gradient-accent shadow-accent/20' 
                        : 'bg-accent hover:bg-accent/80'
                    }`}
                    style={{ 
                      height: `${height}%`, 
                      minHeight: revenue > 0 ? '2px' : '0',
                      animationDelay: `${i * 50}ms`,
                      transition: 'all 0.3s ease'
                    }}
                    title={`${month}: ${revenue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`}
                  />
                  
                  {/* Tooltip au survol */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-foreground text-background px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
                      {revenue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA
                    </div>
                  </div>
                </div>
                
                {/* Label du mois */}
                <span className={`text-xs font-medium ${
                  isCurrentMonth ? 'text-accent font-semibold' : 'text-muted-foreground'
                }`}>
                  {month}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Ligne de référence horizontale */}
        <div className="absolute left-8 right-0 top-0 bottom-12 pointer-events-none">
          {[75, 50, 25].map((percent) => (
            <div
              key={percent}
              className="absolute w-full border-t border-border/30"
              style={{ bottom: `${percent}%` }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
        <Euro size={20} className="text-accent" />
        <span className="text-2xl font-bold text-card-foreground">
          {totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
        <span className="text-muted-foreground">FCFA (12 derniers mois)</span>
      </div>
    </div>
  );
}

