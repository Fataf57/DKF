from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
from django.conf import settings
import os
from .models import Invoice, InvoiceItem
from .serializers import (
    InvoiceSerializer, InvoiceCreateSerializer, InvoiceListSerializer, InvoiceItemSerializer
)


def number_to_words_french(num):
    """Convertit un nombre en lettres françaises"""
    if num == 0:
        return "ZÉRO"
    
    units = ["", "UN", "DEUX", "TROIS", "QUATRE", "CINQ", "SIX", "SEPT", "HUIT", "NEUF",
             "DIX", "ONZE", "DOUZE", "TREIZE", "QUATORZE", "QUINZE", "SEIZE", "DIX-SEPT",
             "DIX-HUIT", "DIX-NEUF"]
    
    def convert_0_19(n):
        """Convertit les nombres de 0 à 19"""
        if n == 0:
            return ""
        return units[n]
    
    def convert_20_99(n):
        """Convertit les nombres de 20 à 99"""
        if n < 20:
            return convert_0_19(n)
        
        tens_digit = n // 10
        units_digit = n % 10
        
        if tens_digit == 2:  # 20-29
            if units_digit == 0:
                return "VINGT"
            elif units_digit == 1:
                return "VINGT-ET-UN"
            else:
                return "VINGT-" + convert_0_19(units_digit)
        elif tens_digit == 3:  # 30-39
            if units_digit == 0:
                return "TRENTE"
            elif units_digit == 1:
                return "TRENTE-ET-UN"
            else:
                return "TRENTE-" + convert_0_19(units_digit)
        elif tens_digit == 4:  # 40-49
            if units_digit == 0:
                return "QUARANTE"
            elif units_digit == 1:
                return "QUARANTE-ET-UN"
            else:
                return "QUARANTE-" + convert_0_19(units_digit)
        elif tens_digit == 5:  # 50-59
            if units_digit == 0:
                return "CINQUANTE"
            elif units_digit == 1:
                return "CINQUANTE-ET-UN"
            else:
                return "CINQUANTE-" + convert_0_19(units_digit)
        elif tens_digit == 6:  # 60-69
            if units_digit == 0:
                return "SOIXANTE"
            elif units_digit == 1:
                return "SOIXANTE-ET-UN"
            else:
                return "SOIXANTE-" + convert_0_19(units_digit)
        elif tens_digit == 7:  # 70-79
            remainder = n - 60
            if remainder == 0:
                return "SOIXANTE-DIX"
            elif remainder == 1:
                return "SOIXANTE-ET-ONZE"
            else:
                return "SOIXANTE-" + convert_0_19(remainder)
        elif tens_digit == 8:  # 80-89
            if units_digit == 0:
                return "QUATRE-VINGTS"
            else:
                remainder = n - 80
                if remainder == 0:
                    return "QUATRE-VINGTS"
                elif remainder == 1:
                    return "QUATRE-VINGT-UN"
                else:
                    return "QUATRE-VINGT-" + convert_0_19(remainder)
        elif tens_digit == 9:  # 90-99
            remainder = n - 80
            if remainder == 0:
                return "QUATRE-VINGT-DIX"
            elif remainder == 1:
                return "QUATRE-VINGT-ONZE"
            else:
                return "QUATRE-VINGT-" + convert_0_19(remainder)
        
        return ""
    
    def convert_100_999(n):
        """Convertit les nombres de 100 à 999"""
        if n < 100:
            return convert_20_99(n)
        
        hundreds_digit = n // 100
        remainder = n % 100
        
        if hundreds_digit == 1:
            if remainder == 0:
                return "CENT"
            else:
                return "CENT-" + convert_20_99(remainder)
        else:
            if remainder == 0:
                return units[hundreds_digit] + "-CENTS"
            else:
                return units[hundreds_digit] + "-CENT-" + convert_20_99(remainder)
    
    def convert_1000_999999(n):
        """Convertit les nombres de 1000 à 999999"""
        if n < 1000:
            return convert_100_999(n)
        
        thousands = n // 1000
        remainder = n % 1000
        
        if thousands == 1:
            if remainder == 0:
                return "MILLE"
            else:
                return "MILLE-" + convert_100_999(remainder)
        else:
            thousands_text = convert_100_999(thousands)
            if remainder == 0:
                return thousands_text + "-MILLE"
            else:
                return thousands_text + "-MILLE-" + convert_100_999(remainder)
    
    # Convertir en entier
    integer_part = int(num)
    
    if integer_part == 0:
        return "ZÉRO"
    elif integer_part < 20:
        return convert_0_19(integer_part)
    elif integer_part < 100:
        return convert_20_99(integer_part)
    elif integer_part < 1000:
        return convert_100_999(integer_part)
    elif integer_part < 1000000:
        return convert_1000_999999(integer_part)
    else:
        # Pour les nombres très grands, on peut les diviser
        millions = integer_part // 1000000
        remainder = integer_part % 1000000
        
        if millions == 1:
            if remainder == 0:
                return "UN-MILLION"
            else:
                return "UN-MILLION-" + convert_1000_999999(remainder)
        else:
            millions_text = convert_1000_999999(millions)
            if remainder == 0:
                return millions_text + "-MILLIONS"
            else:
                return millions_text + "-MILLIONS-" + convert_1000_999999(remainder)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        elif self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    def get_queryset(self):
        queryset = Invoice.objects.all()
        customer = self.request.query_params.get('customer', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)

        if customer:
            queryset = queryset.filter(customer_id=customer)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def preview_pdf(self, request, pk=None):
        """Aperçu du PDF de la facture (inline)"""
        invoice = self.get_object()
        
        # Créer un buffer pour le PDF
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="facture_{invoice.invoice_number}.pdf"'
        
        return self._generate_pdf(invoice, response)
    
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Génère un PDF de la facture selon le modèle fourni"""
        invoice = self.get_object()
        
        # Créer un buffer pour le PDF
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="facture_{invoice.invoice_number}.pdf"'
        
        return self._generate_pdf(invoice, response)
    
    def _generate_pdf(self, invoice, response):
        """Génère le contenu PDF de la facture"""
        
        # Créer le document PDF avec marges
        doc = SimpleDocTemplate(
            response,
            pagesize=A4,
            leftMargin=2*cm,
            rightMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        story = []
        styles = getSampleStyleSheet()
        
        # Styles personnalisés
        company_name_style = ParagraphStyle(
            'CompanyName',
            parent=styles['Normal'],
            fontSize=24,
            fontName='Helvetica-Bold',
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=6,
        )
        
        company_info_style = ParagraphStyle(
            'CompanyInfo',
            parent=styles['Normal'],
            fontSize=10,
            fontName='Helvetica',
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=3,
        )
        
        invoice_title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Normal'],
            fontSize=16,
            fontName='Helvetica-Bold',
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=20,
        )
        
        # En-tête avec logo et nom de l'entreprise
        logo_paths = [
            os.path.join(settings.BASE_DIR.parent, 'Logo Dkf.jpeg'),
            os.path.join(settings.BASE_DIR.parent, 'react-app', 'public', 'logo-dkf.jpeg'),
        ]
        
        logo = None
        for logo_path in logo_paths:
            if os.path.exists(logo_path):
                try:
                    logo = Image(logo_path, width=3*cm, height=3*cm)
                    break
                except Exception as e:
                    print(f"Erreur lors du chargement du logo: {e}")
                    continue
        
        # En-tête: Logo à gauche, nom de l'entreprise centré
        if logo:
            # Tableau avec logo à gauche et nom centré
            header_data = [[logo, Paragraph("SUPER DFK", company_name_style), '']]
            header_table = Table(header_data, colWidths=[4*cm, 9*cm, 4*cm])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'CENTER'),
                ('ALIGN', (2, 0), (2, 0), 'RIGHT'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(header_table)
        else:
            # Juste le nom centré
            story.append(Paragraph("SUPER DFK", company_name_style))
        
        story.append(Spacer(1, 0.3*cm))
        
        # Informations de l'entreprise (centrées)
        company_info = [
            "Vente de Matériels Électroniques et Divers",
            "Sis au grand marché de Bobo Dioulasso",
            "Derrière le marché 50m de L'église alliance chrétienne",
            "Tel: +226 76656506 / 78018394"
        ]
        
        for info in company_info:
            story.append(Paragraph(info, company_info_style))
        
        story.append(Spacer(1, 0.5*cm))
        
        # Ligne avec date et client (au-dessus de FACTURE)
        invoice_date = invoice.date.strftime('%d/%m/%Y')
        location_date = f"Bobo Dioulasso , le {invoice_date}"
        client_name = invoice.customer.full_name if invoice.customer else "Non spécifié"
        
        # Tableau pour client à gauche et date à droite
        client_date_data = [
            [Paragraph(f"<u>Client :</u> {client_name}", styles['Normal']), 
             Paragraph(location_date, styles['Normal'])]
        ]
        
        client_date_table = Table(client_date_data, colWidths=[10*cm, 7*cm])
        client_date_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(client_date_table)
        
        story.append(Spacer(1, 0.3*cm))
        
        # FACTURE centré (en dessous de la date et du client)
        story.append(Paragraph("<u>FACTURE</u>", invoice_title_style))
        
        story.append(Spacer(1, 1.5*cm))  # Plus d'espace après FACTURE avant le tableau
        
        # Tableau des articles
        items_data = [
            ['Désignation', 'Quantité', 'Prix unitaire', 'Prix total']
        ]
        
        for item in invoice.items.all():
            # Formater la quantité (peut être "1pqt" ou un nombre)
            qty_str = str(item.quantity)
            # Formater les prix sans décimales et avec espaces comme séparateurs de milliers
            unit_price = int(float(item.unit_price))
            subtotal = int(float(item.subtotal))
            items_data.append([
                item.description,
                qty_str,
                f"{unit_price:,}".replace(',', ' '),
                f"{subtotal:,}".replace(',', ' ')
            ])
        
        # Tableau avec total général collé
        total_amount = int(float(invoice.total_amount))
        total_formatted = f"{total_amount:,}".replace(',', ' ')
        
        # Ajouter la ligne TOTAL GENERAL directement dans le tableau des items
        items_data.append(['TOTAL GENERAL', '', '', total_formatted])
        
        items_table = Table(items_data, colWidths=[8*cm, 3*cm, 3*cm, 3*cm])
        
        # Calculer le nombre de lignes d'articles (sans l'en-tête et sans TOTAL)
        num_items = len(items_data) - 2  # -2 pour en-tête et TOTAL
        
        # Créer le style avec toutes les bordures
        table_style = [
            # En-tête
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (-1, 0), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            # Corps du tableau
            ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -2), 10),
            ('ALIGN', (0, 1), (0, -2), 'LEFT'),
            ('ALIGN', (1, 1), (-1, -2), 'CENTER'),
            ('BOTTOMPADDING', (0, 1), (-1, -2), 6),
            ('TOPPADDING', (0, 1), (-1, -2), 6),
            # Ligne TOTAL GENERAL
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 11),
            ('ALIGN', (0, -1), (0, -1), 'LEFT'),
            ('ALIGN', (3, -1), (3, -1), 'CENTER'),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 8),
            ('TOPPADDING', (0, -1), (-1, -1), 8),
            # Bordures horizontales principales
            ('LINEABOVE', (0, 0), (-1, 0), 1, colors.black),  # Ligne au-dessus de l'en-tête
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),  # Ligne sous l'en-tête
            ('LINEBELOW', (0, -2), (-1, -2), 1, colors.black),  # Ligne avant TOTAL
            ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black),  # Ligne sous TOTAL
            # Bordures verticales - gauche et droite (toutes les lignes)
            ('LINEBEFORE', (0, 0), (0, -1), 1, colors.black),  # Bordure gauche complète
            ('LINEAFTER', (-1, 0), (-1, -1), 1, colors.black),  # Bordure droite complète
            # Bordures verticales internes entre colonnes
            ('LINEBEFORE', (1, 0), (1, -1), 1, colors.black),  # Entre colonne 1 et 2
            ('LINEBEFORE', (2, 0), (2, -1), 1, colors.black),  # Entre colonne 2 et 3
            ('LINEBEFORE', (3, 0), (3, -1), 1, colors.black),  # Entre colonne 3 et 4
        ]
        
        # Ajouter les lignes horizontales entre chaque article
        for i in range(1, num_items + 1):  # De la ligne 1 (premier article) à num_items
            table_style.append(('LINEBELOW', (0, i), (-1, i), 1, colors.black))
        
        items_table.setStyle(TableStyle(table_style))
        story.append(items_table)
        story.append(Spacer(1, 0.5*cm))
        
        # Montant en lettres
        amount_in_words = number_to_words_french(total_amount)
        amount_text = f"Arrêté la présente facture à la somme de : {amount_in_words} ({total_formatted}) Francs CFA."
        
        amount_style = ParagraphStyle(
            'AmountInWords',
            parent=styles['Normal'],
            fontSize=10,
            fontName='Helvetica',
            textColor=colors.black,
            alignment=TA_LEFT,
            spaceAfter=0,
        )
        
        story.append(Paragraph(amount_text, amount_style))
        story.append(Spacer(1, 2*cm))
        
        # Signature "Le responsable" en bas à droite
        signature_style = ParagraphStyle(
            'Signature',
            parent=styles['Normal'],
            fontSize=10,
            fontName='Helvetica',
            textColor=colors.black,
            alignment=TA_RIGHT,
            spaceAfter=0,
        )
        
        story.append(Paragraph("Le responsable", signature_style))
        
        # Construire le PDF
        doc.build(story)
        
        return response
