"use client"

import { HEADER_H, type HeaderCell } from "@/lib/gantt/layout"
import { differenceInDays, startOfDay } from "date-fns"

const CELL_H = HEADER_H / 2
const BORDER = "hsl(var(--border))"
const TODAY_COLOR = "hsl(221 83% 53%)"

interface GanttHeaderProps {
  level1: HeaderCell[]
  level2: HeaderCell[]
  totalW: number
  timelineStart: Date
  pxPerDay: number
}

export function GanttHeader({ level1, level2, totalW, timelineStart, pxPerDay }: GanttHeaderProps) {
  const todayX = differenceInDays(startOfDay(new Date()), startOfDay(timelineStart)) * pxPerDay
  const showToday = todayX >= 0 && todayX <= totalW

  return (
    <svg width={totalW} height={HEADER_H} className="block">
      <rect x={0} y={0} width={totalW} height={HEADER_H} fill="hsl(var(--card))" />

      {/* Level 1 */}
      {level1.map((cell) => (
        <g key={cell.key}>
          <line x1={cell.x} y1={0} x2={cell.x} y2={CELL_H} stroke={BORDER} strokeWidth={1} />
          <text
            x={cell.x + 6} y={CELL_H / 2 + 4}
            fontSize={10} fontWeight={600}
            fill="currentColor" opacity={0.45}
          >
            {cell.label}
          </text>
        </g>
      ))}

      {/* Separator between levels */}
      <line x1={0} y1={CELL_H} x2={totalW} y2={CELL_H} stroke={BORDER} strokeWidth={0.5} opacity={0.4} />

      {/* Level 2 */}
      {level2.map((cell) => (
        <g key={cell.key}>
          <line x1={cell.x} y1={CELL_H} x2={cell.x} y2={HEADER_H} stroke={BORDER} strokeWidth={0.5} opacity={0.4} />
          {cell.width >= 14 && (
            <text
              x={cell.x + cell.width / 2} y={HEADER_H - 7}
              fontSize={10} textAnchor="middle"
              fill="currentColor" opacity={0.6}
            >
              {cell.label}
            </text>
          )}
        </g>
      ))}

      {/* Today marker in header */}
      {showToday && (
        <>
          <line x1={todayX} y1={0} x2={todayX} y2={HEADER_H} stroke={TODAY_COLOR} strokeWidth={1.5} opacity={0.7} />
          <rect
            x={todayX - 14} y={CELL_H + 2}
            width={28} height={CELL_H - 4}
            rx={3} fill={TODAY_COLOR} opacity={0.15}
          />
          <text
            x={todayX} y={HEADER_H - 7}
            fontSize={9} fontWeight={700} textAnchor="middle"
            fill={TODAY_COLOR}
          >
            Hoy
          </text>
        </>
      )}

      {/* Bottom border */}
      <line x1={0} y1={HEADER_H - 0.5} x2={totalW} y2={HEADER_H - 0.5} stroke={BORDER} strokeWidth={1} />
    </svg>
  )
}
