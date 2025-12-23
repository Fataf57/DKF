from django.contrib.auth import authenticate
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken


class LoginView(APIView):
    """
    API endpoint that accepts username/password and returns JWT tokens.
    """

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'detail': "Le nom d'utilisateur et le mot de passe sont requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response(
                {'detail': "Identifiants invalides."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email if hasattr(user, 'email') else None,
                },
            }
        )


class ProfileView(APIView):
    """Return basic information about the currently authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                'id': user.id,
                'username': user.username,
                'email': user.email if hasattr(user, 'email') else None,
            }
        )


class DashboardStatsView(APIView):
    """Return dashboard statistics."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from products.models import Product
            from sales.models import Sale
            from expenses.models import Expense
            from customers.models import Customer
            from django.db.models import Sum, Q
            from datetime import timedelta

            # Total products
            total_products = Product.objects.count()
            active_products = Product.objects.filter(is_active=True).count()

            # Total sales
            total_sales = Sale.objects.count()
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_sales = Sale.objects.filter(sale_date__gte=thirty_days_ago).count()

            # Total expenses
            total_expenses = Expense.objects.count()
            recent_expenses = Expense.objects.filter(expense_date__gte=thirty_days_ago.date()).count()

            # Total customers
            total_customers = Customer.objects.count()
            recent_customers = Customer.objects.filter(created_at__gte=thirty_days_ago).count()

            # Revenue from sales
            total_revenue = Sale.objects.aggregate(
                total=Sum('total_amount')
            )['total'] or 0

            # Total expenses
            total_expenses_amount = Expense.objects.aggregate(
                total=Sum('amount')
            )['total'] or 0

            # Net revenue (sales - expenses)
            net_revenue = float(total_revenue) - float(total_expenses_amount)

            # Low stock products
            low_stock_products = Product.objects.filter(stock__lt=10, is_active=True).count()

            # Monthly revenue for the last 12 months
            monthly_revenue = []
            now = timezone.now()
            from calendar import monthrange
            from datetime import datetime as dt
            
            for i in range(11, -1, -1):
                # Calculer le mois (i mois en arrière)
                target_date = now - timedelta(days=30*i)
                year = target_date.year
                month = target_date.month
                
                # Premier jour du mois
                month_start = timezone.make_aware(dt(year, month, 1, 0, 0, 0))
                # Dernier jour du mois
                last_day = monthrange(year, month)[1]
                month_end = timezone.make_aware(dt(year, month, last_day, 23, 59, 59))
                
                try:
                    month_sales = Sale.objects.filter(
                        sale_date__gte=month_start,
                        sale_date__lte=month_end
                    ).aggregate(total=Sum('total_amount'))['total'] or 0
                    monthly_revenue.append(float(month_sales))
                except Exception as e:
                    # En cas d'erreur, ajouter 0
                    monthly_revenue.append(0.0)

            return Response({
                'products': {
                    'total': total_products,
                    'active': active_products,
                    'low_stock': low_stock_products,
                },
                'sales': {
                    'total': total_sales,
                    'recent': recent_sales,
                },
                'expenses': {
                    'total': total_expenses,
                    'recent': recent_expenses,
                    'amount': float(total_expenses_amount),
                },
                'customers': {
                    'total': total_customers,
                    'recent': recent_customers,
                },
                'revenue': {
                    'total': float(total_revenue),
                    'net': net_revenue,
                },
                'monthly_revenue': monthly_revenue,
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
