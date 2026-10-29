/* Activation Analytics — the page #/analytics opens on.

   The tracking the activation toolkit is building, surfaced the way a firm
   would read it: is the firm using Knomee, which step of prospect conversion
   loses the most people, which templates bring clients, and which advisors to
   nudge. Advisors come first because prospects only arrive once an advisor
   sends something. Card structure and bar treatments follow the advisor and
   candidate analytics; every number is in `activation.ts`, and the prospect
   side reads the same totals the Prospect Analytics page does — which is one
   button away, opposite the title. */

import './activationAnalytics.css'
import {
  advisorFunnel,
  advisors,
  advisorTotals,
  biggestLoss,
  prospectFunnel,
  prospectTotals,
  revenuePerClient,
  statusLabel,
  statusOf,
  templates,
  templateTotals,
  whereTheyStopped,
  type FunnelStep,
} from '../data/activation'
import { ChartIcon, CheckIcon, FunnelIcon, MegaphoneIcon, TargetIcon, WarnIcon } from '../components/icons'

function HelpTip({ text, side }: { text: string; side?: 'left' | 'right' }) {
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

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0)
const usd = (n: number) => `$${n.toLocaleString('en-US')}`
const usdShort = (n: number) => (n >= 10000 ? `$${Math.round(n / 1000)}K` : usd(n))

function Reading({ children }: { children: React.ReactNode }) {
  return (
    <p className="act-reading">
      <span className="act-fix">Fix</span>
      {children}
    </p>
  )
}

/** One step of the funnel: its bar against the group's first step, and what it lost. */
function Step({ s, unit, flag }: { s: FunnelStep; unit: string; flag?: boolean }) {
  const share = pct(s.count, s.base)
  return (
    <div className={`act-step ${flag ? 'is-flagged' : ''}`}>
      <span className="act-step-label">{s.label}</span>
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
  onProspectAnalytics,
  onRemind,
}: {
  /** Opens the Prospect Analytics page this one replaced as the landing. */
  onProspectAnalytics: () => void
  /** A nudge to an advisor who isn't sending (the demo only confirms it). */
  onRemind: (name: string) => void
}) {
  const { withAccess, sending } = advisorTotals
  const notSending = advisors.filter((a) => statusOf(a) !== 'sending')
  const copiedOnly = advisors.filter((a) => statusOf(a) === 'copied').length
  const stoppedMax = Math.max(...whereTheyStopped.map((w) => w.count))
  const untagged = prospectTotals.signedUp - templateTotals.signedUp

  return (
    <>
      <div className="page-title-row">
        <h1 className="page-title">Activation Analytics</h1>
        <button className="btn btn-outline" type="button" onClick={onProspectAnalytics}>
          Prospect Analytics
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
              <div className="analytics-lbl">Revenue from Knomee clients</div>
              <div className="impact-num">{usdShort(prospectTotals.clients * revenuePerClient)}</div>
              <div className="impact-compare">
                {prospectTotals.clients} clients × {usd(revenuePerClient)} first-year revenue
              </div>
              <div className="impact-detail">Estimate, from your firm’s average per new client</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 ── the funnel: advisors, then their prospects */}
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

      {/* 3 ── templates: copies, and what their tagged links brought in */}
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

      {/* 4 ── advisors: who's sending, who to nudge */}
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
