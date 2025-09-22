import { normalizeVietnameseText, searchVietnameseText } from '../Helpers';

describe('Vietnamese Text Search for Comboboxes', () => {
  describe('normalizeVietnameseText', () => {
    it('should normalize Vietnamese text with diacritics', () => {
      expect(normalizeVietnameseText('Nguyễn Văn Anh')).toBe('nguyen van anh');
      expect(normalizeVietnameseText('Trần Thị Bích')).toBe('tran thi bich');
      expect(normalizeVietnameseText('Phạm Hoàng Đức')).toBe('pham hoang duc');
    });

    it('should handle mixed case', () => {
      expect(normalizeVietnameseText('NGUYỄN VĂN ANH')).toBe('nguyen van anh');
      expect(normalizeVietnameseText('NgUyỄn VăN AnH')).toBe('nguyen van anh');
    });

    it('should handle special Vietnamese characters', () => {
      expect(normalizeVietnameseText('đàn đáp đấu')).toBe('dan dap dau');
      expect(normalizeVietnameseText('Đỗ Đức Đạt')).toBe('do duc dat');
    });

    it('should handle empty or null input', () => {
      expect(normalizeVietnameseText('')).toBe('');
      expect(normalizeVietnameseText(' ')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(normalizeVietnameseText('  Nguyễn Văn A  ')).toBe('nguyen van a');
    });
  });

  describe('searchVietnameseText', () => {
    const testUsers = [
      { id: '1', fullName: 'Nguyễn Văn Anh', shortcut: 'NVA' },
      { id: '2', fullName: 'Trần Thị Bích', shortcut: 'TTB' },
      { id: '3', fullName: 'Phạm Hoàng Đức', shortcut: 'PHD' },
      { id: '4', fullName: 'Lê Minh Tuấn', shortcut: 'LMT' },
    ];

    it('should find users by exact name with diacritics', () => {
      expect(searchVietnameseText(testUsers[0], ['fullName'], 'Nguyễn Văn Anh')).toBe(true);
      expect(searchVietnameseText(testUsers[1], ['fullName'], 'Trần Thị Bích')).toBe(true);
    });

    it('should find users by name without diacritics', () => {
      expect(searchVietnameseText(testUsers[0], ['fullName'], 'nguyen van anh')).toBe(true);
      expect(searchVietnameseText(testUsers[1], ['fullName'], 'tran thi bich')).toBe(true);
    });

    it('should find users by partial name', () => {
      expect(searchVietnameseText(testUsers[0], ['fullName'], 'nguyen')).toBe(true);
      expect(searchVietnameseText(testUsers[1], ['fullName'], 'tran')).toBe(true);
      expect(searchVietnameseText(testUsers[2], ['fullName'], 'duc')).toBe(true);
    });

    it('should find users by shortcut', () => {
      expect(searchVietnameseText(testUsers[0], ['shortcut'], 'NVA')).toBe(true);
      expect(searchVietnameseText(testUsers[1], ['shortcut'], 'TTB')).toBe(true);
      expect(searchVietnameseText(testUsers[2], ['shortcut'], 'PHD')).toBe(true);
    });

    it('should search across multiple fields', () => {
      expect(searchVietnameseText(testUsers[0], ['fullName', 'shortcut'], 'nguyen')).toBe(true);
      expect(searchVietnameseText(testUsers[0], ['fullName', 'shortcut'], 'NVA')).toBe(true);
      expect(searchVietnameseText(testUsers[1], ['fullName', 'shortcut'], 'bich')).toBe(true);
      expect(searchVietnameseText(testUsers[1], ['fullName', 'shortcut'], 'TTB')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(searchVietnameseText(testUsers[0], ['fullName'], 'NGUYEN VAN ANH')).toBe(true);
      expect(searchVietnameseText(testUsers[0], ['shortcut'], 'nva')).toBe(true);
    });

    it('should handle mixed accented and non-accented search', () => {
      // Search with accents should find non-accented
      expect(searchVietnameseText(testUsers[0], ['fullName'], 'nguyễn')).toBe(true);
      // Search without accents should find accented
      expect(searchVietnameseText(testUsers[0], ['fullName'], 'nguyen')).toBe(true);
    });

    it('should return false for non-matching search', () => {
      expect(searchVietnameseText(testUsers[0], ['fullName'], 'tran')).toBe(false);
      expect(searchVietnameseText(testUsers[0], ['shortcut'], 'TTB')).toBe(false);
    });

    it('should return true for empty search term', () => {
      expect(searchVietnameseText(testUsers[0], ['fullName'], '')).toBe(true);
      expect(searchVietnameseText(testUsers[0], ['fullName'], '   ')).toBe(true);
    });

    it('should handle missing fields gracefully', () => {
      const userWithMissingField = { id: '5', fullName: 'Test User' };

      expect(searchVietnameseText(userWithMissingField, ['fullName', 'shortcut'], 'test')).toBe(true);
      expect(searchVietnameseText(userWithMissingField, ['shortcut'], 'test')).toBe(false);
    });
  });

  describe('Product Search Integration', () => {
    const testProducts = [
      { id: 1, productName: 'Áo Khoác Mùa Đông', productCode: 'AK001', category: 'Fashion' },
      { id: 2, productName: 'Quần Jean Nam', productCode: 'QJ002', category: 'Denim' },
      { id: 3, productName: 'Giày Thể Thao', productCode: 'GT003', category: 'Sports' },
    ];

    it('should find products by Vietnamese name with/without diacritics', () => {
      expect(searchVietnameseText(testProducts[0], ['productName', 'productCode', 'category'], 'áo khoác')).toBe(true);
      expect(searchVietnameseText(testProducts[0], ['productName', 'productCode', 'category'], 'ao khoac')).toBe(true);
      expect(searchVietnameseText(testProducts[1], ['productName', 'productCode', 'category'], 'quần jean')).toBe(true);
      expect(searchVietnameseText(testProducts[1], ['productName', 'productCode', 'category'], 'quan jean')).toBe(true);
    });

    it('should find products by product code', () => {
      expect(searchVietnameseText(testProducts[0], ['productName', 'productCode', 'category'], 'AK001')).toBe(true);
      expect(searchVietnameseText(testProducts[1], ['productName', 'productCode', 'category'], 'qj002')).toBe(true);
    });

    it('should find products by category', () => {
      expect(searchVietnameseText(testProducts[0], ['productName', 'productCode', 'category'], 'fashion')).toBe(true);
      expect(searchVietnameseText(testProducts[2], ['productName', 'productCode', 'category'], 'sports')).toBe(true);
    });
  });

  describe('Production Step Search Integration', () => {
    const testSteps = [
      { id: 1, stepName: 'Cắt Vải', stepCode: 'CV001', filmSequence: '1' },
      { id: 2, stepName: 'May Thành Phẩm', stepCode: 'MTP002', filmSequence: '2' },
      { id: 3, stepName: 'Kiểm Tra Chất Lượng', stepCode: 'KTCL003', filmSequence: '3' },
    ];

    it('should find production steps by Vietnamese name with/without diacritics', () => {
      expect(searchVietnameseText(testSteps[0], ['stepName', 'stepCode', 'filmSequence'], 'cắt vải')).toBe(true);
      expect(searchVietnameseText(testSteps[0], ['stepName', 'stepCode', 'filmSequence'], 'cat vai')).toBe(true);
      expect(searchVietnameseText(testSteps[2], ['stepName', 'stepCode', 'filmSequence'], 'kiểm tra')).toBe(true);
      expect(searchVietnameseText(testSteps[2], ['stepName', 'stepCode', 'filmSequence'], 'kiem tra')).toBe(true);
    });

    it('should find production steps by step code', () => {
      expect(searchVietnameseText(testSteps[0], ['stepName', 'stepCode', 'filmSequence'], 'CV001')).toBe(true);
      expect(searchVietnameseText(testSteps[1], ['stepName', 'stepCode', 'filmSequence'], 'mtp002')).toBe(true);
    });

    it('should find production steps by sequence', () => {
      expect(searchVietnameseText(testSteps[0], ['stepName', 'stepCode', 'filmSequence'], '1')).toBe(true);
      expect(searchVietnameseText(testSteps[2], ['stepName', 'stepCode', 'filmSequence'], '3')).toBe(true);
    });
  });
});
