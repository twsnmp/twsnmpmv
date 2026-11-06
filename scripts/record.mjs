import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const recordDir = path.resolve('recordings');
if (!fs.existsSync(recordDir)) {
  fs.mkdirSync(recordDir, { recursive: true });
}

// Clean up old recording files
for (const f of fs.readdirSync(recordDir)) {
  fs.unlinkSync(path.join(recordDir, f));
}

// Check project filter from argument (optional: e.g. node scripts/record.mjs iphone)
const arg = process.argv[2]?.toLowerCase();
let projectFlag = '';
if (arg === 'iphone' || arg === 'ios' || arg === 'safari') {
  projectFlag = ' --project="Mobile Safari (iPhone 14)"';
} else if (arg === 'android' || arg === 'pixel' || arg === 'chrome') {
  projectFlag = ' --project="Mobile Chrome (Pixel 7)"';
}

console.log(`Recording E2E test with Playwright${projectFlag ? ` (${projectFlag.trim()})` : ' (Android & iPhone)'}...`);
try {
  execSync(`npx playwright test${projectFlag}`, {
    env: { ...process.env, RECORD: '1' },
    stdio: 'inherit',
  });
} catch (error) {
  console.error('Playwright test failed during recording.');
  process.exit(1);
}

// Check recordings directory for webm files to convert to mp4
const webmFiles = fs.readdirSync(recordDir).filter(f => f.endsWith('.webm'));

let ffmpegPath = 'ffmpeg';
try {
  execSync('which ffmpeg', { stdio: 'pipe' });
} catch {
  ffmpegPath = null;
}

if (!ffmpegPath) {
  console.error('ffmpeg is not installed. Keeping webm files.');
} else {
  for (const file of webmFiles) {
    const webmPath = path.join(recordDir, file);
    const mp4Name = file.replace(/\.webm$/, '.mp4');
    const mp4Path = path.join(recordDir, mp4Name);

    console.log(`Converting ${file} to ${mp4Name}...`);
    try {
      execSync(`ffmpeg -y -i "${webmPath}" -c:v libx264 -pix_fmt yuv420p "${mp4Path}"`, {
        stdio: 'pipe',
      });
      // Remove the original webm file so only MP4 remains
      fs.unlinkSync(webmPath);
      console.log(`Saved MP4 to: recordings/${mp4Name}`);
    } catch (err) {
      console.error(`ffmpeg conversion failed for ${file}:`, err);
    }
  }
}

console.log('\nRecording finished successfully! Output files in recordings/:');
for (const f of fs.readdirSync(recordDir)) {
  console.log(` - ${f}`);
}
