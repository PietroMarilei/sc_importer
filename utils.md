##### codice per estarre in oggetto tutte le colonne del file excel con header chiave valore

```
const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.readFile(INPUT_FILE_PATH);
    } catch (readError) {
      log(`Error reading Excel file ${INPUT_FILE_PATH}: ${readError.message}`);
      log(`Full path being accessed: ${path.resolve(__dirname, INPUT_FILE_PATH)}`);
      return;
    }

    const worksheet = workbook.worksheets[0]; // Assuming data is in the first sheet
    if (!worksheet) {
      log('No worksheet found in the Excel file.');
      return;
    }
    log(`Processing worksheet: ${worksheet.name}`);

    const headerRow = worksheet.getRow(1);

    let rowMapping = [];

    //lets create an object with the parsed data from the worksheet, all keys are the column names, all values are the cell values corresponding to the column name
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      //skip header row
      if (rowNumber === 1) return;
      const rowObject = {
        _rowNumber: rowNumber
      };
      headerRow.eachCell((cell, colNumber) => {
        rowObject[cell.value] = row.getCell(colNumber).value;
      });

      rowMapping.push(rowObject);
    });
```

### scrive sul file quella roba sopra

```
async function writeOutput(outputRowMapping) {
  const excludeColumns = [
    '_rowNumber',
  ];

  const outputWorkbook = new ExcelJS.Workbook();
  const outputSheet = outputWorkbook.addWorksheet('output');

  const allHeaders = Object.keys(outputRowMapping[0]);
  const outputHeaders = allHeaders.filter(key => !excludeColumns.includes(key));
  outputSheet.addRow(outputHeaders);



  for (const row of outputRowMapping) {
    // Questo converte esplicitamente '' in null per ExcelJS
    const dataRow = outputHeaders.map(header => {
      const value = row[header];
      return value === '' ? null : value;
    });
    outputSheet.addRow(dataRow);
  }

  // Calcola larghezza automatica per ogni colonna
  outputHeaders.forEach((header, i) => {
    let maxLength = header.length;
    outputSheet.eachRow((row, rowNumber) => {
      const cellValue = row.getCell(i + 1).value;
      if (cellValue && cellValue.toString().length > maxLength) {
        maxLength = cellValue.toString().length;
      }
    });
    outputSheet.getColumn(i + 1).width = maxLength + 2;
  });

  await outputWorkbook.xlsx.writeFile(tempFile);
  log(`File di output scritto in ${tempFile}`);
}
```

4728,
4727,
4726,
4720,
4723,
4722,
4719,
4721,
4716,
4718,
4717,
4724,
4725,
4712,
4711,
4710,
4715,
4714,
4709,
4713,
4706,
4708,
4704,
4705,
4703,
4707,
4701,
4698,
4702,
4697,
4699,
4700,
4696,
4695,
4693,
4694,
4692,
4691,
4689,
4688,
4690,

33256,
33257,
33258,
33259,
33260,
33261,
33262,
33263,
33264,
33265,
33266,
33267,
33268,
33269,
33270,
33271,
33272,
33273,
33274,
33275,
33276,
33277,
33278,
33279,
33280,
33281,
33282,
33283,
33284,
33285,
33286,
33287,
33288,
33289,
33290,
33291,
33292,
33293,
33294,
33295,
33296,
33297,
33298,
33299,
33300,
33301,
33302,
33303,
33304,
33305,
33306,
33307,
33308,
33309,
33310,
33311,
33312,
33313,
33314,
33315,
33316,
33317,
33318,
33319,
33320,
33321,
33322,
33323,
33324,
33325,
33326,
33327,
33328,
33329,
33330,
33331,
33332,
33333,
33334,
33335,
33336,
33337,
33338,
33339,
33340,
33341,
33342,
33343,
33344,
33345
