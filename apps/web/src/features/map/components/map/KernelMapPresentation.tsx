import type { MapDetail, MapView } from '@features/map/types'
import { ManHead, ScreenFrame } from '@shared/components/layout'
import { ButtonLink, Icon, Segmented } from '@shared/components/ui'
import type { ScreenChrome } from '@shared/types'
import './KernelMap.css'
import { MapDetailPanel } from './MapDetailPanel'
import { MapSection, type MapSectionProps } from './MapSection'

export interface KernelMapPresentationProps {
  chrome: ScreenChrome
  titleHref: string
  view: MapView
  onView: (view: MapView) => void
  recommended: { readonly label: string; readonly href: string } | null
  section: MapSectionProps
  detail: MapDetail
  /** "Prologue: 1 of 1 built levels rebuilt · Taint 0". */
  summary: string
  version: string
}

/** The Kernel Map: the Machine in section, top to bottom, with a detail panel for the selected stop. */
export function KernelMapPresentation({
  chrome,
  titleHref,
  view,
  onView,
  recommended,
  section,
  detail,
  summary,
  version,
}: KernelMapPresentationProps) {
  return (
    <ScreenFrame
      page="Kernel-map(7)"
      volume="Kernelfall Service Manual · General drawing of the Machine"
      chrome={chrome}
      topbar={
        <nav className="screen__topbar map-topbar" aria-label="Kernel Map">
          <ButtonLink href={titleHref} variant="quiet">
            <Icon name="back" />
            Title
          </ButtonLink>
          <h1 tabIndex={-1} className="map-topbar__title">
            Kernel Map
          </h1>
          <Segmented
            legend="Show"
            options={[
              { value: 'levels', label: 'Levels' },
              { value: 'skills', label: 'Skills' },
            ]}
            value={view}
            onChange={onView}
          />
          {recommended && (
            <p className="map-topbar__next">
              Recommended next: <b title={recommended.label}>{recommended.label}</b>
              <ButtonLink variant="primary" href={recommended.href}>
                Continue
              </ButtonLink>
            </p>
          )}
        </nav>
      }
      foot={<ManHead kind="foot" left={summary} center={version} right="Shortcuts: ?" />}
    >
      <main className="map-board screen__sheet kf-sheet">
        <figure className="map-board__drawing">
          <MapSection {...section} />
          <figcaption>
            Fig. 2. The Machine in section, surface to hardware. Arrow keys walk the road, Page Up and Page Down change
            layer, Enter plays.
          </figcaption>
        </figure>
        <MapDetailPanel detail={detail} />
      </main>
    </ScreenFrame>
  )
}
