import type { Ref } from 'react'

export interface TerminalPresentationProps {
  ref: Ref<HTMLDivElement>
}

/** No rules, header or label of its own: the page draws them around it. */
export function TerminalPresentation({ ref }: TerminalPresentationProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[var(--soft,#e5e5df)] text-[var(--ink,#141414)]">
      {/* The padding sits on xterm's own element: the fit addon subtracts that, not its parent's. */}
      <div
        ref={ref}
        className="min-h-0 min-w-0 flex-1 [font-family:var(--mono,'IBM_Plex_Mono',ui-monospace,Menlo,monospace)] [&_.xterm]:h-full [&_.xterm]:py-2.5 [&_.xterm]:pl-4"
      />
    </div>
  )
}
