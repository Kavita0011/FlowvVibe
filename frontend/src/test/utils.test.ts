import { describe, it, expect } from 'vitest';
import { cn } from '../utils/cn';
import { sanitizeInput, validateEmail, validateUrl } from '../utils/sanitize';

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should handle empty strings', () => {
    expect(cn('', 'foo', '')).toBe('foo');
  });

  it('should handle objects', () => {
    expect(cn({ 'foo': true, 'bar': false })).toBe('foo');
  });
});

describe('sanitizeInput', () => {
  it('should sanitize HTML tags', () => {
    const result = sanitizeInput('<script>alert("xss")</script>Hello');
    expect(result).not.toContain('<script>');
  });

  it('should preserve plain text', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World');
  });

  it('should handle special characters', () => {
    const result = sanitizeInput('Test <>&" characters');
    expect(result).toContain('Test ');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });
});

describe('validateEmail', () => {
  it('should validate correct emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('no@domain')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
  });
});

describe('validateUrl', () => {
  it('should validate correct URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('http://localhost:3000')).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(validateUrl('not-a-url')).toBe(false);
    expect(validateUrl('ftp://example.com')).toBe(false);
  });
});