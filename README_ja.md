# TWSNMP Map Viewer (twsnmpmv)

[English](./README.md)

TWSNMP Map Viewerは、[TWSNMP](https://github.com/twise-oss/twsnmpfk)で管理されているネットワークの状態をモバイルやWebで視覚化するためのアプリケーションです。複数のTWSNMPサイトを監視し、ネットワークマップを表示して、ノードやポーリングの状態をリアルタイムで追跡できます。

## 特徴

- **マルチサイト対応:** 複数のTWSNMPインスタンスを同時に監視。
- **インタラクティブなネットワークマップ:** ノード、ライン、ステータスインジケータを使用してネットワークレイアウトを視覚化。
- **リアルタイムステータス更新:** 設定されたサイトから定期的にステータスを取得。
- **ステータスの視覚化:** 色分けされたステータス（正常、注意、軽度、重度）とアイコンで素早く識別可能。
- **モバイル対応:** Capacitorを使用してシームレスなモバイル体験を提供。

## 技術スタック

- **Frontend:** [Svelte](https://svelte.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Visualization:** [p5.js](https://p5js.org/) (ネットワークマップの描画)
- **Mobile Platform:** [Capacitor](https://capacitorjs.com/)
- **Styling:** Vanilla CSS + [Tailwind CSS](https://tailwindcss.com/) (一部)
- **API Communication:** Fetch API + JWT認証

## アーキテクチャ概要

本アプリケーションは、シンプルなストアベースのアーキテクチャを採用しています。

- **DataStore (`src/lib/datastore.ts`):** アプリケーションの状態（TWSNMPサイトのリストや現在のステータスなど）を管理する中心的なハブ。Capacitor Preferencesを使用してデータを永続化します。
- **TwsnmpAPI (`src/lib/twsnmpapi.ts`):** TWSNMP REST APIとやり取りするためのラッパー。
- **Map Library (`src/lib/map.ts`):** p5.jsを使用してネットワークマップをレンダリングし、ズームなどのユーザーインタラクションを処理する専用ライブラリ。
- **Svelte Components:** UIレイヤー。`src/lib/`内の再利用可能なコンポーネントとして構成されています。

## はじめに

### 前提条件

- [mise](https://mise.jdx.dev/) (ツールとタスクの管理に推奨)
- Node.js (miseで管理)
- Java OpenJDK 21 (miseで管理)

### インストール

1. リポジトリをクローンする:
   ```bash
   git clone https://github.com/twise-oss/twsnmpmv.git
   cd twsnmpmv
   ```

2. ツールと依存関係をインストールする:
   ```bash
   mise install
   npm install
   ```

### 開発

開発サーバーを起動する:

```bash
mise run dev
```

テストを実行する:

```bash
mise run test
```

### ビルドと実行

このプロジェクトでは、`mise`を使用してWebおよびモバイルプラットフォーム向けのビルドと同期タスクを調整しています。

#### Webプロダクションビルド
```bash
mise run build
```

#### Android
- **エミュレータでのデバッグ:**
  ```bash
  mise run debug:android
  ```
- **リリース用APKのビルド:**
  ```bash
  mise run release:android
  ```

#### iOS
- **シミュレータでのデバッグ:**
  ```bash
  mise run debug:ios
  ```
- **リリース用ビルド:**
  ```bash
  mise run release:ios
  ```

#### フルリリース (両プラットフォーム)
```bash
mise run release
```

## ドキュメント

- [Architecture Decision Records (ADRs)](docs/decisions/)
- [API Documentation](docs/api.md)

## ライセンス

このプロジェクトはApache License 2.0の下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルを参照してください。
