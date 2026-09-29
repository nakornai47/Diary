# Diary Sync Server

เซิร์ฟเวอร์ซิงค์ข้อมูลส่วนตัวสำหรับแอป Diary ใช้รันภายในเครือข่าย Tailscale ของคุณเอง

## ความต้องการ

- Node.js 18+
- Tailscale ติดตั้งและเข้าสู่ระบบบนอุปกรณ์ที่จะรันเซิร์ฟเวอร์
- อุปกรณ์ที่ใช้แอปต้องอยู่ใน Tailnet เดียวกัน

## ติดตั้ง

```bash
cd server
npm install
```

## ตั้งค่า

คัดลอกไฟล์ตัวอย่างและแก้ไขค่า:

```bash
cp .env.example .env
```

แก้ไข `.env`:

```env
SYNC_API_KEY=your-strong-secret-key
PORT=3456
DATA_DIR=./data
ALLOWED_ORIGINS=*
```

- `SYNC_API_KEY` — ตั้งค่า API key ยาวอย่างน้อย 8 ตัวอักษร แล้วนำไปใส่ในแอปที่ตั้งค่า Sync
- `PORT` — พอร์ตที่เซิร์ฟเวอร์รัน (ค่าเริ่มต้น 3456)
- `DATA_DIR` — โฟลเดอร์เก็บไฟล์ `sync-data.json`
- `ALLOWED_ORIGINS` — origin ที่อนุญาตผ่าน CORS ใช้ `*` เมื่อทดสอบ หรือระบุ origin ของ GitHub Pages

## รันด้วย ts-node (สำหรับพัฒนา)

```bash
npm run dev
```

## build และรันจริง

```bash
npm run build
npm start
```

## รันด้วย systemd (Linux)

สร้างไฟล์ `/etc/systemd/system/diary-sync.service`:

```ini
[Unit]
Description=Diary Sync Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Diary/server
Environment="SYNC_API_KEY=your-strong-secret-key"
Environment="PORT=3456"
Environment="DATA_DIR=/path/to/Diary/server/data"
ExecStart=/usr/bin/node /path/to/Diary/server/dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

จากนั้น:

```bash
sudo systemctl daemon-reload
sudo systemctl enable diary-sync
sudo systemctl start diary-sync
sudo systemctl status diary-sync
```

## รันด้วย PM2

```bash
npm install -g pm2
pm2 start dist/index.js --name diary-sync --env SYNC_API_KEY=your-strong-secret-key
pm2 save
pm2 startup
```

## ตั้งค่าในแอป

1. หา IP ของอุปกรณ์ที่รันเซิร์ฟเวอร์ใน Tailscale (เช่น `100.x.x.x`)
2. เปิดแอป → ตั้งค่า → ซิงค์ข้อมูล (Tailscale)
3. ใส่ Server URL: `http://100.x.x.x:3456`
4. ใส่ API Key ตามที่ตั้งไว้ใน `SYNC_API_KEY`
5. กด "ทดสอบการเชื่อมต่อ" แล้วเปิดใช้งานการซิงค์

## จุดยึดข้อมูล

- ข้อมูลจัดเก็บในไฟล์ JSON เดียว (`data/sync-data.json`)
- เขียนไฟล์แบบ atomic (temp file + rename) พร้อม rolling backups
- การแก้ไขชนกันใช้ Last-Write-Wins ตาม `updatedAt`
- การลบใช้ tombstones เพื่อเผยแพร่การลบไปยังอุปกรณ์อื่น

## ความปลอดภัย

- ทุก request ต้องส่ง `Authorization: Bearer <SYNC_API_KEY>`
- Tailscale จัดการเข้ารหัสขนส่งและควบคุมการเข้าถึงระดับ node อยู่แล้ว
- ห้ามเปิดเผย API key หรือพอร์ตเซิร์ฟเวอร์สู่อินเทอร์เน็ตสาธารณะโดยตรง
