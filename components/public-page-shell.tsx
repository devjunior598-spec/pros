"use client"

import { motion } from "motion/react"
import { MarketingNavbar } from "@/components/marketing-navbar"
import { SiteFooter } from "@/components/site-footer"
import { cn } from "@/lib/utils"

interface PublicPageShellProps {
  children: React.ReactNode
  pageTitle?: string
  pageSubtitle?: string
  badge?: string
  showBanner?: boolean
}

export function PublicPageShell({
  children,
  pageTitle,
  pageSubtitle,
  badge,
  showBanner = true,
}: PublicPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans overflow-x-hidden">
      <MarketingNavbar />

      {showBanner && pageTitle && (
        <div className="relative overflow-hidden border-b border-border bg-prms-navy">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-prms-navy via-prms-navy/95 to-prms-navy/80" />

          <div className="relative z-10 mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 md:py-20">
            {badge && (
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90"
              >
                {badge}
              </motion.span>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl"
            >
              {pageTitle}
            </motion.h1>
            {pageSubtitle && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg"
              >
                {pageSubtitle}
              </motion.p>
            )}
          </div>
        </div>
      )}

      <main className={cn("flex-1", !showBanner || !pageTitle ? "pt-0" : "")}>
        {children}
      </main>

      <SiteFooter />
    </div>
  )
}
