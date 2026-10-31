import type { LabEvent, LabEventOf, LabEventType } from '@kernelfall/machine/events'
import { byteString } from '@kernelfall/machine/utils'

/** Bytes as the one-character-per-byte text a checker compares against; nothing gives ''. */
export const asText = (bytes: Uint8Array | undefined): string => (bytes ? byteString(bytes) : '')

/** `/bin/ls` → `ls`. */
export const basename = (path: string): string => path.slice(path.lastIndexOf('/') + 1)

/** The events of one type, in order. */
export const eventsOf = <T extends LabEventType>(events: readonly LabEvent[], type: T): LabEventOf<T>[] =>
  events.filter((event): event is LabEventOf<T> => event.type === type)

/**
 * The events strictly between two others, by `seq`. `seq` orders the whole
 * session, so "did A happen before B" is a comparison of their `seq`s.
 */
export const eventsBetween = (events: readonly LabEvent[], fromSeq: number, toSeq: number): LabEvent[] =>
  events.filter((event) => event.seq > fromSeq && event.seq < toSeq)
