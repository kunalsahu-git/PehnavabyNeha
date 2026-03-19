import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { OrderData, OrderItemData } from '@/firebase/firestore/orders';
import { BoutiqueSettings } from '@/firebase/firestore/settings';

export async function generateInvoicePDF(
  order: OrderData & { id: string }, 
  items: OrderItemData[], 
  settings: BoutiqueSettings | null
) {
  const doc = new jsPDF();
  const boutiqueName = settings?.displayName || 'Pehnava by Neha';
  const boutiqueAddress = settings?.address || 'Boutique Address Not Configured';
  const boutiqueWhatsApp = settings?.whatsapp || '+91 8888888888';

  // 1. Header (Store Branding)
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(boutiqueName, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(boutiqueAddress, 14, 30);
  doc.text(`WhatsApp: ${boutiqueWhatsApp}`, 14, 35);

  // 2. Invoice Title & Meta Info
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('TAX INVOICE / RECEIPT', 140, 22);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Invoice No: ${order.id.toUpperCase().slice(0, 12)}`, 140, 30);
  doc.text(`Date: ${order.createdAt?.toDate ? format(order.createdAt.toDate(), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}`, 140, 35);
  doc.text(`Status: ${order.orderStatus}`, 140, 40);

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, 45, 196, 45);

  // 3. Customer Billing Info
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('BILL TO:', 14, 55);
  
  doc.setFontSize(11);
  doc.text(order.name || 'Boutique Customer', 14, 61);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Phone: ${order.phone || '-'}`, 14, 67);

  // Parse Address
  let shippingStr = '';
  try {
    const addr = JSON.parse(order.addressJson || '{}');
    shippingStr = `${addr.line1 || ''}${addr.line2 ? ', ' + addr.line2 : ''}\n${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`;
  } catch (e) {
    shippingStr = 'Shipping address details unavailable.';
  }
  doc.text(shippingStr || 'No address provided', 14, 73);

  // 4. Items Table
  autoTable(doc, {
    startY: 90,
    head: [['Item Description', 'Size', 'Price', 'Qty', 'Amount']],
    body: items.map(item => [
      item.productName,
      item.size || '-',
      `Rs. ${item.price.toLocaleString()}`,
      item.quantity,
      `Rs. ${(item.price * item.quantity).toLocaleString()}`
    ]),
    headStyles: { 
      fillColor: [15, 23, 42], // slate-900 
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85], // slate-700
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'right' }
    },
    margin: { left: 14, right: 14 },
    theme: 'striped'
  });

  // 5. Total Calculation Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', 140, finalY);
  doc.text(`Rs. ${order.subtotal?.toLocaleString() || '0'}`, 196, finalY, { align: 'right' });

  const deliveryY = finalY + 7;
  doc.text('Shipping:', 140, deliveryY);
  doc.text(order.deliveryCharge === 0 ? 'FREE' : `Rs. ${order.deliveryCharge.toLocaleString()}`, 196, deliveryY, { align: 'right' });

  const totalY = deliveryY + 10;
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PAID:', 140, totalY);
  doc.text(`Rs. ${order.total.toLocaleString()}`, 196, totalY, { align: 'right' });

  // 6. Footer & Payment Note
  doc.setDrawColor(226, 232, 240);
  doc.line(14, totalY + 15, 196, totalY + 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Thank you for shopping with Pehnava by Neha!', 105, totalY + 25, { align: 'center' });
  doc.text('This is a computer-generated receipt.', 105, totalY + 30, { align: 'center' });

  // Save the PDF
  doc.save(`invoice-${order.id.slice(0, 8)}.pdf`);
}
