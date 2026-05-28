'use client'

import { useState, useEffect } from 'react'
import { getCountdown } from '@/lib/utils'
import { MUNDIAL_START_DATE } from '@/types'

export default function Countdown() {
  const [mounted, setMounted] = useState(false)
  const [cd, setCd] = useState({ started: false, days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    setCd(getCountdown(MUNDIAL_START_DATE))
    setMounted(true)

    const interval = setInterval(() => {
      setCd(getCountdown(MUNDIAL_START_DATE))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    // Render a consistent skeleton placeholder during SSR and initial client paint to prevent hydration mismatch!
    const placeholderUnits = [
      { label: 'Días' },
      { label: 'Horas' },
      { label: 'Min' },
      { label: 'Seg' },
    ]
    return (
      <div className="flex items-center justify-center gap-3 sm:gap-4 opacity-50">
        {placeholderUnits.map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-3 sm:gap-4">
            <div className="relative glass-card px-4 py-3 sm:px-5 sm:py-4 min-w-[72px] sm:min-w-[84px] text-center overflow-hidden">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white leading-none">
                00
              </div>
              <div className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mt-1">
                {unit.label}
              </div>
            </div>
            {i < placeholderUnits.length - 1 && (
              <span className="text-white/20 text-2xl font-bold -mx-1">:</span>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (cd.started) {
    return (
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          ¡El Mundial ya comenzó!
        </span>
      </div>
    )
  }

  const units = [
    { value: cd.days,    label: 'Días' },
    { value: cd.hours,   label: 'Horas' },
    { value: cd.minutes, label: 'Min' },
    { value: cd.seconds, label: 'Seg' },
  ]

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-3 sm:gap-4">
          <div className="relative glass-card px-4 py-3 sm:px-5 sm:py-4 min-w-[72px] sm:min-w-[84px] text-center overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-celeste/40 to-transparent" />
            <div
              key={unit.value}
              className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white leading-none"
            >
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mt-1">
              {unit.label}
            </div>
          </div>
          {i < units.length - 1 && (
            <span className="text-white/20 text-2xl font-bold -mx-1">:</span>
          )}
        </div>
      ))}
    </div>
  )
}

