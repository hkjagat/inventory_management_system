/**
 * Google Apps Script (Code.gs) for Alpha Pharma Daman Inventory System.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * ALPHA PHARMA DAMAN INVENTORY SYSTEM — WEB APP API
 * ==============================================================================
 * 
 * Setup Instructions:
 * 1. Open your Spreadsheet.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Replace code in Code.gs with this script.
 * 4. Run "initAllSheets" from the menu to format headers if needed.
 * 5. Click "Deploy" > "New deployment" > Select Type: "Web app".
 * 6. Set Who has access: "Anyone", deploy, and copy the Web App URL.
 * ==============================================================================
 */

var SHEET_USERS = "Users";
var SHEET_MASTERS = "Masters";
var SHEET_ITEM_MASTER = "ItemMaster";
var SHEET_INCOMING = "Incoming";
var SHEET_OUTGOING = "Outgoing";

// Automatic sheet setup on first run
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Alpha Pharma Daman")
    .addItem("Initialize / Reset All 5 Sheets (With Dynamic Stock)", "initAllSheets")
    .addToUi();
}

function initAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Users
  var usersSheet = ss.getSheetByName(SHEET_USERS) || ss.insertSheet(SHEET_USERS);
  if (usersSheet.getLastRow() === 0) {
    usersSheet.appendRow(["Login Id", "Password", "Name", "Role", "Page Access", "Status"]);
    usersSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#123d35").setFontColor("#ffffff");
    usersSheet.appendRow(["adm", "admin@123", "Admin", "admin", "all", "Active"]);
  }

  // 2. Masters
  var mastersSheet = getMastersSheet(ss) || ss.insertSheet(SHEET_MASTERS);
  if (mastersSheet.getLastRow() === 0) {
    mastersSheet.appendRow(["Category", "Uom"]);
    mastersSheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#123d35").setFontColor("#ffffff");
    mastersSheet.appendRow(["Consumable", "Nos"]);
    mastersSheet.appendRow(["Lubricants and Oil", "Boxes"]);
    mastersSheet.appendRow(["Welding and Cutting", "Kgs"]);
    mastersSheet.appendRow(["Tooling and Abrasives", "Mtrs"]);
    mastersSheet.appendRow(["PPE and Plant Safety", "Rolls"]);
    mastersSheet.appendRow(["Chemicals and Solvents", "Pcs"]);
    mastersSheet.appendRow(["Tapes and Cleanroom", "Ltrs"]);
    mastersSheet.appendRow(["", "Packes"]);
  }

  // 3. ItemMaster
  var itemSheet = ss.getSheetByName(SHEET_ITEM_MASTER) || ss.insertSheet(SHEET_ITEM_MASTER);
  if (itemSheet.getLastRow() === 0) {
    itemSheet.appendRow(["Item Code", "Item Name", "Category", "UOM", "Opening Balance", "Current Stock", "Lead Days", "Safety Stock", "Average Cunsumtion", "Min Stock", "Max Stock", "Reorder Quantity"]);
    itemSheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#123d35").setFontColor("#ffffff");
  }

  // 4. Incoming
  var incSheet = ss.getSheetByName(SHEET_INCOMING) || ss.insertSheet(SHEET_INCOMING);
  if (incSheet.getLastRow() === 0) {
    incSheet.appendRow(["Date", "Doc Number", "Item Code", "Item Name", "Category", "Quantity", "UOM"]);
    incSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#123d35").setFontColor("#ffffff");
  }

  // 5. Outgoing
  var outSheet = ss.getSheetByName(SHEET_OUTGOING) || ss.insertSheet(SHEET_OUTGOING);
  if (outSheet.getLastRow() === 0) {
    outSheet.appendRow(["Date", "Doc Number", "Item Code", "Item Name", "Category", "Quantity", "UOM"]);
    outSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#123d35").setFontColor("#ffffff");
  }

  return "All 5 sheets initialized with clean headers (ready for your original data)!";
}

// Handle GET Requests
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "getAllData";

  if (action === "init") {
    var msg = initAllSheets();
    return createJsonResponse({ success: true, message: msg });
  }

  if (action === "login") {
    var loginId = e.parameter.loginId || "";
    var password = e.parameter.password || "";
    var userResult = checkUserCredentials(loginId, password);
    return createJsonResponse(userResult);
  }

  // Default: Return all data from all 5 sheets
  return createJsonResponse(fetchAllData());
}

// Handle POST Requests
function doPost(e) {
  try {
    var contents = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = contents.action || (e.parameter && e.parameter.action);

    if (action === "login") {
      return createJsonResponse(checkUserCredentials(contents.loginId, contents.password));
    }

    if (action === "recordIncoming") {
      return createJsonResponse(handleRecordIncoming(contents));
    }

    if (action === "recordOutgoing") {
      return createJsonResponse(handleRecordOutgoing(contents));
    }

    if (action === "addItem") {
      return createJsonResponse(handleAddItem(contents));
    }

    if (action === "updateItem") {
      return createJsonResponse(handleUpdateItem(contents));
    }

    if (action === "deleteItem") {
      return createJsonResponse(handleDeleteItem(contents));
    }

    if (action === "addCategory") {
      return createJsonResponse(handleAddCategory(contents));
    }

    if (action === "deleteCategory") {
      return createJsonResponse(handleDeleteCategory(contents));
    }

    if (action === "addUom") {
      return createJsonResponse(handleAddUom(contents));
    }

    if (action === "deleteUom") {
      return createJsonResponse(handleDeleteUom(contents));
    }

    if (action === "addUser") {
      return createJsonResponse(handleAddUser(contents));
    }

    if (action === "updateUser") {
      return createJsonResponse(handleUpdateUser(contents));
    }

    if (action === "toggleUserStatus") {
      return createJsonResponse(handleToggleUserStatus(contents));
    }

    return createJsonResponse({ success: false, error: "Unknown action: " + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// --- Helper Functions ---

function fetchAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mastersSheet = getMastersSheet(ss);
  var masterData = getMasterCategoriesAndUoms(mastersSheet, ss);

  return {
    success: true,
    users: getSheetObjects(ss.getSheetByName(SHEET_USERS), ["loginId", "password", "name", "role", "status", "pageAccess"]),
    masters: getSheetObjects(mastersSheet, ["category", "uom"]),
    categories: masterData.categories,
    uoms: masterData.uoms,
    itemMaster: getSheetObjects(ss.getSheetByName(SHEET_ITEM_MASTER), ["itemCode", "itemName", "category", "uom", "openingBalance", "currentStock", "leadDays", "safetyStock", "averageConsumption", "minStock", "maxStock", "reorderQuantity"]),
    incoming: getSheetObjects(ss.getSheetByName(SHEET_INCOMING), ["date", "docNumber", "itemCode", "itemName", "category", "quantity", "uom"]),
    outgoing: getSheetObjects(ss.getSheetByName(SHEET_OUTGOING), ["date", "docNumber", "itemCode", "itemName", "category", "quantity", "uom"])
  };
}

function getSheetObjects(sheet, keys) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol < 1) return [];

  var allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headerRow = allData[0];
  var normalizedHeaders = headerRow.map(function(h) {
    return String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  });

  var rows = [];
  for (var r = 1; r < allData.length; r++) {
    var row = allData[r];
    var hasContent = row.some(function(cell) { return String(cell).trim() !== ""; });
    if (!hasContent) continue;

    var obj = {};
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      var colIdx = normalizedHeaders.indexOf(normKey);
      if (colIdx === -1 && normKey === "averageconsumption") {
        colIdx = normalizedHeaders.indexOf("averagecunsumtion");
      }
      if (colIdx === -1 && normKey === "averagecunsumtion") {
        colIdx = normalizedHeaders.indexOf("averageconsumption");
      }
      if (colIdx === -1) {
        colIdx = k;
      }
      var val = colIdx < row.length ? row[colIdx] : "";
      if (["openingbalance", "currentstock", "minstock", "maxstock", "quantity", "leaddays", "safetystock", "averageconsumption", "averagecunsumtion", "reorderquantity"].indexOf(normKey) !== -1) {
        val = Number(val) || 0;
      }
      obj[key] = val;
    }
    rows.push(obj);
  }
  return rows;
}

function checkUserCredentials(loginId, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return { success: false, error: "Users sheet not found" };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, error: "Users sheet is empty" };

  var headers = data[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  });

  var loginIdx = headers.indexOf("loginid");
  if (loginIdx === -1) loginIdx = 0;
  var passIdx = headers.indexOf("password");
  if (passIdx === -1) passIdx = 1;
  var nameIdx = headers.indexOf("name");
  if (nameIdx === -1) nameIdx = 2;
  var roleIdx = headers.indexOf("role");
  if (roleIdx === -1) roleIdx = 3;
  var statusIdx = headers.indexOf("status");
  if (statusIdx === -1) statusIdx = 4;
  var pageAccessIdx = headers.indexOf("pageaccess");
  if (pageAccessIdx === -1) pageAccessIdx = 5;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[loginIdx]).trim().toLowerCase() === String(loginId).trim().toLowerCase()) {
      if (String(row[passIdx]) === String(password)) {
        var statusVal = String(row[statusIdx] || "").trim().toLowerCase();
        if (statusVal === "active") {
          return {
            success: true,
            user: {
              loginId: row[loginIdx],
              name: row[nameIdx],
              role: String(row[roleIdx] || "user").toLowerCase(),
              status: "Active",
              pageAccess: pageAccessIdx !== -1 && pageAccessIdx < row.length ? String(row[pageAccessIdx] || "") : ""
            }
          };
        } else {
          return { success: false, error: "User account is inactive. Please contact administrator." };
        }
      } else {
        return { success: false, error: "Incorrect password." };
      }
    }
  }
  return { success: false, error: "Login ID not found." };
}

function handleRecordIncoming(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var incSheet = ss.getSheetByName(SHEET_INCOMING);
  var itemSheet = ss.getSheetByName(SHEET_ITEM_MASTER);
  if (!incSheet || !itemSheet) return { success: false, error: "Sheets missing" };

  var dateStr = contents.date || Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
  var docNo = contents.docNumber || "IN-" + Date.now();
  var itemCode = contents.itemCode;
  var itemName = contents.itemName || "";
  var category = contents.category || "";
  var qty = Number(contents.quantity) || 0;
  var uom = contents.uom || "";

  // 1. Append to Incoming sheet
  incSheet.appendRow([dateStr, docNo, itemCode, itemName, category, qty, uom]);

  // 2. Check if ItemMaster Column F has a formula. If NOT, update static value fallback.
  var itemData = itemSheet.getDataRange().getValues();
  for (var i = 1; i < itemData.length; i++) {
    if (String(itemData[i][0]).trim().toUpperCase() === String(itemCode).trim().toUpperCase()) {
      var cell = itemSheet.getRange(i + 1, 6);
      if (!cell.getFormula()) {
        var currentVal = Number(itemData[i][5]) || 0;
        cell.setValue(currentVal + qty);
      }
      break;
    }
  }

  return { success: true, message: "Incoming recorded (+ " + qty + " " + uom + ")", docNumber: docNo };
}

function handleRecordOutgoing(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var outSheet = ss.getSheetByName(SHEET_OUTGOING);
  var itemSheet = ss.getSheetByName(SHEET_ITEM_MASTER);
  if (!outSheet || !itemSheet) return { success: false, error: "Sheets missing" };

  var dateStr = contents.date || Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
  var docNo = contents.docNumber || "OUT-" + Date.now();
  var itemCode = contents.itemCode;
  var itemName = contents.itemName || "";
  var category = contents.category || "";
  var qty = Number(contents.quantity) || 0;
  var uom = contents.uom || "";

  // 1. Append to Outgoing sheet
  outSheet.appendRow([dateStr, docNo, itemCode, itemName, category, qty, uom]);

  // 2. Check if ItemMaster Column F has a formula. If NOT, update static value fallback.
  var itemData = itemSheet.getDataRange().getValues();
  for (var i = 1; i < itemData.length; i++) {
    if (String(itemData[i][0]).trim().toUpperCase() === String(itemCode).trim().toUpperCase()) {
      var cell = itemSheet.getRange(i + 1, 6);
      if (!cell.getFormula()) {
        var currentVal = Number(itemData[i][5]) || 0;
        cell.setValue(Math.max(0, currentVal - qty));
      }
      break;
    }
  }

  return { success: true, message: "Outgoing recorded (- " + qty + " " + uom + ")", docNumber: docNo };
}

function handleAddItem(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_ITEM_MASTER);
  if (!sheet) return { success: false, error: "ItemMaster sheet not found" };

  var nextRow = sheet.getLastRow() + 1;
  // Automatically insert dynamic calculation formula in Column F:
  // Current Stock = Opening Balance + SUM(Incoming) - SUM(Outgoing)
  var dynamicFormula = "=E" + nextRow + " + IFERROR(SUMIFS(Incoming!F:F, Incoming!C:C, A" + nextRow + "), 0) - IFERROR(SUMIFS(Outgoing!F:F, Outgoing!C:C, A" + nextRow + "), 0)";

  var avgConsumption = contents.averageConsumption !== undefined ? contents.averageConsumption : contents.averageCunsumtion;

  sheet.appendRow([
    contents.itemCode,
    contents.itemName,
    contents.category,
    contents.uom,
    Number(contents.openingBalance) || 0,
    dynamicFormula,
    Number(contents.leadDays) || 0,
    Number(contents.safetyStock) || 0,
    Number(avgConsumption) || 0,
    Number(contents.minStock) || 0,
    Number(contents.maxStock) || 0,
    Number(contents.reorderQuantity) || 0
  ]);

  return { success: true, message: "Item " + contents.itemCode + " registered with dynamic stock calculation" };
}

function handleUpdateItem(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_ITEM_MASTER);
  if (!sheet) return { success: false, error: "ItemMaster sheet not found" };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === String(contents.itemCode).trim().toUpperCase()) {
      var row = i + 1;
      if (contents.itemName !== undefined) sheet.getRange(row, 2).setValue(contents.itemName);
      if (contents.category !== undefined) sheet.getRange(row, 3).setValue(contents.category);
      if (contents.uom !== undefined) sheet.getRange(row, 4).setValue(contents.uom);
      if (contents.openingBalance !== undefined) sheet.getRange(row, 5).setValue(Number(contents.openingBalance) || 0);
      
      // Preserve dynamic formula in Column F
      var fCell = sheet.getRange(row, 6);
      if (!fCell.getFormula() && contents.currentStock !== undefined) {
        fCell.setValue(Number(contents.currentStock) || 0);
      }

      if (contents.leadDays !== undefined) sheet.getRange(row, 7).setValue(Number(contents.leadDays) || 0);
      if (contents.safetyStock !== undefined) sheet.getRange(row, 8).setValue(Number(contents.safetyStock) || 0);
      if (contents.averageConsumption !== undefined || contents.averageCunsumtion !== undefined) {
        var avg = contents.averageConsumption !== undefined ? contents.averageConsumption : contents.averageCunsumtion;
        sheet.getRange(row, 9).setValue(Number(avg) || 0);
      }
      if (contents.minStock !== undefined) sheet.getRange(row, 10).setValue(Number(contents.minStock) || 0);
      if (contents.maxStock !== undefined) sheet.getRange(row, 11).setValue(Number(contents.maxStock) || 0);
      if (contents.reorderQuantity !== undefined) sheet.getRange(row, 12).setValue(Number(contents.reorderQuantity) || 0);
      return { success: true, message: "Item " + contents.itemCode + " updated" };
    }
  }
  return { success: false, error: "Item not found" };
}

function handleDeleteItem(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_ITEM_MASTER);
  if (!sheet) return { success: false, error: "ItemMaster sheet not found" };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === String(contents.itemCode).trim().toUpperCase()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Item " + contents.itemCode + " deleted from ItemMaster" };
    }
  }
  return { success: false, error: "Item not found" };
}

function getMastersSheet(ss) {
  if (!ss) return null;
  return ss.getSheetByName("Master") || ss.getSheetByName("Masters") || ss.getSheetByName("MASTER") || ss.getSheetByName("MASTERS");
}

function getMasterCategoriesAndUoms(sheet, ss) {
  var categories = [];
  var uoms = [];

  if (sheet) {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow > 0 && lastCol > 0) {
      var allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      var headerRow = allData[0];
      var catColIdx = -1;
      var uomColIdx = -1;

      for (var c = 0; c < headerRow.length; c++) {
        var h = String(headerRow[c]).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        if (catColIdx === -1 && (h === "category" || h === "categories" || h === "itemcategory")) {
          catColIdx = c;
        }
        if (uomColIdx === -1 && (h === "uom" || h === "uoms" || h === "unit" || h === "units" || h === "unitofmeasure" || h === "unitsofmeasure")) {
          uomColIdx = c;
        }
      }

      if (catColIdx === -1 && headerRow.length >= 1) catColIdx = 0;
      if (uomColIdx === -1 && headerRow.length >= 2) uomColIdx = 1;

      for (var r = 1; r < allData.length; r++) {
        if (catColIdx !== -1 && catColIdx < allData[r].length) {
          var catVal = String(allData[r][catColIdx]).trim();
          if (catVal && categories.indexOf(catVal) === -1) {
            categories.push(catVal);
          }
        }
        if (uomColIdx !== -1 && uomColIdx < allData[r].length) {
          var uomVal = String(allData[r][uomColIdx]).trim();
          if (uomVal && uoms.indexOf(uomVal) === -1) {
            uoms.push(uomVal);
          }
        }
      }
    }
  }

  // Fallback 1: check if there's a separate UOM sheet in spreadsheet
  if (uoms.length === 0 && ss) {
    var uomSheet = ss.getSheetByName("UOM") || ss.getSheetByName("UOMs") || ss.getSheetByName("Units");
    if (uomSheet && uomSheet.getLastRow() > 0) {
      var uomVals = uomSheet.getRange(1, 1, uomSheet.getLastRow(), 1).getValues();
      for (var u = 0; u < uomVals.length; u++) {
        var uv = String(uomVals[u][0]).trim();
        if (uv && uv.toLowerCase() !== "uom" && uv.toLowerCase() !== "units" && uoms.indexOf(uv) === -1) {
          uoms.push(uv);
        }
      }
    }
  }

  // Fallback 2: scan ItemMaster sheet for existing categories & UOMs if Master sheet was empty
  if ((categories.length === 0 || uoms.length === 0) && ss) {
    var itemMasterSheet = ss.getSheetByName(SHEET_ITEM_MASTER);
    if (itemMasterSheet && itemMasterSheet.getLastRow() > 1) {
      var itemData = itemMasterSheet.getRange(2, 3, itemMasterSheet.getLastRow() - 1, 2).getValues();
      for (var i = 0; i < itemData.length; i++) {
        var cVal = String(itemData[i][0]).trim();
        var uVal = String(itemData[i][1]).trim();
        if (categories.length === 0 && cVal && categories.indexOf(cVal) === -1) categories.push(cVal);
        if (uoms.length === 0 && uVal && uoms.indexOf(uVal) === -1) uoms.push(uVal);
      }
    }
  }

  // Fallback 3: default to user's defined categories and UOMs
  if (categories.length === 0) {
    categories = [
      "Consumable",
      "Lubricants and Oil",
      "Welding and Cutting",
      "Tooling and Abrasives",
      "PPE and Plant Safety",
      "Chemicals and Solvents",
      "Tapes and Cleanroom"
    ];
  }
  if (uoms.length === 0) {
    uoms = [
      "Nos",
      "Boxes",
      "Kgs",
      "Mtrs",
      "Rolls",
      "Pcs",
      "Ltrs",
      "Packes"
    ];
  }

  return { categories: categories, uoms: uoms };
}

function handleAddCategory(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getMastersSheet(ss);
  if (!sheet) return { success: false, error: "Master sheet not found" };

  var cat = String(contents.category || "").trim();
  if (!cat) return { success: false, error: "Category name required" };

  var data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    sheet.appendRow(["Category", "UOM"]);
    data = sheet.getDataRange().getValues();
  }

  var catCol = 0;
  for (var c = 0; c < data[0].length; c++) {
    var h = String(data[0][c]).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (h === "category" || h === "categories") {
      catCol = c;
      break;
    }
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][catCol]).trim().toLowerCase() === cat.toLowerCase()) {
      return { success: true, message: "Category already exists: " + cat };
    }
  }

  var targetRow = -1;
  for (var r = 1; r < data.length; r++) {
    if (!String(data[r][catCol]).trim()) {
      targetRow = r + 1;
      break;
    }
  }
  if (targetRow === -1) {
    targetRow = data.length + 1;
  }
  sheet.getRange(targetRow, catCol + 1).setValue(cat);
  return { success: true, message: "Category added: " + cat };
}

function handleDeleteCategory(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getMastersSheet(ss);
  if (!sheet) return { success: false, error: "Master sheet not found" };

  var cat = String(contents.category || "").trim().toLowerCase();
  var data = sheet.getDataRange().getValues();
  var catCol = 0;
  for (var c = 0; c < data[0].length; c++) {
    var h = String(data[0][c]).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (h === "category" || h === "categories") {
      catCol = c;
      break;
    }
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][catCol]).trim().toLowerCase() === cat) {
      sheet.getRange(i + 1, catCol + 1).clearContent();
      return { success: true, message: "Category removed: " + contents.category };
    }
  }
  return { success: false, error: "Category not found" };
}

function handleAddUom(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getMastersSheet(ss);
  if (!sheet) return { success: false, error: "Master sheet not found" };

  var uom = String(contents.uom || "").trim();
  if (!uom) return { success: false, error: "UOM required" };

  var data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    sheet.appendRow(["Category", "UOM"]);
    data = sheet.getDataRange().getValues();
  }

  var uomCol = 1;
  for (var c = 0; c < data[0].length; c++) {
    var h = String(data[0][c]).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (h === "uom" || h === "uoms" || h === "unit" || h === "units" || h === "unitofmeasure") {
      uomCol = c;
      break;
    }
  }

  if (data[0].length < 2 && uomCol === 1) {
    sheet.getRange(1, 2).setValue("UOM").setFontWeight("bold").setBackground("#123d35").setFontColor("#ffffff");
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][uomCol]).trim().toLowerCase() === uom.toLowerCase()) {
      return { success: true, message: "UOM already exists: " + uom };
    }
  }

  var targetRow = -1;
  for (var r = 1; r < data.length; r++) {
    if (!String(data[r][uomCol]).trim()) {
      targetRow = r + 1;
      break;
    }
  }
  if (targetRow === -1) {
    targetRow = data.length + 1;
  }
  sheet.getRange(targetRow, uomCol + 1).setValue(uom);
  return { success: true, message: "UOM added: " + uom };
}

function handleDeleteUom(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getMastersSheet(ss);
  if (!sheet) return { success: false, error: "Master sheet not found" };

  var uom = String(contents.uom || "").trim().toLowerCase();
  var data = sheet.getDataRange().getValues();
  var uomCol = 1;
  for (var c = 0; c < data[0].length; c++) {
    var h = String(data[0][c]).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (h === "uom" || h === "uoms" || h === "unit" || h === "units" || h === "unitofmeasure") {
      uomCol = c;
      break;
    }
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][uomCol]).trim().toLowerCase() === uom) {
      sheet.getRange(i + 1, uomCol + 1).clearContent();
      return { success: true, message: "UOM deleted: " + contents.uom };
    }
  }
  return { success: false, error: "UOM not found" };
}

function handleAddUser(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return { success: false, error: "Users sheet not found" };

  var data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    sheet.appendRow(["Login Id", "Password", "Name", "Role", "Page Access", "Status"]);
    data = sheet.getDataRange().getValues();
  }

  var headers = data[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  });

  var newRow = [];
  for (var c = 0; c < headers.length; c++) {
    var h = headers[c];
    if (h === "loginid") newRow.push(contents.loginId);
    else if (h === "password") newRow.push(contents.password);
    else if (h === "name") newRow.push(contents.name);
    else if (h === "role") newRow.push(contents.role || "user");
    else if (h === "status") newRow.push(contents.status || "Active");
    else if (h === "pageaccess") newRow.push(contents.pageAccess || "");
    else newRow.push("");
  }

  if (newRow.length === 0) {
    newRow = [
      contents.loginId,
      contents.password,
      contents.name,
      contents.role || "user",
      contents.pageAccess || "",
      contents.status || "Active"
    ];
  }

  sheet.appendRow(newRow);
  return { success: true, message: "User " + contents.loginId + " added" };
}

function handleUpdateUser(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return { success: false, error: "Users sheet not found" };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, error: "Users sheet empty" };

  var headers = data[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  });

  var loginCol = headers.indexOf("loginid");
  if (loginCol === -1) loginCol = 0;
  var passCol = headers.indexOf("password");
  var nameCol = headers.indexOf("name");
  var roleCol = headers.indexOf("role");
  var statusCol = headers.indexOf("status");
  var pageCol = headers.indexOf("pageaccess");

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][loginCol]).trim().toLowerCase() === String(contents.loginId).trim().toLowerCase()) {
      var rowNum = i + 1;
      if (contents.password !== undefined && passCol !== -1) sheet.getRange(rowNum, passCol + 1).setValue(contents.password);
      if (contents.name !== undefined && nameCol !== -1) sheet.getRange(rowNum, nameCol + 1).setValue(contents.name);
      if (contents.role !== undefined && roleCol !== -1) sheet.getRange(rowNum, roleCol + 1).setValue(contents.role);
      if (contents.status !== undefined && statusCol !== -1) sheet.getRange(rowNum, statusCol + 1).setValue(contents.status);
      if (contents.pageAccess !== undefined && pageCol !== -1) sheet.getRange(rowNum, pageCol + 1).setValue(contents.pageAccess);
      return { success: true, message: "User " + contents.loginId + " updated" };
    }
  }
  return { success: false, error: "User not found" };
}

function handleToggleUserStatus(contents) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return { success: false, error: "Users sheet not found" };

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, error: "Users sheet empty" };

  var headers = data[0].map(function(h) {
    return String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  });

  var loginCol = headers.indexOf("loginid");
  if (loginCol === -1) loginCol = 0;
  var statusCol = headers.indexOf("status");
  if (statusCol === -1) statusCol = 5;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][loginCol]).trim().toLowerCase() === String(contents.loginId).trim().toLowerCase()) {
      var current = String(data[i][statusCol] || "");
      var next = current.toLowerCase() === "active" ? "Inactive" : "Active";
      sheet.getRange(i + 1, statusCol + 1).setValue(next);
      return { success: true, status: next };
    }
  }
  return { success: false, error: "User not found" };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`

export const APPS_SCRIPT_CODE = GOOGLE_APPS_SCRIPT_CODE

/**
 * API client to interact directly with the Google Apps Script Web App
 */
export async function callAppsScriptApi(url: string, payload: any, timeoutMs: number = 15000): Promise<any> {
  if (!url || !url.startsWith('http')) {
    throw new Error('Please configure a valid Google Apps Script Web App URL')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchAllFromAppsScript(url: string, timeoutMs: number = 25000): Promise<any> {
  if (!url || !url.startsWith('http')) {
    throw new Error('Please configure a valid Google Apps Script Web App URL')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${url}?action=getAllData`, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    })

    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

