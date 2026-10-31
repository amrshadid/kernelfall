import { ManHead, Sheet } from '@shared/components/layout'
import './ContentError.css'

export interface ContentErrorPresentationProps {
  errors: readonly string[]
}

export function ContentErrorPresentation({ errors }: ContentErrorPresentationProps) {
  return (
    <div className="content-error">
      <ManHead left="Kernelfall(2)" center="Errata" right="Kernelfall(2)" />
      <Sheet as="main" className="content-error__sheet" aria-labelledby="content-error-title">
        <h1 id="content-error-title" className="kf-display content-error__title">
          The level content has errors.
        </h1>
        <p>
          The game won't start with content that fails its checks, because a broken level could teach something wrong.
          Fix these in <code>levels/</code> and reload:
        </p>
        <ol className="content-error__list">
          {errors.map((error) => (
            <li key={error}>
              <code>{error}</code>
            </li>
          ))}
        </ol>
      </Sheet>
    </div>
  )
}
