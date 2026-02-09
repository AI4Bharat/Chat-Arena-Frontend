// transliterate-utils.js

/**
 * Sets the caret position in an input or textarea element
 * @param {HTMLInputElement | HTMLTextAreaElement} element - The input element
 * @param {number} position - The position to set the caret to
 */
export function setCaretPosition(element, position) {
  if (!element) return;
  
  if (element.setSelectionRange) {
    element.focus();
    element.setSelectionRange(position, position);
  } else if (element.createTextRange) {
    // For older IE browsers
    const range = element.createTextRange();
    range.collapse(true);
    range.moveEnd('character', position);
    range.moveStart('character', position);
    range.select();
  }
}

/**
 * Gets the current selection (start and end positions) in an input element
 * @param {HTMLInputElement | HTMLTextAreaElement} element - The input element
 * @returns {{start: number, end: number}} Object with start and end positions
 */
export function getInputSelection(element) {
  if (!element) {
    return { start: 0, end: 0 };
  }

  if ('selectionStart' in element && 'selectionEnd' in element) {
    return {
      start: element.selectionStart || 0,
      end: element.selectionEnd || 0,
    };
  }

  // Fallback for older browsers
  if (document.selection && document.selection.createRange) {
    const range = document.selection.createRange();
    const stored = range.duplicate();
    stored.moveToElementText(element);
    stored.setEndPoint('EndToEnd', range);
    const start = stored.text.length - range.text.length;
    const end = start + range.text.length;
    return { start, end };
  }

  return { start: 0, end: 0 };
}
