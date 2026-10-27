"use client"

import React, { useState, useEffect } from "react"
import { Package, Plus, AlertCircle, Search, Filter, Loader2, CheckCircle2 } from "lucide-react"

export default function OperationsInventoryPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    const [name, setName] = useState("")
    const [category, setCategory] = useState("Spare Part")
    const [quantity, setQuantity] = useState("10")
    const [unitCost, setUnitCost] = useState("5000")
    const [location, setLocation] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadInventory()
    }, [])

    async function loadInventory() {
        setLoading(true)
        try {
            const res = await fetch("/api/inventory")
            if (res.ok) {
                const data = await res.json()
                setItems(data.items || [])
            }
        } catch (err) {
            console.error("Error loading inventory:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, category, quantity, unitCost, location })
            })
            if (res.ok) {
                setShowModal(false)
                setName("")
                loadInventory()
            }
        } catch (err) {
            console.error("Error adding inventory item:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">OPERATIONS MODULE</span>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">Company Inventory & Asset Ledger</h1>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-2 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Stock Item</span>
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        Loading company inventory...
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                        No inventory items recorded.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => (
                            <div key={item.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                                <div className="flex items-start justify-between">
                                    <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold">
                                        {item.category}
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono">{item.item_code}</span>
                                </div>
                                <h4 className="font-bold text-white text-base">{item.name}</h4>
                                <div className="text-xs text-slate-400 space-y-1">
                                    <p>Quantity in Stock: <strong className="text-white">{item.quantity}</strong></p>
                                    <p>Unit Cost: <strong className="text-emerald-400">${Number(item.unit_cost).toLocaleString()}</strong></p>
                                    <p>Location: {item.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <form onSubmit={handleAddItem} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-slate-100">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                <h3 className="font-bold text-base text-white">Add Inventory Item</h3>
                                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xs">Close [X]</button>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-300 mb-1">Item Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                >
                                    <option value="Spare Part">Spare Part</option>
                                    <option value="Material">Material</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Vehicle">Vehicle</option>
                                    <option value="Asset">Company Asset</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-300 mb-1">Item Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Copper Pipe 1/2 Inch"
                                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-300 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-300 mb-1">Unit Cost ($)</label>
                                    <input
                                        type="number"
                                        value={unitCost}
                                        onChange={(e) => setUnitCost(e.target.value)}
                                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Inventory Item"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
