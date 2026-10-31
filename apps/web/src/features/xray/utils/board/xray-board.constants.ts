export const NO_RUN =
  'Nothing has run yet. Type a command in the terminal, like `echo hello`, and X-ray draws every syscall it makes on its way through the Gate.'

export const BOOT_PENDING =
  'The Machine is still starting. Its boot is drawn here once Linux is up and has read back its own kernel log (`dmesg`).'

/** Where the player is outside any level: X-ray's memory is still kept apart from the levels'. */
export const FREE_PLAY = 'free'

/** The autoplay key's step outside a level step. */
export const ANY_STEP = 'any'

/** One process figure is explained once for every kind of fork. */
export const PROCESS_KIND = 'fork'
