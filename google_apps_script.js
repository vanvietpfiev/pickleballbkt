// ============================================================
// Google Apps Script - VNA Pickleball Tournament Backend
// ============================================================
// CÁCH SỬ DỤNG:
// 1. Mở Google Sheet bất kỳ (hoặc tạo mới)
// 2. Extensions → Apps Script
// 3. Xóa code mặc định, dán toàn bộ code này vào
// 4. Deploy → New deployment → Type: Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy URL deployment → dán vào app Pickleball
// ============================================================

const SHEET_NAME = 'TournamentData';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange('A1').setValue('{}');
    sheet.getRange('B1').setValue(new Date().toISOString());
  }
  return sheet;
}

// GET: Đọc dữ liệu
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const json = sheet.getRange('A1').getValue() || '{}';
    return ContentService
      .createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// POST: Ghi dữ liệu
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = e.postData.contents;
    // Validate JSON
    JSON.parse(data);
    sheet.getRange('A1').setValue(data);
    sheet.getRange('B1').setValue(new Date().toISOString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, timestamp: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
