from django.core.management.base import BaseCommand
from django.db import transaction, connection
from sales.models import Sale, SaleItem, OutOfStockSale
from products.models import Product


class Command(BaseCommand):
    help = 'Supprime toutes les ventes et ce qui est lié par cascade'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirmer la suppression sans demander de confirmation',
        )

    def handle(self, *args, **options):
        # Compter les ventes sans les charger (pour éviter l'erreur Decimal)
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM sales_sale")
            count = cursor.fetchone()[0]
        
        if count == 0:
            self.stdout.write(
                self.style.WARNING('Aucune vente à supprimer')
            )
            return
        
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️  ATTENTION : Cette action va supprimer {count} vente(s) et toutes les données associées !'
                )
            )
            confirm = input('Êtes-vous sûr de vouloir continuer ? (oui/non): ')
            if confirm.lower() not in ['oui', 'o', 'yes', 'y']:
                self.stdout.write(self.style.ERROR('Opération annulée'))
                return
        
        try:
            with transaction.atomic():
                # Restaurer les stocks en utilisant SQL brut pour éviter l'erreur Decimal
                self.stdout.write('Restauration des stocks...')
                with connection.cursor() as cursor:
                    # Récupérer tous les items avec leurs quantités et product_id
                    cursor.execute("""
                        SELECT product_id, SUM(quantity) as total_quantity
                        FROM sales_saleitem
                        GROUP BY product_id
                    """)
                    stock_updates = cursor.fetchall()
                    
                    # Restaurer les stocks
                    for product_id, total_quantity in stock_updates:
                        try:
                            # Convertir en int pour éviter les problèmes de type
                            qty = int(float(total_quantity)) if total_quantity else 0
                            cursor.execute("""
                                UPDATE products_product
                                SET stock = stock + ?
                                WHERE id = ?
                            """, [qty, product_id])
                        except (ValueError, TypeError) as e:
                            self.stdout.write(
                                self.style.WARNING(f'Erreur lors de la restauration du stock pour le produit {product_id}: {e}')
                            )
                
                # Supprimer les enregistrements de ventes hors stock
                self.stdout.write('Suppression des enregistrements de ventes hors stock...')
                OutOfStockSale.objects.all().delete()
                
                # Supprimer les items de vente (en cascade depuis les ventes)
                self.stdout.write('Suppression des items de vente...')
                with connection.cursor() as cursor:
                    cursor.execute("DELETE FROM sales_saleitem")
                
                # Supprimer toutes les ventes
                self.stdout.write('Suppression des ventes...')
                with connection.cursor() as cursor:
                    cursor.execute("DELETE FROM sales_sale")
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ {count} vente(s) supprimée(s) avec succès. Les stocks ont été restaurés.'
                    )
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors de la suppression: {str(e)}')
            )
            import traceback
            self.stdout.write(self.style.ERROR(traceback.format_exc()))

