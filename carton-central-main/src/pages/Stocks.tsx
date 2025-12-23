import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";

const stocks = [
  { id: 1, sku: "PRD-001", name: "Écran LED 27\"", category: "Électronique", quantity: 45, minStock: 10, price: 299.99, status: "En stock" },
  { id: 2, sku: "PRD-002", name: "Clavier mécanique", category: "Accessoires", quantity: 128, minStock: 25, price: 89.99, status: "En stock" },
  { id: 3, sku: "PRD-003", name: "Souris gaming", category: "Accessoires", quantity: 8, minStock: 15, price: 59.99, status: "Stock faible" },
  { id: 4, sku: "PRD-004", name: "Câble HDMI 2m", category: "Câbles", quantity: 0, minStock: 50, price: 12.99, status: "Rupture" },
  { id: 5, sku: "PRD-005", name: "Hub USB-C", category: "Accessoires", quantity: 67, minStock: 20, price: 45.99, status: "En stock" },
  { id: 6, sku: "PRD-006", name: "Support écran", category: "Mobilier", quantity: 23, minStock: 10, price: 79.99, status: "En stock" },
  { id: 7, sku: "PRD-007", name: "Webcam HD", category: "Électronique", quantity: 5, minStock: 15, price: 129.99, status: "Stock faible" },
];

const columns = [
  { key: "sku", header: "SKU" },
  { key: "name", header: "Produit" },
  { key: "category", header: "Catégorie" },
  {
    key: "quantity",
    header: "Quantité",
    render: (item: typeof stocks[0]) => (
      <span className={item.quantity <= item.minStock ? "text-destructive font-medium" : ""}>
        {item.quantity}
      </span>
    ),
  },
  {
    key: "price",
    header: "Prix",
    render: (item: typeof stocks[0]) => `€${item.price.toFixed(2)}`,
  },
  {
    key: "status",
    header: "Statut",
    render: (item: typeof stocks[0]) => (
      <StatusBadge
        status={
          item.status === "En stock" ? "success" : item.status === "Stock faible" ? "warning" : "error"
        }
      >
        {item.status}
      </StatusBadge>
    ),
  },
];

const Stocks = () => {
  return (
    <DashboardLayout>
      <PageHeader
        title="Stocks"
        description="Gérez votre inventaire"
        icon={Package}
        action={
          <Button className="gap-2">
            <Plus size={16} />
            Nouveau produit
          </Button>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total produits</p>
          <p className="text-2xl font-bold text-card-foreground">1,842</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Stock faible</p>
          <p className="text-2xl font-bold text-warning">23</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Rupture de stock</p>
          <p className="text-2xl font-bold text-destructive">8</p>
        </div>
      </div>

      <DataTable data={stocks} columns={columns} />
    </DashboardLayout>
  );
};

export default Stocks;
