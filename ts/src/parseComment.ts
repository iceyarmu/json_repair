import { JSONParser } from './jsonParser';
import { JSONReturnType } from './utils/constants';
import { ContextValues } from './utils/jsonContext';

export function parseComment(parser: JSONParser): JSONReturnType {
  /**
   * Parse code-like comments:
   * - "# comment": A line comment that continues until a newline.
   * - "// comment": A line comment that continues until a newline.
   * - "/* comment * /": A block comment that continues until the closing delimiter "* /".
   */
  let char = parser.getCharAt();
  const terminationCharacters = ['\n', '\r'];

  if (parser.context.context.includes(ContextValues.ARRAY)) {
    terminationCharacters.push(']');
  }
  if (parser.context.context.includes(ContextValues.OBJECT_VALUE)) {
    terminationCharacters.push('}');
  }
  if (parser.context.context.includes(ContextValues.OBJECT_KEY)) {
    terminationCharacters.push(':');
  }

  // Line comment starting with #
  if (char === '#') {
    let comment = '';
    while (char && !terminationCharacters.includes(char)) {
      comment += char;
      parser.index++;
      char = parser.getCharAt();
    }
    parser.log(`Found line comment: ${comment}, ignoring`);
  }
  // Comments starting with '/'
  else if (char === '/') {
    const nextChar = parser.getCharAt(1);
    // Handle line comment starting with //
    if (nextChar === '/') {
      let comment = '//';
      parser.index += 2; // Skip both slashes
      char = parser.getCharAt();
      while (char && !terminationCharacters.includes(char)) {
        comment += char;
        parser.index++;
        char = parser.getCharAt();
      }
      parser.log(`Found line comment: ${comment}, ignoring`);
    }
    // Handle block comment starting with /*
    else if (nextChar === '*') {
      let comment = '/*';
      parser.index += 2; // Skip '/*'
      while (true) {
        char = parser.getCharAt();
        if (!char) {
          parser.log('Reached end-of-string while parsing block comment; unclosed block comment.');
          break;
        }
        comment += char;
        parser.index++;
        if (comment.endsWith('*/')) {
          break;
        }
      }
      parser.log(`Found block comment: ${comment}, ignoring`);
    } else {
      // Skip standalone '/' characters that are not part of a comment
      parser.index++;
    }
  }

  if (parser.context.empty) {
    return parser.parseJson();
  } else {
    return '';
  }
}
