import { JSONParser } from '../jsonParser';

export function parseBooleanOrNull(parser: JSONParser): boolean | null | string {
  // <boolean> is one of the literal strings 'true', 'false', or 'null' (unquoted)
  const char = (parser.getCharAt() || '').toLowerCase();

  const valueMap: { [key: string]: [string, boolean | null] } = {
    't': ['true', true],
    'f': ['false', false],
    'n': ['null', null],
  };

  if (!(char in valueMap)) {
    return '';
  }

  const [expected, value] = valueMap[char];
  let i = 0;
  const startingIndex = parser.index;
  let currentChar = char;

  while (currentChar && i < expected.length && currentChar === expected[i]) {
    i++;
    parser.index++;
    currentChar = (parser.getCharAt() || '').toLowerCase();
  }

  if (i === expected.length) {
    return value;
  }

  // If nothing works reset the index before returning
  parser.index = startingIndex;
  return '';
}
