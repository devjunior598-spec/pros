import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency } from "@/lib/utils"

interface ReceiptData {
    receiptNumber: string
    date: string
    tenantName: string
    tenantEmail: string
    propertyAddress: string
    paymentMethod: string
    items: {
        description: string
        amount: number
    }[]
    totalAmount: number
    status: string
}

export const generateReceipt = (data: ReceiptData) => {
    const doc = new jsPDF()

    // Company Info (Header)
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text("HOUSE DO", 14, 22)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("Property Rental Management System", 14, 28)
    doc.text("123 Property Lane, Lagos", 14, 33)
    doc.text("Email: support@housedoplatform.com", 14, 38)

    // Receipt Title & Number
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text("PAYMENT RECEIPT", 140, 22)

    doc.setFontSize(10)
    doc.text(`Receipt #: ${data.receiptNumber}`, 140, 28)
    doc.text(`Date: ${data.date}`, 140, 33)
    doc.text(`Status: ${data.status.toUpperCase()}`, 140, 38)

    // Divider
    doc.setDrawColor(200, 200, 200)
    doc.line(14, 45, 196, 45)

    // Tenant Info
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text("Bill To:", 14, 55)

    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(data.tenantName, 14, 61)
    doc.text(data.tenantEmail, 14, 66)
    doc.text(data.propertyAddress, 14, 71)

    // Payment Details Table
    const tableColumn = ["Description", "Amount"]
    const tableRows = data.items.map(item => [
        item.description,
        formatCurrency(item.amount)
    ])

    // Add Total Row
    tableRows.push(["", ""]) // Spacer
    tableRows.push(["Total Amount Paid", formatCurrency(data.totalAmount)])

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 'auto', halign: 'right' },
        },
        didParseCell: function (data) {
            if (data.row.index === tableRows.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [240, 240, 240];
            }
        }
    })

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20

    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text("This receipt is electronically generated and valid without a signature.", 14, finalY)
    doc.text("Thank you for your payment.", 14, finalY + 5)

    // Watermark if Paid
    if (data.status.toLowerCase() === 'success' || data.status.toLowerCase() === 'paid') {
        doc.setTextColor(200, 250, 200)
        doc.setFontSize(60)
        // Rotate text workaround or just place it
        doc.text("PAID", 110, 140, { align: "center", angle: 45 })
    }

    return doc
}
