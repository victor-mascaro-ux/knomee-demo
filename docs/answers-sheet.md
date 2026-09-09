# Recording the advisor flow's answers

The answerable flow (`#/advisor-self`) writes every sitting to a Google Sheet in
Drive — **one tab per person, one row per sitting**.

- **The spreadsheet:** [Knomee — Advisor Flow Answers](https://docs.google.com/spreadsheets/d/1BS4zugcZQQceTAUfBjrVfx6BzweonWHwXppIgNIHBmk/edit)
  (id `1BS4zugcZQQceTAUfBjrVfx6BzweonWHwXppIgNIHBmk`)
- **The page that fills it:** `src/data/advisorRecord.ts`
- **The screen that shows what has been recorded:** the phone's menu →
  *Recorded answers*

## Why there is a script in the middle

The prototype is a static page on GitHub Pages. It has no server, no secrets it
can keep, and no way to hold a Google credential — so it cannot call the Sheets
API itself. What it can do is POST a row to something that already has
permission to write to the sheet. That something is an Apps Script web app bound
to the spreadsheet: it runs as you, it is the only thing holding access, and the
page only ever knows its URL.

Two consequences worth knowing:

- **A post is fire-and-forget.** The response comes back opaque (the page and
  the script are on different origins), so the app can tell you a row was *sent*
  and never that it *arrived*. The recording screen says exactly that rather
  than showing a tick it cannot stand behind — check the spreadsheet.
- **Nothing depends on the network.** Every sitting is written to the device as
  it is answered and stays there. A restart resets the Business ID; it does not
  touch the record. If the URL is not set, or the room has no wifi, the answers
  are still there to post later or to download as CSV.

## One-time setup

1. Open the spreadsheet, then **Extensions → Apps Script**.
2. Delete whatever is in `Code.gs` and paste in
   [`answers-sheet-script.gs`](./answers-sheet-script.gs).
3. **Deploy → New deployment → Web app.**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
4. Copy the deployment's `…/exec` URL.
5. In the app: phone menu → **Recorded answers** → paste the URL → **Save the
   URL**.

That URL is stored in the browser, so it is pasted once per device. To bake it
in for every device instead, set `DEFAULT_ENDPOINT` in
`src/data/advisorRecord.ts` and rebuild.

> The URL is a write-only endpoint to one spreadsheet, but it is
> unauthenticated: anyone who has it can append rows. It is fine for a demo
> sheet of placeholder answers. Do not point it at anything you would mind
> strangers writing to, and redeploy (which issues a new URL) if it leaks.

## Testing it without answering anything

Three tests, cheapest first. The first two do not involve the prototype at all,
which is the point: when something is wrong you want to know *which* hop broke,
and re-answering thirty questions to find out is no way to spend an afternoon.
All three are also listed on the **Recorded answers** screen.

### 1. The script against the sheet — no deployment, no app

In the Apps Script editor, choose **`testRow`** from the function dropdown and
press **Run**. Authorise it the first time.

- ✅ A `_test` tab appears with one row on it.
- **Run it a second time.** The row is *updated*, not duplicated — that is the
  `Sitting ID` upsert the real rows depend on. The execution log says
  `Wrote updated row 2`.
- ❌ An error here is the script or the binding, and nothing else is worth
  looking at yet.

### 2. The deployment — no app

Open your `/exec` URL in a browser tab. Then open it again with `?test=1` on
the end.

- ✅ Plain: `{"ok":true,"service":"knomee advisor answers","tabs":[…]}`
- ✅ With `?test=1`: the same plus `"wrote":{…,"action":"appended"}`, and
  another row on `_test`.
- ❌ A Google sign-in page means *Who has access* is not **Anyone**. Fix that
  and **redeploy** — editing a deployment's settings needs a new version.

This is the **only test on this path that answers for itself**. Everything
after it asks you to go and look at the sheet, because a post from the
prototype comes back opaque by design.

### 3. The prototype, on the real code path

**Recorded answers → Post a test row.** Same method, same headers, same body
shape as a finished sitting; it just goes to `_test`.

- ✅ A `_test` row whose Note says *Posted from the prototype*.
- ❌ Nothing in the sheet, having passed test 2, means the URL saved in the
  browser is not the one you deployed.

The message the app shows says the row was **sent** and nothing more. It cannot
tell you it arrived, so it does not pretend to.

### And a full sitting in four taps

When you want a real row rather than a test one, don't answer anything: phone
menu → **Fill in the sample answers** (loads the worked example into your own
sheet) → menu → **Restart for the next person**, which records it and posts it.
That writes a complete, realistic tab in about ten seconds.

Delete the `_test` tab whenever you like — nothing reads it.

## What lands in the sheet

One tab per person, named from the "Who's answering?" screen (blank →
`Anonymous`). The header row is written when a tab is created, and a new column
is appended if the flow ever grows a question.

| Group | Columns |
| --- | --- |
| Who and when | `Sitting ID`, `Recorded at`, `Name`, `Role`, `Assets`, `Firm`, `Completed` |
| What they answered | one column per question — a scale set spends a column per statement (`cf-q.1` … `cf-q.6`) and the attention grid one per area, so a column can be read down |

**Nothing computed goes on a tab.** The EQ, the tier, the three dimensions, the
readiness stage, the confidence band, the route and the three questions the flow
hands back are all rules over the answers in these same rows — `derive()` in
`src/data/advisorAnswers.ts`. Putting them in the sheet would mean a tab holding
two different kinds of thing, and a stale copy of the derived half the moment a
rule changes.

So: **the sheet records what somebody answered. The Business ID is what those
answers mean.** One is the record; the other is read off it, live, every time.
A row is a complete record of a sitting — every question, verbatim — so a
Business ID can be rebuilt from it exactly.

`Sitting ID` is the key: sending the same sitting twice **updates** its row
rather than adding a second one, so an operator can post mid-flow and again at
the end without making a mess.

Every figure in these sheets is placeholder demo data unless a real person
typed it.
