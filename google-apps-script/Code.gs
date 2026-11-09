/**
 * OC Student Union - Media Committee Recruitment Backend
 * Faculty of Computers and Artificial Intelligence, Capital University
 * 
 * Google Apps Script Web App
 * Handles:
 * 1. Form submissions validation and deduplication
 * 2. Saving records to Google Sheets
 * 3. Portfolio upload directly to a designated Google Drive folder
 * 4. Structured JSON responses with CORS headers
 */

// ==========================================
// CONFIGURATION
// ==========================================
// Folder name in Google Drive where applicant portfolios will be saved.
// The script will automatically create this folder if it doesn't already exist.
var DRIVE_FOLDER_NAME = "OC_Media_Recruitment_Portfolios_2026";

// Spreadsheet configuration: Leave as null to use the Active Spreadsheet (when bound to a Sheet),
// OR provide the specific Spreadsheet ID here if running as a standalone script:
var SPREADSHEET_ID = null; // e.g. "1a2b3c4d5e..." or leave null if attached to Sheet

// Maximum file size in MB allowed for Google Drive upload (Apps Script limit is ~20MB for blobs)
var MAX_FILE_SIZE_MB = 12;

// Allowed file MIME types
var ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png"
];

// Header columns required in Google Sheet
var SHEET_HEADERS = [
  "Submission ID",
  "Submission Date",
  "Full Name",
  "Phone Number",
  "Academic Year",
  "Media Skills",
  "Equipment",
  "Portfolio URL",
  "Status"
];

/**
 * Health check / Ping endpoint (GET request)
 * Allows frontend or administrators to verify script deployment status.
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  
  if (action === 'ping') {
    return createJsonResponse({
      success: true,
      status: "ONLINE",
      committee: "Media Committee - OC Student Union",
      faculty: "Faculty of Computers and Artificial Intelligence, Capital University",
      timestamp: new Date().toISOString()
    });
  }

  return createJsonResponse({
    success: false,
    message: "Invalid GET request. Please use POST to submit applications."
  });
}

/**
 * Main Form Submission Handler (POST request)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  
  // Try to acquire lock for 30 seconds to prevent race conditions & duplicates
  try {
    lock.waitLock(30000);
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: "الخادم مشغول حالياً، يرجى إعادة المحاولة بعد لحظات."
    });
  }

  try {
    // 1. Parse incoming payload
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        error: "لم يتم استلام أي بيانات في الطلب."
      });
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return createJsonResponse({
        success: false,
        error: "تنسيق البيانات غير صحيح (Invalid JSON)."
      });
    }

    // 2. Validate Required Fields
    var fullName = (payload.fullName || "").trim();
    var phoneNumber = (payload.phoneNumber || "").trim();
    var academicYear = (payload.academicYear || "").trim();
    var mediaSkills = payload.mediaSkills || [];
    var equipment = payload.equipment || [];
    var otherSkill = (payload.otherSkill || "").trim();
    var otherEquipment = (payload.otherEquipment || "").trim();
    var externalPortfolioUrl = (payload.externalPortfolioUrl || "").trim();
    var fileData = payload.file; // { name, type, base64, size }

    // Validate Full Name: Must be at least 3 parts
    var nameParts = fullName.split(/\s+/).filter(function(part) { return part.length > 0; });
    if (nameParts.length < 3) {
      return createJsonResponse({
        success: false,
        error: "يرجى كتابة الاسم ثلاثياً على الأقل باللغة العربية."
      });
    }

    // Validate Phone Number (Egyptian phone pattern: 11 digits starting with 010, 011, 012, or 015)
    // Also allow clean numbers without spaces or country code +20
    var cleanPhone = phoneNumber.replace(/[\s\-\+]/g, "");
    if (cleanPhone.startsWith("20")) {
      cleanPhone = "0" + cleanPhone.substring(2);
    }
    var phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return createJsonResponse({
        success: false,
        error: "يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً (مثال: 01012345678)."
      });
    }

    // Validate Academic Year
    var validYears = ["First", "Second", "Third", "Fourth", "الفرقة الأولى", "الفرقة الثانية", "الفرقة الثالثة", "الفرقة الرابعة"];
    var isValidYear = validYears.some(function(vy) { return academicYear.indexOf(vy) > -1; });
    if (!academicYear || !isValidYear) {
      return createJsonResponse({
        success: false,
        error: "يرجى اختيار الفرقة الدراسية بشكل صحيح."
      });
    }

    // Prepare skills array
    var finalSkills = Array.isArray(mediaSkills) ? mediaSkills.slice() : [];
    if (otherSkill && finalSkills.indexOf(otherSkill) === -1) {
      finalSkills.push("أخرى: " + otherSkill);
    }
    if (finalSkills.length === 0) {
      return createJsonResponse({
        success: false,
        error: "يرجى اختيار مهارة إعلامية واحدة على الأقل."
      });
    }

    // Prepare equipment array
    var finalEquipment = Array.isArray(equipment) ? equipment.slice() : [];
    if (otherEquipment && finalEquipment.indexOf(otherEquipment) === -1) {
      finalEquipment.push("أخرى: " + otherEquipment);
    }

    // 3. Open or Initialize Spreadsheet
    var sheet = getOrCreateRecruitmentSheet();

    // 4. Check for Duplicates (by Phone Number)
    var isDuplicate = checkIfDuplicate(sheet, cleanPhone);
    if (isDuplicate) {
      return createJsonResponse({
        success: false,
        error: "تم تسجيل هذا الرقم مسبقاً (" + cleanPhone + "). لا يمكن تقديم أكثر من طلب لنفس رقم الهاتف."
      });
    }

    // 5. Generate Unique Submission ID
    var submissionId = generateSubmissionId();
    var submissionDate = Utilities.formatDate(new Date(), "Africa/Cairo", "yyyy-MM-dd HH:mm:ss");

    // 6. Handle Google Drive Portfolio Upload (if provided)
    var finalPortfolioUrl = "";

    if (fileData && fileData.base64 && fileData.name) {
      // Validate file size
      if (fileData.size && fileData.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return createJsonResponse({
          success: false,
          error: "حجم الملف يتجاوز الحد المسموح به (" + MAX_FILE_SIZE_MB + " ميجابايت)."
        });
      }

      // Validate MIME type
      var fileMime = fileData.type || "";
      if (fileMime && ALLOWED_MIME_TYPES.indexOf(fileMime.toLowerCase()) === -1) {
        return createJsonResponse({
          success: false,
          error: "نوع الملف غير مدعوم. الصيغ المدعومة هي PDF, JPG, JPEG, PNG فقط."
        });
      }

      // Upload file to Google Drive folder
      try {
        var driveFileUrl = uploadFileToDrive(fileData, submissionId, fullName);
        finalPortfolioUrl = driveFileUrl;
      } catch (uploadErr) {
        Logger.log("Drive upload error: " + uploadErr.toString());
        return createJsonResponse({
          success: false,
          error: "تعذر رفع ملف البورتفوليو إلى Google Drive: " + uploadErr.message
        });
      }
    }

    // If applicant also supplied an external URL or Behance/Drive link
    if (externalPortfolioUrl) {
      if (finalPortfolioUrl) {
        finalPortfolioUrl = finalPortfolioUrl + " | " + externalPortfolioUrl;
      } else {
        finalPortfolioUrl = externalPortfolioUrl;
      }
    }

    if (!finalPortfolioUrl) {
      finalPortfolioUrl = "لا يوجد (لم يتم إرفاق بورتفوليو)";
    }

    // 7. Append Row to Google Sheet
    var newRow = [
      submissionId,
      submissionDate,
      fullName,
      cleanPhone,
      academicYear,
      finalSkills.join("، "),
      finalEquipment.length > 0 ? finalEquipment.join("، ") : "لا توجد معدات محددة",
      finalPortfolioUrl,
      "قيد المراجعة" // Initial status: Under Review
    ];

    sheet.appendRow(newRow);

    // Format new row styling nicely
    var lastRow = sheet.getLastRow();
    var range = sheet.getRange(lastRow, 1, 1, SHEET_HEADERS.length);
    range.setVerticalAlignment("middle");
    range.setFontFamily("Cairo");
    range.setFontSize(10);

    // 8. Return Success Response
    return createJsonResponse({
      success: true,
      submissionId: submissionId,
      submissionDate: submissionDate,
      fullName: fullName,
      phone: cleanPhone,
      portfolioUrl: finalPortfolioUrl,
      message: "تم استلام طلبك بنجاح في لجنة الإعلام باتحاد طلاب كلية الحاسبات والذكاء الاصطناعي."
    });

  } catch (globalError) {
    Logger.log("Global error: " + globalError.toString());
    return createJsonResponse({
      success: false,
      error: "حدث خطأ غير متوقع في الخادم: " + globalError.message
    });
  } finally {
    // Release the script lock
    lock.releaseLock();
  }
}

/**
 * Uploads applicant's file directly to Google Drive
 */
function uploadFileToDrive(fileData, submissionId, applicantName) {
  var folder = getOrCreateDriveFolder(DRIVE_FOLDER_NAME);
  
  // Clean base64 string
  var base64Content = fileData.base64;
  if (base64Content.indexOf("base64,") > -1) {
    base64Content = base64Content.split("base64,")[1];
  }

  var decodedBytes = Utilities.base64Decode(base64Content);
  
  // Sanitize filename
  var extension = "";
  var lastDot = fileData.name.lastIndexOf(".");
  if (lastDot !== -1) {
    extension = fileData.name.substring(lastDot);
  }
  
  var sanitizedName = applicantName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_");
  var targetFileName = submissionId + "_" + sanitizedName + extension;
  var mimeType = fileData.type || "application/octet-stream";

  var blob = Utilities.newBlob(decodedBytes, mimeType, targetFileName);
  var file = folder.createFile(blob);
  
  // Set file permissions so reviewers with link can view
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    Logger.log("Permission notice: " + shareErr.toString());
  }

  return file.getUrl();
}

/**
 * Finds or creates dedicated folder in Google Drive
 */
function getOrCreateDriveFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

/**
 * Accesses active sheet or by ID, and initializes headers if missing
 */
function getOrCreateRecruitmentSheet() {
  var ss;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (!ss) {
    throw new Error("لم يتم العثور على جدول البيانات. تأكد من ربط السكريبت بجدول Google Sheets أو ضبط SPREADSHEET_ID.");
  }

  var sheet = ss.getSheetByName("Recruitment_Applications") || ss.getActiveSheet();
  
  // If first row is empty, set up headers
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    var headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
    headerRange.setBackground("#0F1D38");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Cairo");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 35);
    sheet.setFrozenRows(1);
    
    // Auto resize column widths
    for (var i = 1; i <= SHEET_HEADERS.length; i++) {
      sheet.setColumnWidth(i, 180);
    }
  }

  return sheet;
}

/**
 * Checks for existing phone number to avoid duplicates
 */
function checkIfDuplicate(sheet, phoneNumber) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return false; // Only header exists
  }

  // Column 4 is Phone Number (D)
  var phoneValues = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
  for (var i = 0; i < phoneValues.length; i++) {
    var existingPhone = String(phoneValues[i][0]).replace(/[\s\-\+]/g, "");
    if (existingPhone.startsWith("20")) {
      existingPhone = "0" + existingPhone.substring(2);
    }
    if (existingPhone === phoneNumber) {
      return true;
    }
  }
  return false;
}

/**
 * Generates an applicant identifier e.g. OC-MED-2026-XXXX
 */
function generateSubmissionId() {
  var rand = Math.floor(1000 + Math.random() * 9000);
  var timeCode = Utilities.formatDate(new Date(), "Africa/Cairo", "ddHHmm");
  return "OC-MED-" + timeCode + "-" + rand;
}

/**
 * Helper to build JSON responses with CORS headers
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP OPTIONS requests for CORS preflight (if triggered)
 */
function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Built-in test function for administrators
 * You can select this function in the Apps Script editor and click "Run"
 * to verify permissions and spreadsheet access without sending an HTTP request.
 */
function testSubmissionDirectly() {
  var sheet = getOrCreateRecruitmentSheet();
  var testId = generateSubmissionId();
  var testDate = Utilities.formatDate(new Date(), "Africa/Cairo", "yyyy-MM-dd HH:mm:ss");
  
  Logger.log("Testing recruitment sheet access...");
  Logger.log("Active sheet name: " + sheet.getName());
  Logger.log("Sheet ID / URL: " + sheet.getParent().getUrl());
  
  // Test Drive folder access
  var folder = getOrCreateDriveFolder(DRIVE_FOLDER_NAME);
  Logger.log("Drive folder ready: " + folder.getName() + " (URL: " + folder.getUrl() + ")");
  
  Logger.log("Test completed successfully! The script has full access to Sheets and Drive.");
  return {
    success: true,
    message: "Google Sheets and Google Drive permissions verified successfully!"
  };
}


