/**
 * Generate User ID với format giống Clerk
 * Format: user_[base58string]
 * Ví dụ: user_2xouUagR4XVgnf578Xo23YAp40r
 */

/**
 * Base58 alphabet (giống Bitcoin/Clerk)
 * Loại bỏ các ký tự dễ nhầm lẫn: 0, O, I, l
 */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Generate random base58 string
 * @param length - Độ dài string cần tạo
 * @returns Random base58 string
 */
function generateBase58String(length: number): string {
  let result = '';
  const alphabetLength = BASE58_ALPHABET.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphabetLength);
    result += BASE58_ALPHABET[randomIndex];
  }

  return result;
}

/**
 * Generate User ID theo format của Clerk
 * @returns User ID với format: user_[27-character-base58-string]
 */
export function generateUserId(): string {
  // Clerk thường dùng ~27 ký tự cho phần random
  const randomPart = generateBase58String(27);
  return `user_${randomPart}`;
}

/**
 * Validate User ID format
 * @param userId - User ID cần validate
 * @returns true nếu format hợp lệ
 */
export function isValidUserId(userId: string): boolean {
  // Check format: user_ + base58 string (minimum 20 chars)
  if (!userId.startsWith('user_')) {
    return false;
  }

  const randomPart = userId.slice(5); // Remove 'user_' prefix
  if (randomPart.length < 20) {
    return false;
  }

  // Check if all characters are valid base58
  for (const char of randomPart) {
    if (!BASE58_ALPHABET.includes(char)) {
      return false;
    }
  }

  return true;
}

/**
 * Generate unique User ID (with retry logic)
 * @param existingIds - Array of existing User IDs để tránh trùng lặp
 * @param maxRetries - Số lần thử tối đa
 * @returns Unique User ID
 */
export function generateUniqueUserId(existingIds: string[] = [], maxRetries: number = 10): string {
  for (let i = 0; i < maxRetries; i++) {
    const newId = generateUserId();
    if (!existingIds.includes(newId)) {
      return newId;
    }
  }

  // Fallback: thêm timestamp nếu vẫn trùng
  const timestamp = Date.now().toString(36);
  const randomPart = generateBase58String(20);
  return `user_${randomPart}${timestamp}`;
}
