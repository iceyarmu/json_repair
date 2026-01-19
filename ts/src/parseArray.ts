import { JSONParser } from './jsonParser';
import { STRING_DELIMITERS, JSONReturnType } from './utils/constants';
import { ContextValues } from './utils/jsonContext';
import { ObjectComparer } from './utils/objectComparer';

export function parseArray(parser: JSONParser): JSONReturnType[] {
  // <array> ::= '[' [ <json> *(', ' <json>) ] ']' ; A sequence of JSON values separated by commas
  const arr: JSONReturnType[] = [];
  parser.context.set(ContextValues.ARRAY);

  // Stop when you either find the closing parentheses or you have iterated over the entire string
  let char = parser.getCharAt();
  while (char && char !== ']' && char !== '}') {
    parser.skipWhitespaces();
    let value: JSONReturnType = '';

    if (char && STRING_DELIMITERS.includes(char)) {
      // Sometimes it can happen that LLMs forget to start an object and then you think it's a string in an array
      // So we are going to check if this string is followed by a : or not
      // And either parse the string or parse the object
      let i = 1;
      i = parser.skipToCharacter(char, i);
      i = parser.scrollWhitespaces(i + 1);
      value = parser.getCharAt(i) === ':' ? parser.parseObject() : parser.parseString();
    } else {
      value = parser.parseJson();
    }

    // It is possible that parseJson() returns nothing valid, so we increase by 1, unless we find an array separator
    if (ObjectComparer.isStrictlyEmpty(value) && char !== ']' && char !== ',') {
      parser.index++;
    } else if (value === '...' && parser.getCharAt(-1) === '.') {
      parser.log("While parsing an array, found a stray '...'; ignoring it");
    } else {
      arr.push(value);
    }

    // skip over whitespace after a value but before closing ]
    char = parser.getCharAt();
    while (char && char !== ']' && (char.match(/\s/) || char === ',')) {
      parser.index++;
      char = parser.getCharAt();
    }
  }

  // Especially at the end of an LLM generated json you might miss the last "]"
  if (char !== ']') {
    parser.log('While parsing an array we missed the closing ], ignoring it');
  }

  parser.index++;
  parser.context.reset();
  return arr;
}
