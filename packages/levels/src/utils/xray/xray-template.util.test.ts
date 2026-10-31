import { describe, expect, it } from 'vitest'
import { fillTemplate, unfilledPlaceholders } from '#utils/xray/xray-template.util'

describe('fillTemplate', () => {
  it('fills every placeholder, numbers included', () => {
    expect(fillTemplate('Number {nr}? That is {name}.', { nr: 1, name: 'write' })).toBe('Number 1? That is write.')
  })

  it('never fills a value a second time', () => {
    expect(fillTemplate('prints `{printed}`', { printed: '{name}', name: 'x' })).toBe('prints `{name}`')
  })

  it('leaves a placeholder without a value as written', () => {
    expect(fillTemplate('{a} and {b}', { a: 'one' })).toBe('one and {b}')
  })

  it('ignores braces that are not placeholders, like C code', () => {
    expect(fillTemplate('int main(void) { return 0; }', {})).toBe('int main(void) { return 0; }')
  })
})

describe('unfilledPlaceholders', () => {
  it('lists what is still to fill', () => {
    expect(unfilledPlaceholders('{a} and {b}')).toEqual(['a', 'b'])
    expect(unfilledPlaceholders('done')).toEqual([])
  })
})
