import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Plus, Users, CalendarCheck, Wrench, CreditCard, FileText } from "lucide-react"

export function QuickActions() {
  const actions = [
    {
      title: "Add Property",
      icon: Plus,
      href: "/dashboard/landlord/properties/new",
      color: "bg-blue-500",
      lightBg: "bg-blue-50 dark:bg-blue-500/10",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Manage Tenants",
      icon: Users,
      href: "/tenants",
      color: "bg-purple-500",
      lightBg: "bg-purple-50 dark:bg-purple-500/10",
      textColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Schedule Inspection",
      icon: CalendarCheck,
      href: "/dashboard/inspections",
      color: "bg-indigo-500",
      lightBg: "bg-indigo-50 dark:bg-indigo-500/10",
      textColor: "text-indigo-600 dark:text-indigo-400"
    },
    {
      title: "Maintenance",
      icon: Wrench,
      href: "/requests",
      color: "bg-orange-500",
      lightBg: "bg-orange-50 dark:bg-orange-500/10",
      textColor: "text-orange-600 dark:text-orange-400"
    },
    {
      title: "View Payments",
      icon: CreditCard,
      href: "/dashboard/payments",
      color: "bg-emerald-500",
      lightBg: "bg-emerald-50 dark:bg-emerald-500/10",
      textColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Create Lease",
      icon: FileText,
      href: "/dashboard/leases/new",
      color: "bg-rose-500",
      lightBg: "bg-rose-50 dark:bg-rose-500/10",
      textColor: "text-rose-600 dark:text-rose-400"
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {actions.map((action, index) => (
        <motion.div
          key={action.title}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link 
            href={action.href}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition-colors ${action.lightBg}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 text-white ${action.color} shadow-sm`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className={`text-xs font-semibold text-center leading-tight ${action.textColor}`}>
              {action.title}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
