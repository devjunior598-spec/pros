"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    Building2,
    CheckCircle,
    XCircle,
    Plus,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    Check,
    Settings,
    AlertCircle,
    MapPin,
    Loader2,
    Phone,
    Mail,
    FileText,
    Info,
    CalendarCheck,
    X
} from "lucide-react"

export default function InspectionsPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [bookings, setBookings] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState("bookings")
    
    // Landlord Availability State
    const [availability, setAvailability] = useState<any>({
        available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        start_time: '09:00',
        end_time: '17:00',
        slot_duration: 30
    })
    const [updatingAvailability, setUpdatingAvailability] = useState(false)

    // Modals & Action State
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [selectedBooking, setSelectedBooking] = useState<any>(null)
    const [showRescheduleModal, setShowRescheduleModal] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rescheduleDate, setRescheduleDate] = useState("")
    const [rescheduleTime, setRescheduleTime] = useState("")
    const [rejectionReason, setRejectionReason] = useState("")

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month')
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date())

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }

            // 1. Fetch Profile
            const { data: prof, error: profError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()
            if (profError) throw profError
            setProfile(prof)

            // 2. Fetch Bookings
            if (prof.role === "landlord") {
                const { data: bookData } = await supabase
                    .from("inspection_bookings")
                    .select("*, property:properties(title, city, state)")
                    .eq("landlord_id", user.id)
                    .order("inspection_date", { ascending: true })
                    .order("inspection_time", { ascending: true })
                setBookings(bookData || [])

                // Fetch Availability Settings
                const { data: avail } = await supabase
                    .from("landlord_availabilities")
                    .select("*")
                    .eq("landlord_id", user.id)
                    .maybeSingle()
                if (avail) {
                    setAvailability({
                        ...avail,
                        start_time: avail.start_time.substring(0, 5),
                        end_time: avail.end_time.substring(0, 5)
                    })
                }
            } else if (prof.role === "tenant") {
                const { data: bookData } = await supabase
                    .from("inspection_bookings")
                    .select("*, property:properties(title, city, state, images)")
                    .eq("tenant_id", user.id)
                    .order("inspection_date", { ascending: true })
                    .order("inspection_time", { ascending: true })
                setBookings(bookData || [])
            }
        } catch (error) {
            console.error("Error fetching inspections data:", error)
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Action handlers
    const handleAction = async (id: string, action: string, extraData: any = {}) => {
        setProcessingId(id)
        try {
            const res = await fetch("/api/inspections/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    action,
                    initiator: profile?.role,
                    ...extraData
                })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Failed to process viewing")

            alert(result.message || `Viewing successfully updated`)
            setShowRescheduleModal(false)
            setShowRejectModal(false)
            setRejectionReason("")
            setSelectedBooking(null)
            fetchData()
        } catch (error: any) {
            alert(error.message || "An error occurred")
        } finally {
            setProcessingId(null)
        }
    }

    // Availability Settings submit
    const handleSaveAvailability = async (e: React.FormEvent) => {
        e.preventDefault()
        setUpdatingAvailability(true)
        try {
            const res = await fetch("/api/inspections/availability/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    landlordId: profile.id,
                    availableDays: availability.available_days,
                    startTime: availability.start_time + ":00",
                    endTime: availability.end_time + ":00",
                    slotDuration: Number(availability.slot_duration)
                })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Failed to update availability")

            alert("Scheduling preferences saved successfully!")
            fetchData()
        } catch (error: any) {
            alert(error.message || "An error occurred")
        } finally {
            setUpdatingAvailability(false)
        }
    }

    const toggleAvailabilityDay = (day: string) => {
        setAvailability((prev: any) => {
            const days = prev.available_days.includes(day)
                ? prev.available_days.filter((d: string) => d !== day)
                : [...prev.available_days, day]
            return { ...prev, available_days: days }
        })
    }

    // Dynamic month calendar grid calculations
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const startDay = new Date(year, month, 1).getDay()
        const totalDays = new Date(year, month + 1, 0).getDate()
        
        const days = []
        // Fill padding of previous month
        for (let i = 0; i < startDay; i++) {
            days.push(null)
        }
        // Fill current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push(new Date(year, month, i))
        }
        return days
    }

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const statusBadges: any = {
        pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        approved: "bg-green-500/10 text-green-500 border-green-500/20",
        completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        cancelled: "bg-slate-500/10 text-slate-500 border-slate-500/20",
        rejected: "bg-red-500/10 text-red-500 border-red-500/20"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-slate-400">Loading your viewing schedule...</p>
                </div>
            </div>
        )
    }

    const isLandlord = profile?.role === "landlord"
    const isTenant = profile?.role === "tenant"

    // Filter bookings based on target tabs
    const upcomingBookings = bookings.filter(b => ['pending', 'approved'].includes(b.status))
    const historicalBookings = bookings.filter(b => ['completed', 'cancelled', 'rejected'].includes(b.status))

    return (
        <div className="max-w-6xl mx-auto space-y-6 py-4 font-sans text-slate-900 dark:text-slate-100">
            {/* Header section */}
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                        <CalendarIcon className="h-7 w-7 text-blue-600 dark:text-blue-500" />
                        Viewing & Inspections Scheduler
                    </h1>
                    <p className="text-xs text-slate-450 mt-1">Coordinate, review, and keep track of physical home visits and virtual property walk-throughs.</p>
                </div>
            </div>

            {isLandlord && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white/80 dark:bg-slate-950/60 p-1 border rounded-xl flex w-full max-w-md mb-6">
                        <TabsTrigger value="bookings" className="flex-1 rounded-lg">List View</TabsTrigger>
                        <TabsTrigger value="calendar" className="flex-1 rounded-lg">Calendar Schedule</TabsTrigger>
                        <TabsTrigger value="settings" className="flex-1 rounded-lg">Availability settings</TabsTrigger>
                    </TabsList>

                    {/* LANDLORD TAB 1: List View */}
                    <TabsContent value="bookings" className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Upcoming Inspections Card */}
                            <Card className="border border-slate-200 dark:border-slate-850 shadow-sm bg-white dark:bg-slate-950/40">
                                <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-extrabold">Upcoming Viewings</CardTitle>
                                        <CardDescription className="text-xs">Physical visits and virtual tours awaiting action or scheduled.</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="bg-blue-600/10 text-blue-600 dark:bg-blue-600/20">{upcomingBookings.length}</Badge>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    {upcomingBookings.length === 0 ? (
                                        <div className="py-12 text-center text-xs text-slate-400 italic">No upcoming viewings scheduled.</div>
                                    ) : (
                                        upcomingBookings.map((b) => (
                                            <div key={b.id} className="p-4 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-900/10 space-y-3 hover:shadow-sm transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-250 truncate max-w-[200px]">{b.property?.title}</h4>
                                                        <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{b.inspection_type}</p>
                                                    </div>
                                                    <Badge className={statusBadges[b.status]}>{b.status}</Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs border-y py-2.5 my-1 bg-white/40 dark:bg-slate-950/40 rounded-xl px-3">
                                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-350">
                                                        <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
                                                        <span>{b.inspection_date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-350">
                                                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                                                        <span>{b.inspection_time.substring(0, 5)}</span>
                                                    </div>
                                                    <div className="col-span-2 flex items-center gap-1.5 text-slate-600 dark:text-slate-350 mt-1">
                                                        <User className="h-3.5 w-3.5 text-blue-500" />
                                                        <span className="truncate">{b.name} ({b.phone})</span>
                                                    </div>
                                                </div>

                                                {b.notes && (
                                                    <div className="text-[11px] bg-slate-100/50 dark:bg-slate-900/40 p-2 rounded-xl text-slate-500">
                                                        <span className="font-bold text-slate-400 block mb-0.5 uppercase tracking-wider text-[8px]">Tenant Notes:</span>
                                                        "{b.notes}"
                                                    </div>
                                                )}

                                                <div className="flex justify-end gap-2 pt-2 border-t text-xs">
                                                    {b.status === 'pending' && (
                                                        <>
                                                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setSelectedBooking(b); setShowRejectModal(true); }}>
                                                                Decline
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="border-slate-200 dark:border-slate-800" onClick={() => { setSelectedBooking(b); setRescheduleDate(b.inspection_date); setRescheduleTime(b.inspection_time.substring(0,5)); setShowRescheduleModal(true); }}>
                                                                Reschedule
                                                            </Button>
                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-bold" onClick={() => handleAction(b.id, 'approve')} disabled={processingId === b.id}>
                                                                Approve
                                                            </Button>
                                                        </>
                                                    )}
                                                    {b.status === 'approved' && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="border-slate-200 dark:border-slate-800" onClick={() => { setSelectedBooking(b); setRescheduleDate(b.inspection_date); setRescheduleTime(b.inspection_time.substring(0,5)); setShowRescheduleModal(true); }}>
                                                                Reschedule
                                                            </Button>
                                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => handleAction(b.id, 'complete')} disabled={processingId === b.id}>
                                                                Mark Completed
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>

                            {/* Viewing History Card */}
                            <Card className="border border-slate-200 dark:border-slate-850 shadow-sm bg-white dark:bg-slate-950/40">
                                <CardHeader className="border-b pb-3">
                                    <CardTitle className="text-base font-extrabold">Viewing History</CardTitle>
                                    <CardDescription className="text-xs">Record of completed, cancelled, or declined inspections.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    {historicalBookings.length === 0 ? (
                                        <div className="py-12 text-center text-xs text-slate-400 italic">No historical viewing records.</div>
                                    ) : (
                                        historicalBookings.map((b) => (
                                            <div key={b.id} className="p-4 border border-slate-200/50 dark:border-slate-850 rounded-2xl bg-slate-50/20 dark:bg-slate-900/5 space-y-2.5">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-bold text-sm truncate max-w-[200px]">{b.property?.title}</h4>
                                                    <Badge className={statusBadges[b.status]}>{b.status}</Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                                                    <span>📅 {b.inspection_date}</span>
                                                    <span>⏰ {b.inspection_time.substring(0, 5)}</span>
                                                    <span className="truncate">👤 {b.name}</span>
                                                </div>
                                                {b.notes && (
                                                    <div className="text-[10px] bg-slate-100/30 dark:bg-slate-900/20 p-2 rounded-xl text-slate-400 leading-normal">
                                                        "{b.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* LANDLORD TAB 2: Calendar View */}
                    <TabsContent value="calendar" className="space-y-6">
                        <Card className="border border-slate-200 dark:border-slate-850 shadow-sm bg-white dark:bg-slate-950/40">
                            <CardHeader className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-extrabold flex items-center gap-1.5">
                                        <CalendarCheck className="h-5 w-5 text-blue-600" />
                                        Month Agenda Scheduler
                                    </CardTitle>
                                    <CardDescription className="text-xs">Interact with dates to view daily viewing queues.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={prevMonth}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-bold capitalize">
                                        {currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={nextMonth}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase tracking-widest border-b pb-2 mb-2">
                                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                                </div>
                                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                                    {getDaysInMonth(currentMonth).map((date, i) => {
                                        if (!date) return <div key={`empty-${i}`} className="aspect-square bg-slate-50/20 dark:bg-slate-900/10 rounded-xl" />

                                        const dateStr = date.toISOString().split('T')[0]
                                        const dayBookings = bookings.filter(b => b.inspection_date === dateStr)
                                        const hasPending = dayBookings.some(b => b.status === 'pending')
                                        const hasApproved = dayBookings.some(b => b.status === 'approved')
                                        
                                        const isSelected = selectedCalendarDate.toDateString() === date.toDateString()

                                        return (
                                            <button
                                                key={dateStr}
                                                onClick={() => setSelectedCalendarDate(date)}
                                                className={`aspect-square p-1 rounded-xl border flex flex-col justify-between hover:border-blue-500 transition-colors relative min-h-[48px] ${
                                                    isSelected 
                                                        ? 'bg-blue-600/10 border-blue-500' 
                                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                                }`}
                                            >
                                                <span className={`text-xs font-bold ${
                                                    date.toDateString() === new Date().toDateString() 
                                                        ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center'
                                                        : 'text-slate-800 dark:text-slate-200'
                                                }`}>
                                                    {date.getDate()}
                                                </span>
                                                <div className="flex gap-1 justify-center w-full pb-1">
                                                    {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Pending viewing" />}
                                                    {hasApproved && <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Approved viewing" />}
                                                    {dayBookings.some(b => b.status === 'completed') && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Completed viewing" />}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Calendar Day Details list */}
                                <div className="mt-8 border-t pt-6 space-y-3">
                                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-350">
                                        Agenda for {selectedCalendarDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </h4>
                                    
                                    {(() => {
                                        const dateStr = selectedCalendarDate.toISOString().split('T')[0]
                                        const dayBookings = bookings.filter(b => b.inspection_date === dateStr)
                                        if (dayBookings.length === 0) {
                                            return <p className="text-xs text-slate-400 italic">No viewings scheduled for this day.</p>
                                        }

                                        return (
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {dayBookings.map((b) => (
                                                    <div key={b.id} className="p-3 border rounded-xl bg-slate-50/40 dark:bg-slate-900/10 flex items-center justify-between text-xs gap-3">
                                                        <div className="space-y-1 min-w-0">
                                                            <div className="font-bold truncate text-slate-800 dark:text-slate-200">{b.property?.title}</div>
                                                            <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-blue-500" />
                                                                {b.inspection_time.substring(0,5)} | {b.inspection_type}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 truncate">Tenant: {b.name}</div>
                                                        </div>
                                                        <Badge className={statusBadges[b.status]}>{b.status}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* LANDLORD TAB 3: Availability Settings */}
                    <TabsContent value="settings" className="space-y-6">
                        <Card className="border border-slate-200 dark:border-slate-850 shadow-sm bg-white dark:bg-slate-950/40 max-w-2xl">
                            <CardHeader className="border-b pb-4">
                                <CardTitle className="text-base font-extrabold flex items-center gap-1.5">
                                    <Settings className="h-5 w-5 text-blue-600" />
                                    Viewing Availability Settings
                                </CardTitle>
                                <CardDescription className="text-xs">Configure your working days and daily hours for property inspections.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSaveAvailability}>
                                <CardContent className="p-6 space-y-6">
                                    {/* Work days select */}
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Days</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                                                const active = availability.available_days.includes(day)
                                                return (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => toggleAvailabilityDay(day)}
                                                        className={`px-3 py-2 rounded-xl text-xs font-bold border capitalize transition-colors min-h-[40px] ${
                                                            active 
                                                                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/10' 
                                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
                                                        }`}
                                                    >
                                                        {day.substring(0,3)}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Work hours select */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="startTime" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Time</Label>
                                            <Input
                                                id="startTime"
                                                type="time"
                                                required
                                                value={availability.start_time}
                                                onChange={(e) => setAvailability({ ...availability, start_time: e.target.value })}
                                                className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="endTime" className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Time</Label>
                                            <Input
                                                id="endTime"
                                                type="time"
                                                required
                                                value={availability.end_time}
                                                onChange={(e) => setAvailability({ ...availability, end_time: e.target.value })}
                                                className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Duration per slot */}
                                    <div className="space-y-2">
                                        <Label htmlFor="duration" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Slot Duration (Minutes)</Label>
                                        <select
                                            id="duration"
                                            value={availability.slot_duration}
                                            onChange={(e) => setAvailability({ ...availability, slot_duration: Number(e.target.value) })}
                                            className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-sans focus-visible:outline-none"
                                        >
                                            <option value={15}>15 Minutes</option>
                                            <option value={30}>30 Minutes</option>
                                            <option value={45}>45 Minutes</option>
                                            <option value={60}>60 Minutes (1 Hour)</option>
                                        </select>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-6 border-t bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
                                    <Button type="submit" disabled={updatingAvailability} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-xl min-h-[44px]">
                                        {updatingAvailability ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Preference Settings"
                                        )}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {isTenant && (
                <div className="space-y-6">
                    <Card className="border border-slate-200 dark:border-slate-850 shadow-sm bg-white dark:bg-slate-950/40">
                        <CardHeader className="border-b pb-3">
                            <CardTitle className="text-base font-extrabold">My Inspection Bookings</CardTitle>
                            <CardDescription className="text-xs">View and manage scheduled inspections for properties you are interested in.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {bookings.length === 0 ? (
                                <div className="py-12 text-center text-xs text-slate-400 italic">You have no inspection bookings. Browse listings to schedule viewings.</div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {bookings.map((b) => (
                                        <div key={b.id} className="p-4 border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 flex gap-4 hover:shadow-md transition-all">
                                            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400">
                                                {b.property?.images && b.property.images.length > 0 ? (
                                                    <img src={b.property.images[0]} alt="Property" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Building2 className="h-6 w-6" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex justify-between items-start gap-1">
                                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{b.property?.title || 'Property'}</h4>
                                                    <Badge className={statusBadges[b.status]}>{b.status}</Badge>
                                                </div>
                                                <div className="flex flex-col gap-1 text-[11px] text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <CalendarIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                        <span>{b.inspection_date} at {b.inspection_time.substring(0, 5)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                        <span>Type: {b.inspection_type}</span>
                                                    </div>
                                                </div>

                                                {b.notes && (
                                                    <p className="text-[10px] italic text-slate-450 dark:text-slate-400 border-l-2 pl-2 mt-1">
                                                        "{b.notes}"
                                                    </p>
                                                )}

                                                {['pending', 'approved'].includes(b.status) && (
                                                    <div className="flex justify-end gap-2 pt-2 text-xs">
                                                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleAction(b.id, 'cancel')} disabled={processingId === b.id}>
                                                            Cancel Booking
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="border-slate-200 dark:border-slate-800" onClick={() => { setSelectedBooking(b); setRescheduleDate(b.inspection_date); setRescheduleTime(b.inspection_time.substring(0,5)); setShowRescheduleModal(true); }}>
                                                            Reschedule
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* MODAL 1: Reschedule viewings slot dialog */}
            {showRescheduleModal && selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4 shadow-xl">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-extrabold text-base">Reschedule Viewing</h3>
                            <button onClick={() => setShowRescheduleModal(false)} className="text-slate-400 hover:text-slate-650">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4 text-xs">
                            <div className="space-y-1.5">
                                <Label htmlFor="resDate">Preferred New Date</Label>
                                <Input
                                    id="resDate"
                                    type="date"
                                    min={new Date().toISOString().split("T")[0]}
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="resTime">Preferred New Time</Label>
                                <Input
                                    id="resTime"
                                    type="time"
                                    value={rescheduleTime}
                                    onChange={(e) => setRescheduleTime(e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setShowRescheduleModal(false)}>Close</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => handleAction(selectedBooking.id, 'reschedule', { newDate: rescheduleDate, newTime: rescheduleTime + ":00" })} disabled={processingId === selectedBooking.id}>
                                Submit Reschedule
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: Decline/Reject notes dialog */}
            {showRejectModal && selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4 shadow-xl">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-extrabold text-base">Decline Viewing Request</h3>
                            <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-650">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-2 text-xs">
                            <Label htmlFor="rejNotes">Provide Reason / Notes for rejection</Label>
                            <Textarea
                                id="rejNotes"
                                placeholder="Write reason here..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="min-h-[100px] rounded-xl border-slate-200"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => handleAction(selectedBooking.id, 'reject', { notes: rejectionReason })} disabled={processingId === selectedBooking.id}>
                                Decline Request
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
