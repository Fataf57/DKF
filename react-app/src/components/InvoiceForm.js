import React, { useState, useEffect } from 'react';
import { createInvoice, getInvoice, updateInvoice, getCustomers, getProducts } from '../services/api';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { MessageDialog } from './ui/MessageDialog';
import { FileText, Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

function InvoiceForm({ invoiceId, onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageDialog, setMessageDialog] = useState({ open: false, title: '', message: '', type: 'success' });
  const [formData, setFormData] = useState({
    customer: '',
    customerId: null,
    items: [{ description: '', quantity: 1, unit_price: '' }],
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchCustomers();
      await fetchProducts();
      if (invoiceId) {
        await fetchInvoice();
      }
    };
    loadData();
  }, [invoiceId]);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const invoice = await getInvoice(invoiceId);
      // S'assurer que les clients sont chargés
      let customersList = customers;
      if (customersList.length === 0) {
        const data = await getCustomers();
        customersList = Array.isArray(data) ? data : data.results || [];
        setCustomers(customersList);
      }
      const customer = customersList.find(c => c.id === invoice.customer?.id);
      setFormData({
        customer: customer ? customer.full_name : (invoice.customer_name || ''),
        customerId: invoice.customer?.id || null,
        items: invoice.items?.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })) || [{ description: '', quantity: 1, unit_price: '' }],
      });
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: 'Erreur lors du chargement de la facture',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (value) => {
    // Chercher le client par nom (insensible à la casse)
    const customer = customers.find(c => 
      c.full_name.toLowerCase() === value.toLowerCase()
    );
    
    setFormData({
      ...formData,
      customer: value,
      customerId: customer ? customer.id : null,
    });
  };

  const handleItemDescriptionChange = (index, value) => {
    const newItems = [...formData.items];
    newItems[index].description = value;
    
    // Si un produit correspond, remplir automatiquement le prix
    const product = products.find(p => 
      p.name.toLowerCase() === value.toLowerCase()
    );
    
    if (product && !newItems[index].unit_price) {
      newItems[index].unit_price = product.price;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: '' }],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Vérifier que le client existe
      if (!formData.customerId && formData.customer) {
        const customer = customers.find(c => 
          c.full_name.toLowerCase() === formData.customer.toLowerCase()
        );
        if (!customer) {
          setMessageDialog({
            open: true,
            title: 'Erreur',
            message: 'Le client saisi n\'existe pas. Veuillez sélectionner un client valide.',
            type: 'error'
          });
          setLoading(false);
          return;
        }
        formData.customerId = customer.id;
      }
      
      if (!formData.customerId) {
        setMessageDialog({
          open: true,
          title: 'Erreur',
          message: 'Veuillez sélectionner un client.',
          type: 'error'
        });
        setLoading(false);
        return;
      }
      
      const invoiceData = {
        customer: formData.customerId,
        date: new Date().toISOString().split('T')[0],
        items: formData.items.map(item => ({
          description: item.description,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
        })),
      };

      if (invoiceId) {
        await updateInvoice(invoiceId, invoiceData);
        setMessageDialog({
          open: true,
          title: 'Succès',
          message: 'Facture mise à jour avec succès',
          type: 'success'
        });
      } else {
        await createInvoice(invoiceData);
        setMessageDialog({
          open: true,
          title: 'Succès',
          message: 'Facture créée avec succès',
          type: 'success'
        });
      }

      // Retourner à la liste après 1 seconde
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('invoices');
        }
      }, 1000);
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Erreur lors de l\'enregistrement de la facture',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      const qty = parseInt(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + (qty * price);
    }, 0);
  };

  return (
    <>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => onNavigate && onNavigate('invoices')}
          className="gap-2 mb-4"
        >
          <ArrowLeft size={16} />
          Retour aux factures
        </Button>
        <PageHeader
          title={invoiceId ? "Modifier la facture" : "Nouvelle facture"}
          description={invoiceId ? "Modifiez les informations de la facture" : "Créez une nouvelle facture"}
          icon={FileText}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          {/* Sélection du client avec suggestions */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Client *</label>
            <Input
              type="text"
              list="customers-list"
              value={formData.customer}
              onChange={(e) => handleCustomerChange(e.target.value)}
              placeholder="Tapez le nom du client"
              required
              className="w-full"
            />
            <datalist id="customers-list">
              {customers.map((customer) => (
                <option key={customer.id} value={customer.full_name} />
              ))}
            </datalist>
          </div>

          {/* Articles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Articles *</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus size={16} className="mr-2" />
                Ajouter un article
              </Button>
            </div>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
                  <Input
                    type="text"
                    list={`products-list-${index}`}
                    placeholder="Description de l'article"
                    value={item.description}
                    onChange={(e) => handleItemDescriptionChange(index, e.target.value)}
                    required
                    className="flex-1"
                  />
                  <datalist id={`products-list-${index}`}>
                    {products.map((product) => (
                      <option key={product.id} value={product.name} />
                    ))}
                  </datalist>
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    min="1"
                    required
                    className="w-24"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Prix unitaire"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    required
                    className="w-32"
                  />
                  <div className="w-24 text-right font-medium">
                    {(parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    disabled={formData.items.length === 1}
                    className="text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
            <div className="text-right pt-4 border-t border-border">
              <p className="text-lg font-semibold">
                Total: <span className="text-accent text-xl">
                  {calculateSubtotal().toLocaleString('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate && onNavigate('invoices')}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save size={16} />
            {loading ? 'Enregistrement...' : (invoiceId ? 'Mettre à jour' : 'Enregistrer')}
          </Button>
        </div>
      </form>

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

export default InvoiceForm;

