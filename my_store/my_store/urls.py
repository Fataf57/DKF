"""
URL configuration for my_store project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('account.urls')),
    path('api/', include('products.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('customers.urls')),
    path('api/', include('sales.urls')),
    path('api/', include('expenses.urls')),
    path('api/', include('invoices.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve React app in production
# Chemin vers le build React (ajustez selon votre structure)
REACT_BUILD_DIR = os.path.join(settings.BASE_DIR.parent, 'react-app', 'build')

if os.path.exists(REACT_BUILD_DIR):
    # Servir index.html pour toutes les routes qui ne sont pas API/admin/static/media
    # Cela permet au routing React de fonctionner
    def serve_react_app(request):
        index_path = os.path.join(REACT_BUILD_DIR, 'index.html')
        return serve(request, os.path.basename(index_path), os.path.dirname(index_path))
    
    urlpatterns += [
        re_path(r'^(?!api|admin|static|media).*$', serve_react_app),
    ]
