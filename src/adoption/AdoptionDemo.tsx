/* The Intercom adoption demo: a new advisor's first three weeks at Acme, step
 * by step. It is the burger menu's Empty State, switched on: the advisor's
 * real app on the left, wearing Acme's brand, with what Intercom adds over
 * it; on the right, the steps, the current one saying what happens and what
 * to click. Picking a step goes to it; the arrow keys step through. The same
 * switch, in this app's own burger menu, turns it off.
 *
 * Its story, copy and timing are the approved prototype's
 * (docs/adoption-demo/prototype.html). Its app is the product's own: the top
 * bar, the tab bar, the empty dashboard, the prospects table and the compose
 * window, handed in by App (kit.ts). Only what the product doesn't have — the
 * Intercom pieces and the steps — is drawn here.
 *
 * Buttons that aren't part of the story do nothing: the app is inert except
 * for its live controls (the burger's switch, the Invite button, and anything
 * of the demo's own marked data-ad-live).
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
import ProspectProfileScreen from '../screens/ProspectProfileScreen'
import ComposeModal, { ComposePanel, type Sent } from './ComposeModal'
import { ComingUp, NudgeCell, NudgeInsights } from './dashboard'
import { freshUi, invitedRow, rowsFor, sarahInvited, statsOf, type DemoRow, type Ui } from './engine'
import { AnchoredTip, Ask, Banner, Beacon, Launcher, Post, Survey } from './intercom'
import type { DemoKit } from './kit'
import MailWindow from './MailWindow'
import { useLeave, useRipples } from './motion'
import NotesPanel from './NotesPanel'
import { ALEX, ASK, CAL_MEETS, NOTE_TEXT, NUDGE, REMINDER, STEPS, firstName, stepIndex } from './steps'
import TeamChat from './TeamChat'
import { toast } from '../toast'
import './adoption.css'

const ACME = CLIENT_BRANDS.find((b) => b.id === 'acme') as ClientBrand

/** The controls in the app that are part of the story. Everything else in it
    is inert. */
const LIVE =
  '.menu-btn, .menu-toggle, .toolbar .btn-primary, .prospects-table .name-link-btn, .pp-crumb-link, [data-ad-live]'

/** Alex's first invite, as his draft starts: the Invite window's Email tab. */
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
  /** Bumped by picking the current step again: it opens afresh. */
  visit: number
  rows: DemoRow[]
  ui: Ui
}

function openStep(idx: number, visit: number): StepState {
  const id = STEPS[idx].id
  return { idx, visit, rows: rowsFor(id), ui: freshUi(id) }
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
  /** The burger's Empty State, switched off. */
  onExit: () => void
  kit: DemoKit
}) {
  const idx = Math.max(0, stepIndex(step))
  /* What Alex answered on Day 4: the team's alert quotes it on Day 7. */
  const [askAnswer, setAskAnswer] = useState<string | null>(null)
  const [visit, setVisit] = useState(0)

  const [st, setSt] = useState<StepState>(() => openStep(idx, 0))
  if (st.idx !== idx || st.visit !== visit) setSt(openStep(idx, visit))
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
      if (k === idx) setVisit((v) => v + 1)
      else onStep(STEPS[k].id)
    },
    [idx, onStep],
  )

  /* ── What arrives on its own ── A moment after the step opens: Alex's
     reminder email (Day 2), the one question (Day 4), the team's
     notification (Day 7, or after "Talk it through"). */
  useEffect(() => {
    const a = st.ui.auto
    if (!a) return
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
  }, [st.idx, st.visit, st.ui.auto])

  /* ── The app's scroll ── A step opens at the top; the first invite opens
     with the toolbar in view, where its tip points; Sarah finishing, with her
     row in view. */
  const device = useRef<HTMLElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const sc = scroller.current
    if (!sc) return
    sc.scrollTop = 0
    if (STEPS[st.idx].id === 'first-send') {
      const tb = sc.querySelector('.toolbar')
      if (tb) sc.scrollTop = Math.max(0, tb.getBoundingClientRect().top - sc.getBoundingClientRect().top - 160)
    }
    if (st.ui.rowTip) {
      const nm = sc.querySelector('.prospects-table .name-link-btn')
      if (nm) sc.scrollTop += nm.getBoundingClientRect().top - sc.getBoundingClientRect().top - 260
    }
  }, [st.idx, st.visit])

  /* ── Motion ── The page's own entrance (the product's fade-ups and drawn
     bars) plays when the page loads, and only then. A step change mounts
     the page afresh (Show me, a step picked, an arrow key), which would play
     it again: from then on it is finished before it is painted, so the page
     holds still. The story's own pieces (Intercom's, a row that has just
     arrived) still move as they arrive; the demo adds nothing to the
     product's elements; buttons that do something ripple where pressed. */
  const loaded = useRef(false)
  useLayoutEffect(() => {
    if (!loaded.current) {
      loaded.current = true
      return
    }
    const app = device.current?.querySelector('.ad-app')
    if (!app) return
    const hold = () => {
      for (const a of document.getAnimations()) {
        const name = (a as CSSAnimation).animationName
        const target = (a.effect as KeyframeEffect | null)?.target
        if (!name || name.startsWith('ad-') || !target || !app.contains(target)) continue
        if (a.effect?.getComputedTiming().iterations === Infinity) continue
        a.finish()
      }
    }
    hold()
    /* What mounts a beat later (a measured chart, a lazy cell) too. */
    const raf = requestAnimationFrame(hold)
    return () => cancelAnimationFrame(raf)
  }, [st.idx, st.visit])
  const root = useRef<HTMLDivElement>(null)
  useRipples(root)

  /* ── Inviting ── */
  /* ── Inviting ── The product's own Invite window, with a third tab only
     the demo has: Email, the custom invite. Alex copies his link (or its QR
     code) to send it himself, and once he has, closing the window is the
     invite gone out; or he sends the email, which closes it. Either way the
     person lands in his table. Closed with neither, nothing went, and on
     the first invite the tip comes back. */
  const shared = useRef(false)
  const openInvite = useCallback(() => {
    shared.current = false
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
  const closeInvite = () => {
    const out = shared.current
    shared.current = false
    setSt((s) => {
      const who = s.ui.invite
      if (!out || !who) {
        return {
          ...s,
          ui: { ...s.ui, modal: null, invite: null, tip: STEPS[s.idx].id === 'first-send' && s.rows.length === 0 },
        }
      }
      const row = who.next ? invitedRow('next', who.name, who.email, '12/04/2026') : sarahInvited(who.email)
      return {
        ...s,
        rows: [...s.rows.map((r) => ({ ...r, fresh: false })), { ...row, fresh: true }],
        ui: { ...s.ui, modal: null, invite: null, tip: false, survey: null },
      }
    })
  }

  /* ── Day 2: Sarah stopped halfway ── Alex can nudge her himself; if he
     does, Knomee's own reminder is off. */
  const openNudge = () => setSt((s) => ({ ...s, ui: { ...s.ui, modal: 'nudge' } }))
  const nudgeSent = (out: Sent) => {
    setSt((s) => ({
      ...s,
      ui: { ...s.ui, modal: null, nudge: { sent: true, draft: { subject: out.subject, body: out.body } } },
    }))
  }

  /* ── Day 3: Sarah's playbook ── Her name opens her page on its Prospect
     Playbook tab; its breadcrumb brings Alex back. */
  const openPlaybook = () =>
    setSt((s) => ({
      ...s,
      rows: s.rows.map((r) => ({ ...r, isNew: false, fresh: false })),
      ui: { ...s.ui, drawer: true, rowTip: false },
    }))
  const closePlaybook = () => setSt((s) => ({ ...s, ui: { ...s.ui, drawer: false } }))
  /* Her page opens, and closes, at the top: only when it does, so a step's
     own opening scroll (to Sarah's row) stands. */
  const drawerWas = useRef(ui.drawer)
  useLayoutEffect(() => {
    if (drawerWas.current === ui.drawer) return
    drawerWas.current = ui.drawer
    if (scroller.current) scroller.current.scrollTop = 0
  }, [ui.drawer])
  const [rowTipLeaving, leaveRowTip] = useLeave()

  /* ── Day 4: how did it go? ── */
  const [surveyLeaving, leaveSurvey] = useLeave()
  const setSurvey = (patch: Partial<NonNullable<Ui['survey']>>) =>
    setSt((s) => (s.ui.survey ? { ...s, ui: { ...s.ui, survey: { ...s.ui.survey, ...patch } } } : s))

  /* ── Week 3: the calendar ── */
  const [postLeaving, leavePost] = useLeave()
  const connectCalendar = () => leavePost(setUiLater({ post: false, cal: { sent: {} } }))
  const calSend = (i: number) => {
    const m = CAL_MEETS[i]
    toast(`Check-in sent to ${m.name}`)
    setSt((s) => ({
      ...s,
      rows: [
        ...s.rows.map((r) => ({ ...r, isNew: false, fresh: false })),
        { ...invitedRow(`cal${i}`, m.name, m.email, '12/14/2026'), isNew: true, fresh: true },
      ],
      ui: { ...s.ui, cal: { sent: { ...(s.ui.cal?.sent ?? {}), [i]: true } } },
    }))
  }

  /* ── Day 2 if no invite: Knomee's reminder, open in Alex's inbox ── Its
     button starts an invite. */
  const [inboxLeaving, leaveInbox] = useLeave()
  const closeInbox = () => leaveInbox(setUiLater({ modal: null }))
  const inboxCta = () => {
    setSt((s) => ({ ...s, ui: { ...s.ui, modal: null } }))
    openInvite()
  }

  /* ── Day 4 if no invite: the one question ── */
  const [askLeaving, leaveAsk] = useLeave()
  const closeAsk = () => leaveAsk(setUiLater({ modal: null }))
  const answerAsk = (i: number) => {
    setAskAnswer(ASK[i])
    const ask = { ...ui.ask, answer: i }
    if (i === 0) {
      /* See the email: the invite, with its email, opens in its place. */
      setSt((s) => ({ ...s, ui: { ...s.ui, ask, modal: null } }))
      openInvite()
    } else if (i === 1) {
      /* Talk it through: the Knomee team hears from him. */
      setSt((s) => ({
        ...s,
        ui: { ...s.ui, ask, modal: null, view: 'chat', chat: 'help', notif: false, notifOpen: false, auto: 'notif' },
      }))
    } else {
      setSt((s) => ({ ...s, ui: { ...s.ui, ask } }))
    }
  }

  /* ── The team's chat: its notification opens the alert ── */
  const [notifLeaving, leaveNotif] = useLeave(160)
  const openNotif = () => leaveNotif(setUiLater({ notif: false, notifOpen: true }))

  /* ── The welcome banner and the Invite tip ── */
  const [bannerLeaving, leaveBanner] = useLeave()
  const [tipLeaving, leaveTip] = useLeave()

  /* ── Keys ── Arrows step through; Esc closes what is open. Typing is left
     alone. */
  const keys = useRef({ st, goTo, closeInbox, closeAsk, closePlaybook })
  keys.current = { st, goTo, closeInbox, closeAsk, closePlaybook }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const { st: s, goTo: go } = keys.current
      if (s.ui.modal) {
        /* The invite's window closes itself on Esc. */
        if (e.key === 'Escape' && s.ui.modal === 'mail') keys.current.closeInbox()
        if (e.key === 'Escape' && s.ui.modal === 'ask') keys.current.closeAsk()
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

  /* ── The app ── */
  const stats = useMemo(() => statsOf(rows), [rows])
  const freshRows = useMemo(() => new Set(rows.filter((r) => r.fresh).map((r) => r.name)), [rows])
  const noop = () => undefined
  const tipOn = ui.tip && !ui.modal

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
      className="adoption-demo"
      style={{ '--brand-bar': ACME.primary } as CSSProperties}
    >
      <h1 className="ad-sr-only">
        Knomee adoption demo: how Intercom guides a new advisor from first login to a habit, inside the ACME
        advisor dashboard
      </h1>
      <main className="ad-stage">
        <section
          className="ad-device"
          ref={device}
          aria-label="ACME advisor dashboard"
        >
          <div className="ad-scroll" ref={scroller}>
            <div className="ad-app" onClickCapture={guard} key={`${st.idx}-${st.visit}`}>
              <div className="page brand-client">
                <TopBar
                  logo={ACME.logo}
                  cobrand="left"
                  emptyState
                  onEmptyState={(on) => {
                    if (!on) onExit()
                  }}
                />
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
                        insights={ui.nudge ? <NudgeInsights sent={ui.nudge.sent} onNudge={openNudge} /> : undefined}
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
            {ui.rowTip && !ui.drawer && !ui.modal && (
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
            {ui.survey && !ui.modal && (
              <Survey
                answer={ui.survey.answer}
                details={ui.survey.details}
                sent={ui.survey.sent}
                leaving={surveyLeaving}
                onAnswer={(answer) => setSurvey({ answer, details: '', sent: false })}
                onDetails={(details) => setSurvey({ details })}
                onSend={() => setSurvey({ sent: true })}
                onClose={() => leaveSurvey(setUiLater({ survey: null }))}
                onInvite={openInvite}
              />
            )}
            {ui.modal === 'ask' && (
              <Ask
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
            {ui.post && (
              <Post
                leaving={postLeaving}
                onConnect={connectCalendar}
                onLater={() => leavePost(setUiLater({ post: false }))}
              />
            )}
            <Launcher />
          </div>
          {ui.modal === 'invite' && ui.invite && (
            <kit.InviteModal
              key={`invite-${st.idx}-${st.visit}`}
              initialKind="prospect"
              onShared={() => {
                shared.current = true
              }}
              emailPanel={(kind) =>
                kind === 'prospect' && ui.invite ? (
                  <ComposePanel
                    Compose={kit.InviteCompose}
                    sample={FIRST_INVITE}
                    to={ui.invite.email}
                    known={{
                      'Advisor Name': ALEX.name,
                      'Firm Name': ALEX.firm,
                      'First Name': firstName(ui.invite.name),
                    }}
                    brand={ACME}
                    onSent={() => {
                      shared.current = true
                      closeInvite()
                    }}
                  />
                ) : null
              }
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
                email={REMINDER}
                brand={ACME}
                inDevice
                leaving={inboxLeaving}
                onClose={closeInbox}
                onCta={inboxCta}
              />
            </>
          )}
        </section>
        <NotesPanel idx={idx} onGoto={goTo} />
      </main>
    </div>
  )
}
