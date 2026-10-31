import type { SkillId } from '#types/definitions/level'

/** A node of the Kernel Map: one concrete skill, e.g. "can expose a value through sysfs". */
export interface SkillNode {
  readonly id: SkillId
  readonly title: string
  readonly region: string
  readonly prerequisites: readonly SkillId[]
}

/** `available`: not unlocked yet, but every prerequisite is. */
export type SkillStatus = 'unlocked' | 'available' | 'locked'
