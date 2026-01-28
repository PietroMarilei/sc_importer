const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");


const { log } = require("./logger");

async function excel_to_object(file_path) {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(file_path);
  } catch (readError) {
    log(`[Excel] Error reading file ${file_path}: ${readError.message}`);
    log(
      `[Excel] Full path being accessed: ${path.resolve(__dirname, file_path)}`
    );
    return;
  }

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    log("[Excel] No worksheet found");
    return;
  }

  const headerRow = worksheet.getRow(1);

  let obj = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // Skip header
    if (rowNumber === 1) return;

    const rowObject = {
      _rowNumber: rowNumber,
    };

    headerRow.eachCell((cell, colNumber) => {
      rowObject[cell.value] = row.getCell(colNumber).value;
    });

    obj.push(rowObject);
  });

  return obj;
}

async function object_to_excel(file_path, obj) {
  // Exclude columns
  const exclude = ["_rowNumber"];

  // Workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("output");

  const headers = Object.keys(obj[0]);
  const filtered_headers = headers.filter((key) => !exclude.includes(key));

  sheet.addRow(filtered_headers);

  for (const row of obj) {
    // Empty strings to null
    const dataRow = filtered_headers.map((header) => {
      const value = row[header];
      return value === "" ? null : value;
    });
    sheet.addRow(dataRow);
  }

  headers.forEach((header, i) => {
    let maxLength = header.length;
    sheet.eachRow((row, rowNumber) => {
      const cellValue = row.getCell(i + 1).value;
      if (cellValue && cellValue.toString().length > maxLength) {
        maxLength = cellValue.toString().length;
      }
    });
    sheet.getColumn(i + 1).width = maxLength + 2;
  });

  await workbook.xlsx.writeFile(file_path);
  log(`[Excel] Output file: ${file_path}`);
}

async function object_to_excel_stream(file_path, obj) {
  if (!obj || obj.length === 0) return;

  // Exclude columns
  const exclude = ["_rowNumber"];

  // Streaming workbook
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: file_path });
  const sheet = workbook.addWorksheet("output");

  const headers = Object.keys(obj[0]);
  const filtered_headers = headers.filter((key) => !exclude.includes(key));

  // Add headers
  sheet.addRow(filtered_headers).commit();

  // Add rows one by one (streaming)
  for (const row of obj) {
    // Empty strings to null (same as object_to_excel)
    const dataRow = filtered_headers.map((header) => {
      const value = row[header];
      return value === "" ? null : value;
    });
    sheet.addRow(dataRow).commit();
  }

  await workbook.commit();
  log(`[Excel] Output file: ${file_path}`);
}

// async function csv_to_object(file_path, delimiter = ';') {
//   const workbook = new ExcelJS.Workbook();

//   try {
//     await workbook.csv.readFile(file_path, {
//       parserOptions: {
//         delimiter: delimiter,
//       },
//     });
//   } catch (readError) {
//     log(`[CSV] Error reading file ${file_path}: ${readError.message}`);
//     return [];
//   }

//   const worksheet = workbook.worksheets[0];

//   if (!worksheet) {
//     log("[CSV] No worksheet found");
//     return [];
//   }

//   const headerRow = worksheet.getRow(1);
//   const headers = [];
//   headerRow.eachCell((cell, colNumber) => {
//     headers[colNumber] = cell.value?.toString().trim() || `col_${colNumber}`;
//   });

//   const obj = [];

//   worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
//     if (rowNumber === 1) return;

//     const rowObject = { _rowNumber: rowNumber };

//     headers.forEach((header, colNumber) => {
//       if (header && colNumber > 0) {
//         const cellValue = row.getCell(colNumber).value;
//         rowObject[header] = cellValue !== null && cellValue !== undefined ? cellValue : null;
//       }
//     });
//     obj.push(rowObject);
//   });

//   return obj;
// }

module.exports = { excel_to_object, object_to_excel, object_to_excel_stream };
