import { useMemo } from 'react'
import { CaseCard } from '../components/CaseCard'
import { CaseSection, Page } from '../components/Page'
import { pllCount, pllSections } from '../data'
import { useActiveSection } from '../useActiveSection'
import { useProgress } from '../useProgress'

export function PllPage() {
  const { completed, algChoices, toggleComplete, chooseAlg } = useProgress('pll')
  const sectionIds = useMemo(() => pllSections.map((s) => s.id), [])
  const active = useActiveSection(sectionIds)

  return (
    <Page
      set="PLL"
      sections={pllSections}
      active={active}
      done={completed.size}
      total={pllCount}
      footer="Algorithms follow the standard PLL names. Progress is stored in this browser only."
    >
      {pllSections.map(({ group, id, cases }) => {
        const done = cases.filter((c) => completed.has(c.id)).length
        return (
          <CaseSection key={id} group={group} id={id} done={done} total={cases.length}>
            {cases.map((pllCase) => (
              <CaseCard
                key={pllCase.id}
                id={pllCase.id}
                name={pllCase.name}
                // The perm letter is the label — these cases are known by name,
                // not number — so it carries more weight than the OLL number.
                heading={
                  <span className="font-mono text-base font-semibold tracking-tight">
                    {pllCase.id}
                  </span>
                }
                grid={pllCase.grid}
                arrows={pllCase.arrows}
                setup={pllCase.setup}
                algs={pllCase.algs}
                completed={completed.has(pllCase.id)}
                onToggleComplete={toggleComplete}
                algIndex={algChoices[pllCase.id] ?? 0}
                onChooseAlg={chooseAlg}
              />
            ))}
          </CaseSection>
        )
      })}
    </Page>
  )
}
