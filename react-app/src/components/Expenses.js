import React, { useState, useEffect } from 'react';
import { getExpenses, createExpense, exportExpensesReport } from '../services/api';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { MessageDialog } from './ui/MessageDialog';
import { TrendingUp, Plus, Trash2, Save, Download, Calendar } from 'lucide-react';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [messageDialog, setMessageDialog] = useState({ open: false, title: '', message: '', type: 'success' });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (dateFrom || dateTo) {
      fetchExpenses();
    }
  }, [dateFrom, dateTo]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const data = await getExpenses(params);
      setExpenses(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
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
      description: "",
      amount: 0,
    };
    setRows([...rows, newRow]);
    setNextId(nextId + 1);
  };

  const deleteRow = (id) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const handleSave = async () => {
    try {
      const validRows = rows.filter(row => row.description && row.amount > 0);
      
      if (validRows.length === 0) {
        setMessageDialog({
          open: true,
          title: 'Validation requise',
          message: 'Veuillez ajouter au moins une ligne valide avec une description et un montant.',
          type: 'error'
        });
        return;
      }

      // Créer toutes les dépenses
      for (const row of validRows) {
        const expenseData = {
          description: row.description,
          amount: parseFloat(row.amount),
          expense_date: new Date().toISOString().split('T')[0], // Date automatique
          category: null,
          payment_method: 'cash',
          notes: '',
        };
        
        await createExpense(expenseData);
      }

      setRows([]);
      setNextId(1);
      fetchExpenses();
      setMessageDialog({
        open: true,
        title: 'Succès',
        message: 'Dépenses enregistrées avec succès',
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

  const handleExportReport = async () => {
    try {
      setExporting(true);
      await exportExpensesReport(dateFrom || null, dateTo || null);
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

  const totalGeneral = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

  // Grouper les dépenses par jour
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const expenseDate = new Date(expense.expense_date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[expenseDate]) {
      acc[expenseDate] = [];
    }
    acc[expenseDate].push(expense);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  return (
    <>
      <PageHeader
        title="Dépenses"
        description="Enregistrez vos dépenses comme dans un tableur"
        icon={TrendingUp}
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
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground min-w-[300px]">Description</th>
                <th className="border-r border-border px-3 py-2 text-left font-semibold text-sm text-card-foreground min-w-[150px]">Montant</th>
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
                        value={row.description || ""}
                        onChange={(e) => updateCell(row.id, "description", e.target.value)}
                        placeholder="Description de la dépense"
                        className="border-0 rounded-none h-9 bg-transparent focus:bg-accent/10"
                      />
                    </td>
                    <td className="border-r border-border p-0">
                      <Input
                        type="number"
                        step="0.01"
                        value={row.amount || ""}
                        onChange={(e) => updateCell(row.id, "amount", Number(e.target.value))}
                        className="border-0 rounded-none h-9 bg-transparent focus:bg-accent/10 text-right"
                        placeholder="0.00"
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
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/50">
                <td colSpan={2} className="px-3 py-3 text-right font-bold text-card-foreground">
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
        💡 Cliquez sur une cellule pour modifier. La date est enregistrée automatiquement.
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

      {/* Historique des dépenses groupées par jour */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Historique des dépenses</h2>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune dépense trouvée pour la période sélectionnée</p>
                {dateFrom && (
                  <p className="text-xs mt-2">
                    Période: {dateFrom} {dateTo ? `- ${dateTo}` : 'et suivantes'}
                  </p>
                )}
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune dépense trouvée</p>
              </div>
            ) : (
              <div className="space-y-6 p-4">
                {sortedDates.map((date) => {
                  const dayExpenses = groupedExpenses[date];
                  if (!dayExpenses || dayExpenses.length === 0) return null;
                  const dayTotal = dayExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
                  
                  return (
                    <div key={date} className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                      <div className="bg-muted/50 px-4 py-3 border-b border-border">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-foreground">{date}</h3>
                          <span className="text-sm font-medium text-destructive">
                            Total: {dayTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted/30">
                              <th className="border-r border-border px-4 py-2 text-left font-semibold text-sm text-card-foreground">Description</th>
                              <th className="border-r border-border px-4 py-2 text-left font-semibold text-sm text-card-foreground">Catégorie</th>
                              <th className="border-r border-border px-4 py-2 text-left font-semibold text-sm text-card-foreground">Montant</th>
                              <th className="px-4 py-2 text-left font-semibold text-sm text-card-foreground">Paiement</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayExpenses.map((expense) => (
                              <tr key={expense.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                                <td className="border-r border-border px-4 py-3 text-sm">{expense.description}</td>
                                <td className="border-r border-border px-4 py-3 text-sm">
                                  {expense.category_name || expense.category || '-'}
                                </td>
                                <td className="border-r border-border px-4 py-3 text-sm font-semibold text-destructive">
                                  {parseFloat(expense.amount || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {expense.payment_method_display || expense.payment_method || '-'}
                                </td>
                              </tr>
                            ))}
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
    </>
  );
}

export default Expenses;
