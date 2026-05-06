import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingGantt() {
  return (
    <div className="flex h-[calc(100vh-64px)] flex-col gap-0">
      <div className="flex h-11 items-center gap-3 border-b px-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-28" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r">
          <div className="flex h-[52px] items-center border-b px-4">
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="space-y-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex h-9 items-center gap-2 border-b px-4">
                <Skeleton className="h-3 w-3 rounded-sm" />
                <Skeleton className="h-3 flex-1" style={{ width: `${60 + (i % 5) * 20}px` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  )
}
