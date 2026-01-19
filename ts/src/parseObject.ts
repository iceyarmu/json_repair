import { JSONParser } from './jsonParser';
import { STRING_DELIMITERS, JSONReturnType } from './utils/constants';
import { ContextValues } from './utils/jsonContext';

export function parseObject(parser: JSONParser): JSONReturnType {
  // <object> ::= '{' [ <member> *(', ' <member>) ] '}' ; A sequence of 'members'
  const obj: { [key: string]: JSONReturnType } = {};
  const startIndex = parser.index;

  // Stop when you either find the closing parentheses or you have iterated over the entire string
  while ((parser.getCharAt() || '}') !== '}') {
    // This is what we expect to find:
    // <member> ::= <string> ': ' <json>

    // Skip filler whitespaces
    parser.skipWhitespaces();

    // Sometimes LLMs do weird things, if we find a ":" so early, we'll change it to "," and move on
    if (parser.getCharAt() === ':') {
      parser.log('While parsing an object we found a : before a key, ignoring');
      parser.index++;
    }

    // We are now searching for the string key
    // Context is used in the string parser to manage the lack of quotes
    parser.context.set(ContextValues.OBJECT_KEY);

    // Save this index in case we need to find a duplicate key
    let rollbackIndex = parser.index;

    // <member> starts with a <string>
    let key = '';
    while (parser.getCharAt()) {
      // The rollback index needs to be updated here in case the key is empty
      rollbackIndex = parser.index;

      if (parser.getCharAt() === '[' && key === '') {
        // Is this an array?
        // Need to check if the previous parsed value contained in obj is an array and in that case parse and merge the two
        const objKeys = Object.keys(obj);
        const prevKey = objKeys.length > 0 ? objKeys[objKeys.length - 1] : null;
        if (prevKey && Array.isArray(obj[prevKey])) {
          // If the previous key's value is an array, parse the new array and merge
          parser.index++;
          const newArray = parser.parseArray();
          if (Array.isArray(newArray)) {
            // Merge and flatten the arrays
            const prevValue = obj[prevKey];
            if (Array.isArray(prevValue)) {
              if (newArray.length === 1 && Array.isArray(newArray[0])) {
                prevValue.push(...newArray[0]);
              } else {
                prevValue.push(...newArray);
              }
            }
            parser.skipWhitespaces();
            if (parser.getCharAt() === ',') {
              parser.index++;
            }
            parser.skipWhitespaces();
            continue;
          }
        }
      }

      const rawKey = parser.parseString();
      if (typeof rawKey !== 'string') {
        key = String(rawKey);
      } else {
        key = rawKey;
      }

      if (key === '') {
        parser.skipWhitespaces();
      }
      if (key !== '' || (key === '' && [':', '}'].includes(parser.getCharAt() || ''))) {
        // Empty keys now trigger in strict mode
        if (key === '' && parser.strict) {
          parser.log('Empty key found in strict mode while parsing object, raising an error');
          throw new Error('Empty key found in strict mode while parsing object.');
        }
        break;
      }
    }

    if (parser.context.context.includes(ContextValues.ARRAY) && key in obj) {
      if (parser.strict) {
        parser.log('Duplicate key found in strict mode while parsing object, raising an error');
        throw new Error('Duplicate key found in strict mode while parsing object.');
      }
      parser.log('While parsing an object we found a duplicate key, closing the object here and rolling back the index');
      parser.index = rollbackIndex - 1;
      // add an opening curly brace to make this work
      parser.jsonStr = parser.jsonStr.substring(0, parser.index + 1) + '{' + parser.jsonStr.substring(parser.index + 1);
      break;
    }

    // Skip filler whitespaces
    parser.skipWhitespaces();

    // We reached the end here
    if ((parser.getCharAt() || '}') === '}') {
      continue;
    }

    parser.skipWhitespaces();

    // An extreme case of missing ":" after a key
    if (parser.getCharAt() !== ':') {
      if (parser.strict) {
        parser.log('Missing \':\' after key in strict mode while parsing object, raising an error');
        throw new Error('Missing \':\' after key in strict mode while parsing object.');
      }
      parser.log('While parsing an object we missed a : after a key');
    }

    parser.index++;
    parser.context.reset();
    parser.context.set(ContextValues.OBJECT_VALUE);

    // The value can be any valid json
    parser.skipWhitespaces();
    // Corner case, a lone comma
    let value: JSONReturnType = '';
    const char = parser.getCharAt();
    if ([',', '}'].includes(char || '')) {
      parser.log(`While parsing an object value we found a stray ${char}, ignoring it`);
    } else {
      value = parser.parseJson();
    }

    if (value === '' && parser.strict && !STRING_DELIMITERS.includes(parser.getCharAt(-1) || '')) {
      parser.log('Parsed value is empty in strict mode while parsing object, raising an error');
      throw new Error('Parsed value is empty in strict mode while parsing object.');
    }

    // Reset context since our job is done
    parser.context.reset();
    obj[key] = value;

    if ([',', "'", '"'].includes(parser.getCharAt() || '')) {
      parser.index++;
    }
    if (parser.getCharAt() === ']' && parser.context.context.includes(ContextValues.ARRAY)) {
      parser.log('While parsing an object we found a closing array bracket, closing the object here and rolling back the index');
      parser.index--;
      break;
    }
    // Remove trailing spaces
    parser.skipWhitespaces();
  }

  parser.index++;

  // If the object is empty but also isn't just {}
  if (Object.keys(obj).length === 0 && parser.index - startIndex > 2) {
    if (parser.strict) {
      parser.log('Parsed object is empty but contains extra characters in strict mode, raising an error');
      throw new Error('Parsed object is empty but contains extra characters in strict mode.');
    }
    parser.log('Parsed object is empty, we will try to parse this as an array instead');
    parser.index = startIndex;
    return parser.parseArray();
  }

  // Check if there are more key-value pairs after the closing brace
  if (!parser.context.empty) {
    // Sometimes there could be an extra closing brace that closes the object twice
    if (parser.getCharAt() === '}' && ![ContextValues.OBJECT_KEY, ContextValues.OBJECT_VALUE].includes(parser.context.current as ContextValues)) {
      parser.log('Found an extra closing brace that shouldn\'t be there, skipping it');
      parser.index++;
    }
    return obj;
  }

  parser.skipWhitespaces();
  if (parser.getCharAt() !== ',') {
    return obj;
  }
  parser.index++;
  parser.skipWhitespaces();
  if (!STRING_DELIMITERS.includes(parser.getCharAt() || '')) {
    return obj;
  }
  if (!parser.strict) {
    parser.log('Found a comma and string delimiter after object closing brace, checking for additional key-value pairs');
    const additionalObj = parser.parseObject();
    if (typeof additionalObj === 'object' && !Array.isArray(additionalObj) && additionalObj !== null) {
      Object.assign(obj, additionalObj);
    }
  }

  return obj;
}
