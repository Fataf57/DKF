import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Users, Truck, Package, FileText, TrendingUp, Euro } from "lucide-react";

const stats = [
  {
    title: "Total Clients",
    value: 248,
    change: "+12% ce mois",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Fournisseurs actifs",
    value: 34,
    change: "+2 nouveaux",
    changeType: "positive" as const,
    icon: Truck,
  },
  {
    title: "Articles en stock",
    value: "1,842",
    change: "156 en rupture",
    changeType: "negative" as const,
    icon: Package,
  },
  {
    title: "Factures ce mois",
    value: 89,
    change: "€45,280 total",
    changeType: "neutral" as const,
    icon: FileText,
  },
];

const Index = () => {
  return (
    <DashboardLayout>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre boutique"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={stat.title} style={{ animationDelay: `${index * 100}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-card-foreground">Revenus mensuels</h3>
            <div className="flex items-center gap-2 text-success">
              <TrendingUp size={16} />
              <span className="text-sm font-medium">+18.2%</span>
            </div>
          </div>
          <div className="flex items-end justify-between h-48 px-4">
            {["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"].map((month, i) => {
              const heights = [40, 55, 45, 60, 75, 65, 80, 95, 85, 90, 88, 100];
              return (
                <div key={month} className="flex flex-col items-center gap-2">
                  <div
                    className="w-6 sm:w-8 rounded-t-md gradient-accent transition-all hover:opacity-80"
                    style={{ height: `${heights[i]}%`, animationDelay: `${i * 50}ms` }}
                  />
                  <span className="text-xs text-muted-foreground hidden sm:block">{month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
            <Euro size={20} className="text-accent" />
            <span className="text-2xl font-bold text-card-foreground">142,580</span>
            <span className="text-muted-foreground">cette année</span>
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
};

export default Index;
