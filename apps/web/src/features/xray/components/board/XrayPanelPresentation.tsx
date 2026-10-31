import { useEffect, useRef } from 'react'
import { XrayBoard, type XrayBoardProps } from './XrayBoard'

export type XrayPanelPresentationProps = Omit<XrayBoardProps, 'layout'>

/** The dock and the full-size sheet share one state, so closing the sheet leaves the dock where it was. */
export function XrayPanelPresentation(props: XrayPanelPresentationProps) {
  const sheet = useRef<HTMLDialogElement>(null)
  const { expanded } = props.controls
  const { setExpanded } = props.controlActions

  useEffect(() => {
    const dialog = sheet.current
    if (!dialog) {
      return
    }
    if (expanded && !dialog.open) {
      dialog.showModal()
    } else if (!expanded && dialog.open) {
      dialog.close()
    }
  }, [expanded])

  return (
    <section aria-label="X-ray" className="flex flex-col">
      <XrayBoard layout="dock" {...props} />
      <dialog
        ref={sheet}
        className="xr-sheet"
        aria-label="X-ray, full size"
        onCancel={(event) => {
          // Esc closes through state, so `expanded` stays the one source of truth.
          event.preventDefault()
          setExpanded(false)
        }}
      >
        {expanded && <XrayBoard layout="sheet" {...props} />}
      </dialog>
    </section>
  )
}
