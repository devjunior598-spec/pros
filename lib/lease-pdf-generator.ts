import jsPDF from "jspdf"
import { formatCurrency } from "@/lib/utils"

interface LeasePDFData {
    title: string
    templateType: string
    landlordName: string
    landlordEmail: string
    landlordPhone?: string
    tenantName: string
    tenantEmail: string
    tenantPhone?: string
    propertyName: string
    propertyAddress: string
    rentAmount: number
    paymentFrequency: string
    securityDeposit: number
    startDate: string
    endDate: string
    houseRules: string[]
    termsAndConditions: string
    signatures: {
        role: "landlord" | "tenant"
        signerName: string
        signatureType: "typed" | "drawn"
        signatureValue: string // typed text name OR drawn Base64 PNG image string
        ipAddress: string
        userAgent: string
        signedAt: string
    }[]
    status: string
}

export const generateLeasePDF = (data: LeasePDFData) => {
    const doc = new jsPDF()
    const margin = 14
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    let y = 20

    // Helper: Add page-break if space runs out
    const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
            doc.addPage()
            y = margin + 10
            drawHeader()
        }
    }

    // Helper: Draw running header
    const drawHeader = () => {
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184) // slate-400
        doc.text("PRMS DIGITAL LEASE PORTAL", margin, y - 5)
        doc.text(`LEASE REFERENCE: ${data.title.toUpperCase()}`, pageWidth - margin - 60, y - 5)
        doc.setDrawColor(226, 232, 240) // slate-200
        doc.line(margin, y - 2, pageWidth - margin, y - 2)
    }

    // --- Page 1 Header & Title ---
    // Title / Logo
    doc.setFontSize(22)
    doc.setTextColor(30, 41, 59) // slate-800
    doc.text("PRMS", margin, y)

    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139) // slate-500
    doc.text("Property Rental Management System", margin, y + 6)
    doc.text("Official Digital Lease Contract", margin, y + 11)

    // Document Meta
    doc.setFontSize(14)
    doc.setTextColor(59, 130, 246) // blue-500
    doc.text("LEASE AGREEMENT", pageWidth - margin - 60, y)

    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105) // slate-600
    doc.text(`Type: ${data.templateType.toUpperCase()}`, pageWidth - margin - 60, y + 6)
    doc.text(`Status: ${data.status.toUpperCase()}`, pageWidth - margin - 60, y + 11)

    y += 22
    doc.setDrawColor(203, 213, 225) // slate-300
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    // Title of Lease
    doc.setFontSize(16)
    doc.setTextColor(30, 41, 59)
    const titleLines = doc.splitTextToSize(data.title, pageWidth - (margin * 2))
    doc.text(titleLines, margin, y)
    y += titleLines.length * 7 + 3

    // Parties Section
    doc.setFontSize(12)
    doc.setTextColor(59, 130, 246)
    doc.text("1. PARTIES TO THIS LEASE", margin, y)
    y += 6

    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)

    // Landlord card column
    doc.setFont("Helvetica", "bold")
    doc.setTextColor(30, 41, 59)
    doc.text("LANDLORD (LESSOR)", margin, y)
    doc.setFont("Helvetica", "normal")
    doc.setTextColor(71, 85, 105)
    doc.text(`Name: ${data.landlordName}`, margin, y + 6)
    doc.text(`Email: ${data.landlordEmail}`, margin, y + 11)
    if (data.landlordPhone) doc.text(`Phone: ${data.landlordPhone}`, margin, y + 16)

    // Tenant card column
    doc.setFont("Helvetica", "bold")
    doc.setTextColor(30, 41, 59)
    doc.text("TENANT (LESSEE)", 110, y)
    doc.setFont("Helvetica", "normal")
    doc.setTextColor(71, 85, 105)
    doc.text(`Name: ${data.tenantName}`, 110, y + 6)
    doc.text(`Email: ${data.tenantEmail}`, 110, y + 11)
    if (data.tenantPhone) doc.text(`Phone: ${data.tenantPhone}`, 110, y + 16)

    y += 28

    // Property details
    doc.setFontSize(12)
    doc.setTextColor(59, 130, 246)
    doc.text("2. PROPERTY RENTED", margin, y)
    y += 6

    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.setFont("Helvetica", "bold")
    doc.text(data.propertyName, margin, y)
    doc.setFont("Helvetica", "normal")
    const addrLines = doc.splitTextToSize(data.propertyAddress, pageWidth - (margin * 2))
    doc.text(addrLines, margin, y + 5)
    y += addrLines.length * 4.5 + 8

    // Rent details
    doc.setFontSize(12)
    doc.setTextColor(59, 130, 246)
    doc.text("3. RENTAL TERMS & FEES", margin, y)
    y += 6

    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text(`Rent Amount: ${formatCurrency(data.rentAmount)}`, margin, y)
    doc.text(`Payment Frequency: ${data.paymentFrequency.toUpperCase()}`, margin, y + 5)
    doc.text(`Security Deposit: ${formatCurrency(data.securityDeposit)}`, margin, y + 10)
    doc.text(`Lease Term: ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}`, margin, y + 15)

    y += 25

    // House Rules
    if (data.houseRules && data.houseRules.length > 0) {
        checkPageBreak(35)
        doc.setFontSize(12)
        doc.setTextColor(59, 130, 246)
        doc.text("4. SPECIFIC HOUSE RULES", margin, y)
        y += 6

        doc.setFontSize(9)
        doc.setTextColor(71, 85, 105)
        data.houseRules.forEach((rule, idx) => {
            checkPageBreak(8)
            doc.text(`• ${rule}`, margin + 3, y)
            y += 5.5
        })
        y += 5
    }

    // Terms and Conditions Section (Spans multiple pages likely)
    checkPageBreak(50)
    doc.setFontSize(12)
    doc.setTextColor(59, 130, 246)
    doc.text("5. TERMS AND CONDITIONS OF AGREEMENT", margin, y)
    y += 8

    doc.setFontSize(9.5)
    doc.setTextColor(71, 85, 105)
    const termsLines = doc.splitTextToSize(data.termsAndConditions, pageWidth - (margin * 2))
    
    termsLines.forEach((line: string) => {
        checkPageBreak(6)
        doc.text(line, margin, y)
        y += 5.5
    })
    y += 10

    // Signatures Section
    checkPageBreak(65)
    doc.setFontSize(12)
    doc.setTextColor(59, 130, 246)
    doc.text("6. EXECUTION & DIGITAL SIGNATURES", margin, y)
    y += 8

    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text("This agreement was signed digitally in accordance with local electronic transactions laws. Captured IP/device logs verify identification.", margin, y, { maxWidth: pageWidth - (margin * 2) })
    y += 12

    // Signature Columns
    const landlordSig = data.signatures.find(s => s.role === "landlord")
    const tenantSig = data.signatures.find(s => s.role === "tenant")

    // Landlord signature box
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.rect(margin, y, 85, 50, "FD")

    doc.setFont("Helvetica", "bold")
    doc.setTextColor(30, 41, 59)
    doc.text("LANDLORD SIGNATURE", margin + 5, y + 6)
    
    if (landlordSig) {
        doc.setFont("Helvetica", "normal")
        doc.setTextColor(71, 85, 105)
        doc.setFontSize(8)
        doc.text(`Signer: ${landlordSig.signerName}`, margin + 5, y + 36)
        doc.text(`Date: ${new Date(landlordSig.signedAt).toLocaleString()}`, margin + 5, y + 40)
        doc.text(`IP: ${landlordSig.ipAddress}`, margin + 5, y + 44)

        if (landlordSig.signatureType === "typed") {
            doc.setFont("Courier", "italic")
            doc.setFontSize(16)
            doc.setTextColor(29, 78, 216) // dark blue cursive style
            doc.text(landlordSig.signatureValue, margin + 8, y + 22)
        } else if (landlordSig.signatureType === "drawn") {
            try {
                // Signature PNG base64 values usually contain 'data:image/png;base64,' prefix
                doc.addImage(landlordSig.signatureValue, "PNG", margin + 8, y + 10, 60, 22)
            } catch (err) {
                console.error("Error drawing landlord signature image:", err)
                doc.setFontSize(9)
                doc.text("[DRAWN SIGNATURE ATTACHED]", margin + 8, y + 20)
            }
        }
    } else {
        doc.setFont("Helvetica", "normal")
        doc.setTextColor(148, 163, 184)
        doc.text("Awaiting signature...", margin + 5, y + 26)
    }

    // Tenant signature box
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.rect(110, y, 85, 50, "FD")

    doc.setFont("Helvetica", "bold")
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(9)
    doc.text("TENANT SIGNATURE", 115, y + 6)

    if (tenantSig) {
        doc.setFont("Helvetica", "normal")
        doc.setTextColor(71, 85, 105)
        doc.setFontSize(8)
        doc.text(`Signer: ${tenantSig.signerName}`, 115, y + 36)
        doc.text(`Date: ${new Date(tenantSig.signedAt).toLocaleString()}`, 115, y + 40)
        doc.text(`IP: ${tenantSig.ipAddress}`, 115, y + 44)

        if (tenantSig.signatureType === "typed") {
            doc.setFont("Courier", "italic")
            doc.setFontSize(16)
            doc.setTextColor(29, 78, 216)
            doc.text(tenantSig.signatureValue, 118, y + 22)
        } else if (tenantSig.signatureType === "drawn") {
            try {
                doc.addImage(tenantSig.signatureValue, "PNG", 118, y + 10, 60, 22)
            } catch (err) {
                console.error("Error drawing tenant signature image:", err)
                doc.setFontSize(9)
                doc.text("[DRAWN SIGNATURE ATTACHED]", 118, y + 20)
            }
        }
    } else {
        doc.setFont("Helvetica", "normal")
        doc.setTextColor(148, 163, 184)
        doc.text("Awaiting signature...", 115, y + 26)
    }

    // Draw page numbers on all pages
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" })
    }

    return doc
}
