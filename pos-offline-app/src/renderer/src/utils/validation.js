export const validateNumber = (value, min = undefined, max = undefined, defaultValue = 0) => {
  if (value === '' || value === null || value === undefined) return defaultValue;

  const num = parseFloat(value);
  if (isNaN(num)) return defaultValue;

  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;

  return num;
};

export const validatePositiveNumber = (value, defaultValue = 0) => {
  return validateNumber(value, 0, undefined, defaultValue);
};

export const validateTaxRate = (value) => {
  return validateNumber(value, 0, 100, 0);
};

export const validateStockThreshold = (value) => {
  return validateNumber(value, 0, undefined, 10);
};

export const validateText = (value, maxLength = 255) => {
  if (!value) return '';
  const str = String(value).trim();
  return str.length > maxLength ? str.substring(0, maxLength) : str;
};

export const validateBarcode = (value) => {
  return validateText(value, 50);
};

export const validateProductName = (value) => {
  return validateText(value, 100);
};

export const validatePrice = (value) => {
  return validatePositiveNumber(value, 0);
};

export const validateStock = (value) => {
  return Math.max(0, Math.floor(validateNumber(value, 0, undefined, 0)));
};

export const validateDiscount = (value) => {
  return validatePositiveNumber(value, 0);
};

export const validateReceivedAmount = (value) => {
  return validatePositiveNumber(value, 0);
};
