import { useMemo } from 'react'
import { CaseCard } from '../components/CaseCard'
import { CaseSection, Page } from '../components/Page'
import { ollCount, ollSections } from '../data'
import { useActiveSection } from '../useActiveSection'
import { useProgress } from '../useProgress'

export function OllPage() {
  const { completed, algChoices, toggleComplete, chooseAlg } = useProgress('oll')
  const sectionIds = useMemo(() => ollSections.map((s) => s.id), [])
  const active = useActiveSection(sectionIds)

  return (
    <Page
      set="OLL"
      sections={ollSections}
      active={active}
      done={completed.size}
      total={ollCount}
      footer="Algorithms follow the standard OLL numbering. Progress is stored in this browser only."
    >
      {ollSections.map(({ group, id, cases }) => {
        const done = cases.filter((c) => completed.has(String(c.id))).length
        return (
          <CaseSection key={id} group={group} id={id} done={done} total={cases.length}>
            {cases.map((ollCase) => {
              const key = String(ollCase.id)
              return (
                <CaseCard
                  key={key}
                  id={key}
                  name={`OLL ${ollCase.id}`}
                  heading={
                    <span className="text-sm font-semibold tracking-tight">OLL {ollCase.id}</span>
                  }
                  grid={ollCase.sticker}
                  setup={ollCase.setup}
                  algs={ollCase.algs}
                  completed={completed.has(key)}
                  onToggleComplete={toggleComplete}
                  algIndex={algChoices[key] ?? 0}
                  onChooseAlg={chooseAlg}
                />
              )
            })}
          </CaseSection>
        )
      })}
    </Page>
  )
}
