import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  MODEL_KEYS,
  lexiconSizes,
  otherPolicy,
  scoredProspects,
  segContract,
  segCuts,
  segCutsBasis,
  segMethod,
  segModels,
  segProof,
  segmentMix,
  segmentsOf,
  undetectable,
  type ModelKey,
  type ScoredProspect,
} from '../data/segmentation'
import './segmentation.css'

/* ── local icons, so this screen has no dependency on App.tsx internals ── */
const LayersIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M8 1.8 1.8 5 8 8.2 14.2 5 8 1.8Z" strokeLinejoin="round" />
    <path d="M1.8 8.4 8 11.6l6.2-3.2M1.8 11.6 8 14.8l6.2-3.2" strokeLinecap="round" />
  </svg>
)
const GridIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
)
const CogIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="8" cy="8" r="2.4" />
    <path d="M8 1.4v1.8M8 12.8v1.8M14.6 8h-1.8M3.2 8H1.4M12.7 3.3l-1.3 1.3M4.6 11.4l-1.3 1.3M12.7 12.7l-1.3-1.3M4.6 4.6 3.3 3.3" strokeLinecap="round" />
  </svg>
)
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M3 8.4 6.4 12 13 4.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const InfoIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="8" cy="8" r="6.3" />
    <path d="M8 7.2v4M8 4.9v.1" strokeLinecap="round" />
  </svg>
)

function Tip({ text }: { text: string }) {
  return (
    <span className="help-tip tt" data-tip={text} tabIndex={0} role="img" aria-label={text}>
      <InfoIcon />
    </span>
  )
}

function Card({
  icon,
  title,
  tip,
  children,
}: {
  icon: ReactNode
  title: string
  tip?: string
  children: ReactNode
}) {
  return (
    <section className="card analytics-card">
      <header className="card-head">
        <div className="card-title">
          {icon}
          <span>{title}</span>
        </div>
        {tip && <Tip text={tip} />}
      </header>
      <div className="analytics-body">{children}</div>
    </section>
  )
}

function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="seg-disclosure">
      <summary>{label}</summary>
      <div className="seg-disclosure-body">{children}</div>
    </details>
  )
}

/* ── segment mix: the "are we reaching the right audience" view ── */
function SegmentMix({ model, onPick }: { model: ModelKey; onPick: (s: string) => void }) {
  const mix = useMemo(() => segmentMix(model), [model])
  const total = scoredProspects.length
  const max = Math.max(1, ...mix.map((m) => m.holders.length))
  const empty = mix.filter((m) => !m.holders.length).map((m) => m.seg.name)

  return (
    <>
      <div className="seg-list">
        {[...mix]
          .sort((a, b) => b.holders.length - a.holders.length)
          .map(({ seg, holders }) => (
            <div className="seg-row" key={seg.name}>
              <div className="seg-row-top">
                <button className="seg-name" type="button" onClick={() => onPick(seg.name)}>
                  {seg.name}
                </button>
                <span className="analytics-lbl">
                  {holders.length} of {total} · {Math.round((holders.length / total) * 100)}%
                </span>
              </div>
              <div className={`seg-bar ${holders.length ? '' : 'is-empty'}`}>
                <i style={{ width: `${(holders.length / max) * 100}%` }} />
              </div>
              <div className="seg-blurb">{seg.blurb}</div>
              <div className="seg-hook">&ldquo;{seg.hook}&rdquo;</div>
            </div>
          ))}
      </div>
      <div className="seg-note">
        {empty.length ? (
          <>
            <b>Nobody in: {empty.join(', ')}.</b> On a real book these are the audiences your
            marketing is not reaching — which is the point of the view. With n={total} from four
            households, treat them as a sample-size artefact for now.
          </>
        ) : (
          <>Every segment is represented in this sample.</>
        )}
      </div>
    </>
  )
}

/* ── Vision × Readiness quadrants ── */
function Quadrants({ onPick }: { onPick: (p: ScoredProspect) => void }) {
  const order = ['Ready to Build', 'Vivid but Stuck', 'Moving Without a Map', 'Not Yet Looking']
  const defs = segModels.C.segments
  return (
    <>
      <div className="seg-quad">
        {order.map((name) => {
          const def = defs.find((d) => d.name === name)!
          const holders = scoredProspects.filter((p) => p.c.segment === name)
          return (
            <div className="seg-quad-cell" key={name}>
              <div className="seg-quad-n">{holders.length}</div>
              <h4>{name}</h4>
              <p className="seg-blurb">{def.blurb}</p>
              <div className="seg-chips">
                {holders.length ? (
                  holders.map((p) => (
                    <button key={p.key} type="button" className="seg-chip" onClick={() => onPick(p)}>
                      {p.name}
                    </button>
                  ))
                ) : (
                  <span className="seg-blurb">—</span>
                )}
              </div>
              {def.action && <div className="seg-hook">{def.action}</div>}
            </div>
          )
        })}
      </div>
      <div className="seg-note">
        Cut points are the <b>{segCutsBasis}</b> of this book — vision {segCuts.vision}, readiness{' '}
        {segCuts.readiness} — not fixed thresholds. The Adventure is designed to elicit a vivid
        vision, so absolute vision scores skew high; only position <i>relative to your own book</i>{' '}
        carries information.
      </div>
    </>
  )
}

/* ── prospect table ── */
function ProspectTable({ model, onPick }: { model: ModelKey; onPick: (p: ScoredProspect) => void }) {
  return (
    <div className="table-wrap">
      <table className="prospects-table seg-table">
        <thead>
          <tr>
            <th>Prospect</th>
            <th>{segModels[model].name}</th>
            <th className="seg-hide-sm">Signal</th>
          </tr>
        </thead>
        <tbody>
          {scoredProspects.map((p) => {
            const segs = segmentsOf(p, model)
            return (
              <tr key={p.key} className="seg-clickable" onClick={() => onPick(p)}>
                <td>
                  <b>{p.name}</b>
                  <div className="seg-blurb">{p.goal.slice(0, 72)}</div>
                </td>
                <td>
                  {segs.map((s) => (
                    <span className="seg-chip is-static" key={s}>
                      {s}
                    </span>
                  ))}
                </td>
                <td className="seg-hide-sm">
                  {model === 'A' && (
                    <span className={`seg-chip ${p.a.margin < 0.08 ? 'is-warn' : 'is-ok'}`}>
                      margin {p.a.margin}
                    </span>
                  )}
                  {model === 'B' && (
                    <span className={`seg-chip ${p.b.margin < 2 ? 'is-warn' : 'is-ok'}`}>
                      margin {p.b.margin}
                    </span>
                  )}
                  {model === 'C' && (
                    <>
                      <span className="seg-chip is-static">vision {p.c.vision}</span>
                      <span className="seg-chip is-static">ready {p.c.readiness}</span>
                    </>
                  )}
                  {model === 'D' && (
                    <span className="seg-chip is-static">{p.d.length} tag(s)</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── drill-down ── */
function ProspectSheet({ p, onClose }: { p: ScoredProspect; onClose: () => void }) {
  const Trace = ({ items }: { items: string[] }) => (
    <ul className="seg-trace">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  )
  return (
    <div className="seg-modal" onClick={onClose} role="presentation">
      <div className="seg-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="seg-x" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3>{p.name}</h3>
        <div className="seg-blurb">
          Data coverage {p.coverage}% · vision clarity {p.vivid ?? '—'}/5 · horizon {p.horizon}
        </div>

        <h5>In their own words</h5>
        <div className="seg-quote">
          <b>Goal:</b> {p.goal} <i>({p.goalWhen})</i>
        </div>
        {p.concerns.map((c, i) => (
          <div className="seg-quote" key={`c${i}`}>
            <b>Concern:</b> {c}
          </div>
        ))}
        {p.hopes.map((h, i) => (
          <div className="seg-quote" key={`h${i}`}>
            <b>Hope:</b> {h}
          </div>
        ))}
        <div className="seg-quote">
          <b>Money is for:</b> {p.purpose.join(' → ')}
        </div>

        <h5>
          A · Life Domain → {p.a.segment}
          {p.a.secondary ? ` (+ ${p.a.secondary})` : ''}
        </h5>
        <Trace items={p.a.reasons} />

        <h5>B · Purpose × Posture → {p.b.segment}</h5>
        <Trace items={p.b.reasons} />

        <h5>
          C · Vision {p.c.vision} × Readiness {p.c.readiness} → {p.c.segment}
        </h5>
        <Trace items={[...p.c.visionReasons, ...p.c.readinessReasons]} />

        <h5>D · Tensions</h5>
        {p.d.length ? (
          p.d.map((t) => (
            <div className="seg-quote" key={t.tag}>
              <b>{t.tag}</b> — {t.why}
            </div>
          ))
        ) : (
          <div className="seg-blurb">None detected.</div>
        )}
      </div>
    </div>
  )
}

function SegmentSheet({ model, name, onClose }: { model: ModelKey; name: string; onClose: () => void }) {
  const def = segModels[model].segments.find((s) => s.name === name)
  const holders = scoredProspects.filter((p) => segmentsOf(p, model).includes(name))
  if (!def) return null
  return (
    <div className="seg-modal" onClick={onClose} role="presentation">
      <div className="seg-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="seg-x" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3>{name}</h3>
        <div className="seg-blurb">{segModels[model].name}</div>
        <h5>What it means</h5>
        <p>{def.blurb}</p>
        <h5>Marketing hook</h5>
        <p className="seg-hook">&ldquo;{def.hook}&rdquo;</p>
        {def.action && (
          <>
            <h5>Marketing action</h5>
            <p>{def.action}</p>
          </>
        )}
        {def.options.length > 0 && (
          <>
            <h5>Built from these closed options</h5>
            <div className="seg-chips">
              {def.options.map((o) => (
                <span className="seg-chip is-static" key={o}>
                  {o}
                </span>
              ))}
            </div>
          </>
        )}
        <h5>In this sample ({holders.length})</h5>
        {holders.length ? (
          holders.map((p) => (
            <div className="seg-quote" key={p.key}>
              <b>{p.name}</b> — {p.goal}
            </div>
          ))
        ) : (
          <div className="seg-blurb">
            No prospect here. On a real book an empty segment is a targeting gap.
          </div>
        )}
      </div>
    </div>
  )
}

/* ── method ── */
function Method({ model }: { model: ModelKey }) {
  const m = segMethod[model]
  return (
    <div className="seg-method">
      <div className="seg-question">{m.question}</div>
      {m.inputs.map((r, i) => (
        <div className="seg-io-row seg-io-3" key={`row${i}`}>
          <b>{r[0]}</b>
          <span>{r[1]}</span>
          <em>{r[2]}</em>
        </div>
      ))}
      {m.steps.map((st, i) => (
        <div className="seg-step" key={i}>
          <div className="seg-step-n">{i + 1}</div>
          <div>
            <h4>{st[0].replace(/^\d+ · /, '')}</h4>
            <p>{st[1]}</p>
            {st[2] && <code className="seg-fx">{st[2]}</code>}
          </div>
        </div>
      ))}
      {m.rules && (
        <div className="table-wrap">
          <table className="prospects-table seg-table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Fires when</th>
              </tr>
            </thead>
            <tbody>
              {m.rules.map((r) => (
                <tr key={r[0]}>
                  <td>
                    <b>{r[0]}</b>
                  </td>
                  <td>{r[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── screen ── */
export default function SegmentationScreen() {
  // 'overview' is the cover: what the page is and what each model means. The
  // four model keys are the detail views the cover leads into.
  const [model, setModel] = useState<ModelKey | 'overview'>('overview')
  const [openProspect, setOpenProspect] = useState<ScoredProspect | null>(null)
  const [openSegment, setOpenSegment] = useState<string | null>(null)

  // Esc closes whichever sheet is open, matching the convert modal in App.tsx.
  const sheetOpen = openProspect !== null || openSegment !== null
  useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpenProspect(null)
      setOpenSegment(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheetOpen])

  return (
    <>
      <h1 className="page-title">Audience Segmentation</h1>

      <div className="seg-banner">
        <b>Prototype.</b> Every label is an exhaustive partition of the Adventure&rsquo;s closed
        option space — no free text assigns a label. Verified against{' '}
        {segProof.n.toLocaleString()} synthetic respondents: {segProof.crashes} crashes,{' '}
        {segProof.unlabeled} unlabeled, every label reachable. <b>Caveat:</b> 8 real profiles from 4
        households, and no conversion outcomes — nothing here is validated against conversion.
      </div>

      <nav className="seg-switch">
        <button
          type="button"
          className={`seg-switch-btn ${model === 'overview' ? 'is-on' : ''}`}
          onClick={() => setModel('overview')}
        >
          <span className="seg-switch-k">◎</span>
          Overview
        </button>
        {MODEL_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={`seg-switch-btn ${model === k ? 'is-on' : ''}`}
            onClick={() => setModel(k)}
          >
            <span className="seg-switch-k">{k}</span>
            {segModels[k].name}
          </button>
        ))}
      </nav>

      {model === 'overview' ? (
        <Overview onPick={setModel} />
      ) : (
        <>
      <div className="seg-spine">
        <b>Organising spine —</b> {segModels[model].spine}.{' '}
        {segModels[model].kind === 'multi'
          ? 'Multi-label: a prospect can carry several.'
          : 'Exclusive: each prospect lands in one segment.'}
      </div>

      {model === 'C' && (
        <Card
          icon={<GridIcon />}
          title="Vision × Readiness — who to call first"
          tip="Above both cut points is the shortest path to a signed client."
        >
          <Quadrants onPick={setOpenProspect} />
        </Card>
      )}

      <Card
        icon={<LayersIcon />}
        title="Segment mix — who is actually coming through"
        tip="Click a segment for its definition, marketing hook and members."
      >
        <SegmentMix model={model} onPick={setOpenSegment} />
      </Card>

      <Card icon={<LayersIcon />} title="Prospects" tip="Click a row for the full scoring trace.">
        <ProspectTable model={model} onPick={setOpenProspect} />
      </Card>

      <Card icon={<CogIcon />} title="How this is calculated">
        <Disclosure label={`${segModels[model].name} — method, inputs and formulas`}>
          <Method model={model} />
        </Disclosure>

        <Disclosure label="The rules every model obeys">
          {segContract.map((c) => (
            <div className="seg-io-row" key={c[0]}>
              <b>{c[0]}</b>
              <span>{c[1]}</span>
            </div>
          ))}
        </Disclosure>

        <Disclosure label={otherPolicy.title}>
          {otherPolicy.policy.map((c) => (
            <div className="seg-io-row" key={c[0]}>
              <b>{c[0]}</b>
              <span>{c[1]}</span>
            </div>
          ))}
          <div className="table-wrap">
            <table className="prospects-table seg-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Client typed</th>
                  <th>Counts as</th>
                </tr>
              </thead>
              <tbody>
                {otherPolicy.examples.map((e, i) => (
                  <tr key={i}>
                    <td className="seg-blurb">{e[0]}</td>
                    <td>{e[1]}</td>
                    <td className={e[2].startsWith('—') ? 'seg-blurb' : ''}>{e[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="seg-note">
            Lexicon:{' '}
            {lexiconSizes
              .map((r) => `${r[0]} ${r[1]} terms (${r[2]}/${r[3]} options)`)
              .join(' · ')}
            . {otherPolicy.backlog_note}
          </div>
        </Disclosure>

        <Disclosure label="What the Adventure cannot detect">
          {undetectable.map((u) => (
            <div className="seg-io-row" key={u[0]}>
              <b>{u[0]}</b>
              <span>{u[1]}</span>
            </div>
          ))}
          <div className="seg-note">
            Cash-flow pressure and caregiving were the two most commercially interesting segments in
            the earlier free-text version. They cannot be recovered from closed data today — adding
            two questions would restore them on a sound footing.
          </div>
        </Disclosure>
      </Card>

      <Card icon={<CheckIcon />} title="Coverage proof">
        <div className="impact-grid">
          {[
            [segProof.n.toLocaleString(), 'synthetic respondents'],
            [String(segProof.crashes), 'crashes'],
            [String(segProof.unlabeled), 'unlabeled'],
            [segProof.writeinsResolved.toLocaleString(), '“Other” write-ins placed'],
            [segProof.writeinsDropped.toLocaleString(), 'write-ins dropped'],
          ].map(([n, l]) => (
            <div className="impact-card" key={l}>
              <div className="impact-num">{n}</div>
              <div className="analytics-lbl">{l}</div>
            </div>
          ))}
        </div>
        <Disclosure label="Label reachability across the full option space">
          {MODEL_KEYS.map((k) => (
            <div key={k}>
              <h5 className="seg-sub">
                Model {k} — {segModels[k].name}
              </h5>
              {Object.entries(segProof[k])
                .sort((a, b) => b[1] - a[1])
                .map(([lab, c]) => (
                  <div className="seg-row" key={lab}>
                    <div className="seg-row-top">
                      <span className="seg-name is-static">{lab}</span>
                      <span className="analytics-lbl">
                        {c.toLocaleString()} · {((c / segProof.n) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="seg-bar">
                      <i
                        style={{
                          width: `${(c / Math.max(...Object.values(segProof[k]))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </Disclosure>
        <Disclosure label="Unresolved write-ins — the missing-option backlog">
          <div className="table-wrap">
            <table className="prospects-table seg-table">
              <thead>
                <tr>
                  <th>Fragment</th>
                  <th>Times seen</th>
                </tr>
              </thead>
              <tbody>
                {segProof.backlog.map(([w, c]) => (
                  <tr key={w}>
                    <td>{w || '(blank)'}</td>
                    <td>{c.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="seg-note">
            From the synthetic proof run — the 8 sample profiles contain no write-ins. On live data
            this is the ranked list of options worth adding to the Adventure.
          </div>
        </Disclosure>
      </Card>
        </>
      )}

      {openProspect && <ProspectSheet p={openProspect} onClose={() => setOpenProspect(null)} />}
      {openSegment && model !== 'overview' && (
        <SegmentSheet model={model} name={openSegment} onClose={() => setOpenSegment(null)} />
      )}
    </>
  )
}

/* ── Overview / cover: what the page is, and what each model means. Each card
   leads into a model's detail view. This is the default landing state. ── */
function Overview({ onPick }: { onPick: (k: ModelKey) => void }) {
  return (
    <>
      <div className="seg-overview-intro">
        <p>
          <b>Audience Segmentation groups your prospects by what they told the Adventure</b> — their
          goals, their language, how ready they are — rather than by demographics. Four independent
          models each cut the same book a different way; pick the lens that fits the decision you are
          making. Every label is an exhaustive partition of the Adventure&rsquo;s closed option
          space, so no prospect is ever left unclassified.
        </p>
      </div>

      <div className="seg-overview-grid">
        {MODEL_KEYS.map((k) => {
          const m = segModels[k]
          return (
            <button key={k} type="button" className="seg-overview-card" onClick={() => onPick(k)}>
              <div className="seg-overview-top">
                <span className="seg-overview-k">{k}</span>
                <span className="seg-overview-name">{m.name}</span>
              </div>
              <p className="seg-overview-spine">{m.spine}.</p>
              <div className="seg-overview-foot">
                <span className="seg-overview-meta">
                  {m.segments.length} segments · {m.kind === 'multi' ? 'overlapping' : 'exclusive'}
                </span>
                <span className="seg-overview-go">Explore →</span>
              </div>
            </button>
          )
        })}
      </div>

      <p className="seg-note seg-overview-hint">
        Pick a model above, or a card, to see its quadrants, segment mix, the full prospect list and
        how each label is calculated.
      </p>
    </>
  )
}
