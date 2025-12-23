from django.db import models
from decimal import Decimal
from account.models import User


class ExpenseCategory(models.Model):
    """Catégories de dépenses"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Expense Categories"


class Expense(models.Model):
    """Modèle pour les dépenses"""
    category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateField()
    payment_method = models.CharField(
        max_length=50,
        choices=[
            ('cash', 'Espèces'),
            ('card', 'Carte bancaire'),
            ('check', 'Chèque'),
            ('transfer', 'Virement'),
            ('other', 'Autre'),
        ],
        default='cash'
    )
    receipt = models.FileField(upload_to='expenses/', blank=True, null=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='expenses_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

    class Meta:
        ordering = ['-expense_date']

