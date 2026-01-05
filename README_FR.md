<div align="center">
  <img src="images/logo.png" alt="iScrcpy Logo" width="120" height="120">

  # iScrcpy

  **Outil de mise en miroir d'appareil Android basé sur scrcpy**

  [![Windows](https://img.shields.io/badge/Windows-0078D4?style=flat-square&logo=windows&logoColor=white)](#)
  [![macOS](https://img.shields.io/badge/macOS-000000?style=flat-square&logo=apple)](#)
  [![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black)](#)
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat-square)](#)
  [![Version](https://img.shields.io/badge/Version-1.0.9-blue?style=flat-square)](#)

  [English](README.md) | [简体中文](README_CN.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Español](README_ES.md) | [Français](README_FR.md) | [Türkçe](README_TR.md)
</div>

---

![Interface iScrcpy](images/iScrcpy.png)

## Fonctionnalités

- **Support multilingue**: 7 langues (chinois, anglais, japonais, coréen, espagnol, français, turc)
- **Gestion des appareils**: Scanner et connecter des appareils USB/WiFi avec surveillance en temps réel
- **Paramètres d'affichage**: Personnaliser la résolution, le bitrate, les fps, les options de fenêtre, la limite de temps d'enregistrement
- **Options de fenêtre**: Mode sans bordures, désactiver l'économiseur d'écran, toujours au-dessus, plein écran
- **Enregistrement**: Enregistrement automatique, limite de temps, chemin de sauvegarde personnalisé
- **Mise en miroir de la caméra**: Mettre en miroir la caméra de l'appareil au lieu de l'écran
- **Paramètres d'encodage**: Configurer les codecs vidéo/audio et le mode de bitrate
- **Configuration du serveur**: Gérer les chemins du serveur scrcpy et les paramètres ADB
- **Natif Windows**: Fenêtre personnalisée avec boutons réduire/agrandir/fermer
- **Thème sombre**: IU moderne sombre inspirée de shadcn/ui

## Pile technologique

- **React 18** - Framework d'interface utilisateur
- **Vite 5** - Outil de construction
- **Electron 28** - Runtime de bureau
- **TypeScript** - Sécurité des types
- **i18next** - Internationalisation
- **Zustand** - Gestion d'état
- **Electron Builder** - Génération d'installateurs

## Langues prises en charge

iScrcpy est disponible en 7 langues:

| Langue | Code | Nom natif |
|--------|------|-----------|
| English | `en-US` | English |
| 简体中文 | `zh-CN` | 简体中文 |
| 日本語 | `ja-JP` | 日本語 |
| 한국어 | `ko-KR` | 한국어 |
| Español | `es-ES` | Español |
| Français | `fr-FR` | Français |
| Türkçe | `tr-TR` | Türkçe |

La langue peut être modifiée via le sélecteur de langue dans la barre de titre (à côté du bouton réduire).

## Documentation

Guides utilisateur détaillés disponibles en 7 langues:

| Langue | Document |
|--------|----------|
| English | [documents/en-US.md](documents/en-US.md) |
| 简体中文 | [documents/zh-CN.md](documents/zh-CN.md) |
| 日本語 | [documents/ja-JP.md](documents/ja-JP.md) |
| 한국어 | [documents/ko-KR.md](documents/ko-KR.md) |
| Español | [documents/es-ES.md](documents/es-ES.md) |
| Français | [documents/fr-FR.md](documents/fr-FR.md) |
| Türkçe | [documents/tr-TR.md](documents/tr-TR.md) |

### Liens rapides (Français)

- [Démarrage rapide](documents/fr-FR.md#démarrage-rapide)
- [Connexion des appareils](documents/fr-FR.md#connexion-des-appareils)
- [Paramètres d'affichage](documents/fr-FR.md#paramètres-daffichage)
- [Enregistrement](documents/fr-FR.md#enregistrement)
- [Mise en miroir de la caméra](documents/fr-FR.md#mise-en-miroir-de-la-caméra)
- [FAQ](documents/fr-FR.md#faq)

## Structure du projet

```text
iScrcpy/
├── app/                    # Binaires scrcpy et dépendances
│   ├── win/                # Binaires Windows
│   │   ├── scrcpy.exe      # Exécutable scrcpy
│   │   ├── scrcpy-server   # Serveur scrcpy jar
│   │   ├── adb.exe         # Exécutable ADB
│   │   ├── SDL2.dll        # Bibliothèque SDL2
│   │   └── *.dll           # DLL requises (avcodec, avformat, etc.)
│   ├── mac/                # Binaires macOS
│   │   ├── scrcpy
│   │   ├── scrcpy-server
│   │   ├── adb
│   │   └── scrcpy.1        # Page de manuel
│   └── linux/              # Binaires Linux
│       ├── scrcpy
│       ├── scrcpy-server
│       ├── adb
│       └── scrcpy.1        # Page de manuel
├── electron/               # Processus principal Electron
│   ├── main.ts             # Processus principal avec gestionnaires IPC
│   ├── main.cjs            # Processus principal compilé
│   ├── preload.ts          # Script de préchargement pour pont IPC
│   ├── preload.cjs         # Script de préchargement compilé
│   ├── logger.ts           # Utilitaire de journalisation
│   └── resources/          # Ressources de construction
├── src/                    # Application React
│   ├── main.tsx            # Point d'entrée
│   ├── App.tsx             # Composant racine
│   ├── i18n/               # Internationalisation
│   │   ├── index.ts        # Configuration i18n
│   │   └── locales/        # Fichiers de traduction
│   │       ├── zh-CN.json
│   │       ├── en-US.json
│   │       ├── ja-JP.json
│   │       ├── ko-KR.json
│   │       ├── es-ES.json
│   │       ├── fr-FR.json
│   │       └── tr-TR.json
│   ├── components/         # Composants réutilisables
│   │   ├── TitleBar.tsx    # Barre de titre avec sélecteur de langue
│   │   ├── Sidebar.tsx     # Barre latérale de navigation
│   │   ├── DeviceCard.tsx  # Composant carte d'appareil
│   │   ├── FileManager.tsx # Dialogue de gestion de fichiers
│   │   ├── CloseConfirmDialog.tsx  # Dialogue de confirmation de fermeture
│   │   ├── UpdateDialog.tsx        # Dialogue de notification de mise à jour
│   │   └── ui/             # Composants style shadcn/ui
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       └── sonner.tsx
│   ├── pages/              # Composants de page
│   │   ├── DevicePage.tsx  # Page de gestion des appareils
│   │   ├── DisplayPage.tsx # Page de paramètres d'affichage
│   │   ├── EncodingPage.tsx    # Page de paramètres d'encodage
│   │   ├── ServerPage.tsx      # Page de configuration du serveur
│   │   ├── LogsPage.tsx        # Page des journaux de l'application
│   │   └── AboutPage.tsx       # Page À propos
│   ├── store/              # Gestion d'état (Zustand)
│   │   └── deviceStore.ts  # Stockage d'état de l'appareil
│   ├── lib/                # Bibliothèques utilitaires
│   │   └── utils.ts        # Fonctions utilitaires
│   ├── styles/             # Styles CSS
│   │   └── index.css       # Styles globaux
│   ├── utils/              # Utilitaires
│   │   └── electron.ts     # Pont API Electron
│   ├── types/              # Définitions de type TypeScript
│   │   └── electron.d.ts   # Déclarations de type Electron
│   ├── assets/             # Actifs statiques
│   │   └── icon.png        # Icône de l'application
│   └── vite-env.d.ts       # Déclarations de type Vite
├── documents/              # Documentation utilisateur (7 langues)
│   ├── en-US.md            # Guide utilisateur en anglais
│   ├── zh-CN.md            # Guide utilisateur en chinois
│   ├── ja-JP.md            # Guide utilisateur en japonais
│   ├── ko-KR.md            # Guide utilisateur en coréen
│   ├── es-ES.md            # Guide utilisateur en espagnol
│   ├── fr-FR.md            # Guide utilisateur en français
│   └── tr-TR.md            # Guide utilisateur en turc
├── images/                 # Captures d'écran et actifs
│   └── iScrcpy.png         # Capture d'écran de l'interface principale
├── logs/                   # Journaux de l'application
├── index.html              # Entrée HTML
├── package.json            # Dépendances
├── vite.config.ts          # Configuration Vite
├── electron.vite.config.ts # Configuration Electron Vite
├── tsconfig.json           # Configuration TypeScript
└── forge.config.cjs        # Configuration Electron Forge
```

## Démarrage rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Exécuter en développement

```bash
npm run dev
```

### 3. Mode de test (appareils fictifs)

```bash
TEST=1 npm run dev
```

### 4. Compiler pour la production

```bash
npm run build
```

Cela créera un installeur `.exe` dans le dossier `dist-win/`.

## Options scrcpy

| Option | Description |
|-----------------------------|------------------------------------|
| `--max-size=<n>` | Taille vidéo maximale |
| `--video-bit-rate=<n>` | Bitrate vidéo (Mbps) |
| `--max-fps=<n>` | Images par seconde maximales |
| `--video-codec=<c>` | Codec vidéo (h264, h265, av1) |
| `--audio-codec=<c>` | Codec audio (opus, aac) |
| `--video-encoder=<name>` | Nom de l'encodeur vidéo spécifique |
| `--always-on-top` | Garder la fenêtre au-dessus |
| `--fullscreen` / `-f` | Démarrer en plein écran |
| `--stay-awake` | Garder l'écran allumé |
| `--window-borderless` | Mode fenêtre sans bordures |
| `--disable-screensaver` | Désactiver l'économiseur d'écran |
| `--record=<file>` | Enregistrer l'écran dans un fichier |
| `--time-limit=<s>` | Limite de temps d'enregistrement (secondes) |
| `--tunnel-forward` | Utiliser le mode tunnel vers l'avant |
| `--no-cleanup` | Ne pas nettoyer le serveur à la sortie |

## Développement

### Ajouter de nouvelles langues

1. Créez un nouveau fichier de traduction dans `src/i18n/locales/` (ex: `de-DE.json`)
2. Copiez la structure d'un fichier de langue existant
3. Traduisez toutes les chaînes de texte
4. Enregistrez la langue dans `src/i18n/index.ts`:

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

### Utiliser les traductions dans les composants

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

## Contributions

Les contributions sont les bienvenues! N'hésitez pas à soumettre une Pull Request.

### Façons de contribuer

- Signaler des bugs ou suggérer des fonctionnalités via GitHub Issues
- Ajouter de nouvelles traductions pour des langues supplémentaires
- Améliorer la documentation
- Soumettre des améliorations de code

## Remerciements

- [scrcpy](https://github.com/Genymobile/scrcpy) - L'incroyable outil de mise en miroir Android
- [shadcn/ui](https://ui.shadcn.com/) - Inspiration pour les composants d'interface utilisateur
- Tous les contributeurs et traducteurs

## Licence

Apache License 2.0

Licencié sous la Licence Apache, Version 2.0 (la "Licence");
vous ne pouvez pas utiliser ce fichier sauf en conformité avec la Licence.
Vous pouvez obtenir une copie de la Licence à:

    http://www.apache.org/licenses/LICENSE-2.0

Sauf si requis par la loi applicable ou convenu par écrit, le logiciel
distribué sous la Licence est distribué "TEL QUEL",
SANS GARANTIES OU CONDITIONS DE QUELQUE NATURE QUE CE SOIT, expresses ou implicites.
Voir la Licence pour les autorisations et limitations spécifiques.
