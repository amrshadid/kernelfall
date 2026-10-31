// CSI sequences (ESC [ … final byte): BusyBox ls colours names on a terminal, as GNU ls --color=auto does.
const ESCAPE_SEQUENCE = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;?]*[A-Za-z]`, 'g')

/** What a program printed, without the colour and cursor codes a terminal reads but never shows. */
export const plainText = (text: string): string => text.replace(ESCAPE_SEQUENCE, '')
