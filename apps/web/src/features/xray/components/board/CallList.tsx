import type { CallFoldKind, CallGroupView, CallListView, CallRowView, XrayCall } from '@features/xray/types'
import { returnText } from '@features/xray/utils/call-list'
import { type KeyboardEvent, useEffect, useRef } from 'react'
import './CallList.css'

export interface CallListProps {
  view: CallListView
  selectedId: number | null
  onSelect: (id: number) => void
  onToggle: (key: string) => void
}

const number = (n: number) => n.toLocaleString('en-US')
const calls = (n: number) => `${number(n)} ${n === 1 ? 'call' : 'calls'}`

// "statx × 67" already says how many.
const COUNTED: Readonly<Record<CallFoldKind, boolean>> = {
  'start-up': true,
  bookkeeping: true,
  'path-search': true,
  terminfo: true,
  repeat: false,
  summary: true,
}

function moveFocus(event: KeyboardEvent<HTMLDivElement>): void {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
    return
  }
  const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
  if (current === -1) {
    return
  }
  event.preventDefault()
  const next = event.key === 'ArrowDown' ? current + 1 : current - 1
  buttons[Math.max(0, Math.min(next, buttons.length - 1))]?.focus()
}

function CallLine({
  call,
  focused,
  selected,
  onSelect,
}: {
  call: XrayCall
  focused: boolean
  selected: boolean
  onSelect: (id: number) => void
}) {
  const classes = ['xr-calls__call', focused && 'xr-calls__call--focus'].filter(Boolean).join(' ')
  return (
    <li>
      <button
        type="button"
        className={classes}
        data-call={call.id}
        aria-pressed={selected}
        onClick={() => onSelect(call.id)}
      >
        <span className="xr-calls__text">
          <span className="xr-calls__name">{call.name}</span>
          {call.text.slice(call.name.length)}
        </span>
        <span className="xr-calls__ret">= {returnText(call.outcome)}</span>
        {focused && <span className="kf-visually-hidden"> (what this level teaches)</span>}
      </button>
    </li>
  )
}

function Row({ row, selectedId, onSelect, onToggle }: { row: CallRowView } & Omit<CallListProps, 'view'>) {
  if (row.kind === 'call') {
    return <CallLine call={row.call} focused={row.focused} selected={row.call.id === selectedId} onSelect={onSelect} />
  }
  const classes = ['xr-calls__fold', row.focused && 'xr-calls__fold--focus'].filter(Boolean).join(' ')
  return (
    <li className={classes}>
      <button type="button" className="xr-calls__fold-head" aria-expanded={row.open} onClick={() => onToggle(row.key)}>
        <span className="xr-calls__mark" aria-hidden="true">
          {row.open ? '▾' : '▸'}
        </span>
        <span className="xr-calls__fold-label">{row.label}</span>
        {COUNTED[row.fold] && <span className="xr-calls__count">{calls(row.calls.length)}</span>}
      </button>
      {row.open && (
        <ol className="xr-calls__rows">
          {row.shown.map((call) => (
            <CallLine key={call.id} call={call} focused={false} selected={call.id === selectedId} onSelect={onSelect} />
          ))}
          {row.hidden > 0 && (
            <li className="xr-calls__more">{number(row.hidden)} more in the Sequence (strace) under the drawing</li>
          )}
        </ol>
      )}
    </li>
  )
}

function Group({ group, live, ...rest }: { group: CallGroupView; live: boolean } & Omit<CallListProps, 'view'>) {
  const classes = ['xr-calls__group', group.focused && 'xr-calls__group--focus'].filter(Boolean).join(' ')
  return (
    <li className={classes}>
      <button
        type="button"
        className="xr-calls__head"
        aria-expanded={group.open}
        disabled={live}
        onClick={() => rest.onToggle(group.key)}
      >
        <span className="xr-calls__mark" aria-hidden="true">
          {group.open ? '▾' : '▸'}
        </span>
        <span className="xr-calls__title">{group.title}</span>
        <span className="xr-calls__count">
          {calls(group.count)}
          {live && ' so far'}
        </span>
      </button>
      {group.facts.length > 0 && <p className="xr-calls__facts">{group.facts.join(' · ')}</p>}
      {group.open && (
        <ol className="xr-calls__rows">
          {group.rows.map((row) => (
            <Row key={row.kind === 'call' ? row.call.id : row.key} row={row} {...rest} />
          ))}
        </ol>
      )}
    </li>
  )
}

/** The run's calls by process: the lesson open, the rest folded into counted rows. */
export function CallList({ view, selectedId, onSelect, onToggle }: CallListProps) {
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Optional: test DOMs have no layout to scroll.
    list.current?.querySelector(`[data-call="${selectedId}"]`)?.scrollIntoView?.({ block: 'nearest' })
  }, [selectedId])

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: ↑ ↓ move between the list's own buttons
    <div ref={list} className="xr-calls" onKeyDown={moveFocus}>
      {view.live && <p className="xr-calls__live">Still running: the counts grow; every call shows once it ends.</p>}
      <ol className="xr-calls__groups" aria-label="Calls, by process">
        {view.groups.map((group) => (
          <Group
            key={group.key}
            group={group}
            live={view.live}
            selectedId={selectedId}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
      </ol>
    </div>
  )
}
