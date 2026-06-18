# Panduan Instalasi Manual VPS Ubuntu 22.04 (Tanpa Docker)

Dokumen ini menjelaskan langkah-langkah instalasi manual, dependensi, dan konfigurasi server VPS untuk deployment HalalCore (`halalcore.id`, `telemarketing.halalcore.id`, dan `api.halalcore.id`).

---

## Langkah 1: Update System & Install Tool Dasar

Jalankan perintah berikut untuk mengupdate daftar paket dan menginstal utilitas dasar:

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential unzip
```

---

## Langkah 2: Install Go (v1.25.4)

Backend HalalCore dibangun dengan Go. Lakukan instalasi Go secara manual:

```bash
# Download Go 1.25.4
wget https://go.dev/dl/go1.25.4.linux-amd64.tar.gz

# Ekstrak ke /usr/local
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.4.linux-amd64.tar.gz

# Hapus file tarball setelah diekstrak
rm go1.25.4.linux-amd64.tar.gz

# Tambahkan Go ke PATH (berlaku global untuk semua user)
echo 'export PATH=$PATH:/usr/local/go/bin' | sudo tee /etc/profile.d/go.sh
sudo chmod +x /etc/profile.d/go.sh

# Load PATH baru pada session saat ini
source /etc/profile.d/go.sh

# Verifikasi instalasi
go version
```

---

## Langkah 3: Install Node.js 22 LTS & npm

Node.js digunakan untuk membuild file statis frontend (Vite/React).

```bash
# Setup repositori NodeSource untuk Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verifikasi instalasi
node -v
npm -v
```

---

## Langkah 4: Install & Konfigurasi PostgreSQL

Database PostgreSQL diinstal langsung di VPS (host).

```bash
# Install PostgreSQL dan paket tambahan
sudo apt-get install -y postgresql postgresql-contrib

# Pastikan PostgreSQL aktif dan berjalan otomatis saat boot
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Buat user database baru
sudo -u postgres psql -c "CREATE USER ananahnu WITH PASSWORD 'ISI_DENGAN_PASSWORD_KUAT_ANDA';"

# Buat database dengan owner user baru tersebut
sudo -u postgres psql -c "CREATE DATABASE ananahnu OWNER ananahnu;"
```

---

## Langkah 5: Install Nginx & Certbot (SSL Let's Encrypt)

Nginx berfungsi sebagai web server untuk frontend statis dan reverse proxy untuk backend API Go.

```bash
# Install Nginx
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install Certbot untuk SSL otomatis
sudo apt-get install -y certbot python3-certbot-nginx
```

---

## Langkah 6: Konfigurasi Firewall (UFW)

Pastikan firewall mengizinkan akses SSH, HTTP, dan HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Langkah 7: Siapkan Struktur Direktori Aplikasi

Buat direktori untuk aplikasi backend, file upload, dan web static (frontend):

```bash
# Buat direktori aplikasi & upload backend
sudo mkdir -p /opt/halalcore/backend/uploads
sudo mkdir -p /opt/halalcore/backend/paymentproof
sudo mkdir -p /opt/halalcore/backend/consultant
sudo mkdir -p /opt/halalcore/backend/temp_docx
sudo mkdir -p /opt/halalcore/backend/templates

# Buat direktori web root untuk static files frontend
sudo mkdir -p /var/www/halalcore.id
sudo mkdir -p /var/www/telemarketing.halalcore.id
```

---

## Langkah 8: Buat System User untuk Keamanan Backend

Demi keamanan, backend Go tidak boleh dijalankan sebagai `root` atau `admin`. Buat user sistem khusus tanpa shell:

```bash
sudo useradd --system --no-create-home --shell /bin/false halalcore

# Ubah kepemilikan direktori backend ke user halalcore
sudo chown -R halalcore:halalcore /opt/halalcore/backend

# Ubah kepemilikan direktori static files ke user Nginx (www-data)
sudo chown -R www-data:www-data /var/www/halalcore.id
sudo chown -R www-data:www-data /var/www/telemarketing.halalcore.id
```

---

## Langkah 9: Konfigurasi DNS & SSL (Let's Encrypt)

1. Arahkan **A Record** dari subdomain Anda ke IP VPS Anda:
   - `halalcore.id` → `<IP_SERVER>`
   - `www.halalcore.id` → `<IP_SERVER>`
   - `api.halalcore.id` → `<IP_SERVER>`
   - `telemarketing.halalcore.id` → `<IP_SERVER>`

2. Dapatkan sertifikat SSL menggunakan Certbot setelah DNS mengarah ke IP Server:
   ```bash
   sudo certbot --nginx -d halalcore.id -d www.halalcore.id -d api.halalcore.id -d telemarketing.halalcore.id
   ```

---

## Langkah 10: Salin Konfigurasi Nginx & Deployment

Salin file konfigurasi Nginx dari repositori Anda ke `/etc/nginx/sites-available/` lalu buat symbolic link ke `sites-enabled/`. Setelah itu, Anda bisa menjalankan script `deploy/deploy.sh` untuk membuild dan mendeploy backend serta frontend Anda.
