/**
 * Knomee — advisor flow answers.
 *
 * Bound to the "Knomee — Advisor Flow Answers" spreadsheet and deployed as a
 * web app, this is the only thing holding permission to write to it. The
 * prototype at #/advisor-self posts one sitting at a time; this finds or makes
 * the tab for that person, aligns the row to the header, and writes it.
 *
 * Setup and the reasoning behind it: docs/answers-sheet.md
 *
 * Expected body (text/plain, so the page can post it cross-origin):
 *   { "tab": "Jordan Ellis",
 *     "headers": ["Sitting ID", "Recorded at", ...],
 *     "values": { "Sitting ID": "s-...", "Recorded at": "...", ... } }
 */

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var result = record(body);
    return json({ ok: true, tab: result.tab, row: result.row, action: result.action });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** A GET is only ever a person checking the deployment is alive. */
function doGet() {
  return json({ ok: true, service: 'knomee advisor answers', tabs: tabNames() });
}

function record(body) {
  var name = sheetName(body.tab);
  var headers = body.headers || [];
  var values = body.values || {};
  if (!headers.length) throw new Error('no headers in the payload');

  // One writer at a time: two phones finishing together would otherwise both
  // read the same last row and one would overwrite the other.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var book = SpreadsheetApp.getActiveSpreadsheet();
    var tab = book.getSheetByName(name) || createTab(book, name, headers);
    var head = headerRow(tab, headers);

    // The row goes where its Sitting ID already is, so re-sending a sitting
    // updates it rather than adding a near-duplicate.
    var idCol = head.indexOf('Sitting ID') + 1;
    var id = values['Sitting ID'];
    var at = 0;
    if (idCol > 0 && id && tab.getLastRow() > 1) {
      var ids = tab.getRange(2, idCol, tab.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(id)) {
          at = i + 2;
          break;
        }
      }
    }

    var row = head.map(function (h) {
      var v = values[h];
      return v === undefined || v === null ? '' : v;
    });
    var target = at || tab.getLastRow() + 1;
    tab.getRange(target, 1, 1, row.length).setValues([row]);
    return { tab: name, row: target, action: at ? 'updated' : 'appended' };
  } finally {
    lock.releaseLock();
  }
}

function createTab(book, name, headers) {
  var tab = book.insertSheet(name);
  tab.getRange(1, 1, 1, headers.length).setValues([headers]);
  tab.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  tab.setFrozenRows(1);
  // The first two columns are the ones you scan; the rest are prose.
  tab.setColumnWidth(1, 150);
  tab.setColumnWidth(2, 170);
  // Sheet1 is the empty tab a new spreadsheet arrives with. Once there is a
  // real tab it is only in the way.
  var blank = book.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && book.getSheets().length > 1) book.deleteSheet(blank);
  return tab;
}

/**
 * The tab's header row, grown if the flow has gained a question since this tab
 * was made. Existing columns keep their position, so nothing already written
 * shifts under a formula or a chart.
 */
function headerRow(tab, wanted) {
  var width = Math.max(tab.getLastColumn(), 1);
  var head = tab.getRange(1, 1, 1, width).getValues()[0].map(String);
  if (head.length === 1 && head[0] === '') head = [];

  var missing = wanted.filter(function (h) {
    return head.indexOf(h) === -1;
  });
  if (missing.length) {
    var next = head.length + 1;
    tab.getRange(1, next, 1, missing.length).setValues([missing]);
    tab.getRange(1, next, 1, missing.length).setFontWeight('bold');
    head = head.concat(missing);
  }
  return head;
}

/** Sheets refuses : \ / ? * [ ] in a tab name, and caps it at 100 characters. */
function sheetName(raw) {
  var name = String(raw || 'Anonymous')
    .replace(/[:\\\/?*\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
  return name || 'Anonymous';
}

function tabNames() {
  return SpreadsheetApp.getActiveSpreadsheet()
    .getSheets()
    .map(function (s) {
      return s.getName();
    });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
