"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface PerformanceChartsProps {
  revenueData?: { name: string; revenue: number }[]
  occupancyData?: { name: string; rate: number }[]
}

const tickStyle = { fill: "#64748B", fontSize: 12 }

export function PerformanceCharts({ revenueData = [], occupancyData = [] }: PerformanceChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="border border-border bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Revenue Growth</CardTitle>
          <CardDescription>Monthly revenue across all properties.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {revenueData.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No paid rent recorded yet.</div> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={tickStyle} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={tickStyle}
                  tickFormatter={(value) => `₦${value / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(15,23,42,0.08)" }}
                />
                <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Occupancy Rate</CardTitle>
          <CardDescription>Current occupied share of your real portfolio.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {occupancyData.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Add properties to calculate occupancy.</div> : <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={tickStyle} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={tickStyle}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(15,23,42,0.08)" }}
                />
                <Area type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
