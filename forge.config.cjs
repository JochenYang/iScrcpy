const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { VitePlugin } = require('@electron-forge/plugin-vite');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  // Main entry point for Electron
  entry: path.join(__dirname, 'electron', 'main.ts'),
  packagerConfig: {
    asar: true,
    name: 'iScrcpy',
    executableName: 'iScrcpy',
    appBundleId: 'com.iscrcpy.app',
    appCategoryType: 'public.app-category.productivity',
    protocols: [
      {
        name: 'iScrcpy Protocol',
        schemes: ['iscrcpy']
      }
    ]
  },
  rebuildConfig: {},
  makers: [
    // Windows Installer (NSIS)
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'iScrcpy',
        description: 'Android screen mirroring tool',
        authors: 'iScrcpy Contributors',
        iconUrl: 'https://raw.githubusercontent.com/JochenYang/iScrcpy/main/images/iScrcpy.png',
        setupIcon: './images/iScrcpy.png',
        remoteReleases: false,
        certificateFile: './certificates/windows.pfx',
        certificatePassword: process.env.WIN_CERTIFICATE_PASSWORD
      }
    },
    // macOS DMG/ZIP
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        name: 'iScrcpy',
        id: 'com.iscrcpy.app',
        productName: 'iScrcpy',
        appBundleId: 'com.iscrcpy.app',
        osxSign: {
          identity: '-',
          'hardened-runtime': true,
          entitlements: 'entitlements.plist',
          'entitlements-inherit': 'entitlements.plist',
          signature-flags: 'library'
        },
        osxNotarize: process.env.APPLE_ID_PASSWORD ? {
          appleId: process.env.APPLE_ID || process.env.APPLE_ID_EMAIL,
          appleIdPassword: process.env.APPLE_ID_PASSWORD,
          teamId: process.env.APPLE_TEAM_ID
        } : false
      }
    },
    // Linux DEB
    {
      name: '@electron-forge/maker-deb',
      config: {
        name: 'iscrcpy',
        productName: 'iScrcpy',
        genericName: 'Android Mirroring Tool',
        description: 'Android screen mirroring tool powered by scrcpy',
        authors: 'iScrcpy Contributors',
        section: 'utils',
        priority: 'optional',
        compression: 'gz',
        depends: [
          'libglib2.0-0',
          'libnss3',
          'libnspr4',
          'libatk1.0-0',
          'libatk-bridge2.0-0',
          'libdrm2',
          'libxkbcommon0',
          'libxcomposite1',
          'libxdamage1',
          'libxfixes3',
          'libxrandr2',
          'libgbm1',
          'libasound2'
        ]
      }
    },
    // Linux RPM
    {
      name: '@electron-forge/maker-rpm',
      config: {
        name: 'iscrcpy',
        productName: 'iScrcpy',
        genericName: 'Android Mirroring Tool',
        description: 'Android screen mirroring tool powered by scrcpy',
        license: 'Apache-2.0',
        requires: [
          'glib2',
          'nss',
          'atk',
          'at-spi2-atk',
          'drm',
          'libxkbcommon',
          'libXcomposite',
          'libXdamage',
          'libXfixes',
          'libXrandr',
          'gbm',
          'alsa-lib'
        ]
      }
    },
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds for Main process, Preload, etc.
      build: [
        {
          // Main process entry
          entry: path.join(__dirname, 'electron', 'main.ts'),
          target: 'main',
        },
        {
          // Preload script entry
          entry: path.join(__dirname, 'electron', 'preload.ts'),
          target: 'preload',
        },
      ],
      // `renderer` is the configuration that passed to Vite
      // for the renderer process - must be an array
      renderer: [
        {
          // The root directory of the renderer process
          root: path.join(__dirname, 'src'),
          // Window name - used for env var MAIN_WINDOW_VITE_DEV_SERVER_URL
          name: 'main_window',
          // Vite configuration
          server: {
            port: 5173,
          },
        },
      ],
    }),
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
