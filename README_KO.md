<div align="center">
  <img src="images/logo.png" alt="iScrcpy Logo" width="120" height="120">

  # iScrcpy

  **scrcpy 기반 Android 기기 미러링 도구**

  [![Windows](https://img.shields.io/badge/Windows-0078D4?style=flat-square&logo=windows&logoColor=white)](#)
  [![macOS](https://img.shields.io/badge/macOS-000000?style=flat-square&logo=apple)](#)
  [![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black)](#)
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square)](#)
  [![Version](https://img.shields.io/badge/Version-1.0.6-blue?style=flat-square)](#)

  [English](README.md) | [简体中文](README_CN.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Español](README_ES.md) | [Français](README_FR.md) | [Türkçe](README_TR.md)
</div>

---

![iScrcpy 인터페이스](images/iScrcpy.png)

## 기능

- **다국어 지원**: 7개 언어 지원 (중국어, 영어, 일본어, 한국어, 스페인어, 프랑스어, 터키어)
- **기기 관리**: USB/WiFi 기기 스캔 및 연결, 실시간 모니터링
- **표시 설정**: 해상도, 비트레이트, 프레임레이트, 창 옵션, 녹화 시간 제한 커스터마이징
- **창 옵션**: 테두리 없음 모드, 화면 보호기 비활성화, 항상 위쪽, 전체 화면
- **녹화 기능**: 자동 녹화, 시간 제한, 커스텀 저장 경로
- **카메라 미러링**: 기기 카메라 미러링
- **인코딩 설정**: 비디오/오디오 코덱 및 비트레이트 모드 설정
- **서버 설정**: scrcpy 서버 경로 및 ADB 설정 관리
- **Windows 네이티브**: 최소화/최대화/닫기 버튼이 포함된 커스텀 창
- **다크 테마**: shadcn/ui에서 영감을 받은 모던한 다크 UI

## 기술 스택

- **React 18** - UI 프레임워크
- **Vite 5** - 빌드 도구
- **Electron 28** - 데스크톱 런타임
- **TypeScript** - 타입 안전성
- **i18next** - 국제화
- **Zustand** - 상태 관리
- **Electron Builder** - 인스톨러 생성

## 지원 언어

iScrcpy는 7개 언어를 지원합니다:

| 언어 | 코드 | 네이티브 이름 |
|------|------|---------------|
| English | `en-US` | English |
| 简体中文 | `zh-CN` | 简体中文 |
| 日本語 | `ja-JP` | 日本語 |
| 한국어 | `ko-KR` | 한국어 |
| Español | `es-ES` | Español |
| Français | `fr-FR` | Français |
| Türkçe | `tr-TR` | Türkçe |

언어는 제목 표시줄 (최소화 버튼 옆)의 언어 선택기에서 전환할 수 있습니다.

## 문서

7개 언어의 상세 사용자 가이드를 제공합니다:

| 언어 | 문서 |
|------|------|
| English | [documents/en-US.md](documents/en-US.md) |
| 简体中文 | [documents/zh-CN.md](documents/zh-CN.md) |
| 日本語 | [documents/ja-JP.md](documents/ja-JP.md) |
| 한국어 | [documents/ko-KR.md](documents/ko-KR.md) |
| Español | [documents/es-ES.md](documents/es-ES.md) |
| Français | [documents/fr-FR.md](documents/fr-FR.md) |
| Türkçe | [documents/tr-TR.md](documents/tr-TR.md) |

### 빠른 링크 (한국어)

- [빠른 시작](documents/ko-KR.md#빠른-시작)
- [기기 연결](documents/ko-KR.md#기기-연결)
- [표시 설정](documents/ko-KR.md#표시-설정)
- [녹화 기능](documents/ko-KR.md#녹화)
- [카메라 미러링](documents/ko-KR.md#카메라-미러링)
- [FAQ](documents/ko-KR.md#faq)

## 프로젝트 구조

```text
iScrcpy/
├── app/                    # scrcpy 바이너리 파일 및 종속성
│   ├── win/                # Windows 바이너리
│   │   ├── scrcpy.exe      # scrcpy 실행 파일
│   │   ├── scrcpy-server   # scrcpy server jar
│   │   ├── adb.exe         # ADB 실행 파일
│   │   ├── SDL2.dll        # SDL2 라이브러리
│   │   └── *.dll           # 필요한 DLL (avcodec, avformat 등)
│   ├── mac/                # macOS 바이너리
│   │   ├── scrcpy
│   │   ├── scrcpy-server
│   │   ├── adb
│   │   └── scrcpy.1        # 매뉴얼 페이지
│   └── linux/              # Linux 바이너리
│       ├── scrcpy
│       ├── scrcpy-server
│       ├── adb
│       └── scrcpy.1        # 매뉴얼 페이지
├── electron/               # Electron 메인 프로세스
│   ├── main.ts             # IPC 핸들러가 있는 메인 프로세스
│   ├── main.cjs            # 컴파일된 메인 프로세스
│   ├── preload.ts          # IPC 브릿지 프리로드 스크립트
│   ├── preload.cjs         # 컴파일된 프리로드 스크립트
│   ├── logger.ts           # 로그 유틸리티
│   └── resources/          # 빌드 리소스
├── src/                    # React 애플리케이션
│   ├── main.tsx            # 진입점
│   ├── App.tsx             # 루트 컴포넌트
│   ├── i18n/               # 국제화
│   │   ├── index.ts        # i18n 설정
│   │   └── locales/        # 번역 파일
│   │       ├── zh-CN.json
│   │       ├── en-US.json
│   │       ├── ja-JP.json
│   │       ├── ko-KR.json
│   │       ├── es-ES.json
│   │       ├── fr-FR.json
│   │       └── tr-TR.json
│   ├── components/         # 재사용 가능한 컴포넌트
│   │   ├── TitleBar.tsx    # 언어 선택기가 있는 제목 표시줄
│   │   ├── Sidebar.tsx     # 탐색 사이드바
│   │   ├── DeviceCard.tsx  # 기기 카드 컴포넌트
│   │   ├── FileManager.tsx # 파일 관리 대화상자
│   │   ├── CloseConfirmDialog.tsx  # 닫기 확인 대화상자
│   │   ├── UpdateDialog.tsx        # 업데이트 알림 대화상자
│   │   └── ui/             # shadcn/ui 스타일 컴포넌트
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       └── sonner.tsx
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── DevicePage.tsx  # 기기 관리 페이지
│   │   ├── DisplayPage.tsx # 표시 설정 페이지
│   │   ├── EncodingPage.tsx    # 인코딩 설정 페이지
│   │   ├── ServerPage.tsx      # 서버 설정 페이지
│   │   ├── LogsPage.tsx        # 애플리케이션 로그 페이지
│   │   └── AboutPage.tsx       # 정보 페이지
│   ├── store/              # 상태 관리 (Zustand)
│   │   └── deviceStore.ts  # 기기 상태 저장소
│   ├── lib/                # 유틸리티 라이브러리
│   │   └── utils.ts        # 유틸리티 함수
│   ├── styles/             # CSS 스타일
│   │   └── index.css       # 글로벌 스타일
│   ├── utils/              # 유틸리티
│   │   └── electron.ts     # Electron API 브릿지
│   ├── types/              # TypeScript 타입 정의
│   │   └── electron.d.ts   # Electron 타입 선언
│   ├── assets/             # 정적 자산
│   │   └── icon.png        # 애플리케이션 아이콘
│   └── vite-env.d.ts       # Vite 타입 선언
├── documents/              # 사용자 가이드 (7개 언어)
│   ├── en-US.md            # 영어 사용자 가이드
│   ├── zh-CN.md            # 중국어 사용자 가이드
│   ├── ja-JP.md            # 일본어 사용자 가이드
│   ├── ko-KR.md            # 한국어 사용자 가이드
│   ├── es-ES.md            # 스페인어 사용자 가이드
│   ├── fr-FR.md            # 프랑스어 사용자 가이드
│   └── tr-TR.md            # 터키어 사용자 가이드
├── images/                 # 스크린샷 및 자산
│   └── iScrcpy.png         # 메인 인터페이스 스크린샷
├── logs/                   # 애플리케이션 로그
├── index.html              # HTML 진입
├── package.json            # 종속성 설정
├── vite.config.ts          # Vite 설정
├── electron.vite.config.ts # Electron Vite 설정
├── tsconfig.json           # TypeScript 설정
└── forge.config.cjs        # Electron Forge 설정
```

## 빠른 시작

### 1. 종속성 설치

```bash
npm install
```

### 2. 개발 버전 실행

```bash
npm run dev
```

### 3. 테스트 모드 (모의 기기)

```bash
TEST=1 npm run dev
```

### 4. 프로덕션 버전 빌드

```bash
npm run build
```

이것은 `dist-win/` 폴더에 `.exe` 인스톨러를 생성합니다.

## scrcpy 옵션

| 옵션 | 설명 |
|-----------------------------|------------------------------------|
| `--max-size=<n>` | 최대 비디오 크기 |
| `--video-bit-rate=<n>` | 비디오 비트레이트 (Mbps) |
| `--max-fps=<n>` | 최대 프레임레이트 |
| `--video-codec=<c>` | 비디오 코덱 (h264, h265, av1) |
| `--audio-codec=<c>` | 오디오 코덱 (opus, aac) |
| `--video-encoder=<name>` | 특정 비디오 인코더 이름 |
| `--always-on-top` | 창을 항상 위에 유지 |
| `--fullscreen` / `-f` | 전체 화면으로 시작 |
| `--stay-awake` | 화면을 켜진 상태로 유지 |
| `--window-borderless` | 테두리 없음 창 모드 |
| `--disable-screensaver` | 화면 보호기 비활성화 |
| `--record=<file>` | 화면을 파일로 녹화 |
| `--time-limit=<s>` | 녹화 시간 제한 (초) |
| `--tunnel-forward` | 포워드 터널 모드 사용 |
| `--no-cleanup` | 종료 시 서버 정리 안 함 |

## 개발

### 새 언어 추가

1. `src/i18n/locales/`에 새 번역 파일 생성 (예: `de-DE.json`)
2. 기존 언어 파일에서 구조 복사
3. 모든 텍스트 문자열 번역
4. `src/i18n/index.ts`에 언어 등록:

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

### 컴포넌트에서 번역 사용

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

## 기여

기여는 환영입니다! 언제든 Pull Request를 제출해 주세요.

### 기여 방법

- GitHub Issues를 통해 버그 보고 또는 기능 제안
- 새 언어 번역 추가
- 문서 개선
- 코드 개선 제출

## 감사 인용

- [scrcpy](https://github.com/Genymobile/scrcpy) - 놀라운 Android 미러링 도구
- [shadcn/ui](https://ui.shadcn.com/) - UI 컴포넌트 영감
- 모든 기여자와 번역자

## 라이선스

Apache License 2.0

Apache License, Version 2.0 (이하 "라이선스")에 따라 라이선스됨;
이 파일을 사용하려면 라이선스를 준수해야 합니다.
라이선스 사본은 다음 주소에서 얻을 수 있습니다:

    http://www.apache.org/licenses/LICENSE-2.0

적용 법률에서 요구하거나 서면 합의가 없는 한,
라이선스에 따라 배포되는 소프트웨어는 "있는 그대로" 배포되며,
명시적이든 암시적이든 어떤 종류의 보증도 없이 제공됩니다.
라이선스에 따른 특정 권한 및 제한에 대해서는 라이선스를 참조하세요.
