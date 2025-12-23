import React, { useState, useEffect, useRef } from 'react';
import { getProducts, deleteProduct, createProduct, updateProduct, importProductsExcel } from '../services/api';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/AlertDialog';
import { MessageDialog } from './ui/MessageDialog';
import { Package, Plus, Trash2, Save, Upload } from 'lucide-react';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [messageDialog, setMessageDialog] = useState({ open: false, title: '', message: '', type: 'success' });
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateCell = (id, field, value) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const addRow = () => {
    const newRow = {
      id: nextId,
      name: "",
      stock: 0,
    };
    setRows([...rows, newRow]);
    setNextId(nextId + 1);
  };

  const deleteRow = (id) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const handleSave = async () => {
    try {
      const validRows = rows.filter(row => row.name && row.name.trim() !== '');
      
      if (validRows.length === 0) {
        setMessageDialog({
          open: true,
          title: 'Validation requise',
          message: 'Veuillez ajouter au moins une ligne valide avec un nom de produit.',
          type: 'error'
        });
        return;
      }

      // Créer ou mettre à jour les produits
      for (const row of validRows) {
        const productData = {
          name: row.name.trim(),
          stock: parseInt(row.stock) || 0,
          price: '0.00',
          description: '',
          category: null,
          is_active: true,
        };

        // Si c'est une modification (row a un productId), mettre à jour
        if (row.productId) {
          await updateProduct(row.productId, productData);
        } else {
          // Sinon, créer un nouveau produit
          await createProduct(productData);
        }
      }

      setRows([]);
      setNextId(1);
      fetchProducts();
      setMessageDialog({
        open: true,
        title: 'Succès',
        message: 'Produits enregistrés avec succès',
        type: 'success'
      });
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de l\'enregistrement',
        type: 'error'
      });
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteProduct(productToDelete.id);
      await fetchProducts();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      setMessageDialog({
        open: true,
        title: 'Succès',
        message: 'Produit supprimé avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de la suppression',
        type: 'error'
      });
    }
  };

  const handleEdit = (product) => {
    // Vérifier si le produit n'est pas déjà dans les lignes
    const existingRow = rows.find(row => row.productId === product.id);
    if (existingRow) {
      return; // Déjà en édition
    }

    const newRow = {
      id: nextId,
      productId: product.id,
      name: product.name,
      stock: product.stock,
    };
    setRows([...rows, newRow]);
    setNextId(nextId + 1);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est un fichier Excel
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setMessageDialog({
        open: true,
        title: 'Format invalide',
        message: 'Veuillez sélectionner un fichier Excel (.xlsx ou .xls)',
        type: 'error'
      });
      return;
    }

    try {
      setImporting(true);
      const result = await importProductsExcel(file);
      
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Rafraîchir la liste des produits
      await fetchProducts();

      // Afficher le message de succès
      let message = `Import terminé avec succès !\n`;
      message += `- ${result.created || 0} produit(s) créé(s)\n`;
      message += `- ${result.updated || 0} produit(s) mis à jour`;
      
      if (result.errors && result.errors.length > 0) {
        message += `\n\nErreurs rencontrées :\n${result.errors.join('\n')}`;
      }

      setMessageDialog({
        open: true,
        title: 'Import réussi',
        message: message,
        type: result.errors && result.errors.length > 0 ? 'warning' : 'success'
      });
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur d\'import',
        message: error.message || 'Une erreur est survenue lors de l\'import du fichier Excel',
        type: 'error'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Produits"
        description="Enregistrez vos produits comme dans un tableur"
        icon={Package}
        action={
          <div className="flex gap-2">
            <Button 
              onClick={handleImportClick} 
              variant="outline" 
              className="gap-2"
              disabled={importing}
            >
              <Upload size={16} />
              {importing ? 'Import en cours...' : 'Importer Excel'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Button onClick={addRow} className="gap-2">
              <Plus size={16} />
              Nouvelle ligne
            </Button>
            <Button onClick={handleSave} variant="secondary" className="gap-2">
              <Save size={16} />
              Sauvegarder
            </Button>
          </div>
        }
      />

      <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground w-10">#</th>
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground min-w-[300px]">Nom</th>
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground min-w-[150px]">Stock</th>
                <th className="px-3 py-2 text-center font-semibold text-sm text-card-foreground w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
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
                        value={row.name || ""}
                        onChange={(e) => updateCell(row.id, "name", e.target.value)}
                        placeholder="Nom du produit"
                        className="border-0 rounded-none h-9 bg-transparent focus:bg-accent/10"
                      />
                    </td>
                    <td className="border-r border-border p-0">
                      <Input
                        type="number"
                        value={row.stock || ""}
                        onChange={(e) => updateCell(row.id, "stock", Number(e.target.value))}
                        className="border-0 rounded-none h-9 bg-transparent focus:bg-accent/10 text-right"
                        placeholder="0"
                        min="0"
                      />
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
          </table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        💡 Cliquez sur une cellule pour modifier. Les produits existants peuvent être modifiés en cliquant sur "Modifier".
      </p>

      {/* Liste des produits enregistrés */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Produits enregistrés</h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun produit trouvé</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border-r border-border px-4 py-3 text-left font-semibold text-sm text-card-foreground">Nom</th>
                    <th className="border-r border-border px-4 py-3 text-left font-semibold text-sm text-card-foreground">Stock</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm text-card-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="border-r border-border px-4 py-3 text-sm">{product.name}</td>
                      <td className="border-r border-border px-4 py-3 text-sm font-semibold">{product.stock}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            className="h-8"
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(product)}
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le produit "{productToDelete?.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de notification */}
      <MessageDialog
        open={messageDialog.open}
        onOpenChange={(open) => setMessageDialog({ ...messageDialog, open })}
        title={messageDialog.title}
        message={messageDialog.message}
        type={messageDialog.type}
      />
    </>
  );
}

export default Products;
