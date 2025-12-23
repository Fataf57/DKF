from django.contrib import admin
from .models import Expense, ExpenseCategory


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'amount', 'category', 'expense_date', 'payment_method', 'created_at']
    list_filter = ['category', 'payment_method', 'expense_date', 'created_at']
    search_fields = ['description']
    readonly_fields = ['created_at', 'updated_at']
