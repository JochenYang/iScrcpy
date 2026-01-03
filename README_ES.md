<div align="center">
  <img src="images/logo.png" alt="iScrcpy Logo" width="120" height="120">

  # iScrcpy

  **Herramienta de duplicación de dispositivos Android basada en scrcpy**

  [![Windows](https://img.shields.io/badge/Windows-0078D4?style=flat-square&logo=windows&logoColor=white)](#)
  [![macOS](https://img.shields.io/badge/macOS-000000?style=flat-square&logo=apple)](#)
  [![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black)](#)
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square)](#)
  [![Version](https://img.shields.io/badge/Version-1.0.6-blue?style=flat-square)](#)

  [English](README.md) | [简体中文](README_CN.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Español](README_ES.md) | [Français](README_FR.md) | [Türkçe](README_TR.md)
</div>

---

![Interfaz de iScrcpy](images/iScrcpy.png)

## Características

- **Soporte multilingüe**: 7 idiomas (chino, inglés, japonés, coreano, español, francés, turco)
- **Gestión de dispositivos**: Escanear y conectar dispositivos USB/WiFi con monitorización en tiempo real
- **Configuración de pantalla**: Personalizar resolución, bitrate, fps, opciones de ventana, límite de tiempo de grabación
- **Opciones de ventana**: Modo sin bordes, desactivar protector de pantalla, siempre encima, pantalla completa
- **Grabación**: Grabación automática, límite de tiempo, ruta de guardado personalizada
- **Duplicación de cámara**: Duplicar la cámara del dispositivo en lugar de la pantalla
- **Configuración de codificación**: Configurar códecs de video/audio y modo de bitrate
- **Configuración del servidor**: Gestionar rutas del servidor scrcpy y configuración ADB
- **Nativo de Windows**: Ventana personalizada con botones de minimizar/maximizar/cerrar
- **Tema oscuro**: UI moderna oscura inspirada en shadcn/ui

## Pila tecnológica

- **React 18** - Framework de interfaz de usuario
- **Vite 5** - Herramienta de construcción
- **Electron 28** - Runtime de escritorio
- **TypeScript** - Seguridad de tipos
- **i18next** - Internacionalización
- **Zustand** - Gestión de estado
- **Electron Builder** - Generación de instaladores

## Idiomas admitidos

iScrcpy está disponible en 7 idiomas:

| Idioma | Código | Nombre nativo |
|--------|--------|---------------|
| English | `en-US` | English |
| 简体中文 | `zh-CN` | 简体中文 |
| 日本語 | `ja-JP` | 日本語 |
| 한국어 | `ko-KR` | 한국어 |
| Español | `es-ES` | Español |
| Français | `fr-FR` | Français |
| Türkçe | `tr-TR` | Türkçe |

El idioma se puede cambiar desde el selector de idioma en la barra de título (junto al botón de minimizar).

## Documentación

Guías de usuario detalladas disponibles en 7 idiomas:

| Idioma | Documento |
|--------|-----------|
| English | [documents/en-US.md](documents/en-US.md) |
| 简体中文 | [documents/zh-CN.md](documents/zh-CN.md) |
| 日本語 | [documents/ja-JP.md](documents/ja-JP.md) |
| 한국어 | [documents/ko-KR.md](documents/ko-KR.md) |
| Español | [documents/es-ES.md](documents/es-ES.md) |
| Français | [documents/fr-FR.md](documents/fr-FR.md) |
| Türkçe | [documents/tr-TR.md](documents/tr-TR.md) |

### Enlaces rápidos (Español)

- [Inicio rápido](documents/es-ES.md#inicio-rápido)
- [Conectar dispositivos](documents/es-ES.md#conectar-dispositivos)
- [Configuración de pantalla](documents/es-ES.md#configuración-de-pantalla)
- [Grabación](documents/es-ES.md#grabación)
- [Duplicación de cámara](documents/es-ES.md#duplicación-de-cámara)
- [Preguntas frecuentes](documents/es-ES.md#preguntas-frecuentes)

## Estructura del proyecto

```text
iScrcpy/
├── app/                    # Binarios de scrcpy y dependencias
│   ├── win/                # Binarios de Windows
│   │   ├── scrcpy.exe      # Ejecutable de scrcpy
│   │   ├── scrcpy-server   # Servidor scrcpy jar
│   │   ├── adb.exe         # Ejecutable de ADB
│   │   ├── SDL2.dll        # Biblioteca SDL2
│   │   └── *.dll           # DLL requeridas (avcodec, avformat, etc.)
│   ├── mac/                # Binarios de macOS
│   │   ├── scrcpy
│   │   ├── scrcpy-server
│   │   ├── adb
│   │   └── scrcpy.1        # Página del manual
│   └── linux/              # Binarios de Linux
│       ├── scrcpy
│       ├── scrcpy-server
│       ├── adb
│       └── scrcpy.1        # Página del manual
├── electron/               # Proceso principal de Electron
│   ├── main.ts             # Proceso principal con manejadores IPC
│   ├── main.cjs            # Proceso principal compilado
│   ├── preload.ts          # Script de precarga para puente IPC
│   ├── preload.cjs         # Script de precarga compilado
│   ├── logger.ts           # Utilidad de registro
│   └── resources/          # Recursos de compilación
├── src/                    # Aplicación React
│   ├── main.tsx            # Punto de entrada
│   ├── App.tsx             # Componente raíz
│   ├── i18n/               # Internacionalización
│   │   ├── index.ts        # Configuración de i18n
│   │   └── locales/        # Archivos de traducción
│   │       ├── zh-CN.json
│   │       ├── en-US.json
│   │       ├── ja-JP.json
│   │       ├── ko-KR.json
│   │       ├── es-ES.json
│   │       ├── fr-FR.json
│   │       └── tr-TR.json
│   ├── components/         # Componentes reutilizables
│   │   ├── TitleBar.tsx    # Barra de título con selector de idioma
│   │   ├── Sidebar.tsx     # Barra lateral de navegación
│   │   ├── DeviceCard.tsx  # Componente de tarjeta de dispositivo
│   │   ├── FileManager.tsx # Diálogo de gestión de archivos
│   │   ├── CloseConfirmDialog.tsx  # Diálogo de confirmación de cierre
│   │   ├── UpdateDialog.tsx        # Diálogo de notificación de actualización
│   │   └── ui/             # Componentes estilo shadcn/ui
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       └── sonner.tsx
│   ├── pages/              # Componentes de página
│   │   ├── DevicePage.tsx  # Página de gestión de dispositivos
│   │   ├── DisplayPage.tsx # Página de configuración de pantalla
│   │   ├── EncodingPage.tsx    # Página de configuración de codificación
│   │   ├── ServerPage.tsx      # Página de configuración del servidor
│   │   ├── LogsPage.tsx        # Página de registros de la aplicación
│   │   └── AboutPage.tsx       # Página de acerca de
│   ├── store/              # Gestión de estado (Zustand)
│   │   └── deviceStore.ts  # Almacén de estado del dispositivo
│   ├── lib/                # Bibliotecas de utilidades
│   │   └── utils.ts        # Funciones de utilidad
│   ├── styles/             # Estilos CSS
│   │   └── index.css       # Estilos globales
│   ├── utils/              # Utilidades
│   │   └── electron.ts     # Puente de API de Electron
│   ├── types/              # Definiciones de tipo TypeScript
│   │   └── electron.d.ts   # Declaraciones de tipo de Electron
│   ├── assets/             # Activos estáticos
│   │   └── icon.png        # Icono de la aplicación
│   └── vite-env.d.ts       # Declaraciones de tipo de Vite
├── documents/              # Documentación de usuario (7 idiomas)
│   ├── en-US.md            # Guía de usuario en inglés
│   ├── zh-CN.md            # Guía de usuario en chino
│   ├── ja-JP.md            # Guía de usuario en japonés
│   ├── ko-KR.md            # Guía de usuario en coreano
│   ├── es-ES.md            # Guía de usuario en español
│   ├── fr-FR.md            # Guía de usuario en francés
│   └── tr-TR.md            # Guía de usuario en turco
├── images/                 # Capturas de pantalla y activos
│   └── iScrcpy.png         # Captura de pantalla de la interfaz principal
├── logs/                   # Registros de la aplicación
├── index.html              # Entrada HTML
├── package.json            # Dependencias
├── vite.config.ts          # Configuración de Vite
├── electron.vite.config.ts # Configuración de Electron Vite
├── tsconfig.json           # Configuración de TypeScript
└── forge.config.cjs        # Configuración de Electron Forge
```

## Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecutar en desarrollo

```bash
npm run dev
```

### 3. Modo de prueba (dispositivos simulados)

```bash
TEST=1 npm run dev
```

### 4. Compilar para producción

```bash
npm run build
```

Esto creará un instalador `.exe` en la carpeta `dist-win/`.

## Opciones de scrcpy

| Opción | Descripción |
|-----------------------------|------------------------------------|
| `--max-size=<n>` | Tamaño máximo de video |
| `--video-bit-rate=<n>` | Bitrate de video (Mbps) |
| `--max-fps=<n>` | Fotogramas máximos por segundo |
| `--video-codec=<c>` | Códec de video (h264, h265, av1) |
| `--audio-codec=<c>` | Códec de audio (opus, aac) |
| `--video-encoder=<name>` | Nombre del codificador de video específico |
| `--always-on-top` | Mantener ventana siempre encima |
| `--fullscreen` / `-f` | Iniciar en pantalla completa |
| `--stay-awake` | Mantener pantalla encendida |
| `--window-borderless` | Modo de ventana sin bordes |
| `--disable-screensaver` | Desactivar protector de pantalla |
| `--record=<file>` | Grabar pantalla en archivo |
| `--time-limit=<s>` | Límite de tiempo de grabación (segundos) |
| `--tunnel-forward` | Usar modo de túnel hacia adelante |
| `--no-cleanup` | No limpiar servidor al salir |

## Desarrollo

### Añadir nuevos idiomas

1. Crea un nuevo archivo de traducción en `src/i18n/locales/` (ej: `de-DE.json`)
2. Copia la estructura de un archivo de idioma existente
3. Traduce todas las cadenas de texto
4. Registra el idioma en `src/i18n/index.ts`:

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

### Usar traducciones en componentes

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

## Contribuciones

¡Las contribuciones son bienvenidas! No dudes en enviar un Pull Request.

### Formas de contribuir

- Reportar errores o sugerir funciones mediante GitHub Issues
- Añadir nuevas traducciones para idiomas adicionales
- Mejorar la documentación
- Enviar mejoras de código

## Agradecimientos

- [scrcpy](https://github.com/Genymobile/scrcpy) - La increíble herramienta de duplicación de Android
- [shadcn/ui](https://ui.shadcn.com/) - Inspiración para componentes de interfaz de usuario
- Todos los contribuidores y traductores

## Licencia

Apache License 2.0

Licenciado bajo la Licencia Apache, Versión 2.0 (la "Licencia");
no puedes usar este archivo excepto de conformidad con la Licencia.
Puedes obtener una copia de la Licencia en:

    http://www.apache.org/licenses/LICENSE-2.0

A menos que lo requiera la ley aplicable o se acuerde por escrito, el software
distribuido bajo la Licencia se distribuye "TAL CUAL",
SIN GARANTÍAS O CONDICIONES DE NINGÚN TIPO, ya sean expresas o implícitas.
Consulta la Licencia para conocer los permisos y limitaciones específicos.
