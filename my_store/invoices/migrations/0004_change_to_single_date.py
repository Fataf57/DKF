# Generated manually

from django.db import migrations, models
from django.utils import timezone


def copy_issue_date_to_date(apps, schema_editor):
    Invoice = apps.get_model('invoices', 'Invoice')
    for invoice in Invoice.objects.all():
        invoice.date = invoice.issue_date
        invoice.save()


def reverse_copy(apps, schema_editor):
    Invoice = apps.get_model('invoices', 'Invoice')
    for invoice in Invoice.objects.all():
        invoice.issue_date = invoice.date
        invoice.due_date = invoice.date
        invoice.save()


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0003_remove_status_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='date',
            field=models.DateField(null=True),
        ),
        migrations.RunPython(copy_issue_date_to_date, reverse_copy),
        migrations.RemoveField(
            model_name='invoice',
            name='issue_date',
        ),
        migrations.RemoveField(
            model_name='invoice',
            name='due_date',
        ),
        migrations.AlterField(
            model_name='invoice',
            name='date',
            field=models.DateField(),
        ),
    ]
