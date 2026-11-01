/**
 * =========================================================================================
 * ប្រព័ន្ធគ្រប់គ្រងសៀវភៅសិក្សាគោល - Google Apps Script Backend (API & Database)
 * Textbook Stock & Borrowing Management System - Google Sheets Cloud Database
 * =========================================================================================
 * 
 * របៀបតម្លើង (Setup Instructions):
 * 1. បង្កើត Google Sheet ថ្មីមួយលើ Google Drive របស់អ្នក (https://sheets.new)
 * 2. ដាក់ឈ្មោះ Google Sheet ឧទាហរណ៍៖ "BookStock_Database"
 * 3. ចូលទៅកាន់ Extensions (ផ្នែកបន្ថែម) -> Apps Script
 * 4. លុបកូដចាស់ចោលទាំងអស់ រួចចម្លងកូដក្នុងឯកសារនេះទៅបិទភ្ជាប់ (Paste)
 * 5. ចុច Save (រូបថាស)
 * 6. ចុចប៊ូតុង "Deploy" (ដាក់ឱ្យប្រើប្រាស់) -> "New deployment" (ការដាក់ឱ្យប្រើប្រាស់ថ្មី)
 * 7. ចុចលើរូបស្ពឺ Select type -> ជ្រើសរើស "Web app"
 * 8. បំពេញ៖
 *    - Description: "BookStock Cloud API"
 *    - Execute as: "Me" (គណនីរបស់អ្នក)
 *    - Who has access: "Anyone" (អ្នកណាក៏ដោយ - សំខាន់ណាស់!)
 * 9. ចុច "Deploy" -> ចុច "Authorize access" (ផ្តល់សិទ្ធិ) -> ជ្រើសរើសគណនី Gmail របស់អ្នក -> ចុច "Advanced" -> ចុច "Go to ... (unsafe)" -> ចុច "Allow"
 * 10. ចម្លង "Web app URL" (បញ្ចប់ដោយ /exec) យកទៅបិទភ្ជាប់ក្នុងប្រព័ន្ធ BookStock (ផ្ទាំងការកំណត់ព័ត៌មានសាលា)!
 */

// Global Sheet Tab Names
var SHEET_BOOKS = "Books";
var SHEET_STUDENTS = "Students";
var SHEET_BORROWINGS = "Borrowings";
var SHEET_SETTINGS = "Settings";
var SHEET_LOGS = "ActivityLogs";

/**
 * Handle GET Requests: Fetch all data from Google Sheets to sync with Client Devices
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheetsExist(ss);

    var callback = e && e.parameter && e.parameter.callback;

    var result = {
      status: "success",
      timestamp: new Date().toISOString(),
      books: readBooks(ss),
      students: readStudents(ss),
      borrowings: readBorrowings(ss),
      settings: readSettings(ss),
      logs: readLogs(ss)
    };

    var outputText = JSON.stringify(result);

    // Support JSONP if requested
    if (callback) {
      return ContentService.createTextOutput(callback + "(" + outputText + ")")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService.createTextOutput(outputText)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errResult = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST Requests: Save/Sync all changes from Client to Google Sheets
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureSheetsExist(ss);

    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    // 1. Write Books
    if (data.books && Array.isArray(data.books)) {
      writeBooks(ss, data.books);
    }

    // 2. Write Students
    if (data.students && Array.isArray(data.students)) {
      writeStudents(ss, data.students);
    }

    // 3. Write Borrowings
    if (data.borrowings && Array.isArray(data.borrowings)) {
      writeBorrowings(ss, data.borrowings);
    }

    // 4. Write Settings
    if (data.settings && typeof data.settings === 'object') {
      writeSettings(ss, data.settings);
    }

    // 5. Append Activity Logs
    if (data.newLogs && Array.isArray(data.newLogs)) {
      appendLogs(ss, data.newLogs);
    } else if (data.logs && Array.isArray(data.logs)) {
      writeLogs(ss, data.logs);
    }

    var result = {
      status: "success",
      message: "Data synchronized successfully across all devices",
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errResult = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Ensure all required Sheet Tabs exist with proper styled headers
 */
function ensureSheetsExist(ss) {
  var sheets = [
    { name: SHEET_BOOKS, headers: ["ID", "Title", "Subject", "Grade", "Quantity", "Borrowed", "Available", "LastUpdated"] },
    { name: SHEET_STUDENTS, headers: ["ID", "Name", "Gender", "Grade", "Class", "Phone", "Note", "LastUpdated"] },
    { name: SHEET_BORROWINGS, headers: ["ID", "StudentID", "StudentName", "Grade", "Class", "BorrowDate", "DueDate", "Status", "BooksJSON", "Note", "LastUpdated"] },
    { name: SHEET_SETTINGS, headers: ["Key", "Value", "Description"] },
    { name: SHEET_LOGS, headers: ["Timestamp", "Action", "Details", "Type", "DeviceTime"] }
  ];

  sheets.forEach(function(s) {
    var sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.headers);
      var headerRange = sheet.getRange(1, 1, 1, s.headers.length);
      headerRange.setBackground("#1e3a8a")
        .setFontColor("#ffffff")
        .setFontWeight("bold")
        .setFontFamily("Arial");
      sheet.setFrozenRows(1);
    }
  });
}

// -------------------------------------------------------------
// READ FUNCTIONS
// -------------------------------------------------------------
function readBooks(ss) {
  var sheet = ss.getSheetByName(SHEET_BOOKS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  return rows.map(function(r) {
    return {
      id: String(r[0]),
      title: String(r[1]),
      subject: String(r[2]),
      grade: String(r[3]),
      quantity: Number(r[4]) || 0,
      borrowed: Number(r[5]) || 0
    };
  }).filter(function(b) { return b.id && b.title; });
}

function readStudents(ss) {
  var sheet = ss.getSheetByName(SHEET_STUDENTS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  return rows.map(function(r) {
    return {
      id: String(r[0]),
      name: String(r[1]),
      gender: String(r[2] || "ប្រុស"),
      grade: String(r[3]),
      class: String(r[4]),
      phone: String(r[5] || ""),
      note: String(r[6] || "")
    };
  }).filter(function(s) { return s.id && s.name; });
}

function readBorrowings(ss) {
  var sheet = ss.getSheetByName(SHEET_BORROWINGS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
  return rows.map(function(r) {
    var booksArr = [];
    try {
      booksArr = JSON.parse(r[8]);
    } catch(e) {
      booksArr = [];
    }
    return {
      id: String(r[0]),
      studentId: String(r[1]),
      studentName: String(r[2]),
      grade: String(r[3]),
      class: String(r[4]),
      borrowDate: formatDateString(r[5]),
      dueDate: formatDateString(r[6]),
      status: String(r[7]),
      books: booksArr,
      note: String(r[9] || "")
    };
  }).filter(function(b) { return b.id; });
}

function readSettings(ss) {
  var sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet || sheet.getLastRow() <= 1) return {};
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var settings = {};
  rows.forEach(function(r) {
    if (r[0]) {
      var val = r[1];
      if (r[0] === 'loanDurationDays') val = Number(val) || 14;
      settings[r[0]] = val;
    }
  });
  return settings;
}

function readLogs(ss) {
  var sheet = ss.getSheetByName(SHEET_LOGS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var numRows = Math.min(sheet.getLastRow() - 1, 50); // last 50 logs
  var startRow = Math.max(2, sheet.getLastRow() - numRows + 1);
  var rows = sheet.getRange(startRow, 1, numRows, 5).getValues();
  return rows.map(function(r) {
    return {
      timestamp: String(r[0]),
      action: String(r[1]),
      details: String(r[2]),
      type: String(r[3]),
      deviceTime: String(r[4])
    };
  }).reverse();
}

// -------------------------------------------------------------
// WRITE FUNCTIONS
// -------------------------------------------------------------
function writeBooks(ss, books) {
  var sheet = ss.getSheetByName(SHEET_BOOKS);
  clearDataRows(sheet);
  if (books.length === 0) return;

  var now = new Date().toISOString();
  var rows = books.map(function(b) {
    var total = Number(b.quantity) || 0;
    var borrowed = Number(b.borrowed) || 0;
    var available = Math.max(0, total - borrowed);
    return [b.id, b.title, b.subject, b.grade, total, borrowed, available, now];
  });
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function writeStudents(ss, students) {
  var sheet = ss.getSheetByName(SHEET_STUDENTS);
  clearDataRows(sheet);
  if (students.length === 0) return;

  var now = new Date().toISOString();
  var rows = students.map(function(s) {
    return [s.id, s.name, s.gender || "ប្រុស", s.grade, s.class, s.phone || "", s.note || "", now];
  });
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function writeBorrowings(ss, borrowings) {
  var sheet = ss.getSheetByName(SHEET_BORROWINGS);
  clearDataRows(sheet);
  if (borrowings.length === 0) return;

  var now = new Date().toISOString();
  var rows = borrowings.map(function(b) {
    var booksJson = JSON.stringify(b.books || []);
    return [
      b.id, b.studentId, b.studentName, b.grade, b.class,
      formatDateString(b.borrowDate), formatDateString(b.dueDate),
      b.status, booksJson, b.note || "", now
    ];
  });
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function writeSettings(ss, settings) {
  var sheet = ss.getSheetByName(SHEET_SETTINGS);
  clearDataRows(sheet);
  var rows = [];
  for (var key in settings) {
    rows.push([key, settings[key], "App Setting"]);
  }
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }
}

function appendLogs(ss, logs) {
  var sheet = ss.getSheetByName(SHEET_LOGS);
  if (!logs || logs.length === 0) return;
  var rows = logs.map(function(l) {
    return [
      l.timestamp || new Date().toISOString(),
      l.action || "",
      l.details || "",
      l.type || "info",
      l.deviceTime || new Date().toLocaleString()
    ];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
}

function writeLogs(ss, logs) {
  var sheet = ss.getSheetByName(SHEET_LOGS);
  clearDataRows(sheet);
  if (!logs || logs.length === 0) return;
  var rows = logs.slice(0, 100).map(function(l) {
    return [
      l.timestamp || new Date().toISOString(),
      l.action || "",
      l.details || "",
      l.type || "info",
      l.deviceTime || new Date().toLocaleString()
    ];
  });
  sheet.getRange(2, 1, rows.length, 5).setValues(rows);
}

function clearDataRows(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function formatDateString(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var yyyy = val.getFullYear();
    var mm = String(val.getMonth() + 1).padStart(2, '0');
    var dd = String(val.getDate()).padStart(2, '0');
    return yyyy + "-" + mm + "-" + dd;
  }
  return String(val).split('T')[0];
}

