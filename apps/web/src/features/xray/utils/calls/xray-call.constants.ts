/** Byte cells the drawing has room for. */
export const MAX_BUFFER_CELLS = 12

/** The i386 registers that carry syscall arguments, in order (arch/x86/entry/entry_32.S). */
export const ARG_REGISTERS = ['ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp'] as const

/** Where the 32-bit entry saves each of them in struct pt_regs (arch/x86/include/asm/ptrace.h). */
export const PT_REGS_FIELDS = ['bx', 'cx', 'dx', 'si', 'di', 'bp'] as const
