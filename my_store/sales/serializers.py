from rest_framework import serializers
from .models import Sale, SaleItem, OutOfStockSale
from products.serializers import ProductSerializer
from customers.serializers import CustomerSerializer


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal = serializers.SerializerMethodField()
    quantity = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'subtotal']


class SaleItemCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'items de vente (avec champs en écriture)"""
    
    class Meta:
        model = SaleItem
        fields = ['product', 'quantity', 'unit_price']
    
    def to_representation(self, instance):
        """Surcharge pour gérer les erreurs de conversion Decimal"""
        try:
            return super().to_representation(instance)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors de la sérialisation de l'item {instance.id}: {e}")
            # Retourner une représentation par défaut en cas d'erreur
            return {
                'id': instance.id if hasattr(instance, 'id') else None,
                'product': instance.product.id if hasattr(instance, 'product') and instance.product else None,
                'product_name': instance.product.name if hasattr(instance, 'product') and instance.product else '-',
                'quantity': 0,
                'unit_price': '0.00',
                'subtotal': '0.00'
            }
    
    def get_quantity(self, obj):
        """Récupère la quantité de manière sécurisée"""
        try:
            # Utiliser getattr pour éviter les erreurs d'accès
            quantity = getattr(obj, 'quantity', None)
            return int(quantity) if quantity is not None else 0
        except (ValueError, TypeError, AttributeError):
            return 0
    
    def get_unit_price(self, obj):
        """Récupère le prix unitaire de manière sécurisée"""
        try:
            from decimal import Decimal, InvalidOperation
            unit_price = getattr(obj, 'unit_price', None)
            if unit_price is None:
                return '0.00'
            # Si c'est déjà un Decimal, le convertir en string
            if isinstance(unit_price, Decimal):
                return str(unit_price.quantize(Decimal('0.01')))
            # Sinon, essayer de convertir
            try:
                price = Decimal(str(unit_price))
                return str(price.quantize(Decimal('0.01')))
            except (ValueError, InvalidOperation, TypeError):
                return '0.00'
        except Exception:
            return '0.00'
    
    def get_subtotal(self, obj):
        """Calcule le subtotal de manière sécurisée"""
        try:
            from decimal import Decimal, InvalidOperation
            
            # Récupérer les valeurs de manière sécurisée
            quantity = getattr(obj, 'quantity', None)
            try:
                quantity = int(quantity) if quantity is not None else 0
            except (ValueError, TypeError):
                quantity = 0
            
            # Récupérer unit_price de manière sécurisée
            unit_price = None
            try:
                unit_price_attr = getattr(obj, 'unit_price', None)
                if unit_price_attr is not None:
                    if isinstance(unit_price_attr, Decimal):
                        unit_price = unit_price_attr
                    else:
                        unit_price = Decimal(str(unit_price_attr))
            except (ValueError, InvalidOperation, TypeError, AttributeError):
                unit_price = Decimal('0.00')
            
            if unit_price is None:
                unit_price = Decimal('0.00')
            
            # Calculer le subtotal
            subtotal = Decimal(str(quantity)) * unit_price
            
            # Retourner avec 2 décimales
            return str(subtotal.quantize(Decimal('0.01')))
        except (ValueError, TypeError, AttributeError, InvalidOperation) as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors du calcul du subtotal pour l'item {getattr(obj, 'id', 'unknown')}: {e}")
            return '0.00'


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'customer', 'customer_name', 'sale_date', 'total_amount',
            'payment_method', 'payment_method_display', 'notes', 'items',
            'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['total_amount', 'created_at', 'updated_at', 'created_by']


class SaleCreateSerializer(serializers.ModelSerializer):
    items = SaleItemCreateSerializer(many=True)
    out_of_stock_info = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = ['customer', 'payment_method', 'notes', 'items', 'out_of_stock_info']
    
    def get_out_of_stock_info(self, obj):
        # Retourner les informations sur les ventes hors stock si elles existent
        if hasattr(obj, 'out_of_stock_info'):
            return obj.out_of_stock_info
        return []

    def create(self, validated_data):
        from django.db import transaction
        from .models import OutOfStockSale
        
        items_data = validated_data.pop('items')
        
        # Utiliser une transaction pour garantir la cohérence
        with transaction.atomic():
            sale = Sale.objects.create(**validated_data)
            
            # Create sale items et gérer les stocks
            total = 0
            out_of_stock_items = []
            
            for item_data in items_data:
                # Utiliser .get() pour éviter KeyError
                product = item_data.get('product')
                if not product:
                    continue
                
                quantity = item_data.get('quantity', 0)
                if quantity is None:
                    quantity = 0
                
                # Récupérer le prix unitaire, avec fallback sur le prix du produit
                unit_price = item_data.get('unit_price')
                if unit_price is None:
                    unit_price = product.price if hasattr(product, 'price') else 0
                
                # S'assurer que quantity et unit_price sont des nombres valides
                try:
                    quantity = int(quantity) if quantity else 0
                except (ValueError, TypeError):
                    quantity = 0
                
                try:
                    from decimal import Decimal
                    if not isinstance(unit_price, Decimal):
                        unit_price = Decimal(str(unit_price)) if unit_price else Decimal('0.00')
                except (ValueError, TypeError):
                    unit_price = product.price if hasattr(product, 'price') else Decimal('0.00')
                
                # Créer l'item de vente
                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price
                )
                total += quantity * unit_price
                
                # Gérer le stock
                current_stock = product.stock
                if current_stock >= quantity:
                    # Stock suffisant : déduire normalement
                    product.stock = current_stock - quantity
                    product.save(update_fields=['stock'])
                else:
                    # Stock insuffisant : mettre à 0 et enregistrer le surplus
                    surplus = quantity - current_stock
                    product.stock = 0
                    product.save(update_fields=['stock'])
                    
                    # Enregistrer la vente hors stock
                    try:
                        OutOfStockSale.objects.create(
                            product=product,
                            quantity_sold=surplus,
                            sale=sale,
                            notes=f"{product.name} {surplus} pièces vendues hors stock"
                        )
                        out_of_stock_items.append({
                            'product': product.name,
                            'quantity': surplus
                        })
                    except Exception as e:
                        # Si l'enregistrement échoue, on continue quand même
                        # mais on log l'erreur
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Erreur lors de l'enregistrement de la vente hors stock: {e}")
            
            sale.total_amount = total
            sale.save(update_fields=['total_amount'])
            
            # Retourner la vente avec les informations sur les stocks insuffisants
            if out_of_stock_items:
                sale.out_of_stock_info = out_of_stock_items
            
            return sale


class SaleListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    items = SaleItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = [
            'id', 'customer_name', 'sale_date', 'total_amount',
            'items', 'items_count', 'created_at'
        ]

    def get_items_count(self, obj):
        return obj.items.count()


class SaleUpdateSerializer(serializers.ModelSerializer):
    items = SaleItemCreateSerializer(many=True)
    out_of_stock_info = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = ['customer', 'payment_method', 'notes', 'items', 'out_of_stock_info']
    
    def get_out_of_stock_info(self, obj):
        if hasattr(obj, 'out_of_stock_info'):
            return obj.out_of_stock_info
        return []

    def update(self, instance, validated_data):
        from django.db import transaction
        from .models import OutOfStockSale
        
        items_data = validated_data.pop('items', None)
        
        if items_data is None:
            # Si pas d'items, juste mettre à jour les autres champs
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            return instance
        
        # Utiliser une transaction pour garantir la cohérence
        with transaction.atomic():
            # Restaurer les stocks des anciens items
            for old_item in instance.items.all():
                product = old_item.product
                product.stock += old_item.quantity
                product.save(update_fields=['stock'])
            
            # Supprimer les anciens items et les enregistrements hors stock
            instance.items.all().delete()
            OutOfStockSale.objects.filter(sale=instance).delete()
            
            # Mettre à jour les autres champs
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            # Créer les nouveaux items et gérer les stocks
            total = 0
            out_of_stock_items = []
            
            for item_data in items_data:
                # Utiliser .get() pour éviter KeyError
                product = item_data.get('product')
                if not product:
                    continue
                
                quantity = item_data.get('quantity', 0)
                if quantity is None:
                    quantity = 0
                
                # Récupérer le prix unitaire, avec fallback sur le prix du produit
                unit_price = item_data.get('unit_price')
                if unit_price is None:
                    unit_price = product.price if hasattr(product, 'price') else 0
                
                # S'assurer que quantity et unit_price sont des nombres valides
                try:
                    quantity = int(quantity) if quantity else 0
                except (ValueError, TypeError):
                    quantity = 0
                
                try:
                    from decimal import Decimal
                    if not isinstance(unit_price, Decimal):
                        unit_price = Decimal(str(unit_price)) if unit_price else Decimal('0.00')
                except (ValueError, TypeError):
                    unit_price = product.price if hasattr(product, 'price') else Decimal('0.00')
                
                # Créer l'item de vente
                SaleItem.objects.create(
                    sale=instance,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price
                )
                total += quantity * unit_price
                
                # Gérer le stock
                current_stock = product.stock
                if current_stock >= quantity:
                    # Stock suffisant : déduire normalement
                    product.stock = current_stock - quantity
                    product.save(update_fields=['stock'])
                else:
                    # Stock insuffisant : mettre à 0 et enregistrer le surplus
                    surplus = quantity - current_stock
                    product.stock = 0
                    product.save(update_fields=['stock'])
                    
                    # Enregistrer la vente hors stock
                    try:
                        OutOfStockSale.objects.create(
                            product=product,
                            quantity_sold=surplus,
                            sale=instance,
                            notes=f"{product.name} {surplus} pièces vendues hors stock"
                        )
                        out_of_stock_items.append({
                            'product': product.name,
                            'quantity': surplus
                        })
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Erreur lors de l'enregistrement de la vente hors stock: {e}")
            
            instance.total_amount = total
            instance.save(update_fields=['total_amount'])
            
            # Retourner la vente avec les informations sur les stocks insuffisants
            if out_of_stock_items:
                instance.out_of_stock_info = out_of_stock_items
            
            return instance


class OutOfStockSaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OutOfStockSale
        fields = ['id', 'product', 'product_name', 'quantity_sold', 'sale', 'created_at', 'notes']
