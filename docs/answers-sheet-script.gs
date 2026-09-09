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

/* The spreadsheet is addressed by id rather than by "whichever one is active",
   so this works whether the project is bound to the sheet (Extensions → Apps
   Script) or standalone (script.google.com). getActiveSpreadsheet() returns
   nothing in the standalone case, which fails in a way that looks like the
   script not running at all. */
var SHEET_ID = '1BS4zugcZQQceTAUfBjrVfx6BzweonWHwXppIgNIHBmk';

function book() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID);
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('No spreadsheet: set SHEET_ID at the top of this script.');
  return active;
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var result = record(body);
    return json({ ok: true, tab: result.tab, row: result.row, action: result.action });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/**
 * A GET is a person checking the deployment from a browser tab, which is the
 * only test on this path with a visible answer — a POST from the prototype
 * comes back opaque by design.
 *
 * Plain `/exec` reports what it can see. `/exec?test=1` also writes a row to
 * the `_test` tab, so one URL in one tab proves the whole round trip: the
 * deployment, its access setting, and the write. A GET that changes something
 * is bad manners, which is why it takes an explicit flag and puts the row
 * somewhere that is obviously not a person.
 */
function doGet(e) {
  var wants = e && e.parameter && e.parameter.test;
  if (!wants) return json({ ok: true, service: 'knomee advisor answers', tabs: tabNames() });
  var result = record(testPayload('from a browser tab'));
  return json({
    ok: true,
    wrote: result,
    tabs: tabNames(),
    note: 'A row was added to the _test tab. Delete that tab whenever you like.',
  });
}

/**
 * Run this from the Apps Script editor — the Run button, no deployment needed —
 * to check the script against the spreadsheet before anything else is in play.
 * A `_test` tab appears with one row on it. Run it twice: the second run
 * UPDATES that row rather than adding another, which is the upsert the real
 * rows rely on.
 */
function testRow() {
  var result = record(testPayload('from the Apps Script editor'));
  Logger.log(
    'Wrote %s row %s on tab "%s" of "%s". Tabs now: %s',
    result.action,
    result.row,
    result.tab,
    book().getName(),
    tabNames().join(', '),
  );
  return result;
}

/** A row that could not be mistaken for somebody's answers. */
function testPayload(where) {
  return {
    tab: '_test',
    headers: ['Sitting ID', 'Recorded at', 'Name', 'Note'],
    values: {
      'Sitting ID': 'test-row',
      'Recorded at': new Date().toISOString(),
      Name: 'Test row',
      Note: 'Written ' + where + '. Not a real sitting.',
    },
  };
}

/**
 * Bring every tab into line with the shape the prototype posts now.
 *
 * Writing only ever ADDS columns, so a tab written under an older shape keeps
 * whatever it had — the score, the tier, the stage and the three questions used
 * to be columns here before they moved back to being computed from the answers.
 * This deletes the leftovers, taking their data with them so the remaining
 * columns stay lined up with their own headers. Nothing else is touched.
 *
 * Run it from the editor after the shape changes. It only deletes; a column
 * the prototype still posts is never removed, so it cannot lose an answer.
 * Anything YOU added to a tab by hand is a leftover as far as this is
 * concerned, so move it to its own sheet first.
 */
function alignTabs(wanted) {
  // The current shape, learned from the last row the prototype posted, unless
  // it is passed in. A tab is aligned against the widest header on the sheet,
  // which is the newest one.
  var sheet = book();
  var keep = wanted || currentShape();
  var report = [];
  sheet.getSheets().forEach(function (tab) {
    var name = tab.getName();
    if (name === '_test') return;
    var width = tab.getLastColumn();
    if (!width) return;
    var head = tab.getRange(1, 1, 1, width).getValues()[0].map(String);
    var dropped = [];
    // Right to left: deleting a column shifts everything after it left.
    for (var i = head.length - 1; i >= 0; i--) {
      if (head[i] && keep.indexOf(head[i]) === -1) {
        dropped.push(head[i]);
        tab.deleteColumn(i + 1);
      }
    }
    if (dropped.length) report.push(name + ': dropped ' + dropped.reverse().join(', '));
    else report.push(name + ': already aligned');
  });
  report.forEach(function (line) {
    Logger.log(line);
  });
  return report;
}

var SHAPE_KEY = 'posted-shape';

/**
 * The columns the prototype is posting now. Every write records its own header
 * list, so this is remembered rather than guessed. Before the first write under
 * this version of the script there is nothing to remember, so it falls back to
 * the narrowest header on the sheet — this change removed columns, so the
 * newest shape is the smallest one.
 */
function currentShape() {
  var stored = PropertiesService.getScriptProperties().getProperty(SHAPE_KEY);
  if (stored) return JSON.parse(stored);
  var narrowest = [];
  book()
    .getSheets()
    .forEach(function (tab) {
      var width = tab.getLastColumn();
      if (tab.getName() === '_test' || !width) return;
      var head = tab.getRange(1, 1, 1, width).getValues()[0].map(String);
      if (!narrowest.length || head.length < narrowest.length) narrowest = head;
    });
  return narrowest;
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
    // What the prototype is posting today, so `alignTabs` never has to guess.
    // The `_test` payload is its own four columns and is not the shape.
    if (name !== '_test') {
      PropertiesService.getScriptProperties().setProperty(SHAPE_KEY, JSON.stringify(headers));
    }
    var sheet = book();
    var tab = sheet.getSheetByName(name) || createTab(sheet, name, headers);
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

function createTab(sheet, name, headers) {
  var tab = sheet.insertSheet(name);
  tab.getRange(1, 1, 1, headers.length).setValues([headers]);
  tab.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  tab.setFrozenRows(1);
  // The first two columns are the ones you scan; the rest are prose.
  tab.setColumnWidth(1, 150);
  tab.setColumnWidth(2, 170);
  // Sheet1 is the empty tab a new spreadsheet arrives with. Once there is a
  // real tab it is only in the way.
  var blank = sheet.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && sheet.getSheets().length > 1) sheet.deleteSheet(blank);
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
  return book()
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
