/**
 * Utility functions for Excel price import
 * Handles validation and parsing of price update files
 */

export interface ExcelPriceData {
  productCode: string;
  stepCode: string;
  price: number;
  rowIndex: number;
  colIndex: number;
}

export interface ValidationError {
  message: string;
  rowIndex?: number;
  colIndex?: number;
  productCode?: string;
  stepCode?: string;
}

/**
 * Validates Excel data format and content
 */
export const validateExcelPriceData = (
  jsonData: any[][],
  productLookup: Map<string, number>,
  stepLookup: Map<string, number>
): {
  validData: ExcelPriceData[];
  errors: ValidationError[];
} => {
  const validData: ExcelPriceData[] = [];
  const errors: ValidationError[] = [];

  if (jsonData.length < 2) {
    errors.push({ message: 'Excel file must have at least 2 rows (header + data)' });
    return { validData, errors };
  }

  // Extract step codes from first row (skip first column)
  const firstRow = jsonData[0];
  if (!firstRow) {
    errors.push({ message: 'No data found in first row' });
    return { validData, errors };
  }
  const stepCodes = firstRow.slice(1).filter(code => code && code.toString().trim());
  
  if (stepCodes.length === 0) {
    errors.push({ message: 'No step codes found in first row' });
    return { validData, errors };
  }

  // Extract product codes and prices from subsequent rows
  const productRows = jsonData.slice(1).filter(row => row[0] && row[0].toString().trim());
  
  if (productRows.length === 0) {
    errors.push({ message: 'No product codes found in first column' });
    return { validData, errors };
  }

  // Validate step codes exist
  stepCodes.forEach((stepCode, colIndex) => {
    const stepCodeStr = stepCode.toString().trim();
    if (!stepLookup.has(stepCodeStr)) {
      errors.push({
        message: `Step code '${stepCodeStr}' not found in database`,
        colIndex: colIndex + 2,
        stepCode: stepCodeStr
      });
    }
  });

  // Process each row
  productRows.forEach((row, rowIndex) => {
    const productCode = row[0].toString().trim();
    
    // Validate product code exists
    if (!productLookup.has(productCode)) {
      errors.push({
        message: `Product code '${productCode}' not found in database`,
        rowIndex: rowIndex + 2,
        productCode
      });
      return;
    }

    // Process each price cell in this row
    stepCodes.forEach((stepCode, colIndex) => {
      const stepCodeStr = stepCode.toString().trim();
      const priceValue = row[colIndex + 1]; // +1 because first column is product code

      // Skip empty cells
      if (priceValue === null || priceValue === undefined || priceValue === '') {
        return;
      }

      // Validate price value
      const price = parseFloat(priceValue.toString());
      
      if (isNaN(price)) {
        errors.push({
          message: `Invalid price value '${priceValue}' - must be a number`,
          rowIndex: rowIndex + 2,
          colIndex: colIndex + 2,
          productCode,
          stepCode: stepCodeStr
        });
        return;
      }

      if (price < 0) {
        errors.push({
          message: `Price cannot be negative: ${price}`,
          rowIndex: rowIndex + 2,
          colIndex: colIndex + 2,
          productCode,
          stepCode: stepCodeStr
        });
        return;
      }

      // Add valid data
      if (productLookup.has(productCode) && stepLookup.has(stepCodeStr)) {
        validData.push({
          productCode,
          stepCode: stepCodeStr,
          price,
          rowIndex: rowIndex + 2,
          colIndex: colIndex + 2
        });
      }
    });
  });

  return { validData, errors };
};

/**
 * Formats validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): string[] => {
  return errors.map(error => {
    let location = '';
    
    if (error.rowIndex && error.colIndex) {
      location = `Row ${error.rowIndex}, Col ${error.colIndex}: `;
    } else if (error.rowIndex) {
      location = `Row ${error.rowIndex}: `;
    } else if (error.colIndex) {
      location = `Col ${error.colIndex}: `;
    }

    return `${location}${error.message}`;
  });
};

/**
 * Groups validation errors by type for better reporting
 */
export const groupValidationErrors = (errors: ValidationError[]) => {
  const groups = {
    productNotFound: [] as ValidationError[],
    stepNotFound: [] as ValidationError[],
    invalidPrice: [] as ValidationError[],
    format: [] as ValidationError[],
    other: [] as ValidationError[]
  };

  errors.forEach(error => {
    if (error.message.includes('Product code') && error.message.includes('not found')) {
      groups.productNotFound.push(error);
    } else if (error.message.includes('Step code') && error.message.includes('not found')) {
      groups.stepNotFound.push(error);
    } else if (error.message.includes('Invalid price') || error.message.includes('negative')) {
      groups.invalidPrice.push(error);
    } else if (error.message.includes('Excel file') || error.message.includes('No step codes') || error.message.includes('No product codes')) {
      groups.format.push(error);
    } else {
      groups.other.push(error);
    }
  });

  return groups;
};