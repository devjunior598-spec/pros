export function getBillDaysUntilDue(dueDate: string, now = new Date()): number {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const due = new Date(`${dueDate.slice(0, 10)}T00:00:00`).getTime()
    return Math.round((due - today) / 86_400_000)
}
