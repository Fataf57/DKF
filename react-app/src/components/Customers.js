import React, { useState, useEffect } from 'react';
import { getCustomers, deleteCustomer, createCustomer, updateCustomer } from '../services/api';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { MessageDialog } from './ui/MessageDialog';
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
import { Users, Plus, Trash2, Save } from 'lucide-react';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [messageDialog, setMessageDialog] = useState({ open: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
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
      first_name: "",
      last_name: "",
      phone: "",
    };
    setRows([...rows, newRow]);
    setNextId(nextId + 1);
  };

  const deleteRow = (id) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const handleSave = async () => {
    try {
      const validRows = rows.filter(row => (row.first_name && row.first_name.trim() !== '') || (row.last_name && row.last_name.trim() !== ''));
      
      if (validRows.length === 0) {
        setMessageDialog({
          open: true,
          title: 'Validation requise',
          message: 'Veuillez ajouter au moins une ligne valide avec un nom (prénom ou nom).',
          type: 'error'
        });
        return;
      }

      // Créer ou mettre à jour les clients
      for (const row of validRows) {
        // Si on a un full_name, le diviser en first_name et last_name
        let first_name = row.first_name || '';
        let last_name = row.last_name || '';
        
        // Si on a seulement full_name (pour compatibilité), le diviser
        if (row.full_name && !first_name && !last_name) {
          const parts = row.full_name.trim().split(' ');
          first_name = parts[0] || '';
          last_name = parts.slice(1).join(' ') || '';
        }

        const customerData = {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          phone: row.phone || '',
          address: '',
          city: '',
          country: '',
        };

        // Si c'est une modification (row a un customerId), mettre à jour
        if (row.customerId) {
          await updateCustomer(row.customerId, customerData);
        } else {
          // Sinon, créer un nouveau client
          await createCustomer(customerData);
        }
      }

      setRows([]);
      setNextId(1);
      fetchCustomers();
      setMessageDialog({
        open: true,
        title: 'Succès',
        message: 'Clients enregistrés avec succès',
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

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    
    try {
      await deleteCustomer(customerToDelete.id);
      await fetchCustomers();
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      setMessageDialog({
        open: true,
        title: 'Succès',
        message: 'Client supprimé avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de la suppression',
        type: 'error'
      });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleEdit = (customer) => {
    // Vérifier si le client n'est pas déjà dans les lignes
    const existingRow = rows.find(row => row.customerId === customer.id);
    if (existingRow) {
      return; // Déjà en édition
    }

    const newRow = {
      id: nextId,
      customerId: customer.id,
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      phone: customer.phone || '',
    };
    setRows([...rows, newRow]);
    setNextId(nextId + 1);
  };

  return (
    <>
      <PageHeader
        title="Clients"
        description="Enregistrez vos clients comme dans un tableur"
        icon={Users}
        action={
          <div className="flex gap-2">
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
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground min-w-[200px]">Prénom</th>
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground min-w-[200px]">Nom</th>
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground min-w-[150px]">Téléphone</th>
                <th className="px-3 py-2 text-center font-semibold text-sm text-card-foreground w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
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
                        value={row.first_name || ""}
                        onChange={(e) => updateCell(row.id, "first_name", e.target.value)}
                        placeholder="Prénom"
                        className="border-0 rounded-none h-9 bg-transparent focus:bg-accent/10"
                      />
                    </td>
                    <td className="border-r border-border p-0">
                      <Input
                        type="text"
                        value={row.last_name || ""}
                        onChange={(e) => updateCell(row.id, "last_name", e.target.value)}
                        placeholder="Nom"
                        className="border-0 rounded-none h-9 bg-transparent focus:bg-accent/10"
                      />
                    </td>
                    <td className="border-r border-border p-0">
                      <Input
                        type="tel"
                        value={row.phone || ""}
                        onChange={(e) => updateCell(row.id, "phone", e.target.value)}
                        placeholder="Téléphone"
                        className="border-0 rounded-none h-9 bg-transparent focus:bg-accent/10"
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
        💡 Cliquez sur une cellule pour modifier. Les clients existants peuvent être modifiés en cliquant sur "Modifier".
      </p>

      {/* Liste des clients enregistrés */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Clients enregistrés</h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {customers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun client trouvé</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border-r border-border px-4 py-3 text-left font-semibold text-sm text-card-foreground">Nom complet</th>
                    <th className="border-r border-border px-4 py-3 text-left font-semibold text-sm text-card-foreground">Téléphone</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm text-card-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="border-r border-border px-4 py-3 text-sm">{customer.full_name}</td>
                      <td className="border-r border-border px-4 py-3 text-sm">{customer.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(customer)}
                            className="h-8"
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(customer)}
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
              Êtes-vous sûr de vouloir supprimer le client "{customerToDelete?.full_name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>
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

export default Customers;
