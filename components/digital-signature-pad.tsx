"use client"

import React, { useRef, useState, useEffect } from "react"
import { Check, Edit3, Type, Upload, Trash2, ShieldCheck, Lock, AlertCircle, Loader2 } from "lucide-react"

interface DigitalSignaturePadProps {
    onSign: (data: {
        signerName: string
        signatureType: "typed" | "drawn" | "uploaded"
        signatureData: string
        consentConfirmed: boolean
        confirmationCode: string
    }) => Promise<void>
    isSubmitting?: boolean
    roleLabel: string
}

export function DigitalSignaturePad({ onSign, isSubmitting = false, roleLabel }: DigitalSignaturePadProps) {
    const [tab, setTab] = useState<"draw" | "type" | "upload">("draw")
    const [signerName, setSignerName] = useState("")
    const [typedSignature, setTypedSignature] = useState("")
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [consent, setConsent] = useState(false)
    const [confirmationCode, setConfirmationCode] = useState("")
    const [error, setError] = useState<string | null>(null)

    // Canvas drawing state
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasDrawn, setHasDrawn] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.strokeStyle = "#1d4ed8" // Dark blue signature ink
        ctx.lineWidth = 2.5
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
    }, [tab])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        setIsDrawing(true)
        setHasDrawn(true)
        const rect = canvas.getBoundingClientRect()
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
        ctx.beginPath()
        ctx.moveTo(clientX - rect.left, clientY - rect.top)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
        ctx.lineTo(clientX - rect.left, clientY - rect.top)
        ctx.stroke()
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasDrawn(false)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 3 * 1024 * 1024) {
            setError("Signature image file size must be less than 3MB.")
            return
        }
        const reader = new FileReader()
        reader.onload = (evt) => {
            setUploadedImage(evt.target?.result as string)
            setError(null)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!signerName.trim()) {
            setError("Please enter your full legal name.")
            return
        }

        if (!consent) {
            setError("You must acknowledge and consent to the digital signature policy.")
            return
        }

        if (!confirmationCode.trim()) {
            setError("Please enter your account password or confirmation code to authorize signing.")
            return
        }

        let signatureData = ""
        let sigType: "typed" | "drawn" | "uploaded" = "drawn"

        if (tab === "draw") {
            if (!hasDrawn || !canvasRef.current) {
                setError("Please draw your signature in the box provided.")
                return
            }
            signatureData = canvasRef.current.toDataURL("image/png")
            sigType = "drawn"
        } else if (tab === "type") {
            if (!typedSignature.trim()) {
                setError("Please type your signature.")
                return
            }
            signatureData = typedSignature
            sigType = "typed"
        } else if (tab === "upload") {
            if (!uploadedImage) {
                setError("Please upload an image of your signature.")
                return
            }
            signatureData = uploadedImage
            sigType = "uploaded"
        }

        try {
            await onSign({
                signerName,
                signatureType: sigType,
                signatureData,
                consentConfirmed: consent,
                confirmationCode
            })
        } catch (err: any) {
            setError(err.message || "Failed to submit signature.")
        }
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto shadow-2xl text-slate-100">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
                <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-white">Digital Signature Execution</h3>
                    <p className="text-xs text-slate-400">Authorize agreement as <span className="font-medium text-blue-400">{roleLabel}</span></p>
                </div>
            </div>

            {error && (
                <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-[#20px] space-y-5">
                {/* Full Legal Name */}
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Full Legal Signer Name *
                    </label>
                    <input
                        type="text"
                        value={signerName}
                        onChange={(e) => {
                            setSignerName(e.target.value)
                            if (tab === "type" && !typedSignature) setTypedSignature(e.target.value)
                        }}
                        placeholder="e.g. Samuel Adewale"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Method selector tabs */}
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                        Signature Method
                    </label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                        <button
                            type="button"
                            onClick={() => setTab("draw")}
                            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-medium transition ${tab === "draw" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Draw</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("type")}
                            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-medium transition ${tab === "type" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <Type className="w-3.5 h-3.5" />
                            <span>Type</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("upload")}
                            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-medium transition ${tab === "upload" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload</span>
                        </button>
                    </div>
                </div>

                {/* Signature input area */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    {tab === "draw" && (
                        <div>
                            <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
                                <span>Draw inside the box using touch or mouse</span>
                                {hasDrawn && (
                                    <button
                                        type="button"
                                        onClick={clearCanvas}
                                        className="text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Clear</span>
                                    </button>
                                )}
                            </div>
                            <canvas
                                ref={canvasRef}
                                width={480}
                                height={150}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="w-full h-36 bg-white rounded-lg cursor-crosshair border border-slate-300 touch-none"
                            />
                        </div>
                    )}

                    {tab === "type" && (
                        <div>
                            <label className="block text-xs text-slate-400 mb-2">Type your signature representation</label>
                            <input
                                type="text"
                                value={typedSignature}
                                onChange={(e) => setTypedSignature(e.target.value)}
                                placeholder="Type cursive name signature"
                                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="p-4 bg-white rounded-lg min-h-[80px] flex items-center justify-center border border-slate-300">
                                <span className="font-serif italic text-2xl text-blue-900 tracking-wider">
                                    {typedSignature || "Signature Preview"}
                                </span>
                            </div>
                        </div>
                    )}

                    {tab === "upload" && (
                        <div>
                            <label className="block text-xs text-slate-400 mb-2">Upload a clear PNG/JPG of your signature</label>
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                onChange={handleImageUpload}
                                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30"
                            />
                            {uploadedImage && (
                                <div className="mt-3 p-2 bg-white rounded-lg flex items-center justify-center max-h-32">
                                    <img src={uploadedImage} alt="Signature Upload" className="max-h-28 object-contain" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Password / Confirmation code security prompt */}
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Account Password / Confirmation Code *</span>
                    </label>
                    <input
                        type="password"
                        value={confirmationCode}
                        onChange={(e) => setConfirmationCode(e.target.value)}
                        placeholder="Enter password to confirm identity"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start space-x-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                    <input
                        type="checkbox"
                        id="legalConsent"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="legalConsent" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                        I confirm that I have reviewed the entire lease agreement, consent to sign electronically under statutory electronic transaction laws, and acknowledge that my IP address & device logs will be recorded as part of the legal audit trail.
                    </label>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Executing Signature...</span>
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                <span>Sign & Execute Lease Contract</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
