"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Brush, Type, RotateCcw, PenTool } from "lucide-react"

interface DigitalSignaturePadProps {
    onSign: (data: { signatureType: "typed" | "drawn"; signatureValue: string }) => void
    signerName: string
    processing?: boolean
}

export function DigitalSignaturePad({ onSign, signerName, processing = false }: DigitalSignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [signatureType, setSignatureType] = useState<"drawn" | "typed">("drawn")
    const [typedName, setTypedName] = useState(signerName)

    // Clear Canvas Drawing
    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Add a clean grey base signature line helper
        ctx.strokeStyle = "#e2e8f0"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(20, canvas.height - 25)
        ctx.lineTo(canvas.width - 20, canvas.height - 25)
        ctx.stroke()
    }

    // Set canvas resolution on mount
    useEffect(() => {
        if (signatureType === "drawn") {
            const canvas = canvasRef.current
            if (canvas) {
                const ctx = canvas.getContext("2d")
                if (ctx) {
                    // Set drawing styles
                    ctx.strokeStyle = "#1d4ed8" // primary blue
                    ctx.lineWidth = 2.5
                    ctx.lineCap = "round"
                    ctx.lineJoin = "round"
                }
                clearCanvas()
            }
        }
    }, [signatureType])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const coords = getCoordinates(e)
        ctx.beginPath()
        ctx.moveTo(coords.x, coords.y)
        setIsDrawing(true)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        if (!isDrawing) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const coords = getCoordinates(e)
        ctx.lineTo(coords.x, coords.y)
        ctx.stroke()
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        const rect = canvas.getBoundingClientRect()
        
        if ("touches" in e) {
            if (e.touches.length === 0) return { x: 0, y: 0 }
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            }
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            }
        }
    }

    const handleSubmit = () => {
        if (signatureType === "typed") {
            if (!typedName.trim()) {
                alert("Please type your name to sign.")
                return
            }
            onSign({
                signatureType: "typed",
                signatureValue: typedName.trim()
            })
        } else {
            const canvas = canvasRef.current
            if (!canvas) return
            
            // Generate PNG Base64 Data URL
            const signatureValue = canvas.toDataURL("image/png")
            onSign({
                signatureType: "drawn",
                signatureValue
            })
        }
    }

    return (
        <div className="space-y-4">
            <Tabs 
                value={signatureType} 
                onValueChange={(val) => setSignatureType(val as "drawn" | "typed")} 
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-2 bg-slate-105 dark:bg-slate-900 rounded-xl p-1 border">
                    <TabsTrigger value="drawn" className="text-xs font-bold py-1.5 rounded-lg flex items-center gap-1.5">
                        <Brush className="h-3.5 w-3.5" /> Draw Signature
                    </TabsTrigger>
                    <TabsTrigger value="typed" className="text-xs font-bold py-1.5 rounded-lg flex items-center gap-1.5">
                        <Type className="h-3.5 w-3.5" /> Type Signature
                    </TabsTrigger>
                </TabsList>

                {/* Tab Content: Canvas Pad */}
                <TabsContent value="drawn" className="space-y-3 pt-2">
                    <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex justify-center">
                        <canvas
                            ref={canvasRef}
                            width={380}
                            height={160}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="touch-none cursor-crosshair max-w-full"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={clearCanvas}
                            className="absolute top-2 right-2 h-8 w-8 rounded-lg hover:bg-slate-200/50"
                            title="Clear Signature Canvas"
                        >
                            <RotateCcw className="h-4 w-4 text-slate-400" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold italic text-center">
                        Draw your signature inside the box using your touch screen or mouse pointer.
                    </p>
                </TabsContent>

                {/* Tab Content: Typed Cursive Input */}
                <TabsContent value="typed" className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="typed-name" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Legal Name</Label>
                        <Input
                            id="typed-name"
                            placeholder="Type your legal signature name"
                            value={typedName}
                            onChange={(e) => setTypedName(e.target.value)}
                            className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
                        />
                    </div>
                    
                    {typedName.trim() && (
                        <div className="p-4 rounded-xl border border-dashed border-slate-250 bg-slate-50 dark:bg-slate-950/40 text-center min-h-[80px] flex items-center justify-center">
                            <span className="font-mono italic text-2xl tracking-wide text-blue-700 dark:text-blue-400 font-extrabold select-none">
                                {typedName}
                            </span>
                        </div>
                    )}
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold italic text-center">
                        Type your name above to generate a legally-binding cursive electronic signature record.
                    </p>
                </TabsContent>
            </Tabs>

            <Button
                onClick={handleSubmit}
                disabled={processing || (signatureType === "typed" && !typedName.trim())}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide mt-2 shadow-lg shadow-blue-600/10 flex items-center justify-center gap-1.5"
            >
                <PenTool className="h-4 w-4" />
                {processing ? "Applying Signature..." : "Apply Signature"}
            </Button>
        </div>
    )
}
