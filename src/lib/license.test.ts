import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('License', () => {
  it('should have the correct copyright year', () => {
    const licensePath = join(process.cwd(), 'LICENSE');
    const licenseContent = readFileSync(licensePath, 'utf-8');
    // According to session context, today is 2026年5月11日
    expect(licenseContent).toContain(`Copyright 2026 Masayuki Yamai`);
  });
});
