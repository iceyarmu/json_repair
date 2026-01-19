import { parseArray } from './parseArray';
import { parseComment } from './parseComment';
import { parseNumber } from './parseNumber';
import { parseObject } from './parseObject';
import { parseString } from './parseString';
import { STRING_DELIMITERS, JSONReturnType, RepairLog } from './utils/constants';
import { JsonContext } from './utils/jsonContext';
import { ObjectComparer } from './utils/objectComparer';

export class JSONParser {
  public jsonStr: string;
  public index: number = 0;
  public context: JsonContext;
  public logging: boolean;
  public logger: RepairLog[] = [];
  public log: (text: string) => void;
  public streamStable: boolean;
  public strict: boolean;

  constructor(
    jsonStr: string,
    logging: boolean = false,
    streamStable: boolean = false,
    strict: boolean = false
  ) {
    this.jsonStr = jsonStr;
    this.context = new JsonContext();
    this.logging = logging;
    this.streamStable = streamStable;
    this.strict = strict;

    // Set up logging
    if (logging) {
      this.log = this._log.bind(this);
    } else {
      // No-op
      this.log = () => {};
    }
  }

  parse(): JSONReturnType | [JSONReturnType, RepairLog[]] {
    let json = this.parseJson();

    if (this.index < this.jsonStr.length) {
      this.log('The parser returned early, checking if there\'s more json elements');
      const jsonArray: JSONReturnType[] = [json];

      while (this.index < this.jsonStr.length) {
        this.context = new JsonContext();
        const j = this.parseJson();
        // Check if j is "truthy" in Python sense (not empty array, object, null, undefined, or empty string)
        const jIsEmpty = j === null || j === undefined || j === '' ||
                        (Array.isArray(j) && j.length === 0) ||
                        (typeof j === 'object' && j !== null && !Array.isArray(j) && Object.keys(j).length === 0);

        if (!jIsEmpty) {
          if (ObjectComparer.isSameObject(jsonArray[jsonArray.length - 1], j)) {
            // replace the last entry with the new one since the new one seems an update
            jsonArray.pop();
          } else {
            // Check if last element is "empty" (Python falsy behavior)
            const last = jsonArray[jsonArray.length - 1];
            const lastIsEmpty = last === null || last === undefined || last === '' ||
                              (Array.isArray(last) && last.length === 0) ||
                              (typeof last === 'object' && last !== null && !Array.isArray(last) && Object.keys(last).length === 0);
            if (lastIsEmpty) {
              jsonArray.pop();
            }
          }
          jsonArray.push(j);
        } else {
          // this was a bust, move the index
          this.index++;
        }
      }

      // If nothing extra was found, don't return an array
      if (jsonArray.length === 1) {
        this.log('There were no more elements, returning the element without the array');
        json = jsonArray[0];
      } else if (this.strict) {
        this.log('Multiple top-level JSON elements found in strict mode, raising an error');
        throw new Error('Multiple top-level JSON elements found in strict mode.');
      } else {
        json = jsonArray;
      }
    }

    if (this.logging) {
      return [json, this.logger];
    } else {
      return json;
    }
  }

  parseJson(): JSONReturnType {
    while (true) {
      const char = this.getCharAt();

      // None means that we are at the end of the string provided
      if (char === null) {
        return '';
      }
      // <object> starts with '{'
      else if (char === '{') {
        this.index++;
        return this.parseObject();
      }
      // <array> starts with '['
      else if (char === '[') {
        this.index++;
        return this.parseArray();
      }
      // <string> starts with a quote
      else if (!this.context.empty && (STRING_DELIMITERS.includes(char) || char.match(/[a-zA-Z]/))) {
        return this.parseString();
      }
      // <number> starts with [0-9] or minus
      else if (!this.context.empty && (char.match(/\d/) || char === '-' || char === '.')) {
        return this.parseNumber();
      } else if (char === '#' || char === '/') {
        return this.parseComment();
      }
      // If everything else fails, we just ignore and move on
      else {
        this.index++;
      }
    }
  }

  parseArray(): JSONReturnType[] {
    return parseArray(this);
  }

  parseComment(): JSONReturnType {
    return parseComment(this);
  }

  parseNumber(): JSONReturnType {
    return parseNumber(this);
  }

  parseObject(): JSONReturnType {
    return parseObject(this);
  }

  parseString(): JSONReturnType {
    return parseString(this);
  }

  getCharAt(count: number = 0): string | null {
    try {
      const char = this.jsonStr[this.index + count];
      return char !== undefined ? char : null;
    } catch (e) {
      return null;
    }
  }

  skipWhitespaces(): void {
    try {
      let char = this.jsonStr[this.index];
      while (char && char.match(/\s/)) {
        this.index++;
        char = this.jsonStr[this.index];
      }
    } catch (e) {
      // End of string
    }
  }

  scrollWhitespaces(idx: number = 0): number {
    try {
      let char = this.jsonStr[this.index + idx];
      while (char && char.match(/\s/)) {
        idx++;
        char = this.jsonStr[this.index + idx];
      }
    } catch (e) {
      // End of string
    }
    return idx;
  }

  skipToCharacter(character: string | string[], idx: number = 0): number {
    const targets = new Set(Array.isArray(character) ? character : [character]);
    let i = this.index + idx;
    const n = this.jsonStr.length;
    let backslashes = 0; // count of consecutive '\' immediately before current char

    while (i < n) {
      const ch = this.jsonStr[i];

      if (ch === '\\') {
        backslashes++;
        i++;
        continue;
      }

      // ch is not a backslash; if it's a target and not escaped (even backslashes), we're done
      if (targets.has(ch) && backslashes % 2 === 0) {
        return i - this.index;
      }

      // reset backslash run when we see a non-backslash
      backslashes = 0;
      i++;
    }

    // not found; return distance to end
    return n - this.index;
  }

  private _log(text: string): void {
    const window = 10;
    const start = Math.max(this.index - window, 0);
    const end = Math.min(this.index + window, this.jsonStr.length);
    const context = this.jsonStr.substring(start, end);
    this.logger.push({
      text,
      context,
    });
  }
}
