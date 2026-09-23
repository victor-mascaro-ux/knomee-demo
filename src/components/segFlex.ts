/* A tier bar segment's share. An empty tier still gets a narrow slot — an
   eighth of the bar's weight — so it can be seen, disabled and grey, rather
   than vanishing and taking its legend with it. */
export function segFlex(n: number, all: number[]) {
  const total = all.reduce((a, b) => a + (b || 0), 0)
  return n || Math.max(0.001, total / 8)
}
