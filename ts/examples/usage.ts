import { repairJson, loads } from '../src/index';

// Example 1: Basic repair - missing closing brace
console.log('Example 1: Missing closing brace');
const broken1 = '{"name": "John", "age": 30';
const fixed1 = repairJson(broken1);
console.log('Input:', broken1);
console.log('Fixed:', fixed1);
console.log();

// Example 2: Missing quotes
console.log('Example 2: Missing quotes');
const broken2 = '{name: "John", age: 30}';
const fixed2 = repairJson(broken2);
console.log('Input:', broken2);
console.log('Fixed:', fixed2);
console.log();

// Example 3: Trailing comma
console.log('Example 3: Trailing comma');
const broken3 = '{"name": "John", "age": 30,}';
const fixed3 = repairJson(broken3);
console.log('Input:', broken3);
console.log('Fixed:', fixed3);
console.log();

// Example 4: With comments
console.log('Example 4: With comments');
const broken4 = '{"name": "John" /* this is a comment */, "age": 30}';
const fixed4 = repairJson(broken4);
console.log('Input:', broken4);
console.log('Fixed:', fixed4);
console.log();

// Example 5: Direct parsing to object
console.log('Example 5: Direct parsing to object');
const broken5 = '{"name": "John", "age": 30';
const obj = loads(broken5);
console.log('Input:', broken5);
console.log('Parsed object:', obj);
console.log();

// Example 6: With logging
console.log('Example 6: With logging');
const broken6 = '{"name": "John", "age": 30';
const [result, log] = repairJson(broken6, {
  returnObjects: true,
  logging: true,
}) as [any, any];
console.log('Input:', broken6);
console.log('Result:', result);
console.log('Repair log:');
log.forEach((entry: any, i: number) => {
  console.log(`  ${i + 1}. ${entry.text}`);
  console.log(`     Context: "${entry.context}"`);
});
console.log();

// Example 7: Incomplete array
console.log('Example 7: Incomplete array');
const broken7 = '{"items": [1, 2, 3';
const fixed7 = repairJson(broken7);
console.log('Input:', broken7);
console.log('Fixed:', fixed7);
console.log();

// Example 8: Mixed issues
console.log('Example 8: Mixed issues');
const broken8 = '{name: "John", age: 30, hobbies: ["reading", "coding"';
const fixed8 = repairJson(broken8);
console.log('Input:', broken8);
console.log('Fixed:', fixed8);
console.log();

// Example 9: Strict mode (will throw on duplicate keys)
console.log('Example 9: Strict mode');
const broken9 = '{"key": "value1", "key": "value2"}';
try {
  const fixed9 = repairJson(broken9, { strict: true });
  console.log('Fixed:', fixed9);
} catch (e: any) {
  console.log('Error (expected):', e.message);
}
console.log();

// Example 10: Stream stable mode
console.log('Example 10: Stream stable mode');
const broken10 = '{"key": "val\\';
const fixed10 = repairJson(broken10, { streamStable: true });
console.log('Input:', broken10);
console.log('Fixed:', fixed10);
console.log();
