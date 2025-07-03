const fs = require('node:fs');
const path = require('node:path');

const enPath = path.join(__dirname, '../src/locales/en.json');
const vnPath = path.join(__dirname, '../src/locales/vn.json');

function mergeDeep(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key]
      && typeof source[key] === 'object'
      && !Array.isArray(source[key])
    ) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      mergeDeep(target[key], source[key]);
    } else {
      if (!(key in target)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const vn = JSON.parse(fs.readFileSync(vnPath, 'utf8'));

const merged = mergeDeep({ ...vn }, en);

fs.writeFileSync(vnPath, JSON.stringify(merged, null, 2), 'utf8');

console.log('vn.json đã được bổ sung đầy đủ key từ en.json (giữ nguyên tiếng Anh cho key mới).');
