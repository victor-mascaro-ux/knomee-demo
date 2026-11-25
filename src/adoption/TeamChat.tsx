/* The Knomee team's own chat workspace, dark, open on #acme-pilot: where the
   alert about Alex lands, for Gayathri to act on. Drawn here as a picture of
   a chat app (plain outline icons, no vendor's marks), with a desktop
   notification that opens the alert. Only the notification does anything. */

import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Mark } from './icons'

/* Outline icons for the workspace, one path each. */
const SKI = {
  menu: 'M4 7h16M4 12h16M4 17h16',
  panel: 'M5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9A2.5 2.5 0 0 1 5.5 5zM9.5 5v14',
  back: 'M19 12H5M11 6l-6 6 6 6',
  fwd: 'M5 12h14M13 6l6 6-6 6',
  hist: 'M12 4a8 8 0 1 1-7.4 5M4 4v5h5M12 8v4l3 2',
  search: 'M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM16 16l4.5 4.5',
  help: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 17h.01',
  min: 'M6 12h12',
  max: 'M7.5 6.5h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z',
  close: 'M7 7l10 10M17 7L7 17',
  home: 'M4 11l8-6.5 8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z',
  dms: 'M4 5.5h11v8H8.5L4 17zM18 9h2v9l-3-2.5h-6v-2',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0',
  files: 'M8 3.5h6.5L19 8v12.5H8zM14.5 3.5V8H19M5 7v14.5h11',
  todo: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM8.5 12.2l2.3 2.3 4.7-4.9',
  tools:
    'M8 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM16 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM8 13.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM16 13.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  plus: 'M12 5v14M5 12h14',
  moon: 'M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10z',
  gear: 'M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM12 3l1.5 2.2 2.6-.5.6 2.6 2.3 1.4-1 2.3 1 2.3-2.3 1.4-.6 2.6-2.6-.5L12 21l-1.5-2.2-2.6.5-.6-2.6-2.3-1.4 1-2.3-1-2.3 2.3-1.4.6-2.6 2.6.5z',
  compose: 'M11 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V13M17.5 3.5l3 3L12 15H9v-3z',
  find: 'M4 6h11M4 11h6M4 16h5M15.5 11a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM18 17l2.5 2.5',
  threads: 'M5 5h14v10h-7l-4 4v-4H5z',
  huddle: 'M4.5 15v-3a7.5 7.5 0 0 1 15 0v3M4.5 14h3v5.5h-1.5a1.5 1.5 0 0 1-1.5-1.5zM19.5 14h-3v5.5h1.5a1.5 1.5 0 0 0 1.5-1.5z',
  sent: 'M4 12l16-7-6 15-2.5-6zM11.5 14L20 5',
  saved: 'M7 4h10v16l-5-3.5L7 20z',
  dir: 'M6.5 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-11zM12 8a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM8.5 17c.6-1.7 1.9-2.6 3.5-2.6s2.9.9 3.5 2.6',
  star: 'M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z',
  hash: 'M9 4L7 20M17 4l-2 16M4.5 9h16M3.5 15h16',
  chans:
    'M6 3.5h12A2.5 2.5 0 0 1 20.5 6v12a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V6A2.5 2.5 0 0 1 6 3.5zM10 7.5l-1.5 9M15.5 7.5l-1.5 9M7.5 10.5h10M6.5 14h10',
  lock: 'M6.5 11h11v9h-11zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  down: 'M7 10l5 5 5-5',
  people:
    'M9 5a3.2 3.2 0 1 1 0 6.4A3.2 3.2 0 0 1 9 5zM3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14c1.8.6 3 2.3 3 5.5',
  kebab: 'M12 5h.01M12 12h.01M12 19h.01',
  canvas: 'M6 3.5h12a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5zM8 9h8M8 13h8M8 17h5',
  clip: 'M9 13.5l5-5a2.5 2.5 0 0 1 3.5 3.5l-6 6a4 4 0 0 1-5.7-5.7l5.2-5.2',
  pin: 'M9 3.5h6l-1 5.5 3.5 3.5h-11L10 9zM12 12.5V20',
  folder: 'M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  ol: 'M10 6h10M10 12h10M10 18h10M4.5 5l1.5-1v5M4 14.5h2.5l-2.5 3.5h2.5',
  ul: 'M10 6h10M10 12h10M10 18h10M5 6h.01M5 12h.01M5 18h.01',
  quote: 'M5.5 5v14M10 8h9M10 12h9M10 16h6',
  code: 'M9 8l-4 4 4 4M15 8l4 4-4 4',
  cblock: 'M5.5 5h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM10 10l-2 2 2 2M14 10l2 2-2 2',
  smile: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM8.5 14c.9 1.3 2 2 3.5 2s2.6-.7 3.5-2M9 9.5h.01M15 9.5h.01',
  at: 'M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.3 6.7',
  video: 'M5 7h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM16 11l5-3v8l-5-3',
  mic: 'M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3zM5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5',
  slash: 'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM14 8l-4 8',
  send: 'M4.5 12L20 4.5 16 20l-4-6.5zM12 13.5l8-9',
  addrx: 'M11 3.5a8 8 0 1 0 8 8.5M8 13.5c.8 1.2 1.8 1.8 3 1.8s2.2-.6 3-1.8M8.5 9h.01M13.5 9h.01M18 2.5v5M15.5 5h5',
} as const

type IconKey = keyof typeof SKI

function Ski({ k, cls }: { k: IconKey; cls?: string }) {
  return (
    <svg className={`i${cls ? ` ${cls}` : ''}`} viewBox="0 0 24 24" aria-hidden>
      <path d={SKI[k]} />
    </svg>
  )
}

/* The workspace is set in Lato, as such apps are; it is fetched from Google
   Fonts, where the product's Poppins comes from, the first time the page
   shows. */
const LATO = 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap'
function useLato() {
  useEffect(() => {
    if (document.querySelector(`link[href="${LATO}"]`)) return
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = LATO
    document.head.appendChild(l)
  }, [])
}

function Item({ icon, label, cls, extra }: { icon: IconKey; label: string; cls?: string; extra?: ReactNode }) {
  return (
    <span className={`sk-it${cls ? ` ${cls}` : ''}`}>
      <Ski k={icon} />
      <span>{label}</span>
      {extra}
    </span>
  )
}
const Channel = ({ name, cls, extra, icon = 'hash' }: { name: string; cls?: string; extra?: ReactNode; icon?: IconKey }) => (
  <Item icon={icon} label={name} cls={`ch${cls ? ` ${cls}` : ''}`} extra={extra} />
)

function BotMessage({
  time,
  i,
  hl,
  children,
  extra,
}: {
  time: string
  i: number
  hl?: boolean
  children: ReactNode
  extra?: ReactNode
}) {
  return (
    <div className={`sk-m${hl ? ' hl' : ''}`} style={{ '--i': i } as CSSProperties}>
      <span className="sk-av bot">
        <Mark />
      </span>
      <div>
        <div className="sk-meta">
          <b>Knomee</b>
          <span className="app">APP</span>
          <time>{time}</time>
        </div>
        <p>{children}</p>
        {extra}
      </div>
    </div>
  )
}

const Divider = ({ label }: { label: string }) => (
  <div className="sk-div">
    <span>
      {label}
      <Ski k="down" />
    </span>
  </div>
)

export default function TeamChat({
  kind,
  askAnswer,
  notif,
  notifLeaving,
  notifOpen,
  onOpenNotif,
}: {
  /** A week with no invite (Day 7), or Alex asking to talk it through (Day 4). */
  kind: 'week' | 'help'
  /** What Alex answered on Day 4, if he did. */
  askAnswer: string | null
  notif: boolean
  notifLeaving: boolean
  /** The notification was clicked: its message is picked out. */
  notifOpen: boolean
  onOpenNotif: () => void
}) {
  useLato()
  const help = kind === 'help'
  const alertText = help
    ? 'Alex Advisor asked to talk it through before his first invite.'
    : 'Alex Advisor hasn’t invited anyone in a week. Give him a call?'
  const nav: [IconKey, ReactNode, boolean?][] = [
    ['home', 'Home', true],
    ['dms', 'DMs'],
    ['bell', 'Activity'],
    ['files', 'Files'],
    ['todo', 'To-dos'],
    [
      'tools',
      <>
        Agents
        <br />
        &amp; tools
      </>,
    ],
  ]
  return (
    <>
      <div className="sk" aria-label="Knomee team chat, #acme-pilot">
        <div className="sk-top">
          <div className="sk-top-l">
            <Ski k="menu" />
            <Ski k="panel" />
            <span className="sp" />
            <Ski k="back" />
            <Ski k="fwd" cls="dim" />
            <Ski k="hist" />
          </div>
          <div className="sk-search">
            <Ski k="search" />
            Search knomee
          </div>
          <div className="sk-top-r">
            <Ski k="help" />
            <Ski k="min" />
            <Ski k="max" />
            <Ski k="close" />
          </div>
        </div>
        <div className="sk-body">
          <div className="sk-rail">
            <span className="sk-ws">
              <Mark />
            </span>
            <Ski k="plus" />
          </div>
          <div className="sk-win">
            <nav className="sk-nav" aria-hidden>
              {nav.map(([icon, label, on], k) => (
                <span key={k} className={`n${on ? ' on' : ''}`}>
                  <span className="t">
                    <Ski k={icon} />
                  </span>
                  {label}
                </span>
              ))}
              <span className="grow" />
              <span className="circ">
                <Ski k="plus" />
              </span>
              <span className="circ">
                <Ski k="moon" />
              </span>
              <span className="sk-me">G</span>
            </nav>
            <aside className="sk-side" aria-hidden>
              <div className="sk-side-h">
                <b>
                  knomee
                  <Ski k="down" />
                </b>
                <Ski k="gear" />
                <Ski k="compose" />
              </div>
              <div className="sk-find">
                <Ski k="find" />
                Find a conversation…
              </div>
              <div className="sk-list">
                <Item icon="threads" label="Threads" />
                <Item icon="huddle" label="Huddles" />
                <Item icon="sent" label="Drafts & sent" />
                <Item icon="saved" label="Saved" />
                <Item icon="dir" label="Directories" />
                <div className="sk-hr" />
                <Item icon="plus" label="Create a section" extra={<span className="tip">Tip</span>} />
                <div className="sk-sec">
                  <Item icon="star" label="Starred" />
                  <Channel name="demo" />
                  <Channel name="design" />
                  <Channel name="general" />
                  <Channel name="product" />
                  <Channel name="stand-up" />
                </div>
                <div className="sk-sec">
                  <Item icon="chans" label="Channels" />
                  <Channel name="acme-pilot" cls="on" />
                  <Channel name="prod-release" cls="b" extra={<span className="cnt">1</span>} />
                  <Channel name="competitors_partners" />
                  <Channel name="customersuccess" cls="b" />
                  <Channel name="fundraising" icon="lock" />
                  <Channel name="marketing" />
                  <Channel name="research-reading" />
                </div>
              </div>
            </aside>
            <main className="sk-main">
              <header className="sk-mh">
                <h2>
                  <Ski k="hash" />
                  acme-pilot
                </h2>
                <div className="sk-mh-r" aria-hidden>
                  <span>
                    <Ski k="people" />6
                  </span>
                  <span>
                    <Ski k="huddle" />
                    <Ski k="down" cls="s" />
                  </span>
                  <Ski k="bell" />
                  <Ski k="search" />
                  <Ski k="kebab" />
                </div>
              </header>
              <nav className="sk-tabs" aria-hidden>
                <span className="on">
                  <Ski k="threads" />
                  Messages
                </span>
                <span>
                  <Ski k="canvas" />
                  Canvas
                </span>
                <span>
                  <Ski k="clip" />
                  Files &amp; links
                </span>
                <span>
                  <Ski k="pin" />
                  Pins
                </span>
                <span>
                  <Ski k="folder" />
                  Bookmarks
                </span>
                <span>
                  <Ski k="plus" />
                </span>
              </nav>
              <div className="sk-msgs">
                <div>
                  <Divider label={help ? 'Yesterday' : 'Friday, December 4th'} />
                  <BotMessage
                    time="10:12 AM"
                    i={0}
                    extra={
                      <div className="sk-rx">
                        <span className="me">🎉 2</span>
                        <span className="add">
                          <Ski k="addrx" />
                        </span>
                      </div>
                    }
                  >
                    <b>Priya Shah</b> invited 2 prospects.
                  </BotMessage>
                  <BotMessage
                    time="3:40 PM"
                    i={1}
                    extra={
                      <div className="sk-rep">
                        <i>M</i>1 reply<small>Last reply {help ? 'yesterday' : 'Friday'}</small>
                      </div>
                    }
                  >
                    <b>Dana Brooks</b>’s prospect Leo Fischer finished his check-in.
                  </BotMessage>
                  <Divider label="Today" />
                  <BotMessage
                    time={help ? '11:02 AM' : '9:00 AM'}
                    i={2}
                    hl={notifOpen}
                    extra={
                      <div className="sk-att">
                        <div>
                          <h4>Alex Advisor · Acme Advisors</h4>
                          <dl>
                            <div>
                              <dt>First login</dt>
                              <dd>Mon, Nov 30</dd>
                            </div>
                            <div>
                              <dt>Invites sent</dt>
                              <dd>0</dd>
                            </div>
                            <div>
                              <dt>Reminder email</dt>
                              <dd>Opened Wed</dd>
                            </div>
                            <div>
                              <dt>{help ? 'His answer today' : 'His answer on Friday'}</dt>
                              <dd>{askAnswer ?? 'No answer yet'}</dd>
                            </div>
                          </dl>
                          <div className="sk-btns">
                            <span className="pri">Call Alex</span>
                            <span>Open in Intercom</span>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <span className="sk-at">@Gayathri</span>{' '}
                    {help ? (
                      <>
                        <b>Alex Advisor</b> asked to talk it through before his first invite. Reach out today?
                      </>
                    ) : (
                      <>
                        <b>Alex Advisor</b> hasn’t invited anyone in a week. Give him a call?
                      </>
                    )}
                  </BotMessage>
                </div>
              </div>
              <div className="sk-comp" aria-hidden>
                <div className="sk-tb">
                  <b>B</b>
                  <i>I</i>
                  <u>U</u>
                  <s>S</s>
                  <span className="sep" />
                  {(['link', 'ol', 'ul'] as IconKey[]).map((k) => (
                    <span key={k}>
                      <Ski k={k} />
                    </span>
                  ))}
                  <span className="sep" />
                  {(['quote', 'code', 'cblock'] as IconKey[]).map((k) => (
                    <span key={k}>
                      <Ski k={k} />
                    </span>
                  ))}
                </div>
                <div className="sk-ph">Message #acme-pilot</div>
                <div className="sk-cb">
                  <span className="plus">
                    <Ski k="plus" />
                  </span>
                  <span className="aa">Aa</span>
                  <span>
                    <Ski k="smile" />
                  </span>
                  <span>
                    <Ski k="at" />
                  </span>
                  <span className="sep" />
                  <span>
                    <Ski k="video" />
                  </span>
                  <span>
                    <Ski k="mic" />
                  </span>
                  <span className="sep" />
                  <span>
                    <Ski k="slash" />
                  </span>
                  <span className="send">
                    <Ski k="send" />
                  </span>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
      {notif && (
        <button className={`notif${notifLeaving ? ' leaving' : ''}`} type="button" onClick={onOpenNotif}>
          <span className="notif-hd">
            <span className="ws">
              <Mark />
            </span>
            knomee
            <span className="x">···</span>
          </span>
          <span className="notif-bd">
            <span className="notif-av">
              <Mark />
            </span>
            <span>
              <b>Knomee in #acme-pilot</b>
              <span>@Gayathri {alertText}</span>
            </span>
          </span>
        </button>
      )}
    </>
  )
}
