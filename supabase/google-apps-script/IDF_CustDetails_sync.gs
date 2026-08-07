/**
 * IDF_CustDetails sync script
 * =============================================================================
 * Keeps a Google Sheet named "IDF_CustDetails" updated with one row per
 * customer — never passwords (Supabase never sends this script a password;
 * it doesn't have access to one, by design), just name, phone, email, city,
 * how they signed up, and their order history summary.
 *
 * SETUP (about 5 minutes):
 *   1. Create a new Google Sheet, name it exactly:  IDF_CustDetails
 *   2. Extensions -> Apps Script. Delete the sample code, paste this whole
 *      file in.
 *   3. Change SHARED_TOKEN below to your own random string (anything —
 *      it just needs to match what you put in the database next).
 *   4. Deploy -> New deployment -> type "Web app".
 *        Execute as:      Me
 *        Who has access:  Anyone
 *      (This has to be "Anyone" because Supabase calls it with no Google
 *      login of its own — the token below is what keeps it from being
 *      abused by someone who doesn't have it.)
 *   5. Click Deploy, authorise it, and copy the Web app URL it gives you.
 *   6. In Supabase's SQL Editor, run:
 *        update public.app_config
 *        set value = 'PASTE_THE_URL_HERE?token=YOUR_SHARED_TOKEN'
 *        where key = 'sheet_webhook_url';
 *
 * That's it — every new customer and every order updates this sheet within
 * a second or two, no further action needed.
 * =============================================================================
 */

const SHARED_TOKEN = 'change-me-to-something-random';

const COLUMNS = [
  'Name',
  'Phone',
  'Email',
  'City',
  'Signed Up Via',
  'Total Orders',
  'Last Order Code',
  'Last Order Value (₹)',
  'Last Order Items',
  'Last Requirement / Notes',
  'Last Updated',
];

function doPost(e) {
  try {
    const token = (e.parameter && e.parameter.token) || '';
    if (token !== SHARED_TOKEN) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: 'bad token' }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    ensureHeader(sheet);

    const email = String(data.email || '').trim().toLowerCase();
    const rowIndex = email ? findRowByEmail(sheet, email) : -1;

    const row = [
      data.name || '',
      data.phone || '',
      data.email || '',
      data.city || '',
      data.signupMethod || '',
      data.totalOrders || 0,
      data.lastOrderCode || '',
      data.lastOrderTotal || '',
      data.lastOrderItems || '',
      data.lastRequirement || '',
      data.lastUpdated || new Date().toISOString(),
    ];

    if (rowIndex > 0) {
      // Update in place — this is what keeps it "one row per customer"
      // instead of a growing log of duplicates.
      sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
      ContentService.MimeType.JSON,
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureHeader(sheet) {
  const firstCell = sheet.getRange(1, 1).getValue();
  if (firstCell === COLUMNS[0]) return; // already set up

  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
  sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold').setBackground('#1c0505').setFontColor('#dec3b4');
  sheet.setFrozenRows(1);
  for (let c = 1; c <= COLUMNS.length; c++) sheet.autoResizeColumn(c);
}

/** Returns the 1-indexed sheet row for this email, or -1 if not found. */
function findRowByEmail(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const emails = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // column C = Email
  for (let i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).trim().toLowerCase() === email) return i + 2;
  }
  return -1;
}
