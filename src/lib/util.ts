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
