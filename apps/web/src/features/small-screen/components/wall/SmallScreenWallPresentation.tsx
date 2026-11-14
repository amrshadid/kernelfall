import { ManHead, Sheet } from '@shared/components/layout'
import { Wordmark } from '@shared/components/ui'
import './SmallScreenWall.css'

export interface SmallScreenWallPresentationProps {
  /** The narrowest width that plays, e.g. 1024. */
  minWidthPx: number
}

/** Nothing is touched: widening the window brings the game straight back. */
export function SmallScreenWallPresentation({ minWidthPx }: SmallScreenWallPresentationProps) {
  return (
    <div className="small-screen">
      <ManHead left="Kernelfall(2)" center="Service Manual" right="Kernelfall(2)" />
      <Sheet as="main" className="small-screen__sheet" aria-labelledby="small-screen-h">
        <div className="small-screen__mark">
          <Wordmark />
        </div>
        <h1 id="small-screen-h" tabIndex={-1}>
          Kernelfall needs a bigger screen.
        </h1>
        <p>
          Kernelfall is a free, open-source game that teaches Linux kernel development from zero, on a real Linux kernel
          running in your browser.
        </p>
        {/* Search engines read this page at a phone's width: what the game is may be quoted, how wide it must be may not. */}
        <div className="small-screen__needs" data-nosnippet="">
          <p>
            You write C in an editor, run it in a terminal and watch each syscall cross into the Kernel in X-ray, all
            side by side. That needs a window at least {minWidthPx} pixels wide.
          </p>
          <p>Open Kernelfall on a laptop or desktop, or widen this window.</p>
        </div>
        <p className="small-screen__note">Your progress and settings stay saved in this browser.</p>
      </Sheet>
    </div>
  )
}
