from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SaleViewSet, OutOfStockSaleListView

router = DefaultRouter()
router.register(r'sales', SaleViewSet, basename='sale')

urlpatterns = [
    path('', include(router.urls)),
    path('out-of-stock-sales/', OutOfStockSaleListView.as_view(), name='out-of-stock-sales'),
]

