"use client"

import { useWorkspaceStore } from "../store"
import { ScrollText, Trash2 } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export function ActivityLog() {
  const logs = useWorkspaceStore((state) => state.logs)
  const clearLogs = useWorkspaceStore((state) => state.clearLogs)

  return (
    <div className="bg-card border rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <ScrollText className="size-4" />
          系统动态
        </div>
        <button 
          onClick={clearLogs}
          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
        >
          <Trash2 className="size-3" />
          重置
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10 italic">暂无流转记录</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3 text-sm animate-in slide-in-from-top-1 duration-300">
              <span className="text-muted-foreground tabular-nums shrink-0 mt-0.5">[{log.time}]</span>
              <span className={cn(
                "font-medium",
                log.type === 'success' && "text-green-600",
                log.type === 'warning' && "text-orange-600",
                log.type === 'info' && "text-foreground"
              )}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
