// Type definition for JSON values
export type JSONReturnType =
  | { [key: string]: any }
  | any[]
  | string
  | number
  | boolean
  | null;

// String delimiters used in JSON parsing
export const STRING_DELIMITERS = ['"', "'", '"', '"'];

// Number characters
export const NUMBER_CHARS = new Set('0123456789-.eE/,_'.split(''));

// Repair log entry
export interface RepairLog {
  text: string;
  context: string;
}
