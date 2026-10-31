// Paths and buffers are bytes to the kernel, not text: one character per byte keeps any byte sequence intact.
export function byteString(bytes: Uint8Array): string {
  let text = ''
  for (const byte of bytes) {
    text += String.fromCharCode(byte)
  }
  return text
}
