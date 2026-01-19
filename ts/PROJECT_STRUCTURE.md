# TypeScript JSON Repair - Project Structure

This is a complete TypeScript port of the Python json-repair library, maintaining identical functionality and API design.

## Project Structure

```
ts/
├── src/
│   ├── utils/
│   │   ├── constants.ts        # Type definitions and constants
│   │   ├── jsonContext.ts      # Context tracking for parsing state
│   │   └── objectComparer.ts   # Object comparison utilities
│   ├── parseHelpers/
│   │   ├── parseBooleanOrNull.ts   # Parse true/false/null
│   │   └── parseJsonLlmBlock.ts    # Parse ```json code blocks
│   ├── parseArray.ts           # Array parsing logic
│   ├── parseComment.ts         # Comment parsing logic
│   ├── parseNumber.ts          # Number parsing logic
│   ├── parseObject.ts          # Object parsing logic
│   ├── parseString.ts          # String parsing logic (most complex)
│   ├── jsonParser.ts           # Core parser class
│   ├── jsonRepair.ts           # Main API functions
│   └── index.ts                # Public exports
├── examples/
│   └── usage.ts                # Usage examples
├── dist/                       # Compiled JavaScript output
├── package.json                # NPM package configuration
├── tsconfig.json               # TypeScript configuration
├── README.md                   # User documentation
├── PROJECT_STRUCTURE.md        # This file
└── .gitignore                  # Git ignore rules

```

## Core Components

### 1. JSONParser Class ([jsonParser.ts](src/jsonParser.ts))
The heart of the library. Manages parsing state and coordinates all parsing operations.

**Key Methods:**
- `parse()` - Main entry point, returns parsed JSON
- `parseJson()` - Determines what to parse next
- `parseObject()` - Delegates to parseObject.ts
- `parseArray()` - Delegates to parseArray.ts
- `parseString()` - Delegates to parseString.ts
- `parseNumber()` - Delegates to parseNumber.ts
- `parseComment()` - Delegates to parseComment.ts
- `getCharAt(offset)` - Safe character access
- `skipWhitespaces()` - Skip whitespace characters
- `skipToCharacter(char)` - Find next occurrence of character

### 2. Parsing Functions

#### parseObject.ts
Parses JSON objects `{}`, handling:
- Missing colons after keys
- Duplicate keys
- Empty keys/values
- Trailing commas
- Missing closing braces

#### parseArray.ts
Parses JSON arrays `[]`, handling:
- Missing commas
- Missing closing brackets
- Empty elements
- Trailing commas

#### parseString.ts
The most complex parser, handling:
- Missing opening/closing quotes
- Escaped characters
- Unicode sequences
- Doubled quotes
- Strings in different contexts (object key, object value, array)
- Misplaced quotes within strings
- Comment-like text

#### parseNumber.ts
Parses numbers, handling:
- Integers
- Floats
- Scientific notation
- Invalid trailing characters

#### parseComment.ts
Parses and removes comments:
- Line comments: `//` and `#`
- Block comments: `/* */`

### 3. Utilities

#### JsonContext ([utils/jsonContext.ts](src/utils/jsonContext.ts))
Tracks parsing context using a stack:
- `OBJECT_KEY` - Currently parsing object key
- `OBJECT_VALUE` - Currently parsing object value
- `ARRAY` - Currently parsing array element

This helps the parser make smart decisions about ambiguous syntax.

#### ObjectComparer ([utils/objectComparer.ts](src/utils/objectComparer.ts))
Utility for comparing objects:
- `isSameObject()` - Deep structural comparison
- `isStrictlyEmpty()` - Check for empty containers

#### Constants ([utils/constants.ts](src/utils/constants.ts))
Type definitions and constants:
- `JSONReturnType` - Union type for all valid JSON values
- `STRING_DELIMITERS` - Valid quote characters
- `NUMBER_CHARS` - Valid number characters
- `RepairLog` - Logging entry structure

### 4. Parse Helpers

#### parseBooleanOrNull ([parseHelpers/parseBooleanOrNull.ts](src/parseHelpers/parseBooleanOrNull.ts))
Parses unquoted boolean and null literals: `true`, `false`, `null`

#### parseJsonLlmBlock ([parseHelpers/parseJsonLlmBlock.ts](src/parseHelpers/parseJsonLlmBlock.ts))
Extracts JSON from markdown code blocks: ` ```json ... ``` `

### 5. Public API ([jsonRepair.ts](src/jsonRepair.ts))

#### `repairJson(jsonStr, options?)`
Main repair function.

**Options:**
- `returnObjects: boolean` - Return parsed object instead of string
- `skipJsonParse: boolean` - Skip initial JSON.parse attempt
- `logging: boolean` - Return repair log
- `streamStable: boolean` - Stable repairs for streaming JSON
- `strict: boolean` - Throw errors instead of repairing

#### `loads(jsonStr, options?)`
Like `JSON.parse()` but repairs first. Always returns object.

#### `load(fd, options?)`
Read and repair JSON from file descriptor.

#### `fromFile(filename, options?)`
Read and repair JSON from file path.

## Implementation Notes

### 1. Differences from Python Version

1. **Type System**: TypeScript provides static typing throughout
2. **File I/O**: Uses Node.js fs module instead of Python's file handling
3. **String Handling**: JavaScript string indexing is simpler than Python's
4. **No File Wrapper**: Removed StringFileWrapper as TypeScript handles file content differently
5. **Error Handling**: Uses TypeScript exceptions instead of Python exceptions

### 2. Key Features Preserved

All features from the Python version are preserved:
- ✅ Missing quote repair
- ✅ Missing bracket/brace repair
- ✅ Comment removal
- ✅ Trailing comma handling
- ✅ Duplicate key detection
- ✅ Stream-stable mode
- ✅ Strict mode
- ✅ Logging support
- ✅ LLM code block extraction
- ✅ Unicode escape sequence handling

### 3. Testing

To test the implementation, create test files or use the examples:

```bash
cd ts
npm install
npm run build
node dist/examples/usage.js
```

## API Compatibility

The TypeScript API is designed to be as close as possible to the Python API:

**Python:**
```python
from json_repair import repair_json, loads

fixed = repair_json('{"name": "John"')
obj = loads('{"name": "John"')
```

**TypeScript:**
```typescript
import { repairJson, loads } from '@yarmu/json-repair';

const fixed = repairJson('{"name": "John"');
const obj = loads('{"name": "John"');
```

## License

Same as the original Python library - see main project for details.

## Credits

This is a faithful TypeScript port of the Python [json-repair](https://github.com/mangiucugna/json_repair) library by Stefano Baccianella.
