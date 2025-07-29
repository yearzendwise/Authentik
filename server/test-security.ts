import { validatePasswordStrength } from "./middleware/security-enhanced";
import { sanitizeInput, escapeSQL } from "./middleware/security";

console.log("🔒 Testing Security Implementations\n");

// Test 1: Password Strength Validation
console.log("1. Password Strength Validation:");
const passwords = [
  "weak",
  "password123",
  "Strong@Pass123",
  "NoSpecialChar123",
  "no-uppercase-123!",
  "NO-LOWERCASE-123!",
  "NoNumbers!@#",
];

passwords.forEach(pwd => {
  const result = validatePasswordStrength(pwd);
  console.log(`   Password: "${pwd}"`);
  console.log(`   Valid: ${result.valid}`);
  if (!result.valid) {
    console.log(`   Errors: ${result.errors.join(", ")}`);
  }
  console.log("");
});

// Test 2: Input Sanitization
console.log("\n2. Input Sanitization (XSS Protection):");
const maliciousInputs = [
  "<script>alert('XSS')</script>",
  "Normal text with <b>bold</b>",
  { name: "<script>alert('XSS')</script>", value: "test" },
  ["<img src=x onerror=alert('XSS')>", "normal text"],
];

maliciousInputs.forEach(input => {
  const sanitized = sanitizeInput(input);
  console.log(`   Original: ${JSON.stringify(input)}`);
  console.log(`   Sanitized: ${JSON.stringify(sanitized)}`);
  console.log("");
});

// Test 3: SQL Injection Protection
console.log("\n3. SQL Injection Protection:");
const sqlInputs = [
  "normal input",
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "1; DELETE FROM users WHERE 'a'='a",
];

sqlInputs.forEach(input => {
  const escaped = escapeSQL(input);
  console.log(`   Original: "${input}"`);
  console.log(`   Escaped: "${escaped}"`);
  console.log("");
});

console.log("✅ Security tests completed!");