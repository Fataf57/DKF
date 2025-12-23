import React, { useState, useEffect } from 'react';
import { getOutOfStockSales } from '../services/api';
import { PageHeader } from './ui/PageHeader';
import { AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/Table';

function Settings() {
  const [outOfStockSales, setOutOfStockSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutOfStockSales();
  }, []);

  const fetchOutOfStockSales = async () => {
    try {
      setLoading(true);
      const data = await getOutOfStockSales();
      setOutOfStockSales(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching out of stock sales:', error);
      setOutOfStockSales([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Hors stocks"
        description="Ventes effectuées hors stock"
        icon={AlertTriangle}
      />

      <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Ventes hors stock
          </h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : outOfStockSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune vente hors stock enregistrée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Quantité vendue</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outOfStockSales.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product_name || item.product}
                    </TableCell>
                    <TableCell className="font-semibold text-destructive">
                      {item.quantity_sold} pièces
                    </TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.notes || `${item.product_name || item.product} ${item.quantity_sold} pièces vendues hors stock`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}

export default Settings;

