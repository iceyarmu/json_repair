import { JSONParser } from './jsonParser';
import { NUMBER_CHARS, JSONReturnType } from './utils/constants';
import { ContextValues } from './utils/jsonContext';

export function parseNumber(parser: JSONParser): JSONReturnType {
  // <number> is a valid real number expressed in one of a number of given formats
  let numberStr = '';
  let char = parser.getCharAt();
  const isArray = parser.context.current === ContextValues.ARRAY;

  while (char && NUMBER_CHARS.has(char) && (!isArray || char !== ',')) {
    if (char !== '_') {
      numberStr += char;
    }
    parser.index++;
    char = parser.getCharAt();
  }

  if (numberStr && ['-', 'e', 'E', '/', ','].includes(numberStr[numberStr.length - 1])) {
    // The number ends with a non-valid character for a number/currency, rolling back one
    numberStr = numberStr.slice(0, -1);
    parser.index--;
  } else if ((parser.getCharAt() || '').match(/[a-zA-Z]/)) {
    // this was a string instead, sorry
    parser.index -= numberStr.length;
    return parser.parseString();
  }

  // Check for invalid number formats that should be treated as strings
  if (numberStr.includes(',') || numberStr.includes('/')) {
    return numberStr;
  }

  // Check for dash in middle (like "10-20" range) - but allow scientific notation like "1e-10"
  // and negative numbers at the start
  const dashIndex = numberStr.indexOf('-', 1); // Start search from index 1
  if (dashIndex !== -1) {
    // Check if it's not scientific notation (dash after e/E)
    const charBeforeDash = numberStr[dashIndex - 1];
    if (charBeforeDash !== 'e' && charBeforeDash !== 'E') {
      return numberStr;
    }
  }

  // Check for multiple dots (like version numbers "1.1.1")
  const dotCount = (numberStr.match(/\./g) || []).length;
  if (dotCount > 1) {
    return numberStr;
  }

  try {
    if (numberStr.includes('.') || numberStr.includes('e') || numberStr.includes('E')) {
      const result = parseFloat(numberStr);
      // Check if parsing was successful (not NaN)
      if (isNaN(result)) {
        return numberStr;
      }
      return result;
    } else {
      const result = parseInt(numberStr, 10);
      // Check if parsing was successful (not NaN)
      if (isNaN(result)) {
        return numberStr;
      }
      return result;
    }
  } catch (e) {
    return numberStr;
  }
}
