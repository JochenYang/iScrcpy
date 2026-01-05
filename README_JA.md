<div align="center">
  <img src="images/logo.png" alt="iScrcpy Logo" width="120" height="120">

  # iScrcpy

  **scrcpy ベースの Android デバイスミラーリングツール**

  [![Windows](https://img.shields.io/badge/Windows-0078D4?style=flat-square&logo=windows&logoColor=white)](#)
  [![macOS](https://img.shields.io/badge/macOS-000000?style=flat-square&logo=apple)](#)
  [![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black)](#)
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square)](#)
  [![Version](https://img.shields.io/badge/Version-1.0.9-blue?style=flat-square)](#)

  [English](README.md) | [简体中文](README_CN.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Español](README_ES.md) | [Français](README_FR.md) | [Türkçe](README_TR.md)
</div>

---

![iScrcpy インターフェース](images/iScrcpy.png)

## 機能

- **多言語対応**: 7言語対応（中国語、英語、日本語、韓国語、スペイン語、フランス語、トルコ語）
- **デバイス管理**: USB/WiFi デバイスのスキャンと接続、リアルタイム監視
- **表示設定**: 解像度、ビットレート、フレームレート、ウィンドウオプション、録画時間制限のカスタマイズ
- **ウィンドウオプション**: ボーダレスモード、スクリーンセーバー無効化、最前面表示、全画面
- **録画機能**: 自動録画、時間制限、カスタム保存パス
- **カメラミラーリング**: デバイスのカメラをミラーリング
- **エンコーディング設定**: ビデオ/オーディオコーデックとビットレートモードの設定
- **サーバー設定**: scrcpy サーバーパスと ADB 設定の管理
- **Windows ネイティブ**: 最小化/最大化/クローズボタンを備えたカスタムウィンドウ
- **ダークテーマ**: shadcn/ui  inspired のモダンなダーク UI

## 技術スタック

- **React 18** - UI フレームワーク
- **Vite 5** - ビルドツール
- **Electron 28** - デスクトップランタイム
- **TypeScript** - 型安全
- **i18next** - 国際化
- **Zustand** - 状態管理
- **Electron Builder** - インストーラー生成

## 対応言語

iScrcpy は 7 言語に対応:

| 言語 | コード | ネイティブ名 |
|------|--------|-------------|
| English | `en-US` | English |
| 简体中文 | `zh-CN` | 简体中文 |
| 日本語 | `ja-JP` | 日本語 |
| 한국어 | `ko-KR` | 한국어 |
| Español | `es-ES` | Español |
| Français | `fr-FR` | Français |
| Türkçe | `tr-TR` | Türkçe |

言語はタイトルバー（最小化ボタンの横）の言語セレクターで切り替えられます。

## ドキュメント

7 言語の詳細なユーザーガイドを提供:

| 言語 | ドキュメント |
|------|------------|
| English | [documents/en-US.md](documents/en-US.md) |
| 简体中文 | [documents/zh-CN.md](documents/zh-CN.md) |
| 日本語 | [documents/ja-JP.md](documents/ja-JP.md) |
| 한국어 | [documents/ko-KR.md](documents/ko-KR.md) |
| Español | [documents/es-ES.md](documents/es-ES.md) |
| Français | [documents/fr-FR.md](documents/fr-FR.md) |
| Türkçe | [documents/tr-TR.md](documents/tr-TR.md) |

### クイックリンク（日本語）

- [クイックスタート](documents/ja-JP.md#クイックスタート)
- [デバイスを接続する](documents/ja-JP.md#デバイスを接続する)
- [表示設定](documents/ja-JP.md#表示設定)
- [録画機能](documents/ja-JP.md#録画)
- [カメラミラーリング](documents/ja-JP.md#カメラミラーリング)
- [FAQ](documents/ja-JP.md#faq)

## プロジェクト構造

```text
iScrcpy/
├── app/                    # scrcpy バイナリファイルと依存関係
│   ├── win/                # Windows バイナリ
│   │   ├── scrcpy.exe      # scrcpy 実行ファイル
│   │   ├── scrcpy-server   # scrcpy server jar
│   │   ├── adb.exe         # ADB 実行ファイル
│   │   ├── SDL2.dll        # SDL2 ライブラリ
│   │   └── *.dll           # 必要な DLL（avcodec, avformat など）
│   ├── mac/                # macOS バイナリ
│   │   ├── scrcpy
│   │   ├── scrcpy-server
│   │   ├── adb
│   │   └── scrcpy.1        # マニュアルページ
│   └── linux/              # Linux バイナリ
│       ├── scrcpy
│       ├── scrcpy-server
│       ├── adb
│       └── scrcpy.1        # マニュアルページ
├── electron/               # Electron メインプロセス
│   ├── main.ts             # IPC ハンドラー付きメインプロセス
│   ├── main.cjs            # コンパイルされたメインプロセス
│   ├── preload.ts          # IPC ブリッジプリロードスクリプト
│   ├── preload.cjs         # コンパイルされたプリロードスクリプト
│   ├── logger.ts           # ログツール
│   └── resources/          # ビルドリソース
├── src/                    # React アプリケーション
│   ├── main.tsx            # エントリーポイント
│   ├── App.tsx             # ルートコンポーネント
│   ├── i18n/               # 国際化
│   │   ├── index.ts        # i18n 設定
│   │   └── locales/        # 翻訳ファイル
│   │       ├── zh-CN.json
│   │       ├── en-US.json
│   │       ├── ja-JP.json
│   │       ├── ko-KR.json
│   │       ├── es-ES.json
│   │       ├── fr-FR.json
│   │       └── tr-TR.json
│   ├── components/         # 再利用可能なコンポーネント
│   │   ├── TitleBar.tsx    # 言語セレクター付きタイトルバー
│   │   ├── Sidebar.tsx     # ナビゲーションサイドバー
│   │   ├── DeviceCard.tsx  # デバイスカードコンポーネント
│   │   ├── FileManager.tsx # ファイル管理ダイアログ
│   │   ├── CloseConfirmDialog.tsx  # 閉じる確認ダイアログ
│   │   ├── UpdateDialog.tsx        # 更新通知ダイアログ
│   │   └── ui/             # shadcn/ui スタイルコンポーネント
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       └── sonner.tsx
│   ├── pages/              # ページコンポーネント
│   │   ├── DevicePage.tsx  # デバイス管理ページ
│   │   ├── DisplayPage.tsx # 表示設定ページ
│   │   ├── EncodingPage.tsx    # エンコーディング設定ページ
│   │   ├── ServerPage.tsx      # サーバー設定ページ
│   │   ├── LogsPage.tsx        # アプリログページ
│   │   └── AboutPage.tsx       # このアプリについてページ
│   ├── store/              # 状態管理 (Zustand)
│   │   └── deviceStore.ts  # デバイス状態ストア
│   ├── lib/                # ツールライブラリ
│   │   └── utils.ts        # ツール関数
│   ├── styles/             # CSS スタイル
│   │   └── index.css       # グローバルスタイル
│   ├── utils/              # ツール関数
│   │   └── electron.ts     # Electron API ブリッジ
│   ├── types/              # TypeScript 型定義
│   │   └── electron.d.ts   # Electron 型宣言
│   ├── assets/             # 静的アセット
│   │   └── icon.png        # アプリアイコン
│   └── vite-env.d.ts       # Vite 型宣言
├── documents/              # ユーザーガイド（7言語）
│   ├── en-US.md            # 英語ユーザーガイド
│   ├── zh-CN.md            # 中国語ユーザーガイド
│   ├── ja-JP.md            # 日本語ユーザーガイド
│   ├── ko-KR.md            # 韓国語ユーザーガイド
│   ├── es-ES.md            # スペイン語ユーザーガイド
│   ├── fr-FR.md            # フランス語ユーザーガイド
│   └── tr-TR.md            # トルコ語ユーザーガイド
├── images/                 # スクリーンショットとアセット
│   └── iScrcpy.png         # メインインターフェーススクリーンショット
├── logs/                   # アプリログ
├── index.html              # HTML エントリ
├── package.json            # 依存関係設定
├── vite.config.ts          # Vite 設定
├── electron.vite.config.ts # Electron Vite 設定
├── tsconfig.json           # TypeScript 設定
└── forge.config.cjs        # Electron Forge 設定
```

## クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発版を実行

```bash
npm run dev
```

### 3. テストモード（モックデバイス）

```bash
TEST=1 npm run dev
```

### 4. 本番版をビルド

```bash
npm run build
```

これにより `dist-win/` フォルダに `.exe` インストーラーが作成されます。

## scrcpy オプション

| オプション | 説明 |
|-----------------------------|------------------------------------|
| `--max-size=<n>` | 最大ビデオサイズ |
| `--video-bit-rate=<n>` | ビデオビットレート (Mbps) |
| `--max-fps=<n>` | 最大フレームレート |
| `--video-codec=<c>` | ビデオコーデック (h264, h265, av1) |
| `--audio-codec=<c>` | オーディオコーデック (opus, aac) |
| `--video-encoder=<name>` | 特定のビデオエンコーダー名 |
| `--always-on-top` | ウィンドウを最前面に保持 |
| `--fullscreen` / `-f` | 全画面で開始 |
| `--stay-awake` | 画面をオンのままにする |
| `--window-borderless` | ボーダレスウィンドウモード |
| `--disable-screensaver` | スクリーンセーバーを無効化 |
| `--record=<file>` | 画面をファイルに録画 |
| `--time-limit=<s>` | 録画時間制限（秒） |
| `--tunnel-forward` | フォワードトンネルモードを使用 |
| `--no-cleanup` | 終了時にサーバーをクリーンアップしない |

## 開発

### 新しい言語の追加

1. `src/i18n/locales/` に新しい翻訳ファイルを作成（例: `de-DE.json`）
2. 既存の言語ファイルから構造をコピー
3. すべてのテキスト文字列を翻訳
4. `src/i18n/index.ts` に言語を登録:

```typescript
import deDE from './locales/de-DE.json';

const resources = {
  ...
  'de-DE': { translation: deDE },
};

export const languages = [
  ...
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
];
```

### コンポーネントでの翻訳の使用

```typescript
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('devices.title')}</h1>
      <button>{t('devices.refresh')}</button>
    </div>
  );
}
```

## 貢献

貢献は大歓迎です！是非 Pull Request を提交してください。

### 貢献の方法

- GitHub Issues を通じてバグを報告または機能提案
- 新しい言語の翻訳を追加
- ドキュメントの改善
- コードの改善を提交

## 謝辞

- [scrcpy](https://github.com/Genymobile/scrcpy) - 優れた Android ミラーリングツール
- [shadcn/ui](https://ui.shadcn.com/) - UI コンポーネントのインスピレーション
- すべての貢献者と翻訳者

## ライセンス

Apache License 2.0

Apache License, Version 2.0（以下「ライセンス」）の下でライセンスされています;
このファイルを使用する場合、ライセンスに従う必要があります。
ライセンスのコピーは以下で入手可能です:

    http://www.apache.org/licenses/LICENSE-2.0

適用法により要求された場合または書面による同意がある場合を除き、
ライセンスに基づいて配布されるソフトウェアは「現状のまま」配布され、
明示または黙示を問わず、いかなる保証もなく提供されます。
ライセンスに基づく特定の権限と制限については、ライセンスを参照してください。
