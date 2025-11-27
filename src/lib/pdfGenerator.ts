import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BusinessSettings, Invoice } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";





export const generateInvoicePDF = (
  invoice: Invoice,
  settings: BusinessSettings | null
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Colors
  const primaryColor = [37, 99, 235]; // Blue 600
  const grayColor = [107, 114, 128]; // Gray 500
  const greenColor = [34, 197, 94]; // Green 500

  // Header - Business Info
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(settings?.businessName || "Factura", 20, 20);

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
    if (settings.taxId) {
      doc.text(`RFC: ${settings.taxId}`, 20, yPos);
      yPos += 5;
    }
  }

  // Invoice Info (Right side)
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("FACTURA", pageWidth - 20, 20, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  const dateStr = format(invoice.date, "d 'de' MMMM, yyyy", { locale: es });
  doc.text(`Folio: ${invoice.number}`, pageWidth - 20, 30, { align: "right" });
  doc.text(`Fecha: ${dateStr}`, pageWidth - 20, 35, { align: "right" });

  if (invoice.dueDate) {
    const dueStr = format(invoice.dueDate, "d 'de' MMMM, yyyy", { locale: es });
    doc.text(`Vencimiento: ${dueStr}`, pageWidth - 20, 40, { align: "right" });
  }

  // Status badge
  if (invoice.status === "paid") {
    doc.setFontSize(12);
    doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
    doc.text("PAGADA", pageWidth - 20, 50, { align: "right" });
  }

  // Client Info
  yPos = Math.max(yPos + 10, 60);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Facturar a:", 20, yPos);

  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  yPos += 6;
  doc.text(invoice.clientName, 20, yPos);
  yPos += 5;

  if (invoice.clientEmail) {
    doc.text(invoice.clientEmail, 20, yPos);
    yPos += 5;
  }

  if (invoice.clientAddress) {
    doc.text(invoice.clientAddress, 20, yPos);
    yPos += 5;
  }

  // Items Table
  yPos += 5;

  const tableData = invoice.items.map((item) => [
    item.description,
    item.quantity,
    `$${item.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    `$${item.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Descripción", "Cantidad", "Precio Unit.", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [37, 99, 235],
      fontSize: 10,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 5,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 25 },
      2: { halign: "right", cellWidth: 35 },
      3: { halign: "right", cellWidth: 35 },
    },
  });

  // Totals
    // @ts-expect-error TODO: jsPDF types for lastAutoTable aren\'t available; safe to assume exists
  let finalY = doc.lastAutoTable.finalY + 10;

  const rightColX = pageWidth - 65;
  const valueX = pageWidth - 20;

  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);

  // Subtotal
  doc.text("Subtotal:", rightColX, finalY, { align: "right" });
  doc.text(
    `$${invoice.subtotal.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    })}`,
    valueX,
    finalY,
    { align: "right" }
  );
  finalY += 6;

  // Discount
  if (invoice.discount && invoice.discount > 0) {
    const discountLabel =
      invoice.discountType === "percentage"
        ? `Descuento (${invoice.discount}%):`
        : "Descuento:";

    const discountAmount =
      invoice.discountType === "percentage"
        ? (invoice.subtotal * invoice.discount) / 100
        : invoice.discount;

    doc.text(discountLabel, rightColX, finalY, { align: "right" });
    doc.text(
      `-$${discountAmount.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
      })}`,
      valueX,
      finalY,
      { align: "right" }
    );
    finalY += 6;
  }

  // Tax
  if (invoice.tax > 0) {
    doc.text("IVA:", rightColX, finalY, { align: "right" });
    doc.text(
      `$${invoice.tax.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      valueX,
      finalY,
      { align: "right" }
    );
    finalY += 6;
  }

  // Total
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Total:", rightColX, finalY, { align: "right" });
  doc.text(
    `$${invoice.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
    valueX,
    finalY,
    { align: "right" }
  );
  finalY += 8;

  // Payment tracking
  if (invoice.amountPaid > 0) {
    doc.setFontSize(10);
    doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
    doc.text("Pagado:", rightColX, finalY, { align: "right" });
    doc.text(
      `$${invoice.amountPaid.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
      })}`,
      valueX,
      finalY,
      { align: "right" }
    );
    finalY += 6;

    if (invoice.balance > 0) {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Saldo pendiente:", rightColX, finalY, { align: "right" });
      doc.text(
        `$${invoice.balance.toLocaleString("es-MX", {
          minimumFractionDigits: 2,
        })}`,
        valueX,
        finalY,
        { align: "right" }
      );
      finalY += 6;
    }
  }

  // Payment History
  if (invoice.paymentHistory && invoice.paymentHistory.length > 0) {
    finalY += 10;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Historial de Pagos", 20, finalY);
    finalY += 5;

    const paymentData = invoice.paymentHistory.map((payment) => [
      format(payment.date, "d MMM yyyy", { locale: es }),
      payment.method === "cash"
        ? "Efectivo"
        : payment.method === "card"
        ? "Tarjeta"
        : payment.method === "transfer"
        ? "Transferencia"
        : "Otro",
      `$${payment.amount.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
      })}`,
      payment.reference || "-",
    ]);

    autoTable(doc, {
      startY: finalY,
      head: [["Fecha", "Método", "Monto", "Referencia"]],
      body: paymentData,
      theme: "plain",
      styles: { fontSize: 8 },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
    });

      // @ts-expect-error TODO: jsPDF types for lastAutoTable aren\'t available; safe to assume exists
    finalY = doc.lastAutoTable.finalY + 5;
  }

  // Notes
  if (invoice.notes) {
    finalY += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Notas:", 20, finalY);
    finalY += 5;

    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(splitNotes, 20, finalY);
  }

  // Footer


  doc.save(
    `factura-${invoice.number}-${invoice.clientName.replace(/\s+/g, "_")}.pdf`
  );
};
