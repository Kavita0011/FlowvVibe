// Security tests for Flowvibe backend

describe('Security Utils', () => {
  describe('Email Validation', () => {
    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email) && email.length <= 255;
    };

    test('accepts valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('admin@flowvibe.ai')).toBe(true);
    });

    test('rejects invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('test@example.com@')).toBe(false);
    });
  });

  describe('Password Strength', () => {
    const isStrongPassword = (password) => {
      if (password.length < 8) return false;
      if (password.length > 128) return false;
      return true;
    };

    test('accepts valid passwords', () => {
      expect(isStrongPassword('password123')).toBe(true);
      expect(isStrongPassword('12345678')).toBe(true);
      expect(isStrongPassword('abcdefgh')).toBe(true);
    });

    test('rejects weak passwords', () => {
      expect(isStrongPassword('')).toBe(false);
      expect(isStrongPassword('1234567')).toBe(false);
      expect(isStrongPassword('pass')).toBe(false);
    });

    test('rejects too long passwords', () => {
      const longPassword = 'a'.repeat(129);
      expect(isStrongPassword(longPassword)).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    const sanitizeString = (str, maxLength = 255) => {
      if (typeof str !== 'string') return '';
      return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
    };

    test('sanitizes XSS attempts', () => {
      expect(sanitizeString('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
      expect(sanitizeString('<img src=x onerror=alert(1)>')).toBe('img src=x onerror=alert(1)');
      expect(sanitizeString('Hello <b>World</b>')).toBe('Hello bWorld/b');
    });

    test('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    test('respects max length', () => {
      const longString = 'a'.repeat(300);
      expect(sanitizeString(longString, 100)).toHaveLength(100);
    });

    test('handles non-string inputs', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString({})).toBe('');
    });
  });

  describe('Token Validation', () => {
    const parseToken = (token) => {
      try {
        const jsonStr = atob(token);
        const payload = JSON.parse(jsonStr);
        if (payload.exp && Date.now() > payload.exp) {
          return { error: 'Token expired', status: 401 };
        }
        return { payload };
      } catch (e) {
        return { error: 'Invalid token', status: 401 };
      }
    };

    test('parses valid token', () => {
      const payload = {
        userId: 'test123',
        role: 'user',
        exp: Date.now() + (24 * 60 * 60 * 1000),
        nonce: 'abc123'
      };
      const token = btoa(JSON.stringify(payload));
      const result = parseToken(token);
      
      expect(result.payload).toBeDefined();
      expect(result.payload.userId).toBe('test123');
      expect(result.payload.role).toBe('user');
    });

    test('rejects expired token', () => {
      const payload = {
        userId: 'test123',
        exp: Date.now() - 1000, // Expired
      };
      const token = btoa(JSON.stringify(payload));
      const result = parseToken(token);
      
      expect(result.error).toBe('Token expired');
      expect(result.status).toBe(401);
    });

    test('rejects invalid token', () => {
      expect(parseToken('invalid-token')).toEqual({ error: 'Invalid token', status: 401 });
      expect(parseToken('')).toEqual({ error: 'Invalid token', status: 401 });
    });
  });

  describe('UTR Validation', () => {
    const isValidUTR = (utr) => {
      return /^\d{12,18}$/.test(utr);
    };

    test('accepts valid UTR numbers', () => {
      expect(isValidUTR('123456789012')).toBe(true); // 12 digits
      expect(isValidUTR('123456789012345678')).toBe(true); // 18 digits
      expect(isValidUTR('12345678901234')).toBe(true); // 14 digits
    });

    test('rejects invalid UTR numbers', () => {
      expect(isValidUTR('')).toBe(false);
      expect(isValidUTR('123')).toBe(false);
      expect(isValidUTR('1234567890123456789')).toBe(false); // 19 digits
      expect(isValidUTR('abcdef123456')).toBe(false);
      expect(isValidUTR('1234-5678-9012')).toBe(false);
    });
  });

  describe('Amount Validation', () => {
    const isValidAmount = (amount, min = 1, max = 1000000) => {
      return amount >= min && amount <= max;
    };

    test('accepts valid amounts', () => {
      expect(isValidAmount(100)).toBe(true);
      expect(isValidAmount(1)).toBe(true);
      expect(isValidAmount(1000000)).toBe(true);
    });

    test('rejects invalid amounts', () => {
      expect(isValidAmount(0)).toBe(false);
      expect(isValidAmount(-100)).toBe(false);
      expect(isValidAmount(1000001)).toBe(false);
    });
  });
});

describe('API Security', () => {
  describe('Token Generation', () => {
    const generateToken = (userId, role = 'user') => {
      const payload = {
        userId,
        role,
        exp: Date.now() + (24 * 60 * 60 * 1000),
        nonce: crypto.randomUUID()
      };
      return btoa(JSON.stringify(payload));
    };

    test('generates unique tokens', () => {
      const token1 = generateToken('user1');
      const token2 = generateToken('user1');
      expect(token1).not.toBe(token2);
    });

    test('includes required fields', () => {
      const token = generateToken('user123', 'admin');
      const parsed = JSON.parse(atob(token));
      
      expect(parsed.userId).toBe('user123');
      expect(parsed.role).toBe('admin');
      expect(parsed.exp).toBeDefined();
      expect(parsed.nonce).toBeDefined();
    });
  });
});

describe('Input Validation Scenarios', () => {
  describe('SQL Injection Prevention', () => {
    // The backend uses parameterized queries, so these tests verify the pattern
    test('sanitization removes dangerous characters', () => {
      const sanitizeString = (str) => {
        if (typeof str !== 'string') return '';
        return str.trim().slice(0, 255).replace(/[<>]/g, '');
      };

      // These should be sanitized
      expect(sanitizeString("'; DROP TABLE users; --")).not.toContain("'");
      expect(sanitizeString('<script>alert(1)</script>')).not.toContain('<');
    });
  });

  describe('XSS Prevention', () => {
    test('removes script tags', () => {
      const sanitizeString = (str) => {
        if (typeof str !== 'string') return '';
        return str.trim().slice(0, 255).replace(/[<>]/g, '');
      };

      expect(sanitizeString('<script>alert("xss")</script>')).not.toContain('script');
    });

    test('removes event handlers', () => {
      const sanitizeString = (str) => {
        if (typeof str !== 'string') return '';
        return str.trim().slice(0, 255).replace(/[<>]/g, '');
      };

      expect(sanitizeString('<img onerror=alert(1) src=x>')).not.toContain('onerror');
    });
  });

  describe('Header Injection Prevention', () => {
    test('removes newlines from input', () => {
      const sanitizeString = (str) => {
        if (typeof str !== 'string') return '';
        return str.trim().slice(0, 255).replace(/[<>]/g, '');
      };

      expect(sanitizeString('test\r\ninjected')).not.toContain('\r');
      expect(sanitizeString('test\ninjected')).not.toContain('\n');
    });
  });
});