// So levels validates its own content with the same toolkit game's validators use.
export { describeType, Issues, isRecord, joinPath, ObjectReader, reportDuplicates } from '@kernelfall/core/utils'
export { ACHIEVEMENTS, newlyEarned, unlockAchievements } from '#utils/achievements/index'
export {
  defineChecker,
  evaluateCheck,
  findTaint,
  levelChecker,
  matchesText,
  meetsObjectiveCheck,
  mergeVerdicts,
  priceTaint,
} from '#utils/checker/index'
export { codexChapters, collectCodex } from '#utils/codex/index'
export { createGameContent } from '#utils/content/index'
export { fieldGuideView } from '#utils/field-guide/index'
export {
  hintPenalty,
  isHintOffered,
  nextHintTier,
  revealedHintTiers,
  scoreWithHints,
} from '#utils/hints/index'
export { kernelMap } from '#utils/map/index'
export { judgePlacement, mergePlacement, placementOfferAt, placementResult } from '#utils/placement/index'
export {
  addActiveTime,
  applyRunStep,
  betterResult,
  completedLevelIds,
  continueTarget,
  emptyProgress,
  findLevelProgress,
  levelStatus,
  levelStatusById,
  placeLevels,
  progressSkills,
  setLabSnapshot,
  setLevelCode,
  startLevel,
} from '#utils/progress/index'
export {
  argvOf,
  argvOfCall,
  asText,
  basename,
  type CompileReport,
  callsOf,
  childrenOf,
  compileReport,
  consoleBetween,
  eventsBetween,
  eventsOf,
  execsOf,
  exitedWith,
  exitOf,
  failedCalls,
  filesOpened,
  forkedChildren,
  isWholeWrite,
  judgedProcesses,
  playerPrograms,
  programsNamed,
  ranProgram,
  readsOf,
  reapedBy,
  writesTo,
  writtenTo,
} from '#utils/queries/index'
export {
  activeTimeSince,
  allowedEvents,
  canTransition,
  checkpointOf,
  createLevelRun,
  resumeLevelRun,
  runStepEmissions,
  stepActiveLevel,
  transition,
} from '#utils/runner/index'
export { exportSave, importSave, parseJson, readSaveFile, toSaveFile } from '#utils/saves/index'
export {
  isLevelPlayable,
  skillStatuses,
  unlockedSkills,
  validateSkillTree,
} from '#utils/skills/index'
export { summarizeProgress } from '#utils/summary/index'
export { levelTaint, replaceLevelTaint, selectEnding, totalTaint } from '#utils/taint/index'
export {
  validateAct,
  validateFieldGuide,
  validateLevel,
  validateMapLayer,
  validatePlacement,
  validateRegion,
  validateSkills,
} from '#utils/validate/index'
