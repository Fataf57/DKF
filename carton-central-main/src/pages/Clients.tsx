import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Users, Plus, Mail, Phone } from "lucide-react";

const clients = [
  { id: 1, name: "Martin SARL", email: "contact@martin-sarl.fr", phone: "01 23 45 67 89", city: "Paris", status: "Actif", totalOrders: 24 },
  { id: 2, name: "Dupont Industries", email: "info@dupont-ind.com", phone: "02 34 56 78 90", city: "Lyon", status: "Actif", totalOrders: 18 },
  { id: 3, name: "Lefebvre & Fils", email: "contact@lefebvre.fr", phone: "03 45 67 89 01", city: "Marseille", status: "Inactif", totalOrders: 7 },
  { id: 4, name: "Bernard Trading", email: "sales@bernard.com", phone: "04 56 78 90 12", city: "Toulouse", status: "Actif", totalOrders: 31 },
  { id: 5, name: "Petit Commerce", email: "hello@petit-commerce.fr", phone: "05 67 89 01 23", city: "Nice", status: "En attente", totalOrders: 0 },
  { id: 6, name: "Robert Express", email: "contact@robert-exp.fr", phone: "06 78 90 12 34", city: "Nantes", status: "Actif", totalOrders: 15 },
];

const columns = [
  { key: "name", header: "Nom" },
  {
    key: "email",
    header: "Contact",
    render: (item: typeof clients[0]) => (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <Mail size={14} className="text-muted-foreground" />
          {item.email}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone size={14} />
          {item.phone}
        </div>
      </div>
    ),
  },
  { key: "city", header: "Ville" },
  {
    key: "status",
    header: "Statut",
    render: (item: typeof clients[0]) => (
      <StatusBadge
        status={item.status === "Actif" ? "success" : item.status === "Inactif" ? "error" : "warning"}
      >
        {item.status}
      </StatusBadge>
    ),
  },
  { key: "totalOrders", header: "Commandes" },
];

const Clients = () => {
  return (
    <DashboardLayout>
      <PageHeader
        title="Clients"
        description="Gérez votre base de clients"
        icon={Users}
        action={
          <Button className="gap-2">
            <Plus size={16} />
            Nouveau client
          </Button>
        }
      />

      <DataTable data={clients} columns={columns} />
    </DashboardLayout>
  );
};

export default Clients;
