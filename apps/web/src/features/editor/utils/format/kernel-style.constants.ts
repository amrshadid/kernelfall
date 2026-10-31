/** A copy of the repo's `.clang-format`, which the browser can't read; a test keeps them in sync. */
export const KERNEL_CLANG_FORMAT_STYLE = `BasedOnStyle: LLVM
UseTab: Always
IndentWidth: 8
TabWidth: 8
ContinuationIndentWidth: 8
ColumnLimit: 80
BreakBeforeBraces: Custom
BraceWrapping:
  AfterClass: false
  AfterControlStatement: Never
  AfterEnum: false
  AfterFunction: true
  AfterNamespace: true
  AfterStruct: false
  AfterUnion: false
  AfterExternBlock: false
  BeforeCatch: false
  BeforeElse: false
  IndentBraces: false
  SplitEmptyFunction: true
  SplitEmptyRecord: true
AllowShortBlocksOnASingleLine: Never
AllowShortCaseLabelsOnASingleLine: false
AllowShortFunctionsOnASingleLine: None
AllowShortIfStatementsOnASingleLine: Never
AllowShortLoopsOnASingleLine: false
AlignAfterOpenBracket: Align
AlignConsecutiveMacros: None
AlignEscapedNewlines: Left
AlignOperands: Align
AlignTrailingComments: false
AlwaysBreakBeforeMultilineStrings: false
BreakBeforeBinaryOperators: None
BreakBeforeTernaryOperators: false
BreakStringLiterals: false
IndentCaseLabels: false
IndentGotoLabels: false
InsertBraces: false
KeepEmptyLinesAtTheStartOfBlocks: false
MaxEmptyLinesToKeep: 1
PointerAlignment: Right
ReflowComments: Never
SortIncludes:
  Enabled: false
SpaceAfterCStyleCast: false
SpaceBeforeParens: ControlStatementsExceptControlMacros
SpacesInContainerLiterals: false
ForEachMacros:
  - list_for_each
  - list_for_each_entry
  - list_for_each_entry_safe
  - hlist_for_each_entry
`
