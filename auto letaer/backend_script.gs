/**
 * Google Apps Script for Document Automation MVP
 * 
 * Instructions:
 * 1. Create a Google Sheet named "نظام إدارة القوالب".
 * 2. Create 3 tabs: "القوالب", "الطلبات", "النتيجه".
 * 3. Replace SHEET_ID with your spreadsheet ID.
 * 4. Deploy as a Web App (Access: Anyone).
 */

const SHEET_ID = '1ubqLM0evnTqhslrMaEYaIm4ZsR4C1ai-DR4QGdi9arg';

// Fetch templates or history
function doGet(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const action = (e.parameter && e.parameter.action) || 'getTemplates';
  
  if (action === 'getHistory') {
    const historySheet = ss.getSheetByName('النتيجه');
    if (!historySheet) return createResponse([]);
    
    const historyData = historySheet.getDataRange().getValues();
    const history = [];
    
    for (let i = 1; i < historyData.length; i++) {
      history.push({
        date: historyData[i][0],
        clientName: historyData[i][1],
        pdfUrl: historyData[i][2],
        status: historyData[i][3]
      });
    }
    return createResponse(history.reverse());
  }

  // Default: getTemplates
  const templateSheet = ss.getSheetByName('القوالب');
  if (!templateSheet) return createResponse([]);
  
  const templateData = templateSheet.getDataRange().getValues();
  const headers = templateData[0];
  const templates = [];

  for (let i = 1; i < templateData.length; i++) {
    let row = templateData[i];
    let template = {};
    for (let j = 0; j < headers.length; j++) {
      template[headers[j]] = row[j];
    }
    templates.push(template);
  }
  
  return createResponse(templates);
}

// Handle form submission and PDF generation
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // 1. Log Request
    const reqSheet = ss.getSheetByName('الطلبات');
    if (!reqSheet) throw new Error("ورقة 'الطلبات' غير موجودة في ملف Google Sheets. يرجى التأكد من اسم الورقة.");
    
    // Get headers to match data
    const headers = reqSheet.getDataRange().getValues()[0];
    const newRow = headers.map(header => {
      if (header === 'وقت الطلب') return new Date();
      return data[header] || "";
    });
    reqSheet.appendRow(newRow);

    // 2. Generate PDF
    const templateId = data['معرف القالب'];
    const pdfUrl = generatePDF(templateId, data);

    // 3. Log Result
    const resSheet = ss.getSheetByName('النتيجه');
    if (!resSheet) throw new Error("ورقة 'النتيجه' غير موجودة في ملف Google Sheets. يرجى التأكد من اسم الورقة.");
    resSheet.appendRow([new Date(), data['اسم العميل'], pdfUrl, 'تم التوليد']);

    // 4. Send Email (Optional)
    // MailApp.sendEmail({
    //   to: "your-email@example.com",
    //   subject: "مستند جديد جاهز: " + data['اسم العميل'],
    //   body: "تم إنشاء المستند بنجاح.\n\nرابط المستند: " + pdfUrl
    // });

    return createResponse({"status": "success", "url": pdfUrl});
  } catch (error) {
    return createResponse({"status": "error", "message": error.toString()});
  }
}

function generatePDF(templateId, data) {
  // Extract ID if a full URL was provided
  if (templateId.includes('/d/')) {
    templateId = templateId.split('/d/')[1].split('/')[0];
  }
  
  if (!templateId || templateId.length < 10) {
    throw new Error("معرف القالب غير صالح. يرجى التأكد من كتابة الـ ID الصحيح في الشيت.");
  }

  const file = DriveApp.getFileById(templateId).makeCopy('نسخة مؤقتة - ' + data['اسم العميل']);
  const copyId = file.getId();
  const presentation = SlidesApp.openById(copyId);
  const slides = presentation.getSlides();

  const keys = Object.keys(data);
  keys.forEach(key => {
    slides.forEach(slide => {
      slide.replaceAllText('{{' + key + '}}', data[key] || '');
    });
  });

  presentation.saveAndClose();

  const pdfBlob = DriveApp.getFileById(copyId).getAs('application/pdf');
  
  // Save to specific folder
  const folderId = '1KS2Zx3uLa27oy7CrwjVjVD8SqqSqLfR1';
  const folder = DriveApp.getFolderById(folderId);
  const pdfFile = folder.createFile(pdfBlob).setName((data['اسم العميل'] || 'وثيقة') + ' - وثيقة.pdf');
  
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  DriveApp.getFileById(copyId).setTrashed(true);

  return pdfFile.getUrl();
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
