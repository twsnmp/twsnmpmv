# Androidアプリのリリース署名手順

このドキュメントでは、Android用APKファイルに正式な署名を行い、インストール可能な形式でリリースするための手順を説明します。

## 1. リリース鍵（キーストア）の作成

手元のターミナルで以下のコマンドを実行し、リリース鍵を作成します。

```bash
keytool -genkey -v -keystore TWSNMP.jks -keyalg RSA -keysize 2048 -validity 10000 -alias TWSNMP
```

- **注意:** パスワードとエイリアス名（`TWSNMP`）は忘れないように安全な場所にメモしてください。
- 生成された `TWSNMP.jks` がキーストアファイルです。

## 2. 鍵の保管とバックアップ

キーストアファイルは**再発行が不可能**です。紛失するとアプリのアップデートができなくなるため、以下の場所などに必ずバックアップしてください。

- Google ドライブ / iCloud Drive などのクラウドストレージ
- 外付けHDD / USBメモリ
- パスワードマネージャー（パスワードとエイリアス名も併せて保管）

## 3. GitHub Secrets への登録準備

GitHub Actionsで使用するために、キーストアファイルをBase64形式に変換します。

```bash
openssl base64 -in TWSNMP.jks -out TWSNMP.base64
```

`TWSNMP.base64` の中身（テキスト文字列）をコピーします。

## 4. GitHub Secrets の設定

各リポジトリの `Settings > Secrets and variables > Actions` に以下の4つの Secret を登録します。

| Secret名 | 内容 |
| :--- | :--- |
| `ANDROID_KEYSTORE` | `TWSNMP.base64` の中身の文字列 |
| `ANDROID_KEYSTORE_PASSWORD` | キーストア作成時に設定したパスワード |
| `ANDROID_KEY_ALIAS` | `TWSNMP` (作成時に指定したエイリアス) |
| `ANDROID_KEY_PASSWORD` | 鍵のパスワード（通常はキーストアと同じ） |

## 5. GitHub Actions ワークフローへの組み込み

`.github/workflows/release.yml` に以下の署名ステップを追加します。

```yaml
      - name: Sign APK
        uses: r0adkll/sign-android-release@v1
        id: sign_app
        with:
          releaseDirectory: android/app/build/outputs/apk/release
          signingKeyBase64: ${{ secrets.ANDROID_KEYSTORE }}
          alias: ${{ secrets.ANDROID_KEY_ALIAS }}
          keyStorePassword: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          keyPassword: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Create Release and Upload APK
        uses: softprops/action-gh-release@v2
        with:
          files: ${{ steps.sign_app.outputs.signedReleaseFile }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

この手順により、タグプッシュ時に自動的に署名済みAPKがリリースにアップロードされます。
