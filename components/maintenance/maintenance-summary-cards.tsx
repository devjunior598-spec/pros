
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Clock, DollarSign, ListTodo } from "lucide-react"

interface MaintenanceSummaryCardsProps {
    requests: any[]
}

export function MaintenanceSummaryCards({ requests }: MaintenanceSummaryCardsProps) {
    const totalRequests = requests.length
    const pendingRequests = requests.filter(r => r.status === 'pending').length
    const inProgressRequests = requests.filter(r => r.status === 'in_progress').length
    const completedRequests = requests.filter(r => r.status === 'completed').length

    // Calculate total cost for completed requests this month
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyCost = requests
        .filter(r => {
            const date = new Date(r.created_at)
            return r.status === 'completed' &&
                date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear
        })
        .reduce((sum, r) => sum + (r.final_cost || r.estimated_cost || 0), 0)

    const urgentIssues = requests.filter(r => r.priority === 'emergency' && r.status !== 'completed').length

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalRequests}</div>
                    <p className="text-xs text-muted-foreground">
                        {pendingRequests} pending attention
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{inProgressRequests}</div>
                    <p className="text-xs text-muted-foreground">
                        Active maintenance jobs
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Urgent Issues</CardTitle>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{urgentIssues}</div>
                    <p className="text-xs text-muted-foreground">
                        Requires immediate action
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₦{monthlyCost.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Spent this month
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
