// So levels validates its own content with the same toolkit game's validators use.
export type { NonEmptyList, StringRule, Validated } from '@kernelfall/core/types'
export type { Achievement, AchievementContext } from '#types/definitions/achievements'
export type {
  BuildHistory,
  CheckInput,
  CheckReport,
  CheckVerdict,
  CompilerWarning,
  LevelChecker,
  LevelCheckers,
} from '#types/definitions/checker'
export type {
  ArgsMatch,
  ObjectiveCheck,
  ObjectiveCheckKind,
  ProgramScope,
  TaintCheck,
  TaintCheckKind,
  TextMatch,
} from '#types/definitions/checks'
export {
  ABSOLUTE_PATH_PATTERN,
  MAX_EXIT_STATUS,
  OBJECTIVE_CHECK_KINDS,
  PROGRAM_NAME_PATTERN,
  SYSCALL_NAME_PATTERN,
  TAINT_CHECK_KINDS,
} from '#types/definitions/checks'
export type { CodexCardState, CodexChapter, CodexChapterCard, CodexEntry } from '#types/definitions/codex'
export type { GameConfig, GameOptions, GameTuning } from '#types/definitions/config'
export { DEFAULT_GAME_OPTIONS, DEFAULT_GAME_TUNING } from '#types/definitions/config'
export type { GameContent, GameContentParts } from '#types/definitions/content'
export type { FieldGuide, FieldGuideEntry, FieldGuideKind, FieldGuideView } from '#types/definitions/field-guide'
export { FIELD_GUIDE_KINDS } from '#types/definitions/field-guide'
export type { HintTier, RevealedHint } from '#types/definitions/hints'
export { HINT_COSTS, HINT_OFFER_AFTER_ATTEMPTS, HINT_TIERS, LEVEL_BASE_SCORE } from '#types/definitions/hints'
export type {
  Act,
  CodexCard,
  CommandChip,
  Fidelity,
  LevelDefinition,
  LevelHints,
  LevelId,
  LevelLocation,
  Objective,
  SkillId,
  StoryRefs,
  TaintRule,
  Track,
  XrayView,
} from '#types/definitions/level'
export {
  ACTS,
  DOCS_URL_PATTERN,
  KERNEL_PATH_PATTERN,
  LEVEL_NUMBER_AND_SLUG_PATTERN,
  SLUG_PATTERN,
  STORY_REF_PATTERN,
  TRACKS,
  XRAY_VIEWS,
} from '#types/definitions/level'
export type { KernelMap, KernelMapLevel } from '#types/definitions/map'
export type {
  ActFile,
  ActOutline,
  MapLayerText,
  RegionFile,
  RegionOutline,
  SlotFile,
  SlotOutline,
} from '#types/definitions/outline'
export type {
  PlacementCheck,
  PlacementFile,
  PlacementOffer,
  PlacementProgress,
  PlacementResult,
  PlacementTask,
  PlacementTaskFile,
} from '#types/definitions/placement'
export type {
  EpochMs,
  LastActive,
  LevelProgress,
  LevelResult,
  LevelStatus,
  Progress,
  RunStep,
  UnlockedAchievement,
} from '#types/definitions/progress'
export type {
  ChildRun,
  FailedCall,
  FileRead,
  ForkedChild,
  OpenedFile,
  ProcessExit,
  SyscallRecord,
} from '#types/definitions/queries'
export type {
  CompletionVia,
  LevelOutcome,
  LevelPhase,
  LevelRunEvent,
  LevelRunEventType,
  LevelRunState,
  OopsReport,
  RunCheckpoint,
} from '#types/definitions/runner'
export { COMPLETION_VIAS, LEVEL_PHASES } from '#types/definitions/runner'
export type {
  LoadedSave,
  SaveFile,
  SaveIssue,
  SaveMigration,
  SaveOutcome,
  SaveSchema,
  SaveSlot,
} from '#types/definitions/saves'
export {
  DEFAULT_SAVE_SLOT,
  NEXT_SUFFIX,
  PREV_SUFFIX,
  SAVE_FORMAT,
  SAVE_ISSUES,
  SAVE_VERSION,
} from '#types/definitions/saves'
export type {
  ActiveLevelStep,
  ActiveLevelStepInput,
  DispatchResult,
  RunStepEmission,
  RunStepEmissionsInput,
  WallClock,
} from '#types/definitions/session'
export { ACTIVE_TIME_IDLE_CAP_MS } from '#types/definitions/session'
export type { SkillNode, SkillStatus } from '#types/definitions/skills'
export type { ActiveLevel, GameStatus } from '#types/definitions/store'
export { GAME_STATUS } from '#types/definitions/store'
export type { ActSummary, CompletionStats, ProgressSummary } from '#types/definitions/summary'
export type {
  Ending,
  TaintEntry,
  TaintEvent,
  TaintFinding,
  TaintKind,
  TaintLedger,
} from '#types/definitions/taint'
export {
  CLEAN_REBOOT_MAX_TAINT,
  ENDING_ACTS,
  ENDINGS,
  MAX_LEVEL_TAINT,
  TAINT_KINDS,
  UNSTABLE_REBOOT_MAX_TAINT,
} from '#types/definitions/taint'
