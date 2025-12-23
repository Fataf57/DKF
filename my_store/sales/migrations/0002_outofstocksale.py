# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0001_initial'),
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='OutOfStockSale',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity_sold', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('notes', models.TextField(blank=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='products.product')),
                ('sale', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='out_of_stock_items', to='sales.sale')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]

