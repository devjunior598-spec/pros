"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CreditCard, Wallet, Building2, AlertCircle } from "lucide-react"
import { Bill } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface PaymentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    bill: Bill | null
    walletBalance: number
    onProcessPayment: (billId: string, amount: number, method: string) => Promise<void>
}

export function PaymentModal({ open, onOpenChange, bill, walletBalance, onProcessPayment }: PaymentModalProps) {
    const [paymentMethod, setPaymentMethod] = useState("card")
    const [amountType, setAmountType] = useState("full")
    const [customAmount, setCustomAmount] = useState<string>("")
    const [agreed, setAgreed] = useState(false)
    const [processing, setProcessing] = useState(false)
    const { toast } = useToast()

    if (!bill) return null

    const outstandingAmount = bill.amount - (bill.amount_paid || 0)

    // Calculate final payment amount based on selection
    const paymentAmount = amountType === "full"
        ? outstandingAmount
        : parseFloat(customAmount) || 0

    const isValidAmount = paymentAmount > 0 && paymentAmount <= outstandingAmount
    const canPayWithWallet = paymentMethod === "wallet" && walletBalance >= paymentAmount

    const handleSubmit = async () => {
        if (!agreed || !isValidAmount) return
        if (paymentMethod === "wallet" && !canPayWithWallet) return

        setProcessing(true)
        try {
            // If not using wallet we will redirect; show user a notice
            if (paymentMethod !== "wallet") {
                toast({
                    title: "Redirecting",
                    description: "You will be taken to our payment provider to complete the transaction.",
                })
            }

            await onProcessPayment(bill.id, paymentAmount, paymentMethod)
            onOpenChange(false)
        } catch (error) {
            console.error(error)
        } finally {
            setProcessing(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Pay Bill</DialogTitle>
                    <DialogDescription>
                        Review your payment details before proceeding.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Bill Summary */}
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Property</span>
                            <span className="text-sm">Rental Property</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Bill Type</span>
                            <span className="text-sm capitalize">{bill.type}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Billing Period</span>
                            <span className="text-sm">{bill.billing_period || "Monthly"}</span>
                        </div>
                        <div className="border-t my-2 pt-2 flex justify-between items-center font-bold">
                            <span>Total Outstanding</span>
                            <span>{formatCurrency(outstandingAmount)}</span>
                        </div>
                    </div>

                    {/* Payment Options */}
                    <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="card">
                                <CreditCard className="mr-2 h-4 w-4" /> Card
                            </TabsTrigger>
                            <TabsTrigger value="wallet">
                                <Wallet className="mr-2 h-4 w-4" /> Wallet
                            </TabsTrigger>
                            <TabsTrigger value="transfer">
                                <Building2 className="mr-2 h-4 w-4" /> Transfer
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="wallet" className="pt-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Wallet Balance</p>
                                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(walletBalance)}</p>
                                </div>
                                {paymentAmount > walletBalance && (
                                    <div className="flex items-center text-red-500 text-xs">
                                        <AlertCircle className="mr-1 h-3 w-3" />
                                        Insufficient
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* show info for redirect-based methods */}
                        <TabsContent value="card" className="pt-4">
                            <p className="text-sm text-muted-foreground">
                                You will be redirected to our secure payment partner to pay by card.
                            </p>
                        </TabsContent>
                        <TabsContent value="transfer" className="pt-4">
                            <p className="text-sm text-muted-foreground">
                                After submitting you will be given instructions to complete a bank transfer.
                            </p>
                        </TabsContent>
                    </Tabs>

                    {/* Partial Payment Toggle */}
                    <div className="space-y-3">
                        <Label>Payment Amount</Label>
                        <Select value={amountType} onValueChange={setAmountType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full">Full Payment ({formatCurrency(outstandingAmount)})</SelectItem>
                                <SelectItem value="partial">Partial Payment</SelectItem>
                            </SelectContent>
                        </Select>

                        {amountType === "partial" && (
                            <div className="space-y-1">
                                <Input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    className={!isValidAmount && customAmount ? "border-red-500" : ""}
                                />
                                {customAmount && !isValidAmount && (
                                    <p className="text-xs text-red-500">Amount cannot exceed outstanding balance.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Terms */}
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="terms"
                            checked={agreed}
                            onCheckedChange={(c: boolean) => setAgreed(c === true)}
                        />
                        <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            I agree to the payment terms and conditions
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button
                            className="w-full sm:flex-1 bg-green-600 hover:bg-green-700"
                            onClick={handleSubmit}
                            disabled={!agreed || !isValidAmount || (paymentMethod === "wallet" && !canPayWithWallet) || processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                `Pay ${formatCurrency(paymentAmount)}`
                            )}
                        </Button>
                    </div>
                </DialogFooter>
                {/* offer funding link if wallet selected but insufficient */}
                {paymentMethod === "wallet" && !canPayWithWallet && (
                    <div className="mt-2 text-sm text-red-600">
                        Insufficient wallet balance. <a href="/dashboard/wallet" className="underline">Fund your wallet</a> to continue.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
