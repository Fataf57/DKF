from rest_framework import serializers
from .models import Expense, ExpenseCategory


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name', 'description', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            'id', 'category', 'category_name', 'description', 'amount',
            'expense_date', 'payment_method', 'payment_method_display',
            'receipt', 'receipt_url', 'notes', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_receipt_url(self, obj):
        if obj.receipt:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receipt.url)
        return None


class ExpenseListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'description', 'amount', 'expense_date',
            'category_name', 'payment_method', 'payment_method_display', 'created_at'
        ]


