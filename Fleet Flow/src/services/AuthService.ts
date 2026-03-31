// services/AuthService.ts

export interface AuthSession {
  serialNumber: string;
  authenticatedAt: number;
  expiresAt: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const SESSION_KEY = 'auth_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Add your real serial numbers here,
 * or replace the Set.has() check with an API call.
 */
const VALID_SERIALS: Set<string> = new Set([
  'A1B2-C3D4-E5F6',
  'DEMO-1234-ABCD',
  'TEST-0000-9999',
]);

const AuthService = {
  validate(raw: string): ValidationResult {
    const serial = raw.trim().toUpperCase();
    if (!serial) return { valid: false, error: 'الرقم التسلسلي مطلوب.' };
    if (!VALID_SERIALS.has(serial)) return { valid: false, error: 'الرقم التسلسلي غير معروف.' };
    return { valid: true };
  },

  login(raw: string): ValidationResult {
    const result = this.validate(raw);
    if (!result.valid) return result;

    const now = Date.now();
    const session: AuthSession = {
      serialNumber: raw.trim().toUpperCase(),
      authenticatedAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      return { valid: false, error: 'تعذّر حفظ الجلسة.' };
    }

    return { valid: true };
  },

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  isAuthenticated(): boolean {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const session: AuthSession = JSON.parse(raw);
      if (Date.now() > session.expiresAt) { this.logout(); return false; }
      return Boolean(session.serialNumber);
    } catch {
      return false;
    }
  },

  getSession(): AuthSession | null {
    if (!this.isAuthenticated()) return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  },
};

export default AuthService;