import React, { useState, useEffect } from 'react';
import { getSales, createSale, updateSale, deleteSale, getSale, getProducts, exportSalesReport, checkStock } from '../services/api';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { MessageDialog } from './ui/MessageDialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './ui/AlertDialog';
import { ShoppingCart, Plus, Trash2, Save, Download, Calendar, Edit, X } from 'lucide-react';

function Sales({ onNavigate, activeItem, user, onLogout }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [messageDialog, setMessageDialog] = useState({ open: false, title: '', message: '', type: 'success' });
  const [exporting, setExporting] = useState(false);
  const [stockDialog, setStockDialog] = useState({ open: false, issues: [], items: [], onConfirm: null });
  const [editingSale, setEditingSale] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, saleId: null, saleInfo: null });

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [dateFrom, dateTo]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const data = await getSales(params);
      const salesList = Array.isArray(data) ? data : (data.results || []);
      setSales(salesList);
      console.log('Ventes récupérées:', salesList.length, salesList);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : (data.results || []));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const updateCell = (id, field, value) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };
        // Si on change le produit, récupérer automatiquement le prix
        if (field === "produit") {
          const product = products.find(p => p.name.toLowerCase() === String(value).toLowerCase());
          if (product) {
            updated.prixUnitaire = product.price;
          }
        }
        // Calculer le total automatiquement
        if (field === "quantite" || field === "prixUnitaire" || field === "produit") {
          updated.total = Number(updated.quantite || 0) * Number(updated.prixUnitaire || 0);
        }
        return updated;
      }
      return row;
    }));
  };

  const addRow = () => {
    const newRow = {
      id: nextId,
      date: new Date().toISOString().split('T')[0],
      produit: "",
      quantite: 0,
      prixUnitaire: 0,
      total: 0,
    };
    setRows([...rows, newRow]);
    setNextId(nextId + 1);
  };

  const deleteRow = (id) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const handleSave = async () => {
    try {
      const validRows = rows.filter(row => row.produit && row.quantite > 0 && row.prixUnitaire > 0);
      
      if (validRows.length === 0) {
        setMessageDialog({
          open: true,
          title: 'Validation requise',
          message: 'Veuillez ajouter au moins une ligne valide avec un produit, une quantité et un prix.',
          type: 'error'
        });
        return;
      }

      // Vérifier que tous les produits existent
      const items = [];
      for (const row of validRows) {
        const product = products.find(p => p.name.toLowerCase() === row.produit.toLowerCase());
        
        if (!product) {
          setMessageDialog({
            open: true,
            title: 'Produit introuvable',
            message: `Le produit "${row.produit}" n'existe pas. Veuillez le créer d'abord dans la section Produits.`,
            type: 'error'
          });
          return;
        }

        items.push({
          product: product.id,
          quantity: parseInt(row.quantite),
          unit_price: parseFloat(row.prixUnitaire),
        });
      }

      // Vérifier les stocks avant l'enregistrement
      try {
        const stockCheck = await checkStock(items);
        if (stockCheck.has_issues && stockCheck.issues.length > 0) {
          // Afficher le dialogue de confirmation
          setStockDialog({
            open: true,
            issues: stockCheck.issues,
            items: items,
            onConfirm: async () => {
              await proceedWithSale(items);
            }
          });
          return;
        }
      } catch (error) {
        console.error('Error checking stock:', error);
        // Continuer même si la vérification échoue
      }

      // Si pas de problème de stock, procéder directement
      await proceedWithSale(items);
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de l\'enregistrement',
        type: 'error'
      });
    }
  };

  const proceedWithSale = async (items) => {
    try {
      const saleData = {
        customer: null,
        payment_method: 'cash',
        notes: '',
        items: items,
      };
      
      const result = await createSale(saleData);
      
      // Vérifier si des ventes hors stock ont été enregistrées
      let successMessage = 'Vente enregistrée avec succès';
      if (result && result.out_of_stock_info && result.out_of_stock_info.length > 0) {
        const outOfStockList = result.out_of_stock_info
          .map(item => `${item.product}: ${item.quantity} pièces`)
          .join(', ');
        successMessage += `. Ventes hors stock enregistrées: ${outOfStockList}`;
      }

      setRows([]);
      setNextId(1);
      // Rafraîchir les ventes et produits après création
      await fetchSales();
      await fetchProducts();
      setMessageDialog({
        open: true,
        title: 'Succès',
        message: successMessage,
        type: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la vente:', error);
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de l\'enregistrement. Vérifiez la console pour plus de détails.',
        type: 'error'
      });
    }
  };

  const handleExportReport = async () => {
    try {
      setExporting(true);
      await exportSalesReport(dateFrom || null, dateTo || null);
      setMessageDialog({
        open: true,
        title: 'Succès',
        message: 'Rapport téléchargé avec succès',
        type: 'success'
      });
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Erreur lors du téléchargement du rapport',
        type: 'error'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleEditSale = async (saleId) => {
    try {
      const sale = await getSale(saleId);
      // Convertir la vente en format rows pour l'édition
      const saleRows = sale.items.map((item, index) => ({
        id: index + 1,
        produit: item.product_name || '',
        quantite: item.quantity || 0,
        prixUnitaire: parseFloat(item.unit_price || 0),
        total: parseFloat(item.subtotal || 0),
        itemId: item.id,
      }));
      setRows(saleRows);
      setNextId(saleRows.length + 1);
      setEditingSale(saleId);
      // Scroller vers le formulaire d'édition
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Erreur lors du chargement de la vente',
        type: 'error'
      });
    }
  };

  const handleDeleteSale = async () => {
    if (!deleteDialog.saleId) return;
    try {
      await deleteSale(deleteDialog.saleId);
      await fetchSales();
      await fetchProducts(); // Rafraîchir les stocks
      setMessageDialog({
        open: true,
        title: 'Succès',
        message: 'Vente supprimée avec succès',
        type: 'success'
      });
      setDeleteDialog({ open: false, saleId: null, saleInfo: null });
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Erreur lors de la suppression',
        type: 'error'
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSale) return;
    
    try {
      const validRows = rows.filter(row => row.produit && row.quantite > 0 && row.prixUnitaire > 0);
      
      if (validRows.length === 0) {
        setMessageDialog({
          open: true,
          title: 'Validation requise',
          message: 'Veuillez ajouter au moins une ligne valide avec un produit, une quantité et un prix.',
          type: 'error'
        });
        return;
      }

      // Vérifier que tous les produits existent
      const items = [];
      for (const row of validRows) {
        const product = products.find(p => p.name.toLowerCase() === row.produit.toLowerCase());
        
        if (!product) {
          setMessageDialog({
            open: true,
            title: 'Produit introuvable',
            message: `Le produit "${row.produit}" n'existe pas. Veuillez le créer d'abord dans la section Produits.`,
            type: 'error'
          });
          return;
        }

        items.push({
          product: product.id,
          quantity: parseInt(row.quantite),
          unit_price: parseFloat(row.prixUnitaire),
        });
      }

      // Vérifier les stocks avant l'enregistrement
      try {
        const stockCheck = await checkStock(items);
        if (stockCheck.has_issues && stockCheck.issues.length > 0) {
          setStockDialog({
            open: true,
            issues: stockCheck.issues,
            items: items,
            onConfirm: async () => {
              await proceedWithUpdate(editingSale, items);
            }
          });
          return;
        }
      } catch (error) {
        console.error('Error checking stock:', error);
      }

      await proceedWithUpdate(editingSale, items);
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de la modification',
        type: 'error'
      });
    }
  };

  const proceedWithUpdate = async (saleId, items) => {
    try {
      const saleData = {
        customer: null,
        payment_method: 'cash',
        notes: '',
        items: items,
      };
      
      await updateSale(saleId, saleData);

      setRows([]);
      setNextId(1);
      setEditingSale(null);
      await fetchSales();
      await fetchProducts();
      setMessageDialog({
        open: true,
        title: 'Succès',
        message: 'Vente modifiée avec succès',
        type: 'success'
      });
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de la modification',
        type: 'error'
      });
    }
  };

  const handleCancelEdit = () => {
    setRows([]);
    setNextId(1);
    setEditingSale(null);
  };


  const totalGeneral = rows.reduce((sum, row) => sum + (row.total || 0), 0);

  // Grouper les ventes par jour
  const groupedSales = sales.reduce((acc, sale) => {
    if (!sale || !sale.sale_date) return acc;
    try {
      const saleDate = new Date(sale.sale_date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!acc[saleDate]) {
        acc[saleDate] = [];
      }
      acc[saleDate].push(sale);
    } catch (error) {
      console.error('Erreur lors du groupement de la vente:', sale, error);
    }
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSales).sort((a, b) => {
    try {
      // Convertir les dates françaises en objets Date pour le tri
      // Format: "4 décembre 2024" -> "2024 décembre 4"
      const parseFrenchDate = (dateStr) => {
        const months = {
          'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
          'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
        };
        const parts = dateStr.split(' ');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = months[parts[1].toLowerCase()];
          const year = parseInt(parts[2]);
          return new Date(year, month, day);
        }
        return new Date(dateStr);
      };
      const dateA = parseFrenchDate(a);
      const dateB = parseFrenchDate(b);
      return dateB - dateA;
    } catch (error) {
      console.error('Erreur lors du tri des dates:', a, b, error);
      return 0;
    }
  });

  return (
    <>
      <PageHeader
        title={editingSale ? `Modifier la vente #${editingSale}` : "Ventes"}
        description={editingSale ? "Modifiez les détails de la vente" : "Enregistrez vos ventes comme dans un tableur"}
        icon={ShoppingCart}
        action={
          <div className="flex gap-2">
            {editingSale ? (
              <>
                <Button onClick={handleCancelEdit} variant="outline" className="gap-2">
                  <X size={16} />
                  Annuler
                </Button>
                <Button onClick={handleSaveEdit} variant="secondary" className="gap-2">
                  <Save size={16} />
                  Enregistrer les modifications
                </Button>
              </>
            ) : (
              <>
                <Button onClick={addRow} className="gap-2">
                  <Plus size={16} />
                  Nouvelle ligne
                </Button>
                <Button onClick={handleSave} variant="secondary" className="gap-2">
                  <Save size={16} />
                  Sauvegarder
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground w-10">#</th>
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground min-w-[200px]">Produit</th>
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground min-w-[100px]">Quantité</th>
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground min-w-[120px]">Prix Unitaire</th>
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground min-w-[120px]">Total</th>
                <th className="px-3 py-2 text-center font-semibold text-sm text-card-foreground w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    Aucune ligne. Cliquez sur "Nouvelle ligne" pour commencer.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="border-r border-border px-3 py-1 text-sm text-muted-foreground bg-muted/30">
                      {index + 1}
                    </td>
                    <td className="border-r border-border p-0">
                      <Input
                        type="text"
                        value={row.produit || ""}
                        onChange={(e) => updateCell(row.id, "produit", e.target.value)}
                        placeholder="Nom du produit"
                        list={`products-list-${row.id}`}
                        className="border-0 rounded-none h-9 bg-transparent focus:bg-accent/10"
                      />
                      <datalist id={`products-list-${row.id}`}>
                        {products.map((product) => (
                          <option key={product.id} value={product.name}>
                            {product.name}
                          </option>
                        ))}
                      </datalist>
                    </td>
                    <td className="border-r border-border p-0">
                      <Input
                        type="number"
                        value={row.quantite || ""}
                        onChange={(e) => updateCell(row.id, "quantite", Number(e.target.value))}
                        className="border-0 rounded-none h-9 bg-transparent focus:bg-accent/10 text-right"
                        placeholder="Quantité"
                      />
                    </td>
                    <td className="border-r border-border p-0">
                      <Input
                        type="number"
                        step="0.01"
                        value={row.prixUnitaire || ""}
                        onChange={(e) => updateCell(row.id, "prixUnitaire", Number(e.target.value))}
                        className="border-0 rounded-none h-9 bg-transparent focus:bg-accent/10 text-right"
                        placeholder="Prix unitaire"
                      />
                    </td>
                    <td className="border-r border-border px-3 py-1 text-right font-medium text-sm bg-muted/20">
                      {row.total.toLocaleString()}
                    </td>
                    <td className="px-3 py-1 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRow(row.id)}
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/50">
                <td colSpan={4} className="px-3 py-3 text-right font-bold text-card-foreground">
                  Total Général:
                </td>
                <td className="px-3 py-3 text-right font-bold text-accent text-lg">
                  {totalGeneral.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        💡 Cliquez sur une cellule pour modifier. Le prix est récupéré automatiquement depuis le produit. Le total est calculé automatiquement.
      </p>

      {/* Filtre de période et téléchargement */}
      <div className="mt-8 bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar size={16} className="inline mr-2" />
                Date de début
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar size={16} className="inline mr-2" />
                Date de fin
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              Réinitialiser
            </Button>
            <Button
              onClick={handleExportReport}
              disabled={exporting}
              className="gap-2"
            >
              <Download size={16} />
              {exporting ? 'Téléchargement...' : 'Télécharger le rapport'}
            </Button>
          </div>
        </div>
      </div>

      {/* Historique des ventes groupées par jour */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Historique des ventes</h2>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : sales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune vente trouvée pour la période sélectionnée</p>
                {dateFrom && (
                  <p className="text-xs mt-2">
                    Période: {dateFrom} {dateTo ? `- ${dateTo}` : 'et suivantes'}
                  </p>
                )}
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune vente trouvée</p>
              </div>
            ) : (
              <div className="space-y-6 p-4">
                {sortedDates.map((date) => {
                  const daySales = groupedSales[date];
                  if (!daySales || daySales.length === 0) return null;
                  const dayTotal = daySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
                  
                  return (
                    <div key={date} className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                      <div className="bg-muted/50 px-4 py-3 border-b border-border">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-foreground">{date}</h3>
                          <span className="text-sm font-medium text-accent">
                            Total: {dayTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted/30">
                              <th className="border-r border-border px-4 py-2 text-left font-semibold text-sm text-card-foreground">ID</th>
                              <th className="border-r border-border px-4 py-2 text-left font-semibold text-sm text-card-foreground">Heure</th>
                              <th className="border-r border-border px-4 py-2 text-left font-semibold text-sm text-card-foreground">Produit</th>
                              <th className="border-r border-border px-4 py-2 text-left font-semibold text-sm text-card-foreground">Quantité</th>
                              <th className="border-r border-border px-4 py-2 text-left font-semibold text-sm text-card-foreground">Montant</th>
                              <th className="px-4 py-2 text-center font-semibold text-sm text-card-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {daySales.flatMap((sale) => {
                              // Si la vente a des items, les afficher un par un
                              const items = sale.items || [];
                              if (items.length > 0) {
                                return items.map((item, itemIndex) => (
                                  <tr key={`${sale.id}-${item.id || itemIndex}`} className="border-t border-border hover:bg-muted/20 transition-colors">
                                    {itemIndex === 0 && (
                                      <>
                                        <td className="border-r border-border px-4 py-3 text-sm align-top" rowSpan={items.length}>
                                          #{sale.id}
                                        </td>
                                        <td className="border-r border-border px-4 py-3 text-sm align-top" rowSpan={items.length}>
                                          {new Date(sale.sale_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                      </>
                                    )}
                                    <td className="border-r border-border px-4 py-3 text-sm">
                                      {item.product_name || '-'}
                                    </td>
                                    <td className="border-r border-border px-4 py-3 text-sm">
                                      {item.quantity || 0}
                                    </td>
                                    {itemIndex === 0 && (
                                      <>
                                        <td className="border-r border-border px-4 py-3 text-sm font-semibold align-top" rowSpan={items.length}>
                                          {parseFloat(sale.total_amount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center align-top" rowSpan={items.length}>
                                          <div className="flex gap-2 justify-center">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => handleEditSale(sale.id)}
                                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                              title="Modifier"
                                            >
                                              <Edit size={14} />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => setDeleteDialog({ 
                                                open: true, 
                                                saleId: sale.id, 
                                                saleInfo: `Vente #${sale.id} du ${new Date(sale.sale_date).toLocaleDateString('fr-FR')}` 
                                              })}
                                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                              title="Supprimer"
                                            >
                                              <Trash2 size={14} />
                                            </Button>
                                          </div>
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ));
                              } else {
                                // Fallback si pas d'items
                                return (
                                  <tr key={sale.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                                    <td className="border-r border-border px-4 py-3 text-sm">#{sale.id}</td>
                                    <td className="border-r border-border px-4 py-3 text-sm">
                                      {new Date(sale.sale_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="border-r border-border px-4 py-3 text-sm">-</td>
                                    <td className="border-r border-border px-4 py-3 text-sm">-</td>
                                    <td className="border-r border-border px-4 py-3 text-sm font-semibold">
                                      {parseFloat(sale.total_amount || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <div className="flex gap-2 justify-center">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEditSale(sale.id)}
                                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                          title="Modifier"
                                        >
                                          <Edit size={14} />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setDeleteDialog({ 
                                            open: true, 
                                            saleId: sale.id, 
                                            saleInfo: `Vente #${sale.id} du ${new Date(sale.sale_date).toLocaleDateString('fr-FR')}` 
                                          })}
                                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          title="Supprimer"
                                        >
                                          <Trash2 size={14} />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de notification */}
      <MessageDialog
        open={messageDialog.open}
        onOpenChange={(open) => setMessageDialog({ ...messageDialog, open })}
        title={messageDialog.title}
        message={messageDialog.message}
        type={messageDialog.type}
      />

      {/* Modal de confirmation pour stock insuffisant */}
      <AlertDialog open={stockDialog.open} onOpenChange={(open) => setStockDialog({ ...stockDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stock insuffisant</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Les stocks suivants sont insuffisants :</p>
                <ul className="list-disc list-inside space-y-1">
                  {stockDialog.issues.map((issue, index) => (
                    <li key={index} className="text-sm">
                      <strong>{issue.product_name}</strong> : 
                      Demande: {issue.requested}, 
                      Disponible: {issue.available}, 
                      Manquant: {issue.shortage}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-semibold">
                  Souhaitez-vous quand même enregistrer la vente ? 
                  Le stock sera mis à 0 et les surplus seront enregistrés.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStockDialog({ open: false, issues: [], items: [], onConfirm: null })}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (stockDialog.onConfirm) {
                  stockDialog.onConfirm();
                }
                setStockDialog({ open: false, issues: [], items: [], onConfirm: null });
              }}
            >
              Enregistrer quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmation pour suppression */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, saleId: null, saleInfo: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              <p>Êtes-vous sûr de vouloir supprimer {deleteDialog.saleInfo || 'cette vente'} ?</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Cette action est irréversible. Les stocks seront restaurés.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, saleId: null, saleInfo: null })}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSale}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default Sales;
