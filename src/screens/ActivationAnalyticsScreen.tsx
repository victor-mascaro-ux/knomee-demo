/* Prospect Analytics — the page #/analytics opens on (the menu's "Prospect
   Analytics").

   The tracking the activation toolkit is building, surfaced the way a firm
   would read it: is the firm using Knomee, which step of prospect conversion
   loses the most people, which templates bring clients, and which advisors to
   nudge. Advisors come first because prospects only arrive once an advisor
   sends something. Card structure and bar treatments follow the advisor and
   candidate analytics; every number is in `activation.ts`, and the prospect
   side reads the same totals the older Prospect Analytics page does — which
   is one button away, opposite the title ("Older Version"). Candidate
   Analytics borrows this page's parts (Step, Reading, HelpTip). */

import { Fragment, useState } from 'react'
import './activationAnalytics.css'
import {
  advisorFunnel,
  advisors,
  advisorTotals,
  baseline,
  biggestLoss,
  daysToClient,
  knomeeClients,
  lift,
  prospectFunnel,
  prospectTotals,
  revenueFrom,
  revenuePerClient,
  roi,
  statusLabel,
  statusOf,
  templates,
  templateTotals,
  whereTheyStopped,
  type FunnelStep,
  type KnomeeClient,
} from '../data/activation'
import {
  ChartIcon,
  CheckIcon,
  ChevronDown,
  ChevronUp,
  FunnelIcon,
  KnomeeMark,
  MegaphoneIcon,
  TargetIcon,
  TierBarsIcon,
  WarnIcon,
} from '../components/icons'

export function HelpTip({ text, side }: { text: string; side?: 'left' | 'right' }) {
  return (
    <span
      className={`help-tip tt${side === 'right' ? ' help-tip-right' : ''}`}
      data-tip={text}
      tabIndex={0}
      role="img"
      aria-label={text}
    >
      ?
    </span>
  )
}

export const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0)
const usd = (n: number) => `$${n.toLocaleString('en-US')}`
const usdShort = (n: number) => (n >= 10000 ? `$${Math.round(n / 1000)}K` : usd(n))
const assetsShort = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2).replace(/\.?0+$/, '')}M` : usdShort(n))
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** "2026-03-02" → "Mar 2", read off the string so no time zone moves the day. */
export const shortDate = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`

/** One baseline measure: the firm before Knomee against the same measure since, each bar
    against the larger of the two. */
function LiftRow({
  label,
  before,
  after,
  show,
  change,
}: {
  label: string
  before: number
  after: number
  show: (n: number) => string
  change: string
}) {
  const max = Math.max(before, after)
  return (
    <div className="act-lift-row">
      <span className="act-lift-label">{label}</span>
      <span className="act-lift-bars">
        <span className="act-lift-line">
          <span className="act-track">
            <span
              className="act-bar is-before tt"
              style={{ width: `${(before / max) * 100}%` }}
              data-tip={`Before Knomee: ${show(before)}`}
              tabIndex={0}
            />
          </span>
          <span className="act-lift-num is-before">{show(before)}</span>
        </span>
        <span className="act-lift-line">
          <span className="act-track">
            <span
              className="act-bar tt"
              style={{ width: `${(after / max) * 100}%` }}
              data-tip={`With Knomee: ${show(after)}`}
              tabIndex={0}
            />
          </span>
          <span className="act-lift-num">{show(after)}</span>
        </span>
      </span>
      <span className="act-lift-change">
        <CheckIcon />
        {change}
      </span>
    </div>
  )
}

/** A client's path, from the invitation that started it to the conversion. */
function Trail({ c }: { c: KnomeeClient }) {
  const revenue = c.assets != null ? revenueFrom(c.assets) : null
  return (
    <ol className="act-trail">
      <li>
        <b>Invited</b>
        <span>{shortDate(c.invited)}</span>
        <i>
          by {c.advisor} · {c.template ? `“${c.template}”` : 'a link without a template tag'}
        </i>
      </li>
      <li>
        <b>Signed up</b>
        <span>{shortDate(c.signedUp)}</span>
      </li>
      <li>
        <b>Profile complete</b>
        <span>{shortDate(c.complete)}</span>
      </li>
      <li className="is-client">
        <b>Became a client</b>
        <span>{shortDate(c.converted)}</span>
        <i>
          {c.assets != null
            ? `${assetsShort(c.assets)} in assets · ${usd(revenue as number)} a year`
            : `Assets not entered · ≈ ${usd(revenuePerClient)}, your average`}
        </i>
      </li>
    </ol>
  )
}

/** A step's name that says, on hover or focus, what records it. */
export function StepName({ label, tip }: { label: string; tip: string }) {
  return (
    <span className="act-step-name tt tt-wrap" data-tip={tip} tabIndex={0}>
      {label}
    </span>
  )
}

export function Reading({ children }: { children: React.ReactNode }) {
  return (
    <p className="act-reading">
      <span className="act-fix">Fix</span>
      {children}
    </p>
  )
}

/** One step of the funnel: its bar against the group's first step, and what it lost.
    `tip`, where given, opens from the step's name (what records the step). */
export function Step({ s, unit, flag, tip }: { s: FunnelStep; unit: string; flag?: boolean; tip?: string }) {
  const share = pct(s.count, s.base)
  return (
    <div className={`act-step ${flag ? 'is-flagged' : ''}`}>
      <span className="act-step-label">
        {tip ? <StepName label={s.label} tip={tip} /> : s.label}
      </span>
      <span className="act-track">
        <span
          className="act-bar tt"
          style={{ width: `${Math.max(share, 2)}%` }}
          data-tip={`${s.label}: ${s.count} ${unit} · ${share}% of ${s.base}`}
          tabIndex={0}
        />
      </span>
      <span className="act-step-num">
        <b>{s.count}</b> <i>{share}%</i>
      </span>
      <span className="act-step-lost">
        {s.lost ? (
          flag ? (
            <span className="act-flag">
              <WarnIcon color="currentColor" /> −{s.lost} {s.lostLabel} · biggest loss
            </span>
          ) : (
            <>
              −{s.lost} {s.lostLabel}
            </>
          )
        ) : null}
      </span>
    </div>
  )
}

export default function ActivationAnalyticsScreen({
  onOlderVersion,
  onRemind,
}: {
  /** Opens the older Prospect Analytics page this one replaced as the landing. */
  onOlderVersion: () => void
  /** A nudge to an advisor who isn't sending (the demo only confirms it). */
  onRemind: (name: string) => void
}) {
  const { withAccess, sending } = advisorTotals
  const notSending = advisors.filter((a) => statusOf(a) !== 'sending')
  const copiedOnly = advisors.filter((a) => statusOf(a) === 'copied').length
  const stoppedMax = Math.max(...whereTheyStopped.map((w) => w.count))
  const untagged = prospectTotals.signedUp - templateTotals.signedUp
  /* One client's trail open at a time; the first is open so the page shows what a trail is. */
  const [openClient, setOpenClient] = useState<string | null>(knomeeClients[0]?.name ?? null)

  return (
    <>
      <div className="page-title-row">
        <h1 className="page-title">Prospect Analytics</h1>
        <button className="btn btn-outline" type="button" onClick={onOlderVersion}>
          Older Version
        </button>
      </div>

      {/* 1 ── the header: is the firm using it, and is it paying off */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <TargetIcon />
            <span>Is Your Firm Using Knomee?</span>
            <HelpTip side="right" text="Advisors from the toolkit's own events; prospects from Knomee and Typeform." />
          </div>
        </header>
        <div className="analytics-body">
          <div className="impact-grid act-kpis">
            <div className="impact-card">
              <div className="analytics-lbl">Advisors sending</div>
              <div className="impact-num">{pct(sending, withAccess)}%</div>
              <div className="impact-compare">
                {sending} of {withAccess} advisors sent an adventure in the last 30 days
              </div>
              <div className="impact-detail">{withAccess - sending} haven’t — see who below</div>
            </div>
            <div className="impact-card">
              <div className="analytics-lbl">Prospects who sign up</div>
              <div className="impact-num">{pct(prospectTotals.signedUp, prospectTotals.invited)}%</div>
              <div className="impact-compare">
                {prospectTotals.signedUp} of {prospectTotals.invited} invited this year
              </div>
              <div className="impact-detail">The step that loses the most people</div>
            </div>
            <div className="impact-card">
              <div className="analytics-lbl">Profiles completed</div>
              <div className="impact-num">{pct(prospectTotals.complete, prospectTotals.signedUp)}%</div>
              <div className="impact-compare">
                {prospectTotals.complete} of the {prospectTotals.signedUp} who signed up
              </div>
              <div className="impact-detail good">Once they start, most finish</div>
            </div>
            <div className="impact-card">
              <div className="analytics-lbl">Clients from Knomee</div>
              <div className="impact-num">{prospectTotals.clients}</div>
              <div className="impact-compare">
                {pct(prospectTotals.clients, prospectTotals.invited)}% of the {prospectTotals.invited} invited this year
              </div>
              <div className="impact-detail">{roi.daysToClient} days from invitation, on average</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 ── ROI: what Knomee brought, against the firm's own numbers from before */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <TierBarsIcon />
            <span>What Knomee Brought Your Firm</span>
            <HelpTip
              side="right"
              text="Revenue from the assets entered on Convert to Client, against your numbers from before Knomee."
            />
          </div>
        </header>
        <div className="analytics-body">
          <div className="act-roi">
            <div className="act-roi-stat">
              <div className="analytics-lbl">Revenue from Knomee clients</div>
              <div className="act-roi-num">{usdShort(roi.totalRevenue)}</div>
              <div className="act-roi-sub">
                {usdShort(roi.reportedRevenue)} from the assets entered for {roi.reportedClients} clients, plus{' '}
                {roi.estimatedClients} at your {usd(revenuePerClient)} average
              </div>
            </div>
            <div className="act-roi-stat">
              <div className="analytics-lbl">Above your baseline</div>
              <div className="act-roi-num">+{lift.extraClients} clients</div>
              <div className="act-roi-sub">
                {prospectTotals.invited} invitations at your {Math.round(baseline.conversionRate * 100)}% would have
                brought {lift.expectedAtBaseline}. The extra {lift.extraClients} ≈ {usdShort(lift.extraRevenue)} a year.
              </div>
            </div>
            <div className="act-roi-stat">
              <div className="analytics-lbl">What Knomee cost</div>
              <div className="act-roi-num">{usd(roi.cost)}</div>
              <div className="act-roi-sub">
                {Math.round(roi.totalRevenue / roi.cost)}× back in revenue; the extra clients alone,{' '}
                {Math.round(lift.extraRevenue / roi.cost)}×
              </div>
            </div>
          </div>

          <div className="act-group-head">
            <span className="analytics-sub-head">Before Knomee, and since</span>
            <span className="act-legend">
              <span>
                <i className="act-swatch is-before" /> Your baseline
              </span>
              <span>
                <i className="act-swatch" /> With Knomee
              </span>
            </span>
          </div>
          <LiftRow
            label="Prospects who become clients"
            before={baseline.conversionRate * 100}
            after={roi.conversionRate * 100}
            show={(n) => `${Math.round(n)}%`}
            change={`+${Math.round(roi.conversionRate * 100 - baseline.conversionRate * 100)} points`}
          />
          <LiftRow
            label="Days to a new client"
            before={baseline.daysToClient}
            after={roi.daysToClient}
            show={(n) => `${Math.round(n)} days`}
            change={`${baseline.daysToClient - roi.daysToClient} days sooner`}
          />
          <LiftRow
            label="First-year revenue per client"
            before={baseline.revenuePerClient}
            after={roi.revenuePerClient}
            show={(n) => usd(Math.round(n))}
            change={`+${pct(roi.revenuePerClient - baseline.revenuePerClient, baseline.revenuePerClient)}%`}
          />
          <p className="analytics-note">
            Your baseline is the three numbers you entered at onboarding, in the toolkit’s Baseline. Days run from the
            invitation to Convert to Client; revenue per client counts the {roi.reportedClients} clients with assets
            entered.
          </p>
          <Reading>
            {roi.estimatedClients} of the {prospectTotals.clients} clients were converted without their assets, so
            their revenue is your average. Ask advisors to fill in the one field when they convert.
          </Reading>
        </div>
      </section>

      {/* 3 ── the funnel: advisors, then their prospects */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <FunnelIcon />
            <span>From Toolkit to Client</span>
            <HelpTip side="right" text="Each step counted on its own, so the step to fix is the one that loses the most people." />
          </div>
        </header>
        <div className="analytics-body">
          <div className="act-group-head">
            <span className="analytics-sub-head">Advisors at your firm</span>
            <span className="act-period">Last 30 days</span>
          </div>
          {advisorFunnel.map((s) => (
            <Step s={s} unit="advisors" key={s.label} />
          ))}

          <div className="act-group-head">
            <span className="analytics-sub-head">Their prospects</span>
            <span className="act-period">This year</span>
          </div>
          {prospectFunnel.map((s) => (
            <Step s={s} unit="prospects" flag={s === biggestLoss} key={s.label} />
          ))}

          <div className="act-stopped">
            <div className="act-stopped-head">
              Where the {biggestLoss.lost} who never signed up stopped
            </div>
            {whereTheyStopped.map((w) => (
              <div className="act-stopped-row" key={w.where}>
                <span>{w.where}</span>
                <span className="act-mini-track">
                  <span className="act-mini-bar" style={{ width: `${pct(w.count, stoppedMax)}%` }} />
                </span>
                <b>{w.count}</b>
              </div>
            ))}
          </div>
          <Reading>
            Most stop at the welcome screen, before the first question. Say on that screen what they get in
            eight minutes — no engineering, just the Typeform intro.
          </Reading>
        </div>
      </section>

      {/* 4 ── templates: copies, and what their tagged links brought in */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <MegaphoneIcon />
            <span>Which Templates Bring Clients</span>
            <HelpTip side="right" text="Every link a template copies carries its name, so a sign-up can be traced back to it." />
          </div>
        </header>
        <div className="analytics-body">
          <div className="act-table-wrap">
            <table className="act-table">
              <thead>
                <tr>
                  <th>Template</th>
                  <th className="num">Copied</th>
                  <th className="num">Signed up</th>
                  <th className="num">Completed</th>
                  <th className="num">Clients</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.name}>
                    <td>
                      <span className="act-tpl-name">{t.name}</span>
                      <i>{t.kind}</i>
                    </td>
                    <td className="num">{t.copies}</td>
                    <td className="num">{t.signedUp}</td>
                    <td className="num">{t.complete}</td>
                    <td className="num">
                      <b>{t.clients}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>From a template link · this year</td>
                  <td className="num">{templateTotals.copies}</td>
                  <td className="num">{templateTotals.signedUp}</td>
                  <td className="num">{templateTotals.complete}</td>
                  <td className="num">{templateTotals.clients}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="analytics-note">
            {untagged} of the {prospectTotals.signedUp} sign-ups came in on a link without a template’s tag — pasted
            plainly, or from your own marketing.
          </p>
          <Reading>
            “Before we meet” is copied most and brings half the clients a template brought in. Put it first in the
            Hot section, and send it the day a meeting is booked.
          </Reading>
        </div>
      </section>

      {/* 5 ── each client's trail: the record that says it was Knomee */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <KnomeeMark size={18} />
            <span>Clients Knomee Brought In</span>
            <HelpTip
              side="right"
              text="Each client's path from the invitation that started it — open one to see it."
            />
          </div>
        </header>
        <div className="analytics-body">
          <div className="act-table-wrap">
            <table className="act-table act-clients">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Advisor</th>
                  <th>Came in through</th>
                  <th className="num">Days to client</th>
                  <th className="num">First-year revenue</th>
                </tr>
              </thead>
              <tbody>
                {knomeeClients.map((c) => {
                  const open = openClient === c.name
                  return (
                    <Fragment key={c.name}>
                      <tr className={open ? 'is-open' : ''}>
                        <td>
                          <button
                            className="act-client-btn"
                            type="button"
                            aria-expanded={open}
                            onClick={() => setOpenClient(open ? null : c.name)}
                          >
                            {open ? <ChevronUp /> : <ChevronDown />}
                            {c.name}
                          </button>
                        </td>
                        <td>{c.advisor}</td>
                        <td>{c.template ? `“${c.template}”` : <i className="act-muted">Link without a template tag</i>}</td>
                        <td className="num">{daysToClient(c)}</td>
                        <td className="num">
                          {c.assets != null ? (
                            <b>{usd(revenueFrom(c.assets))}</b>
                          ) : (
                            <span className="act-est">≈ {usd(revenuePerClient)}</span>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr className="act-trail-row">
                          <td colSpan={5}>
                            <Trail c={c} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="analytics-note">
            Every client here started from a Knomee invitation and was marked a client with Convert to Client.
            Revenue with ≈ is your average: no assets were entered when they converted.
          </p>
        </div>
      </section>

      {/* 6 ── advisors: who's sending, who to nudge */}
      <section className="card analytics-card">
        <header className="card-head">
          <div className="card-title">
            <ChartIcon />
            <span>Which Advisors Are Sending</span>
            <HelpTip side="right" text="Toolkit use in the last 30 days, beside what each advisor's invitations brought in this year." />
          </div>
        </header>
        <div className="analytics-body">
          <div className="act-table-wrap">
            <table className="act-table act-advisors">
              <thead>
                <tr>
                  <th>Advisor</th>
                  <th>Last 30 days</th>
                  <th className="num">Opened</th>
                  <th className="num">Copied</th>
                  <th className="num">Sent</th>
                  <th className="num">Invited · signed up this year</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {advisors.map((a) => {
                  const st = statusOf(a)
                  return (
                    <tr key={a.name}>
                      <td className="act-adv-name">{a.name}</td>
                      <td>
                        <span className={`act-status is-${st}`}>
                          {st === 'sending' ? <CheckIcon /> : <WarnIcon color="currentColor" />}
                          {statusLabel[st]}
                        </span>
                      </td>
                      <td className="num">{a.opens}</td>
                      <td className="num">{a.copies}</td>
                      <td className="num">{a.sent}</td>
                      <td className="num">
                        {a.invited} · {a.signedUp}
                      </td>
                      <td className="act-act">
                        {st !== 'sending' && (
                          <button className="act-remind" type="button" onClick={() => onRemind(a.name)}>
                            Remind
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Reading>
            {notSending.length} advisors aren’t sending, and {copiedOnly} of them copied a template and stopped there.
            A reminder with their own link already filled in is the shortest way back.
          </Reading>
          <p className="analytics-note">
            Placeholder data. Opens and copies come from the activation toolkit’s own events, per firm link;
            invitations from Knomee; sign-ups and completions from Typeform; clients from the Convert to Client
            button.
          </p>
        </div>
      </section>
    </>
  )
}
