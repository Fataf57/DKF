from django.contrib import admin
from .models import Sale, SaleItem, OutOfStockSale


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ['subtotal']


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'sale_date', 'total_amount', 'payment_method', 'created_at']
    list_filter = ['payment_method', 'sale_date', 'created_at']
    search_fields = ['customer__first_name', 'customer__last_name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [SaleItemInline]


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ['sale', 'product', 'quantity', 'unit_price', 'subtotal']
    list_filter = ['sale__sale_date']


@admin.register(OutOfStockSale)
class OutOfStockSaleAdmin(admin.ModelAdmin):
    list_display = ['product', 'quantity_sold', 'sale', 'created_at']
    list_filter = ['created_at']
    search_fields = ['product__name']
