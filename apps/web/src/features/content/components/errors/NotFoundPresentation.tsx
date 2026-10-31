import { ManHead, Sheet } from '@shared/components/layout'
import { ButtonLink } from '@shared/components/ui'
import './NotFound.css'

export interface NotFoundPresentationProps {
  titleHref: string
}

export function NotFoundPresentation({ titleHref }: NotFoundPresentationProps) {
  return (
    <div className="not-found">
      <ManHead left="Kernelfall(2)" center="Kernelfall Service Manual" right="Kernelfall(2)" />
      <Sheet as="main" aria-labelledby="not-found-h" className="not-found__sheet">
        <h1 id="not-found-h" tabIndex={-1}>
          No such page: <code>ENOENT</code>
        </h1>
        <p>This address isn't part of the manual.</p>
        <ButtonLink variant="primary" href={titleHref}>
          Back to the title
        </ButtonLink>
      </Sheet>
    </div>
  )
}
