/* What an adventure asks and what it hands back, said on its intro before
 * Get Started: two short lines, so the advisor knows what the next minutes
 * are and what they will have at the end of them — and that it goes on the
 * Business ID they are building toward.
 */

export interface Gets {
  /** What they will do, starting "You'll…" in the sentence it sits in. */
  do: string
  /** What they will come away with. */
  get: string
}

export function IntroGets({ gets }: { gets: Gets }) {
  return (
    <dl className="jf-gets">
      <div className="jf-gets-row">
        <dt>You’ll</dt>
        <dd>{gets.do}</dd>
      </div>
      <div className="jf-gets-row">
        <dt>You’ll get</dt>
        <dd>{gets.get}</dd>
      </div>
    </dl>
  )
}
