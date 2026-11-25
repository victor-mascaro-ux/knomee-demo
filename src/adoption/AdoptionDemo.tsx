/* The Intercom adoption demo: a new advisor's first three weeks at Acme, step
 * by step. The dark demo bar runs it; the advisor's real app is on the left,
 * wearing Acme's brand, with what Intercom adds over it; the notes on the
 * right say what is happening and why.
 *
 * Its story, copy and timing are the approved prototype's
 * (docs/adoption-demo/prototype.html). Its app is the product's own: the top
 * bar, the tab bar, the empty dashboard, the prospects table and the compose
 * window, handed in by App (kit.ts). Only what the product doesn't have — the
 * Intercom pieces, the notes, the intro screens — is drawn here.
 *
 * Buttons that aren't part of the story do nothing: the app is inert except
 * for its live controls (the Invite button, and anything of the demo's own
 * marked data-ad-live).
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import TopBar from '../components/TopBar'
import { CLIENT_BRANDS, type ClientBrand } from '../components/clientBrands'
import { useCcNav } from '../ccNav'
import type { InviteEmail } from '../data/inviteEmails'
import AskModal from './AskModal'
import ComposeModal, { type Sent } from './ComposeModal'
import DemoBar from './DemoBar'
import { freshUi, invitedRow, rowsFor, sarahInvited, statsOf, type DemoRow, type Ui } from './engine'
import IntroScreen from './IntroScreen'
import { AnchoredTip, Banner, Beacon, Launcher, Post, Survey } from './intercom'
import { ComingUp, NudgeCell } from './dashboard'
import ProspectProfileScreen from '../screens/ProspectProfileScreen'
import type { DemoKit } from './kit'
import MailWindow from './MailWindow'
import { reducedMotion, useCountUps, useLeave, useRipples } from './motion'
import NotesPanel from './NotesPanel'
import TeamChat from './TeamChat'
import {
  ALEX,
  ASK,
  CAL_MEETS,
  NOTE_TEXT,
  NUDGE,
  STEPS,
  dayOf,
  firstName,
  nextDayStart,
  stepIndex,
  type ExtraKey,
  type SentEmail,
} from './steps'
import './adoption.css'

const ACME = CLIENT_BRANDS.find((b) => b.id === 'acme') as ClientBrand

/** The controls in the app that are part of the story. Everything else in it
    is inert. */
const LIVE = '.toolbar .btn-primary, .prospects-table .name-link-btn, .pp-crumb-link, [data-ad-live]'

/** Alex's first invite, as his draft starts. */
const FIRST_INVITE: InviteEmail = {
  id: 'adoption-first-invite',
  stage: 'Adoption demo',
  name: 'Before we meet',
  subject: 'Before we meet',
  message: NOTE_TEXT.replace('{first}', '{{First Name}}'),
  cta: 'Start Your Check-In →',
  signoff: 'Best,\n{{Advisor Name}}\n{{Firm Name}}',
}

/** Alex's nudge to Sarah, as his draft starts. */
const NUDGE_EMAIL: InviteEmail = {
  id: 'adoption-nudge',
  stage: 'Adoption demo',
  name: 'Nudge',
  ...NUDGE,
}

interface StepState {
  idx: number
  /** Bumped by Restart and by re-entering the current step: either opens it afresh. */
  visit: number
  rows: DemoRow[]
  ui: Ui
  /** The day's intro screen is up. */
  intro: boolean
  /** The email open from the notes, over everything. */
  mail: ExtraKey | null
  /** The next day, lit up in the notes after a pause at the end of a day. */
  hint: number | null
}

function openStep(idx: number, visit: number, prevDay: number, intros: boolean): StepState {
  const id = STEPS[idx].id
  return {
    idx,
    visit,
    rows: rowsFor(id),
    ui: freshUi(id),
    intro: intros && dayOf(idx) !== prevDay,
    mail: null,
    hint: null,
  }
}

export default function AdoptionDemo({
  step,
  onStep,
  onExit,
  kit,
}: {
  /** The step in the address; null or unknown is the first. */
  step: string | null
  onStep: (id: string) => void
  onExit: () => void
  kit: DemoKit
}) {
  const idx = Math.max(0, stepIndex(step))
  const [introsOn, setIntrosOn] = useState(true)
  const [labelsOn, setLabelsOn] = useState(true)
  /* What Alex sent, carried from his first invite to the notes of later steps. */
  const [sent, setSent] = useState<SentEmail | null>(null)
  /* What Alex answered on Day 4: the team's alert quotes it on Day 7. */
  const [askAnswer, setAskAnswer] = useState<string | null>(null)
  /* Restart and re-entering a step open it afresh; Restart also starts the
     day's intro again, as on a first visit. */
  const [visit, setVisit] = useState({ n: 0, fresh: false })

  const [st, setSt] = useState<StepState>(() => openStep(idx, 0, -1, true))
  if (st.idx !== idx || st.visit !== visit.n) {
    const prevDay = st.visit !== visit.n && visit.fresh ? -1 : dayOf(st.idx)
    setSt(openStep(idx, visit.n, prevDay, introsOn))
  }
  const { ui, rows } = st
  /** A change to this step's screen, made later (after an exit has played):
      dropped if the presenter has moved to another step meanwhile. */
  const laterOnThisStep = (patch: (s: StepState) => StepState) => {
    const at = { idx: st.idx, visit: st.visit }
    return () => setSt((s) => (s.idx === at.idx && s.visit === at.visit ? patch(s) : s))
  }
  const setUiLater = (patch: Partial<Ui>) => laterOnThisStep((s) => ({ ...s, ui: { ...s.ui, ...patch } }))

  /* The address names the step it shows. */
  useEffect(() => {
    if (step !== STEPS[idx].id) onStep(STEPS[idx].id)
  }, [step, idx, onStep])

  /* A comment left on the demo lands back on its step. */
  useCcNav(
    'adoption-step',
    STEPS[idx].id,
    (id: string) => onStep(id),
    STEPS.map((s) => s.id),
  )

  const goTo = useCallback(
    (i: number) => {
      const k = Math.max(0, Math.min(STEPS.length - 1, i))
      if (k === idx) setVisit((v) => ({ n: v.n + 1, fresh: false }))
      else onStep(STEPS[k].id)
    },
    [idx, onStep],
  )
  const restart = () => {
    setSent(null)
    setAskAnswer(null)
    setVisit((v) => ({ n: v.n + 1, fresh: true }))
    if (idx !== 0) onStep(STEPS[0].id)
  }

  /* ── The intro screen ── */
  const [introLeaving, leaveIntro] = useLeave(260)
  const closeIntro = useCallback(() => {
    if (!st.intro) return
    const at = { idx: st.idx, visit: st.visit }
    leaveIntro(() => setSt((s) => (s.idx === at.idx && s.visit === at.visit ? { ...s, intro: false } : s)))
  }, [st.intro, st.idx, st.visit, leaveIntro])
  /* Turning intros off mid-intro opens the day. */
  useEffect(() => {
    if (!introsOn) closeIntro()
  }, [introsOn, closeIntro])

  /* ── Pacing ── At the end of a day, if the presenter hasn't moved on within
     4 seconds, the next day lights up in the notes. */
  useEffect(() => {
    if (st.intro) return
    const target = nextDayStart(st.idx)
    if (target === null) return
    const t = window.setTimeout(() => setSt((s) => (s.idx === st.idx ? { ...s, hint: target } : s)), 4000)
    return () => window.clearTimeout(t)
  }, [st.idx, st.visit, st.intro])

  /* ── What arrives on its own ── A moment after the day opens: Alex's
     reminder email (Day 2), the one question (Day 4), the team's
     notification (Day 7, or after "Talk it through"). */
  useEffect(() => {
    const a = st.ui.auto
    if (st.intro || !a) return
    const at = { idx: st.idx, visit: st.visit }
    const t = window.setTimeout(
      () =>
        setSt((s) =>
          s.idx !== at.idx || s.visit !== at.visit
            ? s
            : {
                ...s,
                ui: {
                  ...s.ui,
                  auto: null,
                  ...(a === 'mail' ? { modal: 'mail' as const } : a === 'ask' ? { modal: 'ask' as const } : { notif: true }),
                },
              },
        ),
      900,
    )
    return () => window.clearTimeout(t)
  }, [st.idx, st.visit, st.intro, st.ui.auto])

  /* ── The app's scroll ── A step opens at the top; the first invite opens
     with the toolbar in view, where its tip points. */
  const device = useRef<HTMLElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const sc = scroller.current
    if (!sc) return
    sc.scrollTop = 0
    if (STEPS[st.idx].id === 'first-send') {
      const tb = sc.querySelector('.toolbar')
      if (tb) sc.scrollTop = Math.max(0, tb.getBoundingClientRect().top - sc.getBoundingClientRect().top - 138)
    }
    if (st.ui.rowTip) {
      const nm = sc.querySelector('.prospects-table .name-link-btn')
      if (nm) sc.scrollTop += nm.getBoundingClientRect().top - sc.getBoundingClientRect().top - 260
    }
  }, [st.idx, st.visit])

  /* ── Motion ── A new step, or a day once its intro closes, lays the page in
     from the top; the dashboard's numbers count up to theirs once the page
     is in view; buttons that do something ripple where they are pressed. */
  const [entering, setEntering] = useState(false)
  useLayoutEffect(() => {
    if (st.intro || reducedMotion()) return
    setEntering(true)
    const t = window.setTimeout(() => setEntering(false), 1400)
    return () => window.clearTimeout(t)
  }, [st.idx, st.visit, st.intro])
  useCountUps(device, st.intro)
  const root = useRef<HTMLDivElement>(null)
  useRipples(root)

  /* ── Inviting ── */
  const openInvite = useCallback(() => {
    setSt((s) => {
      const next = s.rows.some((r) => r.id === 'sarah')
      return {
        ...s,
        ui: {
          ...s.ui,
          tip: false,
          modal: 'invite',
          invite: next
            ? { name: 'Sam Patel', email: 'sam.patel@example.com', next: true }
            : { name: 'Sarah Mitchell', email: 'sara.mitchell@email.com', next: false },
        },
      }
    })
  }, [])
  const closeInvite = () =>
    setSt((s) => ({
      ...s,
      /* Closed without sending on the first invite: the tip comes back. */
      ui: { ...s.ui, modal: null, invite: null, tip: STEPS[s.idx].id === 'first-send' && !s.ui.done },
    }))
  const inviteSent = (out: Sent) => {
    const who = ui.invite
    if (!who) return
    setSent({ first: firstName(who.name), subject: out.subject, body: out.body })
    const row = who.next
      ? invitedRow('next', who.name, out.email, '12/04/2026')
      : sarahInvited(out.email)
    setSt((s) => ({
      ...s,
      rows: [...s.rows.map((r) => ({ ...r, fresh: false })), { ...row, fresh: true }],
      ui: { ...s.ui, modal: null, invite: null, tip: false, survey: null, done: true },
    }))
  }

  /* ── Day 2: Sarah stopped halfway ── Alex can nudge her himself; if he
     does, Knomee's own reminder is off. */
  const openNudge = () => setSt((s) => ({ ...s, ui: { ...s.ui, modal: 'nudge' } }))
  const nudgeSent = (out: Sent) =>
    setSt((s) => ({
      ...s,
      ui: {
        ...s.ui,
        modal: null,
        done: true,
        nudge: { sent: true, draft: { subject: out.subject, body: out.body } },
      },
    }))

  /* ── Day 3: Sarah's playbook ── Her name opens her page on its Prospect
     Playbook tab; its breadcrumb brings Alex back. */
  const openPlaybook = () =>
    setSt((s) => ({
      ...s,
      rows: s.rows.map((r) => ({ ...r, isNew: false, fresh: false })),
      ui: { ...s.ui, drawer: true, rowTip: false },
    }))
  const closePlaybook = () => setSt((s) => ({ ...s, ui: { ...s.ui, drawer: false, done: true } }))
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0
  }, [ui.drawer])
  const [rowTipLeaving, leaveRowTip] = useLeave()

  /* ── Day 4: how did it go? ── */
  const [surveyLeaving, leaveSurvey] = useLeave()
  const setSurvey = (patch: Partial<NonNullable<Ui['survey']>>, done = false) =>
    setSt((s) =>
      s.ui.survey ? { ...s, ui: { ...s.ui, survey: { ...s.ui.survey, ...patch }, done: done || s.ui.done } } : s,
    )

  /* ── Week 3: the calendar ── */
  const [postLeaving, leavePost] = useLeave()
  const connectCalendar = () => leavePost(setUiLater({ post: false, cal: { sent: {} } }))
  const calSend = (i: number) => {
    const m = CAL_MEETS[i]
    setSt((s) => ({
      ...s,
      rows: [
        ...s.rows.map((r) => ({ ...r, isNew: false, fresh: false })),
        { ...invitedRow(`cal${i}`, m.name, m.email, '12/14/2026'), isNew: true, fresh: true },
      ],
      ui: { ...s.ui, done: true, cal: { sent: { ...(s.ui.cal?.sent ?? {}), [i]: true } } },
    }))
  }

  /* ── Day 2: Knomee's reminder, open in Alex's inbox ── Its button starts
     an invite; closing it is the end of the day's story either way. */
  const [inboxLeaving, leaveInbox] = useLeave()
  const closeInbox = () =>
    leaveInbox(laterOnThisStep((s) => ({ ...s, ui: { ...s.ui, modal: null, done: true } })))
  const inboxCta = () => {
    setSt((s) => ({ ...s, ui: { ...s.ui, modal: null, done: true } }))
    openInvite()
  }

  /* ── Day 4: the one question ── */
  const [askLeaving, leaveAsk] = useLeave()
  const closeAsk = () => leaveAsk(setUiLater({ modal: null }))
  const answerAsk = (i: number) => {
    setAskAnswer(ASK[i])
    const ask = { ...ui.ask, answer: i }
    if (i === 0) {
      /* See the email: the invite, with its email, opens in its place. */
      setSt((s) => ({ ...s, ui: { ...s.ui, ask, done: true, modal: null } }))
      openInvite()
    } else if (i === 1) {
      /* Talk it through: the Knomee team hears from him. */
      setSt((s) => ({
        ...s,
        ui: { ...s.ui, ask, done: true, modal: null, view: 'chat', chat: 'help', notif: false, notifOpen: false, auto: 'notif' },
      }))
    } else {
      setSt((s) => ({ ...s, ui: { ...s.ui, ask, done: true } }))
    }
  }

  /* ── The team's chat: its notification opens the alert ── */
  const [notifLeaving, leaveNotif] = useLeave(160)
  const openNotif = () =>
    leaveNotif(laterOnThisStep((s) => ({ ...s, ui: { ...s.ui, notif: false, notifOpen: true, done: true } })))

  /* ── The welcome banner and the Invite tip ── */
  const [bannerLeaving, leaveBanner] = useLeave()
  const [tipLeaving, leaveTip] = useLeave()

  /* ── Emails opened from the notes ── */
  const [mailLeaving, leaveMail] = useLeave()
  const mailFrom = useRef<HTMLElement | null>(null)
  const openMail = (k: ExtraKey, from: HTMLElement) => {
    mailFrom.current = from
    setSt((s) => ({ ...s, mail: k }))
  }
  const closeMail = useCallback(() => {
    leaveMail(() => {
      setSt((s) => (s.mail ? { ...s, mail: null } : s))
      const back = mailFrom.current
      if (back && document.body.contains(back)) back.focus()
    })
  }, [leaveMail])

  /* ── Keys ── Arrows step through; Enter, Space or Esc open a day from its
     intro; Esc closes an open email. Typing is left alone. */
  const keys = useRef({ st, goTo, closeIntro, closeMail, closeInbox, closeAsk, closePlaybook })
  keys.current = { st, goTo, closeIntro, closeMail, closeInbox, closeAsk, closePlaybook }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const { st: s, goTo: go, closeIntro: openDay, closeMail: shut, closeInbox: shutInbox, closeAsk: shutAsk } =
        keys.current
      if (s.mail) {
        if (e.key === 'Escape') shut()
        return
      }
      if (s.intro) {
        if (['Enter', ' ', 'ArrowRight', 'Escape'].includes(e.key)) {
          e.preventDefault()
          openDay()
        }
        if (e.key === 'ArrowLeft') go(s.idx - 1)
        return
      }
      if (s.ui.modal) {
        /* The invite's window closes itself on Esc. */
        if (e.key === 'Escape' && s.ui.modal === 'mail') shutInbox()
        if (e.key === 'Escape' && s.ui.modal === 'ask') shutAsk()
        return
      }
      if (s.ui.drawer && e.key === 'Escape') {
        keys.current.closePlaybook()
        return
      }
      if (e.key === 'ArrowRight') go(s.idx + 1)
      if (e.key === 'ArrowLeft') go(s.idx - 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const next = () => (st.intro ? closeIntro() : goTo(idx + 1))

  /* ── The app ── */
  const stats = useMemo(() => statsOf(rows), [rows])
  const freshRows = useMemo(() => new Set(rows.filter((r) => r.fresh).map((r) => r.name)), [rows])
  const noop = () => undefined
  const tipOn = ui.tip && !ui.modal && !st.intro

  /* Clicks on anything in the app that isn't part of the story stop here. */
  const guard = (e: ReactMouseEvent) => {
    const t = e.target as Element
    if (!t.closest(LIVE)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div
      ref={root}
      className={`adoption-demo${labelsOn ? ' labels-on' : ''}`}
      style={{ '--brand-bar': ACME.primary } as CSSProperties}
      data-beckon={tipOn ? '' : undefined}
    >
      <h1 className="ad-sr-only">
        Knomee adoption demo: how Intercom guides a new advisor from first login to a habit, inside the ACME
        advisor dashboard
      </h1>
      <DemoBar
        idx={idx}
        introsOn={introsOn}
        onIntros={setIntrosOn}
        labelsOn={labelsOn}
        onLabels={setLabelsOn}
        pulse={ui.done && idx < STEPS.length - 1}
        onRestart={restart}
        onBack={() => goTo(idx - 1)}
        onNext={next}
        onExit={onExit}
      />
      <main className="ad-stage">
        <section
          className={`ad-device${entering ? ' ad-entering' : ''}`}
          ref={device}
          aria-label="ACME advisor dashboard"
        >
          <div className="ad-scroll" ref={scroller}>
            <div className="ad-zoom" onClickCapture={guard} key={`${st.idx}-${st.visit}`}>
              <div className="page brand-client">
                <TopBar logo={ACME.logo} cobrand="left" />
                {ui.drawer ? (
                  <main className="content content-profile">
                    <ProspectProfileScreen
                      prospect={rows.find((r) => r.id === 'sarah') ?? rows[0]}
                      initialTab="toolkit"
                      onBack={closePlaybook}
                      onConvert={noop}
                      onToast={noop}
                    />
                  </main>
                ) : (
                <main className="content">
                  {kit.tabs}
                  {ui.welcome && (
                    <Banner
                      title="Welcome, Alex."
                      action="Show me"
                      onAction={() => goTo(1)}
                      onDismiss={() => leaveBanner(setUiLater({ welcome: false }))}
                      leaving={bannerLeaving}
                    >
                      This is where you see what matters to prospects before you meet them.
                    </Banner>
                  )}
                  {rows.length === 0 ? (
                    <kit.EmptyScreen variant="prospects" onInvite={openInvite} />
                  ) : (
                    <kit.ProspectsScreen
                      rows={rows}
                      stats={stats}
                      rowClassName={(p) => (freshRows.has(p.name) ? 'ad-row-enter' : undefined)}
                      onInvite={openInvite}
                      onConvert={noop}
                      onResend={noop}
                      onDownload={noop}
                      onOpenProfile={openPlaybook}
                      renderAction={(p) =>
                        ui.nudge && p.name === 'Sarah Mitchell' && p.tier === 'incomplete' ? (
                          <NudgeCell text={p.topAction} sent={ui.nudge.sent} onNudge={openNudge} />
                        ) : undefined
                      }
                      afterMetrics={ui.cal && <ComingUp sent={ui.cal.sent} onSend={calSend} />}
                    />
                  )}
                </main>
                )}
              </div>
            </div>
          </div>
          <kit.PoweredBy />
          <div className="ic-layer">
            {tipOn && (
              <AnchoredTip
                key={`tip-${st.idx}-${st.visit}`}
                anchor={() => device.current?.querySelector<HTMLElement>('.toolbar .btn-primary') ?? null}
                device={device}
                scroller={scroller}
                leaving={tipLeaving}
                onClose={() => leaveTip(setUiLater({ tip: false }))}
              >
                Meeting someone this week? Click <b>Invite</b> to add them.
              </AnchoredTip>
            )}
            {ui.rowTip && !ui.drawer && !ui.modal && !st.intro && (
              <>
                <Beacon
                  key={`beacon-${st.idx}-${st.visit}`}
                  anchor={() => device.current?.querySelector<HTMLElement>('.prospects-table .name-link-btn') ?? null}
                  device={device}
                  scroller={scroller}
                />
                <AnchoredTip
                  key={`rowtip-${st.idx}-${st.visit}`}
                  side="left"
                  anchor={() => device.current?.querySelector<HTMLElement>('.prospects-table .name-link-btn') ?? null}
                  device={device}
                  scroller={scroller}
                  leaving={rowTipLeaving}
                  onClose={() => leaveRowTip(setUiLater({ rowTip: false }))}
                >
                  <b>Sarah finished.</b> Click her name to see her playbook.
                </AnchoredTip>
              </>
            )}
            {ui.survey && !ui.modal && !st.intro && (
              <Survey
                answer={ui.survey.answer}
                details={ui.survey.details}
                sent={ui.survey.sent}
                leaving={surveyLeaving}
                onAnswer={(answer) => setSurvey({ answer, details: '', sent: false }, true)}
                onDetails={(details) => setSurvey({ details })}
                onSend={() => setSurvey({ sent: true }, true)}
                onClose={() => leaveSurvey(setUiLater({ survey: null }))}
                onInvite={openInvite}
              />
            )}
            {ui.post && !st.intro && (
              <Post leaving={postLeaving} onConnect={connectCalendar} onLater={() => leavePost(setUiLater({ post: false }))} />
            )}
            <Launcher />
          </div>
          {ui.modal === 'invite' && ui.invite && (
            <ComposeModal
              key={`invite-${st.idx}-${st.visit}`}
              Compose={kit.InviteCompose}
              title="Invite"
              sample={FIRST_INVITE}
              to={ui.invite.email}
              known={{
                'Advisor Name': ALEX.name,
                'Firm Name': ALEX.firm,
                'First Name': firstName(ui.invite.name),
              }}
              brand={ACME}
              onSent={inviteSent}
              onClose={closeInvite}
            />
          )}
          {ui.modal === 'nudge' && (
            <ComposeModal
              key={`nudge-${st.idx}-${st.visit}`}
              Compose={kit.InviteCompose}
              title="Nudge Sarah"
              sample={NUDGE_EMAIL}
              to="sara.mitchell@email.com"
              known={{ 'Advisor Name': ALEX.name, 'Firm Name': ALEX.firm, 'First Name': 'Sarah' }}
              brand={ACME}
              onSent={nudgeSent}
              onClose={() => setSt((s) => ({ ...s, ui: { ...s.ui, modal: null } }))}
            />
          )}
          {ui.view === 'chat' && (
            <div className="ad-chat-layer">
              <TeamChat
                kind={ui.chat}
                askAnswer={askAnswer}
                notif={ui.notif}
                notifLeaving={notifLeaving}
                notifOpen={ui.notifOpen}
                onOpenNotif={openNotif}
              />
            </div>
          )}
          {ui.modal === 'mail' && (
            <>
              <div className={`ad-scrim${inboxLeaving ? ' leaving' : ''}`} onClick={closeInbox} />
              <MailWindow
                k="alexNudge"
                sent={sent}
                nudge={null}
                brand={ACME}
                inDevice
                leaving={inboxLeaving}
                onClose={closeInbox}
                onCta={inboxCta}
              />
            </>
          )}
          {ui.modal === 'ask' && (
            <AskModal
              answer={ui.ask.answer}
              text={ui.ask.text}
              sent={ui.ask.sent}
              leaving={askLeaving}
              onAnswer={answerAsk}
              onText={(text) => setSt((s) => ({ ...s, ui: { ...s.ui, ask: { ...s.ui.ask, text } } }))}
              onSend={() => setSt((s) => ({ ...s, ui: { ...s.ui, ask: { ...s.ui.ask, sent: true } } }))}
              onClose={closeAsk}
            />
          )}
          {st.intro && (
            <div className="ad-intro-layer">
              <IntroScreen day={dayOf(st.idx)} leaving={introLeaving} onContinue={closeIntro} />
            </div>
          )}
        </section>
        <NotesPanel
          idx={idx}
          nudged={!!ui.nudge?.sent}
          nudge={ui.nudge?.draft ?? null}
          sent={sent}
          hint={st.hint}
          onGoto={goTo}
          onOpenMail={openMail}
        />
      </main>
      {st.mail && (
        <div className="ad-mail-layer">
          <div className={`mail-scrim${mailLeaving ? ' leaving' : ''}`} onClick={closeMail} />
          <MailWindow
            k={st.mail}
            sent={sent}
            nudge={ui.nudge?.draft ?? null}
            brand={ACME}
            leaving={mailLeaving}
            onClose={closeMail}
          />
        </div>
      )}
    </div>
  )
}
