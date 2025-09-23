/**
 * Test cases for generateUserId utility
 */

import { generateUniqueUserId, generateUserId, isValidUserId } from '../generateUserId';

describe('generateUserId', () => {
  it('should generate User ID with correct format', () => {
    const userId = generateUserId();

    // Check format: user_ + base58 string
    expect(userId).toMatch(/^user_[1-9A-HJ-NP-Za-km-z]+$/);
    expect(userId.length).toBeGreaterThan(25); // user_ (5) + at least 20 chars
    expect(userId.startsWith('user_')).toBe(true);
  });

  it('should generate unique IDs', () => {
    const ids = new Set();

    // Generate 100 IDs và check uniqueness
    for (let i = 0; i < 100; i++) {
      const id = generateUserId();

      expect(ids.has(id)).toBe(false);

      ids.add(id);
    }
  });

  it('should not contain confusing characters', () => {
    const userId = generateUserId();
    const randomPart = userId.replace('user_', '');

    // Không chứa 0, O, I, l
    expect(randomPart).not.toMatch(/[0OIl]/);
  });
});

describe('isValidUserId', () => {
  it('should validate correct User ID format', () => {
    const validId = 'user_2xouUagR4XVgnf578Xo23YAp40r';

    expect(isValidUserId(validId)).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(isValidUserId('invalid')).toBe(false);
    expect(isValidUserId('user_')).toBe(false);
    expect(isValidUserId('user_abc')).toBe(false); // too short
    expect(isValidUserId('user_abc0def')).toBe(false); // contains 0
    expect(isValidUserId('admin_2xouUagR4XVgnf578Xo23YAp40r')).toBe(false);
  });

  it('should validate generated IDs', () => {
    for (let i = 0; i < 10; i++) {
      const userId = generateUserId();

      expect(isValidUserId(userId)).toBe(true);
    }
  });
});

describe('generateUniqueUserId', () => {
  it('should avoid existing IDs', () => {
    const existingIds = [
      'user_abc123def456ghi789jkl',
      'user_xyz987uvw654rst321mnp',
    ];

    const newId = generateUniqueUserId(existingIds);

    expect(existingIds.includes(newId)).toBe(false);
    expect(isValidUserId(newId)).toBe(true);
  });

  it('should handle empty existing IDs array', () => {
    const newId = generateUniqueUserId([]);

    expect(isValidUserId(newId)).toBe(true);
  });
});
