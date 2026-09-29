const path = require('path');
const fs = require('fs');

function resolveRoot() {
  if (
    fs.existsSync(
      path.join(__dirname, '..', '..', 'src', 'config', 'paths.js')
    )
  ) {
    return path.resolve(__dirname, '..', '..');
  }
  return path.resolve(__dirname, '..');
}

const ROOT = resolveRoot();
const isBundled = path.basename(__dirname) === 'dist';

const PUBLIC_DIR = isBundled
  ? path.join(ROOT, 'dist', 'public')
  : path.join(ROOT, 'src', 'public');

const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');

module.exports = { UPLOAD_DIR };