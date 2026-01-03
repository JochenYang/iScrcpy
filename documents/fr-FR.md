# Guide de l'utilisateur iScrcpy

iScrcpy est un outil de mise en miroir d'appareil Android basé sur [scrcpy](https://github.com/Genymobile/scrcpy), offrant une interface graphique simple et des options de personnalisation riches.

## Table des matières

- [Démarrage rapide](#démarrage-rapide)
- [Connexion des appareils](#connexion-des-appareils)
- [Paramètres d'affichage](#paramètres-daffichage)
- [Enregistrement](#enregistrement)
- [Paramètres de la fenêtre](#paramètres-de-la-fenêtre)
- [Mise en miroir de la caméra](#mise-en-miroir-de-la-caméra)
- [Paramètres d'encodage](#paramètres-dencodage)
- [FAQ](#faq)

---

## Démarrage rapide

### Configuration requise

- Windows 10/11
- Appareil Android 5.0+
- Débogage USB activé
- Connexion réseau WiFi

### Première utilisation

1. Téléchargez et installez iScrcpy
2. Connectez votre appareil Android à l'ordinateur
3. Autorisez le débogage USB sur votre appareil
4. Cliquez sur "Démarrer la mise en miroir" sur la carte de l'appareil

---

## Connexion des appareils

### Connexion USB

1. Connectez votre téléphone à l'ordinateur avec un cable USB
2. Appuyez sur "Autoriser" sur l'invite d'autorisation
3. L'appareil apparaîtra dans la liste des appareils USB
4. Cliquez sur "Démarrer la mise en miroir"

### Connexion WiFi

**Méthode 1: Utilisation du mode TCP/IP**

1. Connectez d'abord via USB
2. Cliquez sur "Activer WiFi" sur la carte de l'appareil
3. Attendez que l'adresse IP de l'appareil soit obtenue
4. Déconnectez le USB et utilisez la connexion WiFi

**Méthode 2: Connexion manuelle**

1. Assurez-vous que le téléphone et l'ordinateur sont sur le même réseau
2. Activez Options développeur → Débogage réseau sur votre téléphone
3. Cliquez sur "Ajouter un appareil WiFi"
4. Entrez l'adresse IP de l'appareil (ex: `192.168.1.100:5555`)

---

## Paramètres d'affichage

Allez dans l'onglet "Affichage" pour configurer:

### Paramètres vidéo

| Option | Description | Par défaut |
|--------|-------------|------------|
| Résolution maximale | Limite la taille vidéo maximale | 1080p |
| Débit vidéo | Qualité d'encodage vidéo (Mbps) | 8 Mbps |
| Fréquence d'images | Limite de fréquence d'images max | 60 fps |
| Vidéo activée | Activer/désactiver le flux vidéo | Activé |
| Audio activé | Activer/désactiver le flux audio | Activé |

### Paramètres de la fenêtre

| Option | Description |
|--------|-------------|
| Toujours au-dessus | Garder la fenêtre de mise en miroir au-dessus |
| Plein écran | Démarrer en mode plein écran |
| Garder éveillé | Garder l'écran de l'appareil allumé pendant la mise en miroir |
| Mode sans bordure | Masquer la barre de titre et les bordures de la fenêtre |
| Désactiver l'économiseur d'écran | Empêcher la veille et l'économiseur d'écran |

---

## Enregistrement

### Enregistrement de base

1. Cliquez sur le bouton d'enregistrement rouge sur la carte de l'appareil
2. Cliquez à nouveau pour arrêter l'enregistrement
3. Les vidéos sont enregistrées dans le dossier Téléchargements par défaut

### Enregistrement automatique

Dans "Affichage" → "Paramètres d'enregistrement":

| Option | Description |
|--------|-------------|
| Enregistrement auto | Démarrer automatiquement l'enregistrement à la connexion |
| Enregistrer l'audio | Enregistrer l'audio avec la vidéo |
| Chemin d'enregistrement | Emplacement de sauvegarde personnalisé |
| Limite de temps | Durée d'enregistrement limite (0 = illimité) |

### Formats d'enregistrement

- Prend en charge les formats MP4, MKV, WEBM
- Codec vidéo: H.264 / H.265 / AV1
- Codec audio: Opus / AAC

---

## Mise en miroir de la caméra

### Activer la mise en miroir de la caméra

1. Activez dans "Affichage" → "Paramètres de la caméra"
2. Sélectionnez la résolution et la fréquence d'images de la caméra
3. Cliquez sur le bouton caméra sur la carte de l'appareil

### Paramètres de la caméra

| Option | Description |
|--------|-------------|
| Résolution caméra | 640x480 ~ 3840x2160 |
| Fréquence d'images caméra | 15 ~ 120 fps |

---

## Paramètres d'encodage

Allez dans l'onglet "Encodage" pour les options avancées:

### Codec vidéo

| Codec | Description |
|-------|-------------|
| H.264 | Par défaut, meilleure compatibilité |
| H.265 | Compression plus élevée, nécessite la prise en charge de l'appareil |
| AV1 | Dernier codec, nécessite la prise en charge de l'appareil |

### Codec audio

| Codec | Description |
|-------|-------------|
| Opus | Par défaut, recommandé |
| AAC | Meilleure compatibilité |

### Mode de débit

| Mode | Description |
|------|-------------|
| VBR | Débit variable, fichiers plus petits |
| CBR | Débit constant, meilleure stabilité |

---

## Paramètres du serveur

Allez dans l'onglet "Serveur":

### Mode tunnel

- **Tunnel inverse (par défaut)**: Connexion via `adb reverse`
- **Tunnel direct**: Connexion via `adb forward`

### Nettoyage automatique

Lorsqu'il est activé, nettoie automatiquement les processus du serveur scrcpy lors de la déconnexion.

---

## FAQ

### Q: L'appareil ne répond pas?

1. Vérifiez si le cable USB prend en charge le transfert de données
2. Confirmez que le débogage USB est activé sur l'appareil
3. Essayez de reconnecter le cable USB
4. Vérifiez si les bons pilotes ADB sont installés

### Q: La mise en miroir est saccadée?

1. Réduisez la résolution maximale
2. Diminuez le débit vidéo
3. Abaissez la limite de fréquence d'images
4. Essayez d'utiliser le réseau WiFi 5GHz

### Q: Pas de son?

1. Vérifiez que l'audio est activé dans les paramètres "Affichage"
2. Vérifiez les paramètres de volume de l'ordinateur
3. Certains appareils peuvent ne pas prendre en charge la transmission audio

### Q: Fichier d'enregistrement corrompu?

1. Utilisez le bouton "Arrêter l'enregistrement" pour terminer normalement
2. Évitez la déconnexion forcée pendant l'enregistrement
3. iScrcpy tentera automatiquement de réparer les fichiers corrompus

### Q: Comment quitter le plein écran?

Appuyez sur le raccourci `MOD+f`, ou redémarrez la mise en miroir sans l'option plein écran.

---

## Raccourcis

| Raccourci | Fonction |
|-----------|----------|
| `MOD+f` | Basculer en plein écran |
| `MOD+Gauche/Droite` | Faire pivoter l'écran |
| `MOD+g` | Basculer l'écran noir |
| `MOD+r` | Basculer la rotation de l'appareil |
| `Ctrl+Clic+Glisser` | Simuler le clic droit |
| `Molette` | Simuler les boutons de volume |

---

## Support

- GitHub: [https://github.com/JochenYang/iScrcpy](https://github.com/JochenYang/iScrcpy)
- Rapport de problèmes: Veuillez soumettre via GitHub Issues

---

## Licence

Apache License 2.0
