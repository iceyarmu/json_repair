import { JSONParser } from './jsonParser';
import { parseBooleanOrNull } from './parseHelpers/parseBooleanOrNull';
import { parseJsonLlmBlock } from './parseHelpers/parseJsonLlmBlock';
import { STRING_DELIMITERS, JSONReturnType } from './utils/constants';
import { ContextValues } from './utils/jsonContext';

function onlyWhitespaceUntil(parser: JSONParser, end: number): boolean {
  for (let j = 1; j < end; j++) {
    const c = parser.getCharAt(j);
    if (c !== null && !c.match(/\s/)) {
      return false;
    }
  }
  return true;
}

export function parseString(parser: JSONParser): JSONReturnType {
  // Utility function to append a character to the accumulator and update the index
  const appendLiteralChar = (acc: string, currentChar: string): [string, string | null] => {
    acc += currentChar;
    parser.index++;
    const char = parser.getCharAt();
    return [acc, char];
  };

  // <string> is a string of valid characters enclosed in quotes
  let missingQuotes = false;
  let doubledQuotes = false;
  let lstringDelimiter: string = '"';
  let rstringDelimiter: string = '"';

  let char = parser.getCharAt();
  if (char === '#' || char === '/') {
    return parser.parseComment();
  }

  // A valid string can only start with a valid quote or, in our case, with a literal
  while (char && !STRING_DELIMITERS.includes(char) && !char.match(/[a-zA-Z0-9]/)) {
    parser.index++;
    char = parser.getCharAt();
  }

  if (!char) {
    // This is an empty string
    return '';
  }

  // Ensuring we use the right delimiter
  if (char === "'") {
    lstringDelimiter = rstringDelimiter = "'";
  } else if (char === '"') {
    lstringDelimiter = '"';
    rstringDelimiter = '"';
  } else if (char.match(/[a-zA-Z0-9]/)) {
    // This could be a <boolean> and not a string
    if (['t', 'f', 'n'].includes(char.toLowerCase()) && parser.context.current !== ContextValues.OBJECT_KEY) {
      const value = parseBooleanOrNull(parser);
      if (value !== '') {
        return value;
      }
    }
    parser.log('While parsing a string, we found a literal instead of a quote');
    missingQuotes = true;
  }

  if (!missingQuotes) {
    parser.index++;
  }

  if (parser.getCharAt() === '`') {
    const retVal = parseJsonLlmBlock(parser);
    if (retVal !== false) {
      return retVal;
    }
    parser.log('While parsing a string, we found code fences but they did not enclose valid JSON, continuing parsing the string');
  }

  // Handle doubled quotes
  if (parser.getCharAt() === lstringDelimiter) {
    // If it's an empty key, this was easy
    if (
      (parser.context.current === ContextValues.OBJECT_KEY && parser.getCharAt(1) === ':') ||
      (parser.context.current === ContextValues.OBJECT_VALUE && [',', '}'].includes(parser.getCharAt(1) || '')) ||
      (parser.context.current === ContextValues.ARRAY && [',', ']'].includes(parser.getCharAt(1) || ''))
    ) {
      parser.index++;
      return '';
    } else if (parser.getCharAt(1) === lstringDelimiter) {
      parser.log('While parsing a string, we found a doubled quote and then a quote again, ignoring it');
      if (parser.strict) {
        throw new Error('Found doubled quotes followed by another quote.');
      } else {
        return '';
      }
    }

    // Find the next delimiter
    let i = parser.skipToCharacter(rstringDelimiter, 1);
    // Check if we have doubled quotes
    if (parser.getCharAt(i + 1) === rstringDelimiter) {
      parser.log('While parsing a string, we found a valid starting doubled quote');
      doubledQuotes = true;
      parser.index++;
    } else {
      // Check if this is an empty string or not
      i = parser.scrollWhitespaces(1);
      const nextC = parser.getCharAt(i);
      if (STRING_DELIMITERS.concat(['{', '[']).includes(nextC || '')) {
        parser.log('While parsing a string, we found a doubled quote but also another quote afterwards, ignoring it');
        if (parser.strict) {
          throw new Error('Found doubled quotes followed by another quote while parsing a string.');
        }
        parser.index++;
        return '';
      } else if (![',', ']', '}'].includes(nextC || '')) {
        parser.log('While parsing a string, we found a doubled quote but it was a mistake, removing one quote');
        parser.index++;
      }
    }
  }

  // Initialize our return value
  let stringAcc = '';

  char = parser.getCharAt();
  let unmatchedDelimiter = false;

  while (char && char !== rstringDelimiter) {
    if (missingQuotes) {
      if (parser.context.current === ContextValues.OBJECT_KEY && (char === ':' || char.match(/\s/))) {
        parser.log('While parsing a string missing the left delimiter in object key context, we found a :, stopping here');
        break;
      } else if (parser.context.current === ContextValues.ARRAY && [']', ','].includes(char)) {
        parser.log('While parsing a string missing the left delimiter in array context, we found a ] or ,, stopping here');
        break;
      }
    }

    // Complex logic for handling missing delimiters in object values
    if (
      !parser.streamStable &&
      parser.context.current === ContextValues.OBJECT_VALUE &&
      [',', '}'].includes(char) &&
      (!stringAcc || stringAcc[stringAcc.length - 1] !== rstringDelimiter)
    ) {
      let rstringDelimiterMissing = true;
      parser.skipWhitespaces();

      if (parser.getCharAt(1) === '\\') {
        rstringDelimiterMissing = false;
      }

      let i = parser.skipToCharacter(rstringDelimiter, 1);
      let nextC = parser.getCharAt(i);

      if (nextC) {
        i++;
        i = parser.scrollWhitespaces(i);
        nextC = parser.getCharAt(i);
        if (!nextC || [',', '}'].includes(nextC)) {
          rstringDelimiterMissing = false;
        } else {
          i = parser.skipToCharacter(lstringDelimiter, i);
          nextC = parser.getCharAt(i);
          if (!nextC) {
            rstringDelimiterMissing = false;
          } else {
            i = parser.scrollWhitespaces(i + 1);
            nextC = parser.getCharAt(i);
            if (nextC && nextC !== ':') {
              rstringDelimiterMissing = false;
            }
          }
        }
      } else {
        i = parser.skipToCharacter(':', 1);
        nextC = parser.getCharAt(i);
        if (nextC) {
          break;
        } else {
          i = parser.scrollWhitespaces(1);
          const j = parser.skipToCharacter('}', i);
          if (j - i > 1) {
            rstringDelimiterMissing = false;
          } else if (parser.getCharAt(j)) {
            for (let k = stringAcc.length - 1; k >= 0; k--) {
              if (stringAcc[k] === '{') {
                rstringDelimiterMissing = false;
                break;
              }
            }
          }
        }
      }

      if (rstringDelimiterMissing) {
        parser.log('While parsing a string missing the left delimiter in object value context, we found a , or } and we couldn\'t determine that a right delimiter was present. Stopping here');
        break;
      }
    }

    // Handle array context
    if (
      !parser.streamStable &&
      char === ']' &&
      parser.context.context.includes(ContextValues.ARRAY) &&
      (!stringAcc || stringAcc[stringAcc.length - 1] !== rstringDelimiter)
    ) {
      const i = parser.skipToCharacter(rstringDelimiter);
      if (!parser.getCharAt(i)) {
        break;
      }
    }

    // Handle closing brace in object value context
    if (parser.context.current === ContextValues.OBJECT_VALUE && char === '}') {
      let i = parser.scrollWhitespaces(1);
      const nextC = parser.getCharAt(i);
      if (nextC === '`' && parser.getCharAt(i + 1) === '`' && parser.getCharAt(i + 2) === '`') {
        parser.log('While parsing a string in object value context, we found a } that closes the object before code fences, stopping here');
        break;
      }
      if (!nextC) {
        parser.log('While parsing a string in object value context, we found a } that closes the object, stopping here');
        break;
      }
    }

    stringAcc += char;
    parser.index++;
    char = parser.getCharAt();

    if (char === null) {
      // Unclosed string ends with a \ character
      if (parser.streamStable && stringAcc && stringAcc[stringAcc.length - 1] === '\\') {
        stringAcc = stringAcc.slice(0, -1);
      }
      break;
    }

    // Handle escape sequences
    if (stringAcc && stringAcc[stringAcc.length - 1] === '\\') {
      parser.log('Found a stray escape sequence, normalizing it');
      if ([rstringDelimiter, 't', 'n', 'r', 'b', '\\'].includes(char)) {
        stringAcc = stringAcc.slice(0, -1);
        const escapeSeqs: { [key: string]: string } = { t: '\t', n: '\n', r: '\r', b: '\b' };
        stringAcc += escapeSeqs[char] || char;
        parser.index++;
        char = parser.getCharAt();
        while (char && stringAcc && stringAcc[stringAcc.length - 1] === '\\' && [rstringDelimiter, '\\'].includes(char)) {
          stringAcc = stringAcc.slice(0, -1) + char;
          parser.index++;
          char = parser.getCharAt();
        }
        continue;
      } else if (['u', 'x'].includes(char)) {
        const numChars = char === 'u' ? 4 : 2;
        const nextChars = parser.jsonStr.substring(parser.index + 1, parser.index + 1 + numChars);
        if (nextChars.length === numChars && /^[0-9a-fA-F]+$/.test(nextChars)) {
          parser.log('Found a unicode escape sequence, normalizing it');
          stringAcc = stringAcc.slice(0, -1) + String.fromCharCode(parseInt(nextChars, 16));
          parser.index += 1 + numChars;
          char = parser.getCharAt();
          continue;
        }
      } else if (STRING_DELIMITERS.includes(char) && char !== rstringDelimiter) {
        parser.log('Found a delimiter that was escaped but shouldn\'t be escaped, removing the escape');
        stringAcc = stringAcc.slice(0, -1) + char;
        parser.index++;
        char = parser.getCharAt();
        continue;
      }
    }

    // Handle potential missing right quote in object key context
    if (char === ':' && !missingQuotes && parser.context.current === ContextValues.OBJECT_KEY) {
      let i = parser.skipToCharacter(lstringDelimiter, 1);
      let nextC = parser.getCharAt(i);
      if (nextC) {
        i++;
        i = parser.skipToCharacter(rstringDelimiter, i);
        nextC = parser.getCharAt(i);
        if (nextC) {
          i++;
          i = parser.scrollWhitespaces(i);
          const ch = parser.getCharAt(i);
          if ([',', '}'].includes(ch || '')) {
            parser.log(`While parsing a string missing the right delimiter in object key context, we found a ${ch} stopping here`);
            break;
          }
        }
      } else {
        parser.log('While parsing a string missing the right delimiter in object key context, we found a :, stopping here');
        break;
      }
    }

    // Handle misplaced quotes
    if (char === rstringDelimiter && stringAcc && stringAcc[stringAcc.length - 1] !== '\\') {
      if (doubledQuotes && parser.getCharAt(1) === rstringDelimiter) {
        parser.log('While parsing a string, we found a doubled quote, ignoring it');
        parser.index++;
      } else if (missingQuotes && parser.context.current === ContextValues.OBJECT_VALUE) {
        let i = 1;
        let nextC = parser.getCharAt(i);
        while (nextC && ![rstringDelimiter, lstringDelimiter].includes(nextC)) {
          i++;
          nextC = parser.getCharAt(i);
        }
        if (nextC) {
          i++;
          i = parser.scrollWhitespaces(i);
          if (parser.getCharAt(i) === ':') {
            parser.index--;
            char = parser.getCharAt();
            parser.log('In a string with missing quotes and object value context, I found a delimiter but it turns out it was the beginning on the next key. Stopping here.');
            break;
          }
        }
      } else if (unmatchedDelimiter) {
        unmatchedDelimiter = false;
        [stringAcc, char] = appendLiteralChar(stringAcc, char);
      } else {
        // Complex logic to determine if this is truly a closing quote
        let i = 1;
        let nextC = parser.getCharAt(i);
        let checkCommaInObjectValue = true;

        while (nextC && ![rstringDelimiter, lstringDelimiter].includes(nextC)) {
          if (checkCommaInObjectValue && nextC.match(/[a-zA-Z]/)) {
            checkCommaInObjectValue = false;
          }
          if (
            (parser.context.context.includes(ContextValues.OBJECT_KEY) && [':', '}'].includes(nextC)) ||
            (parser.context.context.includes(ContextValues.OBJECT_VALUE) && nextC === '}') ||
            (parser.context.context.includes(ContextValues.ARRAY) && [']', ','].includes(nextC)) ||
            (checkCommaInObjectValue && parser.context.current === ContextValues.OBJECT_VALUE && nextC === ',')
          ) {
            break;
          }
          i++;
          nextC = parser.getCharAt(i);
        }

        // Additional complex checks for comma in object value context
        if (nextC === ',' && parser.context.current === ContextValues.OBJECT_VALUE) {
          i++;
          i = parser.skipToCharacter(rstringDelimiter, i);
          nextC = parser.getCharAt(i);
          i++;
          i = parser.scrollWhitespaces(i);
          nextC = parser.getCharAt(i);
          if (['}', ','].includes(nextC || '')) {
            parser.log('While parsing a string, we found a misplaced quote that would have closed the string but has a different meaning here, ignoring it');
            [stringAcc, char] = appendLiteralChar(stringAcc, char);
            continue;
          }
        } else if (nextC === rstringDelimiter && parser.getCharAt(i - 1) !== '\\') {
          if (onlyWhitespaceUntil(parser, i)) {
            break;
          }
          // More complex checks for object value and array contexts
          if (parser.context.current === ContextValues.OBJECT_VALUE) {
            i = parser.scrollWhitespaces(i + 1);
            if (parser.getCharAt(i) === ',') {
              i = parser.skipToCharacter(lstringDelimiter, i + 1);
              i++;
              i = parser.skipToCharacter(rstringDelimiter, i + 1);
              i++;
              i = parser.scrollWhitespaces(i);
              nextC = parser.getCharAt(i);
              if (nextC === ':') {
                parser.log('While parsing a string, we found a misplaced quote that would have closed the string but has a different meaning here, ignoring it');
                [stringAcc, char] = appendLiteralChar(stringAcc, char);
                continue;
              }
            }
            i = parser.skipToCharacter(rstringDelimiter, i + 1);
            i++;
            nextC = parser.getCharAt(i);
            while (nextC && nextC !== ':') {
              if ([',', ']', '}'].includes(nextC) || (nextC === rstringDelimiter && parser.getCharAt(i - 1) !== '\\')) {
                break;
              }
              i++;
              nextC = parser.getCharAt(i);
            }
            if (nextC !== ':') {
              parser.log('While parsing a string, we found a misplaced quote that would have closed the string but has a different meaning here, ignoring it');
              unmatchedDelimiter = !unmatchedDelimiter;
              [stringAcc, char] = appendLiteralChar(stringAcc, char);
            }
          } else if (parser.context.current === ContextValues.ARRAY) {
            let evenDelimiters = nextC === rstringDelimiter;
            while (nextC === rstringDelimiter) {
              i = parser.skipToCharacter([rstringDelimiter, ']'], i + 1);
              nextC = parser.getCharAt(i);
              if (nextC !== rstringDelimiter) {
                evenDelimiters = false;
                break;
              }
              i = parser.skipToCharacter([rstringDelimiter, ']'], i + 1);
              nextC = parser.getCharAt(i);
            }
            if (evenDelimiters) {
              parser.log('While parsing a string in Array context, we detected a quoted section that would have closed the string but has a different meaning here, ignoring it');
              unmatchedDelimiter = !unmatchedDelimiter;
              [stringAcc, char] = appendLiteralChar(stringAcc, char);
            } else {
              break;
            }
          } else if (parser.context.current === ContextValues.OBJECT_KEY) {
            parser.log('While parsing a string in Object Key context, we detected a quoted section that would have closed the string but has a different meaning here, ignoring it');
            [stringAcc, char] = appendLiteralChar(stringAcc, char);
          }
        }
      }
    }
  }

  // Handle corner case for missing quotes in object key with comments
  if (char && missingQuotes && parser.context.current === ContextValues.OBJECT_KEY && char.match(/\s/)) {
    parser.log('While parsing a string, handling an extreme corner case in which the LLM added a comment instead of valid string, invalidate the string and return an empty value');
    parser.skipWhitespaces();
    if (![':',','].includes(parser.getCharAt() || '')) {
      return '';
    }
  }

  // Update index if we had a closing quote
  if (char !== rstringDelimiter) {
    if (!parser.streamStable) {
      parser.log('While parsing a string, we missed the closing quote, ignoring');
      stringAcc = stringAcc.trimEnd();
    }
  } else {
    parser.index++;
  }

  if (!parser.streamStable && (missingQuotes || (stringAcc && stringAcc.endsWith('\n')))) {
    stringAcc = stringAcc.trimEnd();
  }

  return stringAcc;
}
