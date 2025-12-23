from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'phone', 'city', 'created_at']
    list_filter = ['city', 'country', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at']
