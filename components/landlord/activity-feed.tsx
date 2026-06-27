"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Bell, CreditCard, Wrench, FileText, UserPlus, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  type: 'payment' | 'maintenance' | 'application' | 'message' | 'system'
  title: string
  description: string
  timestamp: string | Date
  read: boolean
}

interface ActivityFeedProps {
  activities?: ActivityItem[]
}

const mockActivities: ActivityItem[] = [
  { id: '1', type: 'payment', title: 'Rent Payment Received', description: 'John Doe paid ₦150,000 for Apartment 4A.', timestamp: new Date(Date.now() - 1000 * 60 * 30), read: false },
  { id: '2', type: 'application', title: 'New Tenant Application', description: 'Jane Smith applied for Sunset Villa.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), read: false },
  { id: '3', type: 'maintenance', title: 'Maintenance Request', description: 'Plumbing issue reported at Unit 12.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), read: true },
  { id: '4', type: 'message', title: 'New Message', description: 'Michael asked about the parking space.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), read: true },
  { id: '5', type: 'system', title: 'Lease Expiring Soon', description: 'Lease for Apartment 2B expires in 30 days.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), read: true },
]

export function ActivityFeed({ activities = mockActivities }: ActivityFeedProps) {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      case 'maintenance': return <Wrench className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      case 'application': return <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      case 'message': return <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      default: return <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'payment': return "bg-emerald-100 dark:bg-emerald-900/40"
      case 'maintenance': return "bg-orange-100 dark:bg-orange-900/40"
      case 'application': return "bg-blue-100 dark:bg-blue-900/40"
      case 'message': return "bg-purple-100 dark:bg-purple-900/40"
      default: return "bg-gray-100 dark:bg-gray-800"
    }
  }

  return (
    <Card className="border shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest updates across your portfolio.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto pr-2">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No recent activity.
            </div>
          ) : (
            activities.map((activity, index) => (
              <motion.div 
                key={activity.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex gap-4 group cursor-pointer"
              >
                <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getBgColor(activity.type)}`}>
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium leading-none ${activity.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-50'}`}>
                      {activity.title}
                    </p>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {activity.description}
                  </p>
                </div>
                {!activity.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                )}
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
