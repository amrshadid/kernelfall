import type { FieldGuideSection } from '@features/codex/types'
import './FieldGuideTable.css'

export interface FieldGuideTableProps {
  sections: readonly FieldGuideSection[]
}

/** The commands and folders met so far: what each is, what it asks the kernel, and where it's taught. */
export function FieldGuideTable({ sections }: FieldGuideTableProps) {
  return (
    <div className="field-guide">
      <p className="field-guide__lead">
        Every command and folder you have met, with the syscalls it makes. A syscall with a card links to it.
      </p>
      {sections.map((section) => (
        <table key={section.title} className="field-guide__table">
          <caption>{section.title}</caption>
          <thead>
            <tr>
              <th scope="col">Entry</th>
              <th scope="col">What it is</th>
              <th scope="col">Syscalls</th>
              <th scope="col">First met</th>
              <th scope="col">Built or deepened in</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row.name}>
                <th scope="row">
                  <code>{row.name}</code>
                </th>
                <td>{row.what}</td>
                <td>
                  {row.syscalls.length === 0 ? (
                    <span className="field-guide__none">none</span>
                  ) : (
                    <ul className="field-guide__calls">
                      {row.syscalls.map((call) => (
                        <li key={call.text}>
                          {call.href ? (
                            <a href={call.href}>
                              <code>{call.text}</code>
                            </a>
                          ) : (
                            <code>{call.text}</code>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {row.syscallNote && <p className="field-guide__note">{row.syscallNote}</p>}
                </td>
                <td>{row.firstMet}</td>
                <td>{row.deepenedIn.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  )
}
