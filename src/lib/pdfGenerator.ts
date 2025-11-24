import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AgendaItem, BusinessSettings } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper function to safely parse dates
const parseDate = (dateString: string | number | undefined | null): Date => {
    if (!dateString) return new Date();
    
    try {
        // Handle Excel serial dates
        if (typeof dateString === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + dateString * 86400000);
            if (!isNaN(date.getTime())) return date;
        }
        
        const dateStr = String(dateString);
        
        if (dateStr.includes('T')) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) return date;
        }
        
        const date = new Date(dateStr + 'T00:00:00');
        if (!isNaN(date.getTime())) return date;
        
        return new Date();
    } catch {
        return new Date();
    }
};

export const generateReceipt = (item: AgendaItem, settings: BusinessSettings | null) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Colors
    const primaryColor = [37, 99, 235]; // Blue 600
    const grayColor = [107, 114, 128]; // Gray 500

    // Header
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(settings?.businessName || 'Recibo de Servicio', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    
    let yPos = 30;
    if (settings) {
        if (settings.address) {
            doc.text(settings.address, 20, yPos);
            yPos += 5;
        }
        if (settings.phone) {
            doc.text(`Tel: ${settings.phone}`, 20, yPos);
            yPos += 5;
        }
        if (settings.email) {
            doc.text(settings.email, 20, yPos);
            yPos += 5;
        }
        if (settings.website) {
            doc.text(settings.website, 20, yPos);
            yPos += 5;
        }
    }

    // Receipt Info (Right side)
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const dateStr = format(parseDate(item.date), "d 'de' MMMM, yyyy", { locale: es });
    
    doc.text('RECIBO', pageWidth - 20, 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Fecha: ${dateStr}`, pageWidth - 20, 30, { align: 'right' });
    doc.text(`Folio: #${item.id.slice(0, 8).toUpperCase()}`, pageWidth - 20, 35, { align: 'right' });

    // Client Info
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Cliente', 20, yPos);
    
    doc.setFontSize(10);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    yPos += 6;
    doc.text(item.client, 20, yPos);
    
    // Table
    yPos += 10;
    
    const tableData = [
        [item.service, 1, `$${item.quotedAmount.toLocaleString('es-MX')}`, `$${item.quotedAmount.toLocaleString('es-MX')}`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Servicio', 'Cant.', 'Precio Unit.', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 10 },
    });

    // Totals
    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 10;
    
    const rightColX = pageWidth - 50;
    const valueX = pageWidth - 20;

    doc.text('Subtotal:', rightColX, finalY, { align: 'right' });
    doc.text(`$${item.quotedAmount.toLocaleString('es-MX')}`, valueX, finalY, { align: 'right' });
    
    finalY += 7;
    
    if (item.deposit && item.deposit > 0) {
        doc.text('Abonado:', rightColX, finalY, { align: 'right' });
        doc.text(`-$${item.deposit.toLocaleString('es-MX')}`, valueX, finalY, { align: 'right' });
        finalY += 7;
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Restante:', rightColX, finalY, { align: 'right' });
        doc.text(`$${(item.quotedAmount - item.deposit).toLocaleString('es-MX')}`, valueX, finalY, { align: 'right' });
    } else {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Total:', rightColX, finalY, { align: 'right' });
        doc.text(`$${item.quotedAmount.toLocaleString('es-MX')}`, valueX, finalY, { align: 'right' });
    }

    // Footer
    if (settings?.footerMessage) {
        const footerY = doc.internal.pageSize.height - 30;
        doc.setFontSize(10);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(settings.footerMessage, pageWidth / 2, footerY, { align: 'center' });
    }

    doc.save(`recibo-${item.client.replace(/\s+/g, '_')}-${item.date}.pdf`);
};
