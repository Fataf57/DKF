import React, { useState, useEffect } from 'react';
import { getInvoices, downloadInvoicePDF, previewInvoicePDF } from '../services/api';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/Table';
import { FileText, Plus, Download, Eye, X } from 'lucide-react';

function Invoices({ onNavigate }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageDialog, setMessageDialog] = useState({ open: false, title: '', message: '', type: 'success' });
  const [previewDialog, setPreviewDialog] = useState({ open: false, invoiceId: null, pdfUrl: null });
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Nettoyer l'URL du blob quand le composant se démonte ou que le dialogue se ferme
  useEffect(() => {
    return () => {
      if (previewDialog.pdfUrl) {
        window.URL.revokeObjectURL(previewDialog.pdfUrl);
      }
    };
  }, [previewDialog.pdfUrl]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await getInvoices();
      setInvoices(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: 'Erreur lors du chargement des factures',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (invoiceId) => {
    try {
      setLoadingPreview(true);
      const pdfUrl = await previewInvoicePDF(invoiceId);
      setPreviewDialog({ open: true, invoiceId, pdfUrl });
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Erreur lors du chargement de l\'aperçu',
        type: 'error'
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    if (previewDialog.pdfUrl) {
      window.URL.revokeObjectURL(previewDialog.pdfUrl);
    }
    setPreviewDialog({ open: false, invoiceId: null, pdfUrl: null });
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      await downloadInvoicePDF(invoiceId);
      setMessageDialog({
        open: true,
        title: 'Succès',
        message: 'Facture téléchargée avec succès',
        type: 'success'
      });
    } catch (error) {
      setMessageDialog({
        open: true,
        title: 'Erreur',
        message: error.message || 'Erreur lors du téléchargement du PDF',
        type: 'error'
      });
    }
  };

  const handleDownloadFromPreview = async () => {
    if (previewDialog.invoiceId) {
      handleClosePreview();
      await handleDownloadPDF(previewDialog.invoiceId);
    }
  };

  return (
    <>
      <PageHeader
        title="Factures"
        description="Gérez vos factures et téléchargez-les en PDF"
        icon={FileText}
        action={
          <Button onClick={() => onNavigate && onNavigate('invoice-new')} className="gap-2">
            <Plus size={16} />
            Nouvelle facture
          </Button>
        }
      />

      <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune facture trouvée</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.customer_name || '-'}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell className="font-semibold">
                    {parseFloat(invoice.total_amount || 0).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(invoice.id)}
                        disabled={loadingPreview}
                        className="gap-2"
                      >
                        <Eye size={16} />
                        Aperçu
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPDF(invoice.id)}
                        className="gap-2"
                      >
                        <Download size={16} />
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialogue d'aperçu */}
      <AlertDialog open={previewDialog.open} onOpenChange={handleClosePreview}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <AlertDialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <AlertDialogTitle>Aperçu de la facture</AlertDialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClosePreview}
                className="h-6 w-6"
              >
                <X size={16} />
              </Button>
            </div>
          </AlertDialogHeader>
          <AlertDialogDescription className="flex-1 overflow-auto p-0">
            {previewDialog.pdfUrl ? (
              <iframe
                src={previewDialog.pdfUrl}
                className="w-full h-full min-h-[600px] border-0"
                title="Aperçu de la facture"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Chargement de l'aperçu...
              </div>
            )}
          </AlertDialogDescription>
          <AlertDialogFooter className="flex-shrink-0">
            <AlertDialogCancel onClick={handleClosePreview}>Fermer</AlertDialogCancel>
            <AlertDialogAction onClick={handleDownloadFromPreview} className="gap-2">
              <Download size={16} />
              Télécharger
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

export default Invoices;
