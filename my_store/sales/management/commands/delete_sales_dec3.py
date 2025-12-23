from django.core.management.base import BaseCommand
from django.db import transaction, connection
from sales.models import OutOfStockSale
from datetime import date, datetime


class Command(BaseCommand):
    help = 'Supprime les ventes du 3 décembre 2025 qui posent problème'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirmer la suppression sans demander de confirmation',
        )

    def handle(self, *args, **options):
        target_date = date(2025, 12, 3)
        date_str = target_date.strftime('%Y-%m-%d')
        
        # Compter les ventes du 3 décembre sans les charger (pour éviter l'erreur Decimal)
        with connection.cursor() as cursor:
            # SQLite utilise strftime pour extraire la date
            sql = "SELECT COUNT(*) FROM sales_sale WHERE strftime('%%Y-%%m-%%d', sale_date) = %s"
            cursor.execute(sql, [date_str])
            count = cursor.fetchone()[0]
        
        if count == 0:
            self.stdout.write(
                self.style.WARNING(f'Aucune vente trouvée pour le {target_date.strftime("%d/%m/%Y")}')
            )
            return
        
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️  ATTENTION : Cette action va supprimer {count} vente(s) du {target_date.strftime("%d/%m/%Y")} et toutes les données associées !'
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
                    # Récupérer tous les items des ventes du 3 décembre avec leurs quantités et product_id
                    sql = """
                        SELECT si.product_id, SUM(si.quantity) as total_quantity
                        FROM sales_saleitem si
                        INNER JOIN sales_sale s ON si.sale_id = s.id
                        WHERE strftime('%%Y-%%m-%%d', s.sale_date) = %s
                        GROUP BY si.product_id
                    """
                    cursor.execute(sql, [date_str])
                    stock_updates = cursor.fetchall()
                    
                    # Restaurer les stocks
                    for product_id, total_quantity in stock_updates:
                        try:
                            # Convertir en int pour éviter les problèmes de type
                            qty = int(float(total_quantity)) if total_quantity else 0
                            cursor.execute(
                                "UPDATE products_product SET stock = stock + %s WHERE id = %s",
                                [qty, product_id]
                            )
                        except (ValueError, TypeError) as e:
                            self.stdout.write(
                                self.style.WARNING(f'Erreur lors de la restauration du stock pour le produit {product_id}: {e}')
                            )
                
                # Supprimer les enregistrements de ventes hors stock pour les ventes du 3 décembre
                self.stdout.write('Suppression des enregistrements de ventes hors stock...')
                with connection.cursor() as cursor:
                    # Récupérer les IDs des ventes du 3 décembre
                    sql = "SELECT id FROM sales_sale WHERE strftime('%%Y-%%m-%%d', sale_date) = %s"
                    cursor.execute(sql, [date_str])
                    sale_ids = [row[0] for row in cursor.fetchall()]
                    
                    if sale_ids:
                        # Supprimer les OutOfStockSale associés
                        OutOfStockSale.objects.filter(sale_id__in=sale_ids).delete()
                
                # Supprimer les items de vente du 3 décembre
                self.stdout.write('Suppression des items de vente...')
                with connection.cursor() as cursor:
                    sql = """
                        DELETE FROM sales_saleitem
                        WHERE sale_id IN (
                            SELECT id FROM sales_sale WHERE strftime('%%Y-%%m-%%d', sale_date) = %s
                        )
                    """
                    cursor.execute(sql, [date_str])
                
                # Supprimer les ventes du 3 décembre
                self.stdout.write('Suppression des ventes...')
                with connection.cursor() as cursor:
                    sql = "DELETE FROM sales_sale WHERE strftime('%%Y-%%m-%%d', sale_date) = %s"
                    cursor.execute(sql, [date_str])
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ {count} vente(s) du {target_date.strftime("%d/%m/%Y")} supprimée(s) avec succès. Les stocks ont été restaurés.'
                    )
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur lors de la suppression: {str(e)}')
            )
            import traceback
            self.stdout.write(self.style.ERROR(traceback.format_exc()))
