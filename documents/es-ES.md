# Guía del usuario de iScrcpy

iScrcpy es una herramienta de duplicación de dispositivos Android basada en [scrcpy](https://github.com/Genymobile/scrcpy), que proporciona una GUI limpia y opciones de personalización ricas.

## Tabla de contenidos

- [Inicio rápido](#inicio-rápido)
- [Conectar dispositivos](#conectar-dispositivos)
- [Configuración de pantalla](#configuración-de-pantalla)
- [Grabación](#grabación)
- [Configuración de ventana](#configuración-de-ventana)
- [Duplicación de cámara](#duplicación-de-cámara)
- [Configuración de codificación](#configuración-de-codificación)
- [Preguntas frecuentes](#preguntas-frecuentes)

---

## Inicio rápido

### Requisitos del sistema

- Windows 10/11
- Dispositivo Android 5.0+
- Depuración USB habilitada
- Conexión de red WiFi

### Primer uso

1. Descargue e instale iScrcpy
2. Conecte su dispositivo Android a la computadora
3. Autorice la depuración USB en su dispositivo
4. Haga clic en "Iniciar duplicación" en la tarjeta del dispositivo

---

## Conectar dispositivos

### Conexión USB

1. Conecte su teléfono a la computadora usando un cable USB
2. Toque "Permitir" en el aviso de autorización
3. El dispositivo aparecerá en la lista de dispositivos USB
4. Haga clic en "Iniciar duplicación"

### Conexión WiFi

**Método 1: Usar modo TCP/IP**

1. Primero conecte mediante USB
2. Haga clic en "Habilitar WiFi" en la tarjeta del dispositivo
3. Espere a que se obtenga la IP del dispositivo
4. Desconecte el USB y use la conexión WiFi

**Método 2: Conexión manual**

1. Asegúrese de que el teléfono y la computadora estén en la misma red
2. Habilite Opciones de desarrollador → Depuración de red en su teléfono
3. Haga clic en "Agregar dispositivo WiFi"
4. Ingrese la dirección IP del dispositivo (ej: `192.168.1.100:5555`)

---

## Configuración de pantalla

Vaya a la pestaña "Pantalla" para configurar:

### Configuración de video

| Opción | Descripción | Predeterminado |
|--------|-------------|----------------|
| Resolución máxima | Limitar tamaño máximo de video | 1080p |
| Bitrate de video | Calidad de codificación de video (Mbps) | 8 Mbps |
| Cuadros por segundo | Límite máximo de fps | 60 fps |
| Video activado | Alternar flujo de video | Activado |
| Audio activado | Alternar flujo de audio | Activado |

### Configuración de ventana

| Opción | Descripción |
|--------|-------------|
| Siempre encima | Mantener ventana de duplicación encima |
| Pantalla completa | Iniciar en modo pantalla completa |
| Mantener despierto | Mantener pantalla del dispositivo encendida durante duplicación |
| Modo sin bordes | Ocultar barra de título y bordes de ventana |
| Desactivar protector de pantalla | Evitar suspensión y protector de pantalla |

---

## Grabación

### Grabación básica

1. Haga clic en el botón de grabación rojo en la tarjeta del dispositivo
2. Haga clic nuevamente para detener la grabación
3. Los videos se guardan en la carpeta Descargas predeterminadamente

### Grabación automática

En "Pantalla" → "Configuración de grabación":

| Opción | Descripción |
|--------|-------------|
| Grabación automática | Iniciar grabación automáticamente al conectar |
| Grabar audio | Grabar audio junto con video |
| Ruta de guardado | Ubicación de guardado personalizada |
| Límite de tiempo | Límite de duración de grabación (0 = ilimitado) |

### Formatos de grabación

- Soporta formatos MP4, MKV, WEBM
- Códec de video: H.264 / H.265 / AV1
- Códec de audio: Opus / AAC

---

## Duplicación de cámara

### Habilitar duplicación de cámara

1. Habilite en "Pantalla" → "Configuración de cámara"
2. Seleccione la resolución y fps de la cámara
3. Haga clic en el botón de cámara en la tarjeta del dispositivo

### Configuración de cámara

| Opción | Descripción |
|--------|-------------|
| Resolución de cámara | 640x480 ~ 3840x2160 |
| Cuadros por segundo de cámara | 15 ~ 120 fps |

---

## Configuración de codificación

Vaya a la pestaña "Codificación" para opciones avanzadas:

### Códec de video

| Códec | Descripción |
|-------|-------------|
| H.264 | Predeterminado, mejor compatibilidad |
| H.265 | Mayor compresión, requiere soporte del dispositivo |
| AV1 | Códec más reciente, requiere soporte del dispositivo |

### Códec de audio

| Códec | Descripción |
|-------|-------------|
| Opus | Predeterminado, recomendado |
| AAC | Mejor compatibilidad |

### Modo de bitrate

| Modo | Descripción |
|------|-------------|
| VBR | Bitrate variable, archivos más pequeños |
| CBR | Bitrate constante, mejor estabilidad |

---

## Configuración del servidor

Vaya a la pestaña "Servidor":

### Modo de túnel

- **Túnel inverso (predeterminado)**: Conectar mediante `adb reverse`
- **Túnel directo**: Conectar mediante `adb forward`

### Limpieza automática

Cuando está habilitado, limpia automáticamente los procesos del servidor scrcpy al desconectar.

---

## Preguntas frecuentes

### P: ¿El dispositivo no responde?

1. Verifique si el cable USB soporta transferencia de datos
2. Confirme que la depuración USB esté habilitada en el dispositivo
3. Intente reconectar el cable USB
4. Verifique si los controladores ADB correctos están instalados

### P: ¿La duplicación está lenta?

1. Reduzca la resolución máxima
2. Disminuya el bitrate de video
3. Reduzca el límite de fps
4. Intente usar red WiFi de 5GHz

### P: ¿No hay sonido?

1. Verifique que el audio esté habilitado en la configuración de "Pantalla"
2. Revise la configuración de volumen de la computadora
3. Algunos dispositivos pueden no soportar transmisión de audio

### P: ¿Archivo de grabación corrupto?

1. Use el botón "Detener grabación" para finalizar normalmente
2. Evite desconectar forzosamente durante la grabación
3. iScrcpy intentará reparar automáticamente archivos corruptos

### P: ¿Cómo salir de pantalla completa?

Presione el atajo `MOD+f`, o reinicie la duplicación sin la opción de pantalla completa.

---

## Atajos de teclado

| Atajo | Función |
|-------|---------|
| `MOD+f` | Alternar pantalla completa |
| `MOD+Izquierda/Derecha` | Rotar pantalla |
| `MOD+g` | Alternar pantalla negra |
| `MOD+r` | Alternar rotación del dispositivo |
| `Ctrl+Clic+Arrastrar` | Simular clic derecho |
| `Rueda del ratón` | Simular botones de volumen |

---

## Soporte

- GitHub: [https://github.com/JochenYang/iScrcpy](https://github.com/JochenYang/iScrcpy)
- Informes de problemas: Envíe mediante GitHub Issues

---

## Licencia

Apache License 2.0
