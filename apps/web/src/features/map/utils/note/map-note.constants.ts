/** How a stop's state reads in the note; done states add their Taint. */
export const NOTE_STATES = {
  next: 'Next up',
  available: 'Available',
  progress: 'In progress',
  planned: 'Not built yet',
  done: 'Done',
  helped: "Done with init's version",
  lockedUnknown: "Locked: it needs skills you don't have yet",
} as const

export const NOTE_TAGS = { boss: 'Boss', side: 'Side level' } as const
