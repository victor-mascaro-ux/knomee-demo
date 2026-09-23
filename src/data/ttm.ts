/* The readiness ladder, in the client's own words.
 *
 * Five stages, and for each the sentence a person says about a goal when they
 * are standing on that rung. The assessment does not offer these as answers —
 * it asks four plainer questions and works the rung out — so this is the
 * reading it hands back: what being there sounds like, in their own voice.
 *
 * The advisor side words its own set about a practice rather than a goal, and
 * those live with the sheet that computes them.
 */

export const TTM_STATEMENTS: Record<string, string> = {
  'Pre-Contemplation':
    'I do not feel like any changes are needed, or have no intention of making changes to tackle a goal.',
  Contemplation:
    'I feel like some changes are needed, but I’m not actually planning on doing anything anytime soon.',
  Preparation:
    'I feel like some changes are needed, and I’m getting ready to take action. I do not know what actions to take.',
  Action:
    'I know what actions are needed and I’m changing my behavior, or have already begun taking action toward change.',
  Maintenance: 'I have taken action toward change and want to stay on track.',
}
