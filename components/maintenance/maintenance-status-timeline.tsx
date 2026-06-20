
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface StatusLog {
    status: string
    created_at: string
    notes?: string
}

interface MaintenanceStatusTimelineProps {
    currentStatus: string
    logs: StatusLog[]
}

export function MaintenanceStatusTimeline({ currentStatus, logs }: MaintenanceStatusTimelineProps) {
    const steps = [
        { id: 'pending', label: 'Reported' },
        { id: 'assigned', label: 'Provider Assigned' },
        { id: 'in_progress', label: 'Work Started' },
        { id: 'completed', label: 'Completed' },
        { id: 'closed', label: 'Closed' }
    ]

    // Sort logs by date
    const sortedLogs = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const getStepStatus = (stepId: string) => {
        // Simple logic: if current status is beyond this step, it's completed
        // This is a simplification; ideally we check logs for existence of this status
        const statusOrder = ['pending', 'assigned', 'in_progress', 'completed', 'closed']
        const currentIndex = statusOrder.indexOf(currentStatus)
        const stepIndex = statusOrder.indexOf(stepId)

        if (stepIndex < currentIndex) return 'completed'
        if (stepIndex === currentIndex) return 'current'
        return 'upcoming'
    }

    return (
        <div className="space-y-8">
            <h3 className="text-lg font-medium">Status Timeline</h3>
            <div className="relative space-y-4">
                {steps.map((step, index) => {
                    const status = getStepStatus(step.id)
                    const log = sortedLogs.find(l => l.status === step.id) // Find first log for this status

                    return (
                        <div key={step.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`
                                    rounded-full p-1 border-2 
                                    ${status === 'completed' ? 'bg-primary border-primary text-primary-foreground' :
                                        status === 'current' ? 'border-primary text-primary' :
                                            'border-muted text-muted-foreground'}
                                `}>
                                    {status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                                        status === 'current' ? <Clock className="h-4 w-4 animate-pulse" /> :
                                            <Circle className="h-4 w-4" />}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-0.5 h-full min-h-[2rem] 
                                        ${status === 'completed' ? 'bg-primary' : 'bg-muted'}
                                    `} />
                                )}
                            </div>
                            <div className="pb-8">
                                <p className="font-medium">{step.label}</p>
                                {log && (
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(log.created_at).toLocaleString()}
                                    </p>
                                )}
                                {status === 'current' && (
                                    <p className="text-xs text-blue-500 font-medium mt-1">
                                        Current Stage
                                    </p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
