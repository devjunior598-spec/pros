
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface MaintenanceCostManagementProps {
    requestId: string
    initialEstimatedCost?: number
    initialFinalCost?: number
    isLandlord: boolean
}

export function MaintenanceCostManagement({
    requestId,
    initialEstimatedCost,
    initialFinalCost,
    isLandlord
}: MaintenanceCostManagementProps) {
    const [estimatedCost, setEstimatedCost] = useState<string>(initialEstimatedCost?.toString() || '')
    const [finalCost, setFinalCost] = useState<string>(initialFinalCost?.toString() || '')
    const [loading, setLoading] = useState(false)

    const handleUpdate = async (type: 'estimated' | 'final') => {
        setLoading(true)
        const value = type === 'estimated' ? parseFloat(estimatedCost) : parseFloat(finalCost)

        const updateData: any = {}
        if (type === 'estimated') updateData.estimated_cost = value
        else updateData.final_cost = value

        const { error } = await supabase
            .from('maintenance_requests')
            .update(updateData)
            .eq('id', requestId)

        if (error) {
            console.error('Error updating cost:', error)
            alert('Failed to update cost')
        } else {
            alert('Cost updated successfully')
        }
        setLoading(false)
    }

    if (!isLandlord) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Cost Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between">
                        <span>Estimated Cost:</span>
                        <span className="font-medium">
                            {initialEstimatedCost ? `₦${initialEstimatedCost.toLocaleString()}` : 'Pending'}
                        </span>
                    </div>
                    {initialFinalCost && (
                        <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="font-bold">Final Cost:</span>
                            <span className="font-bold text-green-600">
                                ₦{initialFinalCost.toLocaleString()}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cost Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="estimated-cost">Estimated Cost (₦)</Label>
                    <div className="flex gap-2">
                        <Input
                            id="estimated-cost"
                            type="number"
                            value={estimatedCost}
                            onChange={(e) => setEstimatedCost(e.target.value)}
                            placeholder="0.00"
                        />
                        <Button
                            onClick={() => handleUpdate('estimated')}
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="final-cost">Final Cost (₦)</Label>
                    <div className="flex gap-2">
                        <Input
                            id="final-cost"
                            type="number"
                            value={finalCost}
                            onChange={(e) => setFinalCost(e.target.value)}
                            placeholder="0.00"
                        />
                        <Button
                            onClick={() => handleUpdate('final')}
                            disabled={loading}
                            variant="secondary"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
