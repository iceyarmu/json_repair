import { JSONParser } from '../jsonParser';
import { JSONReturnType } from '../utils/constants';

export function parseJsonLlmBlock(parser: JSONParser): JSONReturnType | false {
  /**
   * Extracts and normalizes JSON enclosed in ```json ... ``` blocks.
   */
  // Try to find a ```json ... ``` block
  if (parser.jsonStr.substring(parser.index, parser.index + 7) === '```json') {
    const i = parser.skipToCharacter('`', 7);
    if (parser.jsonStr.substring(parser.index + i, parser.index + i + 3) === '```') {
      parser.index += 7; // Move past ```json
      return parser.parseJson();
    }
  }
  return false;
}
