import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('サイト管理', () => {
  test('サイトの新規追加ができること', async ({ page }, testInfo) => {
    // アプリにアクセス
    await page.goto('/');

    // 画面の初期表示（下部ナビゲーション）を確認
    const addBtn = page.getByRole('button', { name: 'サイト追加' }).or(page.locator('#nav-add-btn'));
    await expect(addBtn).toBeVisible();

    // サイト追加モーダルを開く
    await addBtn.click();

    // モーダルの表示確認
    await expect(page.getByText('サイト設定')).toBeVisible();

    // 各項目に入力
    const nameInput = page.getByLabel('サイト名');
    await nameInput.fill('TWSNMP FC');

    const urlInput = page.getByLabel('URL');
    await urlInput.fill('http://192.168.1.250:8080');

    const userInput = page.getByLabel('ユーザー名');
    await userInput.fill('twsnmp');

    const passwordInput = page.getByLabel('パスワード');
    await passwordInput.fill('twsnmp');

    // 保存ボタンをクリック
    const saveBtn = page.getByRole('button', { name: '保存' }).or(page.locator('#save-site-btn'));
    await saveBtn.click();

    // モーダルが閉じて、リストに追加されたサイトが表示されることを検証
    await expect(page.getByText('TWSNMP FC')).toBeVisible();

    // 録画モードの場合、動画ファイルを recordings ディレクトリに保存
    if (process.env.RECORD) {
      // 最後の画面が少し見えるよう少し待機
      await page.waitForTimeout(1000);
      await page.close();
      const video = page.video();
      if (video) {
        const recordDir = path.resolve('recordings');
        if (!fs.existsSync(recordDir)) {
          fs.mkdirSync(recordDir, { recursive: true });
        }
        const projectName = testInfo.project.name.replace(/[^a-zA-Z0-9-_]/g, '_');
        const targetPath = path.join(recordDir, `add_site_${projectName}.webm`);
        await video.saveAs(targetPath);
      }
    }
  });
});
