// Comprehensive Validation & Sanitization Utilities
// Security-first approach for enterprise-grade validation

// Email validation with strict RFC 5322 compliant regex
const EMAIL_REGEX = /^(?!.*\.\.)(?!.*\.$)(?!^\.)([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})$/;

// Disposable email domains blacklist
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'yopmail.com', 'throwawaymail.com', 'fakeinbox.com', 'sharklasers.com',
  'getairmail.com', 'tempinbox.com', 'mailnesia.com', 'tempmailaddress.com',
  'burnermail.io', 'temp-mail.org', 'fake-email.net', 'tempmails.com'
];

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|WHERE|FROM|TABLE|DATABASE)\b)/i,
  /(--|#|\/\*|\*\/)/,
  /(\bOR\b|\bAND\b)\s*\d*\s*=\s*\d+/i,
  /;/,
  /(\bWAITFOR\b|\bDELAY\b|\bSHUTDOWN\b)/i,
  /(\bXP_|\bSP_)/i,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /data:text\/html/gi,
];

// HTML tags to strip
const DANGEROUS_HTML_TAGS = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

export interface FormValidationErrors {
  [key: string]: string;
}

/**
 * Validate email address with strict checks
 */
export function validateEmail(email: string, checkDisposable = true): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email is too long (max 254 characters)' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for disposable email
  if (checkDisposable) {
    const domain = trimmed.split('@')[1];
    if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
      return { isValid: false, error: 'Please use a permanent email address' };
    }
  }

  // Check for consecutive dots
  if (trimmed.includes('..')) {
    return { isValid: false, error: 'Email cannot contain consecutive dots' };
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long (max 128 characters)' };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const strength = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  if (strength < 3) {
    return { 
      isValid: false, 
      error: 'Password must contain at least 3 of: uppercase, lowercase, numbers, special characters' 
    };
  }

  // Check for common passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    return { isValid: false, error: 'Password is too common. Please choose a stronger password.' };
  }

  return { isValid: true };
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Remove null bytes
  let sanitized = input.replace(/\x00/g, '');

  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove dangerous HTML tags
  DANGEROUS_HTML_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>|<${tag}[^>]*/?>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
}

/**
 * Check for SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Check for XSS patterns
 */
export function containsXss(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Comprehensive input validation
 */
export function validateInput(
  input: string, 
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    allowHtml?: boolean;
    pattern?: RegExp;
    fieldName?: string;
  } = {}
): ValidationResult {
  const { 
    required = false, 
    minLength = 0, 
    maxLength = 1000, 
    allowHtml = false,
    pattern,
    fieldName = 'Field'
  } = options;

  if (!input || typeof input !== 'string') {
    if (required) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true, sanitized: '' };
  }

  const trimmed = input.trim();

  if (required && trimmed.length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be no more than ${maxLength} characters` };
  }

  // Check for SQL injection
  if (containsSqlInjection(trimmed)) {
    return { isValid: false, error: 'Invalid characters detected' };
  }

  // Check for XSS (unless HTML is explicitly allowed)
  if (!allowHtml && containsXss(trimmed)) {
    return { isValid: false, error: 'Invalid characters detected' };
  }

  // Check custom pattern
  if (pattern && !pattern.test(trimmed)) {
    return { isValid: false, error: `${fieldName} format is invalid` };
  }

  // Sanitize if not allowing HTML
  const sanitized = allowHtml ? trimmed : sanitizeInput(trimmed);

  return { isValid: true, sanitized };
}

/**
 * Validate chatbot name
 */
export function validateBotName(name: string): ValidationResult {
  return validateInput(name, {
    required: true,
    minLength: 2,
    maxLength: 100,
    fieldName: 'Bot name',
    pattern: /^[a-zA-Z0-9\s\-_'.]+$/
  });
}

/**
 * Validate industry/company name
 */
export function validateIndustry(name: string): ValidationResult {
  return validateInput(name, {
    required: true,
    minLength: 2,
    maxLength: 100,
    fieldName: 'Industry',
    pattern: /^[a-zA-Z0-9\s\-_',.&]+$/
  });
}

/**
 * Validate description
 */
export function validateDescription(description: string): ValidationResult {
  return validateInput(description, {
    required: false,
    maxLength: 2000,
    fieldName: 'Description'
  });
}

/**
 * Validate URL
 */
export function validateUrl(url: string, required = false): ValidationResult {
  if (!url && !required) {
    return { isValid: true, sanitized: '' };
  }

  const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)$/;
  
  if (!urlPattern.test(url)) {
    return { isValid: false, error: 'Please enter a valid URL (https://...)' };
  }

  return { isValid: true, sanitized: url.trim() };
}

/**
 * Validate phone number (international format)
 */
export function validatePhoneNumber(phone: string, required = false): ValidationResult {
  if (!phone && !required) {
    return { isValid: true, sanitized: '' };
  }

  // Remove all non-numeric characters for validation
  const numericOnly = phone.replace(/\D/g, '');
  
  if (numericOnly.length < 10 || numericOnly.length > 15) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }

  return { isValid: true, sanitized: numericOnly };
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File, 
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  maxSizeMB: number = 5
): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'File is required' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { isValid: false, error: `File too large. Max size: ${maxSizeMB}MB` };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'File is empty' };
  }

  return { isValid: true };
}

/**
 * Validate JSON data
 */
export function validateJson(jsonString: string): ValidationResult {
  if (!jsonString || typeof jsonString !== 'string') {
    return { isValid: false, error: 'JSON data is required' };
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null) {
      return { isValid: false, error: 'Invalid JSON structure' };
    }
    return { isValid: true, sanitized: jsonString };
  } catch {
    return { isValid: false, error: 'Invalid JSON format' };
  }
}

/**
 * Validate entire form object
 */
export function validateForm(
  data: Record<string, any>,
  schema: Record<string, (value: any) => ValidationResult>
): { isValid: boolean; errors: FormValidationErrors; sanitized: Record<string, any> } {
  const errors: FormValidationErrors = {};
  const sanitized: Record<string, any> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(schema)) {
    const result = validator(data[field]);
    if (!result.isValid) {
      errors[field] = result.error || 'Invalid value';
      isValid = false;
    } else {
      sanitized[field] = result.sanitized !== undefined ? result.sanitized : data[field];
    }
  }

  return { isValid, errors, sanitized };
}

/**
 * Rate limiting helper for form submissions
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  canProceed(key: string): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      const oldestAttempt = validAttempts[0];
      const resetTime = oldestAttempt + this.windowMs;
      return { 
        allowed: false, 
        remainingAttempts: 0, 
        resetTime 
      };
    }

    return { 
      allowed: true, 
      remainingAttempts: this.maxAttempts - validAttempts.length 
    };
  }

  recordAttempt(key: string): void {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    attempts.push(now);
    this.attempts.set(key, attempts);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter(5, 60000);

export default {
  validateEmail,
  validatePassword,
  validateInput,
  validateBotName,
  validateIndustry,
  validateDescription,
  validateUrl,
  validatePhoneNumber,
  validateFile,
  validateJson,
  validateForm,
  sanitizeInput,
  containsSqlInjection,
  containsXss,
  RateLimiter,
  globalRateLimiter
};
