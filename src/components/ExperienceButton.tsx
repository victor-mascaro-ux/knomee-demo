/* The foot of a profile's left rail: the way into that person's own
   experience — the journey they take on their phone. It opens on the phone;
   the D panel switches it to the desktop version. */

export default function ExperienceButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="pp-experience" type="button" onClick={onClick}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
        <path d="M10.5 18.5h3" />
      </svg>
      Open Experience
    </button>
  )
}
