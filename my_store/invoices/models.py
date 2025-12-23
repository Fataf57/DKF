from django.db import models
from decimal import Decimal
from account.models import User
from customers.models import Customer
from orders.models import Order


class Invoice(models.Model):
    """Modèle pour les factures"""
    invoice_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    date = models.DateField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='invoices_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Facture {self.invoice_number}"

    def calculate_totals(self):
        subtotal = sum(item.subtotal for item in self.items.all())
        total = subtotal
        
        self.subtotal = subtotal
        self.total_amount = total
        self.save()
        return total

    class Meta:
        ordering = ['-date']


class InvoiceItem(models.Model):
    """Items d'une facture"""
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=200)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def subtotal(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.description} x {self.quantity}"

    class Meta:
        ordering = ['id']

