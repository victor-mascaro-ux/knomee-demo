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

## What lands in the sheet

One tab per person, named from the "Who's answering?" screen (blank →
`Anonymous`). The header row is written when a tab is created, and a new column
is appended if the flow ever grows a question.

| Group | Columns |
| --- | --- |
| Identity | `Sitting ID`, `Recorded at`, `Name`, `Role`, `Assets`, `Firm`, `Completed` |
| The read | `EQ`, `Tier`, `Intent`, `Clarity`, `Receptivity`, `Stage`, `Confidence`, `Route` |
| The answers | one column per question — a scale set spends a column per statement (`cf-q.1` … `cf-q.6`) and the attention grid one per area, so a column can be read down |
| The output | `Question 1`, `Question 2`, `Question 3` — what the flow told them to go and ask |

`Sitting ID` is the key: sending the same sitting twice **updates** its row
rather than adding a second one, so an operator can post mid-flow and again at
the end without making a mess.

Every figure in these sheets is placeholder demo data unless a real person
typed it.
