/**
 * Truncates a string to the specified length and adds an ellipsis ("...") if needed.
 *
 * @param {string} str - The string to be truncated.
 * @param {number} maxLength - The maximum length of the string before truncating.
 * @param {boolean} [useEllipsis=true] - Whether to add "..." at the end if truncated (default is true).
 * @returns {string} - The truncated string.
 */
const truncate = (
  str: string,
  maxLength: number,
): string => {
  if (str.length <= maxLength) {
    return str
  }

  return `${str.substring(0, maxLength)}...` // Adds ellipsis by default
}

export default truncate
