export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*/.test(error.message) || error.message.includes("Authentication failed");
}

export function calculatePasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

export function getPasswordStrengthText(strength: number): string {
  const texts = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  return texts[strength] || "Very Weak";
}

export function getPasswordStrengthColor(strength: number): string {
  const colors = ["text-red-500", "text-orange-500", "text-yellow-600", "text-green-600"];
  return colors[Math.min(strength - 1, 3)] || "text-red-500";
}
