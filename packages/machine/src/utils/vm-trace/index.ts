export { syscallName, syscallNumber } from '#utils/vm-trace/syscall-name.util'
export {
  argvOf,
  type CapturedData,
  chunkBytes,
  fieldNumber,
  joinChunks,
  joinIovecs,
  type ProbeName,
  parseProbeName,
  pathData,
  wordsToBytes,
} from '#utils/vm-trace/trace-data.util'
export { parseTraceLine, signed32, traceFields } from '#utils/vm-trace/trace-line.util'
