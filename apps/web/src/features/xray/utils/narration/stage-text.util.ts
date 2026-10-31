import type { PredictChoices, StagePredict, StageText, StageTextOptions } from '@features/xray/types'
import type { TemplateValues, XrayPredictText, XrayStageText } from '@kernelfall/levels/types'
import { fillTemplate } from '@kernelfall/levels/utils'

function predictOf(
  text: XrayPredictText,
  values: TemplateValues,
  choices: PredictChoices | 'content'
): StagePredict | undefined {
  const fill = (template: string) => fillTemplate(template, values)
  const options = choices === 'content' ? (text.options ?? []).map(fill) : choices.options
  const answer = choices === 'content' ? fill(text.answer ?? '') : choices.answer
  if (options.length === 0 || answer === '') {
    return undefined
  }
  // Two options can fill to the same value (a status of 0 and the literal 0).
  return { question: fill(text.question), options: [...new Set(options)], answer, explain: fill(text.explain) }
}

export function stageText(text: XrayStageText, values: TemplateValues, options: StageTextOptions = {}): StageText {
  const fill = (template: string) => fillTemplate(template, values)
  const sources = text.sources?.map((source) => ({
    path: fill(source.path),
    ...(source.fn !== undefined && { fn: fill(source.fn) }),
  }))
  const choices = options.predict ?? null
  const predict = text.predict && choices !== null ? predictOf(text.predict, values, choices) : undefined
  return {
    tick: fill(text.tick),
    title: fill(text.title),
    what: fill(text.what),
    why: fill(text.why),
    deeper: fill(text.deeper),
    ...(text.gate !== undefined && options.gate !== false && { gate: fill(text.gate) }),
    ...(text.simplified !== undefined && { simplified: fill(text.simplified) }),
    sources: sources ?? options.sources ?? [],
    ...(predict && { predict }),
  }
}
