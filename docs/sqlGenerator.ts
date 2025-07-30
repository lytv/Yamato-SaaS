import type { GridApi } from 'ag-grid-community';

// Add type definition for row data
type GridRowData = {
  [key: string]: any;
};

/**
 * Hàm tạo câu lệnh SQL UPDATE từ dữ liệu GridView
 *
 * Hàm này tạo các câu lệnh SQL UPDATE cho bảng dựa trên dữ liệu trong GridView.
 * Nó sử dụng ký hiệu (T 1, T 2, T 3...) làm điều kiện và cập nhật giá trị
 * cho các cột từ 26 đến 34.
 *
 * @param gridApi API của AG Grid từ GridView
 * @returns Chuỗi chứa các câu lệnh SQL UPDATE
 */
export function generateVeTinhUpdates(gridApi: GridApi): string {
  // Mảng lưu các câu lệnh SQL
  const sqlStatements: string[] = [];

  // Lấy tất cả dữ liệu từ grid
  const rowData: GridRowData[] = [];
  gridApi.forEachNode((node) => {
    if (node.data) {
      rowData.push(node.data);
    }
  });

  // Tìm dòng chứa các ID cột (dòng thứ 2)
  if (rowData.length < 2) {
    return 'Không đủ dữ liệu trong bảng';
  }

  const firstRow = rowData[0];
  if (!firstRow) {
    return 'Không tìm thấy dữ liệu trong bảng';
  }

  // Xác định tên cột chứa ký hiệu (T 1, T 2, ...)
  const firstKey = Object.keys(firstRow)[0]; // Cột đầu tiên
  if (!firstKey) {
    return 'Không tìm thấy cột ký hiệu';
  }
  const kyHieuColumnName = firstKey;

  // Lấy các dòng từ T 1 đến T 8 (bắt đầu từ dòng thứ 3)
  const dataRows = rowData.slice(2); // Bỏ qua 2 dòng header

  // Xác định các cột cần cập nhật (từ 26 đến 34)
  const numericColumns = Object.keys(firstRow)
    .filter((key) => {
      // Lọc các cột có tên là số từ 26 đến 34
      const colNum = Number.parseInt(key);
      return !Number.isNaN(colNum) && colNum >= 26 && colNum <= 34;
    })
    .sort((a, b) => Number.parseInt(a) - Number.parseInt(b)); // Sắp xếp theo thứ tự số

  // Tạo câu lệnh SQL cho từng dòng
  dataRows.forEach((row: GridRowData) => {
    // Ensure kyHieuColumnName exists in row before accessing
    if (!(kyHieuColumnName in row)) {
      return;
    }

    const kyHieu = row[kyHieuColumnName]; // Now TypeScript knows this is safe

    if (!kyHieu) {
      return;
    } // Bỏ qua nếu không có ký hiệu

    // Tạo các mệnh đề SET
    const setStatements = numericColumns.map((colId) => {
      const value = row[colId];
      return `    [${colId}] = ${value}`;
    });

    // Tạo câu lệnh UPDATE đầy đủ
    const sqlStatement = `UPDATE [tblDonGiaVeTinh]
SET 
${setStatements.join(',\n')}
WHERE [kyhieu] = '${kyHieu}';`;

    sqlStatements.push(sqlStatement);
  });

  // Kết hợp tất cả các câu lệnh SQL
  return sqlStatements.join('\n\n');
}

/**
 * Phiên bản đơn giản hơn của hàm tạo SQL dùng cho trường hợp không có GridApi
 *
 * @param tableData Dữ liệu dạng mảng 2 chiều từ bảng
 * @returns Chuỗi chứa các câu lệnh SQL UPDATE
 */
export function generateVeTinhUpdatesFromTable(tableData: any[][]): string {
  // Mảng lưu các câu lệnh SQL
  const sqlStatements: string[] = [];

  // Kiểm tra dữ liệu đầu vào
  if (!tableData || tableData.length < 3 || !tableData[1]) {
    return 'Không đủ dữ liệu trong bảng';
  }

  // Dòng 2 chứa ID cột (26, 27, 28, ...)
  const columnIds = tableData[1].slice(1); // Now safe since we checked tableData[1] exists

  // Lấy các dòng dữ liệu từ dòng thứ 3 trở đi
  for (let i = 2; i < tableData.length; i++) {
    const row = tableData[i];
    if (!row) {
      continue;
    }

    const kyHieu = row[0]; // Cột đầu tiên chứa ký hiệu (T 1, T 2, ...)

    if (!kyHieu) {
      continue;
    } // Bỏ qua nếu không có ký hiệu

    // Tạo các mệnh đề SET cho các cột từ 26 đến 34
    const setStatements = columnIds
      .map((colId, index) => {
        // Kiểm tra xem ID cột có phải là số từ 26-34 không
        const colNum = Number.parseInt(colId);
        if (!Number.isNaN(colNum) && colNum >= 26 && colNum <= 34) {
          const value = row[index + 1]; // +1 vì đã bỏ qua cột đầu tiên
          return `    [${colId}] = ${value}`;
        }
        return null;
      })
      .filter(stmt => stmt !== null); // Lọc bỏ các mệnh đề null

    // Tạo câu lệnh UPDATE đầy đủ
    const sqlStatement = `UPDATE [tblDonGiaVeTinh]
SET 
${setStatements.join(',\n')}
WHERE [kyhieu] = '${kyHieu}';`;

    sqlStatements.push(sqlStatement);
  }

  // Kết hợp tất cả các câu lệnh SQL
  return sqlStatements.join('\n\n');
}

/**
 * Hàm copy text vào clipboard
 *
 * @param text Văn bản cần copy
 * @returns Promise<boolean> Trạng thái copy thành công hay không
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Không thể copy vào clipboard:', err);
    return false;
  }
}

const parseValue = (value: string): string | number => {
  // Try to parse as number
  const numValue = Number.parseInt(value, 10);
  if (!Number.isNaN(numValue)) {
    return numValue;
  }

  // Try to parse as date
  const dateParts = value.split('/');
  if (dateParts.length === 3) {
    const [dayStr, monthStr, yearStr] = dateParts;
    if (!dayStr || !monthStr || !yearStr) {
      return `'${value}'`;
    }

    const day = Number.parseInt(dayStr, 10);
    const month = Number.parseInt(monthStr, 10);
    const year = Number.parseInt(yearStr, 10);
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      return `'${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}'`;
    }
  }

  // Return as string with quotes
  return `'${value}'`;
};

const generateUpdateSql = (data: Record<string, any>[], tableName: string, keyField: string): string => {
  if (!data.length) {
    return '';
  }

  const updates = data
    .filter((row): row is Record<string, any> => row !== null && row !== undefined)
    .map((row) => {
      const setClause = Object.entries(row)
        .filter(([field]) => field !== keyField)
        .map(([field, value]) => `${field} = ${parseValue(String(value))}`)
        .join(', ');

      return `UPDATE ${tableName} SET ${setClause} WHERE ${keyField} = ${parseValue(String(row[keyField]))};\n`;
    });

  return updates.join('');
};

const generateInsertSql = (data: Record<string, any>[], tableName: string): string => {
  if (!data.length) {
    return '';
  }

  const firstRow = data.find(row => row !== null && row !== undefined);
  if (!firstRow) {
    return '';
  }

  const fields = Object.keys(firstRow);
  const fieldList = fields.join(', ');

  const values = data
    .filter((row): row is Record<string, any> => row !== null && row !== undefined)
    .map((row) => {
      const rowValues = fields.map(field => parseValue(String(row[field])));
      return `(${rowValues.join(', ')})`;
    });

  return `INSERT INTO ${tableName} (${fieldList}) VALUES\n${values.join(',\n')};\n`;
};

const generateDeleteSql = (data: Record<string, any>[], tableName: string, keyField: string): string => {
  if (!data.length) {
    return '';
  }

  const keys = data
    .filter((row): row is Record<string, any> => row !== null && row !== undefined)
    .map(row => parseValue(String(row[keyField])));

  return `DELETE FROM ${tableName} WHERE ${keyField} IN (${keys.join(', ')});\n`;
};

export { generateDeleteSql, generateInsertSql, generateUpdateSql };
