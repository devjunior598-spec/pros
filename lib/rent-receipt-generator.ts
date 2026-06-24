import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency } from "@/lib/utils"

interface RentReceiptData {
    receiptNumber: string
    datePaid: string
    tenantName: string
    tenantEmail: string
    propertyName: string
    propertyAddress: string
    paymentMethod: string
    transactionReference: string
    amountPaid: number
    status: string
}

export const generateRentReceipt = (data: RentReceiptData) => {
    const doc = new jsPDF()

    // Title / Header
    doc.setFontSize(22)
    doc.setTextColor(30, 41, 59) // slate-800
    doc.text("PRMS", 14, 22)

    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text("Property Rental Management System", 14, 28)
    doc.text("Electronic Payment Acknowledgment", 14, 33)

    // Invoice Meta
    doc.setFontSize(16)
    doc.setTextColor(59, 130, 246) // blue-500
    doc.text("RENT RECEIPT", 140, 22)

    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105) // slate-600
    doc.text(`Receipt No: ${data.receiptNumber}`, 140, 28)
    doc.text(`Date Paid: ${data.datePaid}`, 140, 33)
    doc.text(`Status: ${data.status.toUpperCase()}`, 140, 38)

    // Divider Line
    doc.setDrawColor(226, 232, 240) // slate-200
    doc.line(14, 45, 196, 45)

    // Client/Property Details
    doc.setFontSize(11)
    doc.setTextColor(30, 41, 59) // slate-800
    doc.text("Paid By:", 14, 55)
    doc.text("Property Details:", 110, 55)

    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105) // slate-600
    doc.text(data.tenantName, 14, 61)
    doc.text(data.tenantEmail, 14, 66)

    doc.text(data.propertyName, 110, 61)
    doc.text(data.propertyAddress || "N/A", 110, 66)

    // Payment Summary Table
    const tableColumn = ["Transaction Details", "Information"]
    const tableRows = [
        ["Payment Gateway / Method", data.paymentMethod],
        ["Transaction Reference", data.transactionReference],
        ["Date of Value", data.datePaid],
        ["Receipt ID", data.receiptNumber],
        ["Total Amount Paid", formatCurrency(data.amountPaid)]
    ]

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 4, textColor: [71, 85, 105] },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 80, fontStyle: 'bold' },
            1: { cellWidth: 'auto', halign: 'left' },
        },
        didParseCell: function (cellData) {
            if (cellData.row.index === tableRows.length - 1) {
                cellData.cell.styles.fontStyle = 'bold';
                cellData.cell.styles.fillColor = [239, 246, 255]; // light blue
                cellData.cell.styles.textColor = [29, 78, 216]; // dark blue
            }
        }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 15

    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184) // slate-400
    doc.text("Thank you for your business. For support or dispute inquiries, contact billing@prms.ng", 14, finalY)
    doc.text("This document serves as an official receipt of transaction fulfillment.", 14, finalY + 5)

    // Success Stamp
    if (data.status.toLowerCase() === 'paid' || data.status.toLowerCase() === 'success') {
        doc.setTextColor(240, 253, 244) // emerald-50/10 dark opacity style
        doc.setFontSize(55)
        // Add stamp text
        doc.setTextColor(200, 230, 200)
        doc.text("PAID", 100, 135, { align: "center", angle: 30 })
    }

    return doc
}
