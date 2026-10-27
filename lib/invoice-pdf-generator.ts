import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency } from "@/lib/utils"

interface InvoicePDFData {
    invoiceNumber: string
    date: string
    dueDate: string
    tenantName: string
    tenantEmail: string
    propertyAddress: string
    landlordName: string
    items: {
        description: string
        amount: number
    }[]
    totalAmount: number
    status: string
    notes?: string
}

export const generateInvoicePDF = (data: InvoicePDFData) => {
    const doc = new jsPDF()

    // Header / Brand
    doc.setFontSize(22)
    doc.setTextColor(30, 41, 59)
    doc.text("PRMS", 14, 22)

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text("Property Rental Management System", 14, 28)
    doc.text(`Issuer: ${data.landlordName}`, 14, 33)

    // Invoice Title Meta
    doc.setFontSize(18)
    doc.setTextColor(37, 99, 235)
    doc.text("INVOICE", 140, 22)

    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(`Invoice #: ${data.invoiceNumber}`, 140, 28)
    doc.text(`Issue Date: ${data.date}`, 140, 33)
    doc.text(`Due Date: ${data.dueDate}`, 140, 38)
    doc.text(`Status: ${data.status.toUpperCase()}`, 140, 43)

    doc.setDrawColor(226, 232, 240)
    doc.line(14, 48, 196, 48)

    // Tenant / Bill To
    doc.setFontSize(11)
    doc.setTextColor(30, 41, 59)
    doc.text("BILL TO:", 14, 57)

    doc.setFontSize(9.5)
    doc.setTextColor(71, 85, 105)
    doc.text(data.tenantName, 14, 63)
    doc.text(data.tenantEmail, 14, 68)
    const addrLines = doc.splitTextToSize(data.propertyAddress, 90)
    doc.text(addrLines, 14, 73)

    // Line Items Table
    const tableColumn = ["Item Description", "Amount (USD)"]
    const tableRows = data.items.map(item => [
        item.description,
        formatCurrency(item.amount)
    ])

    tableRows.push(["", ""])
    tableRows.push(["TOTAL AMOUNT DUE", formatCurrency(data.totalAmount)])

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 85,
        theme: 'grid',
        styles: { fontSize: 9.5, cellPadding: 4 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        columnStyles: {
            0: { cellWidth: 130 },
            1: { cellWidth: 'auto', halign: 'right' },
        },
        didParseCell: function (cellData) {
            if (cellData.row.index === tableRows.length - 1) {
                cellData.cell.styles.fontStyle = 'bold'
                cellData.cell.styles.fillColor = [241, 245, 249]
            }
        }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 15

    if (data.notes) {
        doc.setFontSize(9)
        doc.setTextColor(100, 116, 139)
        doc.text("Notes / Payment Instructions:", 14, finalY)
        doc.text(data.notes, 14, finalY + 5, { maxWidth: 180 })
    }

    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text("This invoice is officially issued via PRMS Digital Financial Engine.", 14, 280)

    return doc
}
