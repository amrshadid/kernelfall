import type { ButtonSize, ButtonVariant } from '@shared/types'

/** The kit's button classes, shared by `Button` and `ButtonLink` so a link looks exactly like a button. */
export function buttonClass(variant: ButtonVariant, size: ButtonSize, extra: string | undefined): string {
  return ['kf-btn', `kf-btn--${variant}`, `kf-btn--${size}`, extra].filter(Boolean).join(' ')
}
