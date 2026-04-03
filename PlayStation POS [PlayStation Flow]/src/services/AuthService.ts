// services/AuthService.ts

export interface AuthSession {
  serialNumber: string;
  authenticatedAt: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const SESSION_KEY = 'auth_session';


const VALID_SERIALS: Set<string> = new Set([
  'Z9X8-Y7W6-V5U4',
  'K3L9-P2Q8-R7S1',
  'M4N6-B8V2-C1X9',
  'T7Y5-U3I1-O9P4',
  'Q2W8-E4R6-T1Y3',
  'H7J2-K9L4-Z1X5',
  'V6B3-N8M1-A2S9',
  'D4F7-G1H3-J8K2',
  'L9P3-O5I7-U2Y8',
  'X1Z4-C7V2-B8N6',
  'A9S3-D7F1-G2H6',
  'J5K8-L2P9-O3I7',
  'Q7W1-E9R3-T5Y8',
  'U2I6-O8P4-A3S7',
  'Z5X9-C1V4-B7N2',
  'M8N3-B5V9-C2X6',
  'T1Y7-U4I8-O6P3',
  'H2J6-K1L8-Z9X4',
  'D9F2-G5H8-J1K3',
  'L4P7-O2I9-U5Y1',
  'X3Z8-C6V1-B9N4',
  'A7S2-D8F5-G1H9',
  'J9K3-L7P2-O4I6',
  'Q4W9-E1R7-T8Y2',
  'U6I3-O5P9-A1S8',
  'Z8X2-C9V5-B1N7',
  'M3N7-B1V6-C9X2',
  'T5Y2-U9I3-O7P1',
  'H1J9-K4L2-Z8X6',
  'D7F3-G2H9-J6K1',
  'L2P5-O8I1-U9Y7',
  'X6Z1-C4V8-B3N9',
  'A2S8-D1F9-G7H3',
  'J7K1-L6P8-O2I5',
  'Q1W6-E8R2-T9Y4',
  'U9I4-O1P7-A6S2',
  'Z2X6-C3V9-B5N1',
  'M1N9-B4V2-C7X8',
  'T9Y3-U6I1-O2P8',
  'H6J4-K2L7-Z3X1',
  'D2F8-G7H1-J9K4',
  'L7P1-O3I6-U8Y2',
  'X8Z5-C2V7-B4N1',
  'A4S1-D6F3-G9H8',
  'J2K6-L8P1-O9I3',
  'Q9W3-E7R1-T2Y6',
  'U3I7-O9P2-A8S1',
  'Z1X7-C8V3-B6N2',
  'M7N2-B9V3-C1X5',
  'T3Y6-U1I9-O4P2',
  'H9J1-K3L6-Z2X7',
  'D1F6-G3H2-J7K9',
  'L5P2-O7I3-U1Y9',
  'X9Z2-C1V6-B7N3',
  'A6S9-D2F7-G3H1',
  'J1K7-L3P5-O8I2',
  'Q3W2-E6R9-T1Y7',
  'U7I1-O2P6-A9S3',
  'Z3X1-C7V2-B8N5',
  'M2N6-B3V8-C5X1',
  'T8Y1-U7I2-O3P9',
  'H3J7-K5L1-Z6X2',
  'D6F1-G9H3-J2K8',
  'L1P9-O4I2-U7Y3',
  'X2Z7-C5V3-B1N8',
  'A8S1-D3F6-G2H7',
  'J6K2-L1P3-O7I9',
  'Q5W7-E3R8-T6Y1',
  'U1I8-O3P5-A2S7',
  'Z7X3-C6V1-B2N9',
  'M9N1-B2V7-C3X6',
  'T2Y9-U5I3-O1P6',
  'H5J3-K7L9-Z1X8',
  'D3F9-G1H6-J8K2',
  'L3P6-O1I8-U2Y5',
  'X5Z3-C9V2-B6N1',
  'A1S7-D9F2-G8H3',
  'J8K5-L2P6-O1I4',
  'Q6W1-E2R5-T3Y9',
  'U5I9-O6P1-A3S4',
  'Z6X4-C2V8-B3N1',
  'M5N3-B8V1-C6X2',
  'T6Y4-U8I2-O9P1',
  'H8J2-K6L3-Z4X1',
  'D8F4-G2H7-J3K1',
  'L6P3-O9I5-U1Y4',
  'X4Z6-C3V1-B2N7',
  'A3S5-D4F1-G6H9',
  'J3K9-L4P7-O2I1',
  'Q2W5-E1R4-T7Y8',
  'U4I2-O7P3-A5S1',
  'Z4X8-C1V5-B9N2',
  'M6N4-B7V5-C8X1',
  'T4Y8-U2I6-O5P3',
  'H4J5-K8L1-Z7X3',
  'D5F2-G8H4-J1K6',
  'L8P4-O6I1-U3Y2',
  'X7Z9-C8V4-B1N3'
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