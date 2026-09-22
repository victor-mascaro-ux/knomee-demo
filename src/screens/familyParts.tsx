/* The two pieces both family tabs are built out of: whose column this is, and
   the card that holds one column per member. They live here rather than in
   either tab so the Family ID and Family Insights cannot drift into two
   different ways of saying the same thing. */

import type { ReactNode, RefObject } from 'react'
import { Portrait } from './ClientProfileScreen'

/* Whose column this is. Every column in every card is headed by it, so a row
   read halfway down a long card still belongs to somebody. */
export function Who({ name }: { name: string }) {
  return (
    <span className="fid-who">
      <Portrait name={name} size="sm" />
      <b>{name}</b>
    </span>
  )
}

/* The Financial ID's card and head, with a column per member under it. */
export function FamilyCard<T extends { name: string }>({
  members,
  icon,
  title,
  head,
  foot,
  bodyRef,
  render,
}: {
  members: T[]
  icon: string
  title: string
  head?: ReactNode
  foot?: ReactNode
  bodyRef?: RefObject<HTMLDivElement>
  render: (m: T) => ReactNode
}) {
  return (
    <section className="pp-card">
      <div className="pp-card-head">
        <span className="pp-card-title">
          <img className="pp-card-ic" src={icon} alt="" />
          {title}
        </span>
        {head}
      </div>
      <div className="fid-split" ref={bodyRef}>
        {members.map((m) => (
          <div className="fid-cell" key={m.name}>
            <Who name={m.name} />
            {render(m)}
          </div>
        ))}
      </div>
      {foot}
    </section>
  )
}
