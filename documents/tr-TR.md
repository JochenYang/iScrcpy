# iScrcpy Kullanıcı Kılavuzu

iScrcpy, temiz bir GUI ve zengin özelleştirme seçenekleri sunan [scrcpy](https://github.com/Genymobile/scrcpy) tabanlı bir Android cihaz yansıtma aracıdır.

## İçindekiler

- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Cihazları Bağlama](#cihazları-bağlama)
- [Görüntü Ayarları](#görüntü-ayarları)
- [Kayıt](#kayıt)
- [Pencere Ayarları](#pencere-ayarları)
- [Kamera Yansıtma](#kamera-yansıtma)
- [Kodlama Ayarları](#kodlama-ayarları)
- [SSS](#sss)

---

## Hızlı Başlangıç

### Sistem Gereksinimleri

- Windows 10/11
- Android 5.0+ cihaz
- USB hata ayıklama etkin
- WiFi ağ bağlantısı

### İlk Kullanım

1. iScrcpy'yi indirin ve kurun
2. Android cihazınızı bilgisayara bağlayın
3. Cihazınızda USB hata ayıklamayı yetkilendirin
4. Cihaz kartındaki "Yansıtmayı Başlat" düğmesine tıklayın

---

## Cihazları Bağlama

### USB Bağlantısı

1. Telefonunuzu USB kablosuyla bilgisayara bağlayın
2. Yetkilendirme isteminde "İzin Ver"e dokunun
3. Cihaz USB cihazları listesinde görünecektir
4. "Yansıtmayı Başlat"a tıklayın

### WiFi Bağlantısı

**Yöntem 1: TCP/IP Modu Kullanma**

1. Önce USB ile bağlanın
2. Cihaz kartındaki "WiFi Etkinleştir"e tıklayın
3. Cihaz IP'si alınana kadar bekleyin
4. USB'yi çıkarın ve WiFi bağlantısı kullanın

**Yöntem 2: Manuel Bağlantı**

1. Telefon ve bilgisayarın aynı ağda olduğundan emin olun
2. Telefonunuzda Geliştirici Seçenekleri → Ağ Hata Ayıklamayı etkinleştirin
3. "WiFi Cihazı Ekle"ye tıklayın
4. Cihaz IP adresini girin (örn: `192.168.1.100:5555`)

---

## Görüntü Ayarları

Yapılandırmak için "Görüntü" sekmesine gidin:

### Video Ayarları

| Seçenek | Açıklama | Varsayılan |
|---------|----------|------------|
| Maksimum Çözünürlük | Maksimum video boyutunu sınırla | 1080p |
| Video Bit Hızı | Video kodlama kalitesi (Mbps) | 8 Mbps |
| Kare Hızı | Maksimum kare hızı sınırı | 60 fps |
| Video Etkin | Video akışını aç/kapa | Açık |
| Ses Etkin | Ses akışını aç/kapa | Açık |

### Pencere Ayarları

| Seçenek | Açıklama |
|---------|----------|
| Her Zaman Üstte | Yansıtma penceresini üstte tut |
| Tam Ekran | Tam ekran modunda başlat |
| Uyanık Tut | Yansıtma sırasında cihaz ekranını açık tut |
| Kenarlıksız Mod | Pencere başlık çubuğu ve kenarlıkları gizle |
| Ekran Koruyucu Devre Dışı | Sistem uykusunu ve ekran koruyucuyu engelle |

---

## Kayıt

### Temel Kayıt

1. Cihaz kartındaki kırmızı kayıt düğmesine tıklayın
2. Kaydı durdurmak için tekrar tıklayın
3. Videolar varsayılan olarak İndirilenler klasörüne kaydedilir

### Otomatik Kayıt

"Görüntü" → "Kayıt Ayarları"nda:

| Seçenek | Açıklama |
|---------|----------|
| Otomatik Kayıt | Bağlandığında kaydı otomatik başlat |
| Sesi Kaydet | Video ile birlikte sesi kaydet |
| Kayıt Yolu | Özel kayıt konumu |
| Zaman Sınırı | Kayıt süre sınırı (0 = sınırsız) |

### Kayıt Formatları

- MP4, MKV, WEBM formatlarını destekler
- Video Codec: H.264 / H.265 / AV1
- Ses Codec: Opus / AAC

---

## Kamera Yansıtma

### Kamera Yansıtmayı Etkinleştir

1. "Görüntü" → "Kamera Ayarları"nda etkinleştir
2. Kamera çözünürlüğü ve kare hızı seçin
3. Cihaz kartındaki kamera düğmesine tıklayın

### Kamera Ayarları

| Seçenek | Açıklama |
|---------|----------|
| Kamera Çözünürlüğü | 640x480 ~ 3840x2160 |
| Kamera Kare Hızı | 15 ~ 120 fps |

---

## Kodlama Ayarları

Gelişmiş kodlama seçenekleri için "Kodlama" sekmesine gidin:

### Video Codec

| Codec | Açıklama |
|-------|----------|
| H.264 | Varsayılan, en iyi uyumluluk |
| H.265 | Daha yüksek sıkıştırma, cihaz desteği gerekli |
| AV1 | En son codec, cihaz desteği gerekli |

### Ses Codec

| Codec | Açıklama |
|-------|----------|
| Opus | Varsayılan, önerilir |
| AAC | Daha iyi uyumluluk |

### Bit Hızı Modu

| Mod | Açıklama |
|-----|----------|
| VBR | Değişken bit hızı, daha küçük dosyalar |
| CBR | Sabit bit hızı, daha iyi kararlılık |

---

## Sunucu Ayarları

"Sunucu" sekmesine gidin:

### Tünel Modu

- **Ters Tünel (varsayılan)**: `adb reverse` ile bağlan
- **İleri Tünel**: `adb forward` ile bağlan

### Otomatik Temizleme

Etkinleştirildiğinde, bağlantı kesildiğinde scrcpy sunucu süreçlerini otomatik temizler.

---

## SSS

### S: Cihaz yanıt vermiyor mu?

1. USB kablosunun veri aktarımını destekleyip desteklemediğini kontrol edin
2. Cihazda USB hata ayıklamanın etkin olduğunu onaylayın
3. USB kablosunu yeniden takmayı deneyin
4. Doğru ADB sürücülerinin yüklü olup olmadığını kontrol edin

### S: Yansıtma takılıyor mu?

1. Maksimum çözünürlüğü düşürün
2. Video bit hızını azaltın
3. Kare hızı sınırını düşürün
4. WiFi 5GHz ağı kullanmayı deneyin

### S: Ses yok mu?

1. "Görüntü" ayarlarında sesin etkin olduğunu kontrol edin
2. Bilgisayar ses ayarlarını kontrol edin
3. Bazı cihazlar ses iletimini desteklemeyebilir

### S: Kayıt dosyası bozuldu mu?

1. Kaydı normale sonlandırmak için "Kaydı Durdur" düğmesini kullanın
2. Kayıt sırasında zorla bağlantı kesmekten kaçının
3. iScrcpy bozulmuş dosyaları otomatik olarak onarmaya çalışacaktır

### S: Tam ekrandan nasıl çıkılır?

`MOD+f` kısayoluna basın veya tam ekran seçeneği olmadan yansıtmayı yeniden başlatın.

---

## Kısayollar

| Kısayol | İşlev |
|---------|-------|
| `MOD+f` | Tam ekran aç/kapa |
| `MOD+Sol/Sağ` | Ekranı döndür |
| `MOD+g` | Siyah ekran aç/kapa |
| `MOD+r` | Cihaz döngüsünü aç/kapa |
| `Ctrl+Tık+Sürükle` | Sağ tık simüle et |
| `Kaydırma tekerleği` | Ses düğmelerini simüle et |

---

## Destek

- GitHub: [https://github.com/JochenYang/iScrcpy](https://github.com/JochenYang/iScrcpy)
- Sorun bildirimi: Lütfen GitHub Issues üzerinden gönderin

---

## Lisans

Apache License 2.0
