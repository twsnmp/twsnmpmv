/**
 * Converts full-width ASCII characters (zenkaku) to half-width (hankaku).
 * Also normalizes Japanese prolonged sound marks/dashes to hyphens and full-width spaces to half-width.
 */
export const toHalfWidth = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[ー―‐–—−]/g, "-")
    .replace(/　/g, " ");
};

/**
 * Filters a string to only contain valid ASCII characters permitted in a URL.
 * Full-width characters are automatically converted to half-width first.
 */
export const filterUrl = (str: string): string => {
  if (!str) return "";
  const normalized = toHalfWidth(str).trim();
  // Keep printable ASCII characters excluding whitespace
  return normalized.replace(/[^\x21-\x7E]/g, "");
};

/**
 * Filters a string to only contain alphanumeric characters and common username symbols (. _ - @).
 * Full-width characters are automatically converted to half-width first.
 */
export const filterUsername = (str: string): string => {
  if (!str) return "";
  const normalized = toHalfWidth(str).trim();
  return normalized.replace(/[^a-zA-Z0-9._\-@]/g, "");
};

/**
 * Filters a string to only contain valid ASCII password characters.
 * Full-width characters are automatically converted to half-width first.
 */
export const filterPassword = (str: string): string => {
  if (!str) return "";
  const normalized = toHalfWidth(str);
  return normalized.replace(/[^\x21-\x7E]/g, "");
};
