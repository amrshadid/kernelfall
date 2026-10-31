import type { MachineLock } from '@shared/types'
import './MachineLockPlate.css'

export interface MachineLockPlateProps {
  lock: MachineLock
}

/** A notice plate over the console: the boot log stays readable through it, keys don't pass. */
export function MachineLockPlate({ lock }: MachineLockPlateProps) {
  const steps = ['Load', lock.phase === 'restoring' ? 'Restore' : 'Boot', 'Shell']
  const current = lock.phase === 'booting' || lock.phase === 'restoring' ? 1 : 0
  return (
    <div className="kf-machine-lock">
      <div
        className={`kf-machine-lock__plate${lock.failed ? ' kf-machine-lock__plate--failed' : ''}`}
        role={lock.failed ? 'alert' : 'status'}
      >
        <p className="kf-machine-lock__label">
          {lock.failed ? 'Fault: the terminal is closed' : 'Stand by: the terminal opens when Linux is up'}
        </p>
        <p className="kf-machine-lock__title">{lock.title}</p>
        {lock.detail !== null && <p className="kf-machine-lock__detail">{lock.detail}</p>}
        {!lock.failed && (
          <ol className="kf-machine-lock__steps" aria-hidden="true">
            {steps.map((step, index) => (
              <li key={step} className={index < current ? 'is-done' : index === current ? 'is-current' : undefined}>
                {step}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
