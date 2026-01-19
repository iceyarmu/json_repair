import * as fs from 'fs';
import { JSONParser } from './jsonParser';
import { JSONReturnType, RepairLog } from './utils/constants';

/**
 * Custom JSON stringify that matches Python's json.dumps() default format.
 * Adds spaces after colons and commas to match Python behavior.
 */
function customStringify(obj: any): string {
  // Handle undefined/null cases
  if (obj === undefined) {
    return '';
  }

  const json = JSON.stringify(obj);

  // If stringify returned undefined (e.g., for functions), return empty string
  if (json === undefined) {
    return '';
  }

  // Add space after colons (: -> : ) and after commas (, -> , )
  // but only when not inside strings
  let result = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (!inString) {
      if (char === ':' && json[i + 1] !== ' ') {
        result += ': ';
        continue;
      }
      if (char === ',' && json[i + 1] !== ' ' && json[i + 1] !== ']' && json[i + 1] !== '}') {
        result += ', ';
        continue;
      }
    }

    result += char;
  }

  return result;
}

export interface RepairJsonOptions {
  returnObjects?: boolean;
  skipJsonParse?: boolean;
  logging?: boolean;
  streamStable?: boolean;
  strict?: boolean;
}

export interface LoadsOptions {
  skipJsonParse?: boolean;
  logging?: boolean;
  streamStable?: boolean;
  strict?: boolean;
}

export interface LoadOptions {
  skipJsonParse?: boolean;
  logging?: boolean;
  strict?: boolean;
}

export interface FromFileOptions {
  skipJsonParse?: boolean;
  logging?: boolean;
  strict?: boolean;
}

/**
 * Given a json formatted string, it will try to decode it and, if it fails, it will try to fix it.
 *
 * @param jsonStr - The JSON string to repair
 * @param options - Repair options
 * @returns The repaired JSON or a tuple with the repaired JSON and repair log when logging is True
 */
export function repairJson(
  jsonStr: string = '',
  options: RepairJsonOptions = {}
): string | JSONReturnType | [JSONReturnType, RepairLog[]] {
  const {
    returnObjects = false,
    skipJsonParse = false,
    logging = false,
    streamStable = false,
    strict = false,
  } = options;

  const parser = new JSONParser(jsonStr, logging, streamStable, strict);
  let parsedJson: JSONReturnType | [JSONReturnType, RepairLog[]];

  if (skipJsonParse) {
    parsedJson = parser.parse();
  } else {
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch (e) {
      parsedJson = parser.parse();
    }
  }

  // It's useful to return the actual object instead of the json string
  if (returnObjects || logging) {
    // If logging is True, the user should expect a tuple.
    // If JSON.parse worked, the repair log list is empty
    if (logging && !Array.isArray(parsedJson)) {
      return [parsedJson, []];
    }
    return parsedJson;
  }

  // Avoid returning only a pair of quotes if it's an empty string
  if (parsedJson === '') {
    return '';
  }

  return customStringify(parsedJson);
}

/**
 * This function works like `JSON.parse()` except that it will fix your JSON in the process.
 * It is a wrapper around the `repairJson()` function with `returnObjects=true`.
 *
 * @param jsonStr - The JSON string to load and repair
 * @param options - Load options
 * @returns The repaired JSON object or a tuple with the repaired JSON object and repair log
 */
export function loads(
  jsonStr: string,
  options: LoadsOptions = {}
): JSONReturnType | [JSONReturnType, RepairLog[]] {
  const result = repairJson(jsonStr, {
    ...options,
    returnObjects: true,
  });
  return result as JSONReturnType | [JSONReturnType, RepairLog[]];
}

/**
 * This function works like `JSON.parse()` except that it will fix your JSON from a file descriptor.
 * It is a wrapper around the `repairJson()` function with file descriptor support and `returnObjects=true`.
 *
 * @param fd - File descriptor for JSON input
 * @param options - Load options
 * @returns The repaired JSON object or a tuple with the repaired JSON object and repair log
 */
export function load(
  fd: number,
  options: LoadOptions = {}
): JSONReturnType | [JSONReturnType, RepairLog[]] {
  const stats = fs.fstatSync(fd);
  const buffer = Buffer.alloc(stats.size);
  fs.readSync(fd, buffer, 0, stats.size, 0);
  const jsonStr = buffer.toString('utf8');

  return loads(jsonStr, options);
}

/**
 * This function is a wrapper around `load()` so you can pass the filename as string
 *
 * @param filename - The name of the file containing JSON data to load and repair
 * @param options - Load options
 * @returns The repaired JSON object or a tuple with the repaired JSON object and repair log
 */
export function fromFile(
  filename: string,
  options: FromFileOptions = {}
): JSONReturnType | [JSONReturnType, RepairLog[]] {
  const fd = fs.openSync(filename, 'r');
  try {
    return load(fd, options);
  } finally {
    fs.closeSync(fd);
  }
}
