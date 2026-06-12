# PrintDrop — Self-Service Printing Kiosk SaaS Platform

PrintDrop is a complete, production-ready, scalable self-service printing kiosk SaaS platform. It allows operators to deploy unlimited kiosk laptops connected to standard USB printers. Users scan a QR code, upload files, customize parameters, pay via UPI/Card, and under 60 seconds without staff presence.

---

## Technical Stack

- **Web Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + Custom CSS Variables
- **Database & Realtime**: Supabase (Postgres with Realtime Listeners)
- **Payment Processing**: Razorpay Node.js SDK + Checkout JS integration
- **Document Services**: `pdf-lib` for document page-count parsing
- **QR Generation**: `qrcode` library
- **Local Print Spooler**: Node.js Express server + `pdf-to-printer` native shell bridges

---

## Prerequisites

- Node.js 18 or higher installed on both server and kiosk nodes.
- A Supabase account and database project.
- A Razorpay account with live/test API keys.
- A USB/network printer connected to the kiosk machine.

---

## Quick Start Setup (Server Platform)

### 1. Install Dependencies
```bash
git clone https://github.com/your-username/print-drop.git
cd print-drop
npm install
```

### 2. Configure Database Tables
Copy the SQL codes from [schema.sql](file:///d:/print-drop/schema.sql) and paste them into your Supabase SQL Editor. Run the script to initialize tables, primary indices, default configurations, and service role bypass policies.

### 3. Setup Environment variables
Copy the template file to configure local keys:
```bash
cp .env.example .env.local
```
Fill in the values in `.env.local` using your Supabase credentials, Razorpay key ID, and Razorpay key secret.

### 4. Run Server Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to verify the landing marketing page.

---

## Kiosk Machine Setup (Local Spooler)

Ensure the laptop is connected to the printer via USB and is configured in your operating system as the default printer.

### 1. Initialize Print Agent
Go to the print server subdirectory, install dependencies, and run:
```bash
cd print-server
npm install
node index.js
```
The server will boot on `http://localhost:3001` and output a list of recognized printer drivers.

### 2. Startup Shell Launch
Configure permissions on the startup script and run:
```bash
# On Unix/macOS/Linux
chmod +x start-kiosk.sh
export KIOSK_ID=KIOSK_PAU_01
export APP_URL=https://your-printdrop-domain.vercel.app
./start-kiosk.sh
```

For **Windows platforms**, double click or run:
```cmd
:: Edit KIOSK_ID and APP_URL in start-kiosk.bat if needed, then run:
start-kiosk.bat
```
This launches Chrome in fullscreen kiosk mode, locked to the local terminal loop.

---

## Environment Variables Reference Table

| Variable Name | Purpose | Example / Format |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase endpoint url | `https://your-db.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public access key | `eyJhbGciOiJIUzI1NiIsInR5c...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin bypass key (Server only) | `eyJhbGciOiJIUzI1NiIsInR5c...` |
| `RAZORPAY_KEY_ID` | Razorpay checkout Key | `rzp_test_XXXXXXXXX` |
| `RAZORPAY_KEY_SECRET` | Secret key for verification signature | `yyyyyyyYYYYYYYzzzzzzzz` |
| `ADMIN_PASSWORD` | Access key for Super Admin dashboard | `your_secure_password_here` |
| `NEXT_PUBLIC_APP_URL` | Domain where server is hosted | `https://printdrop.co` |
| `CRON_SECRET` | Header validation token for cleanup crons | `cron_secret_uuid_token` |

---

## Adding a New Kiosk Installation

1. Navigate to the **Super Admin Panel** at `/admin/kiosks`.
2. Enter the administrator password (default `admin123` or your configured password).
3. Click **Add New Kiosk** in the top-right corner.
4. Input a unique **Kiosk ID** (e.g., `KIOSK_PAU_01`), a location name, and location details. Click Register.
5. In the next screen, click **Download QR Code** to download a print-quality QR code. Attach this QR code printout to the physical kiosk station.
6. Install and run the `start-kiosk` script on the kiosk machine using the registered `KIOSK_ID`.

---

## Troubleshooting Guide

### 1. Kiosk Screen displays "Kiosk Offline"
- Confirm the kiosk laptop is connected to active internet.
- Ensure the local Node.js print server is running on port 3001. Check the console for node-fetch or connectivity errors.
- Confirm the kiosk script is using the correct `KIOSK_ID` that matches the ID registered in your admin panel.

### 2. Print Code OTP entered, but fails to print
- Verify the USB printer is powered on and loaded with paper.
- Test document spooling by calling `GET http://localhost:3001/status` on the kiosk. It should list your printer name.
- Ensure your print-server console logs do not show download or pdf-to-printer permissions errors.

### 3. Razorpay Modal fails to open on Checkout
- Confirm you have populated `NEXT_PUBLIC_RAZORPAY_KEY_ID` in your `.env.local`.
- Check if you have internet connectivity. Razorpay requires loading dynamic scripts from `checkout.razorpay.com`.
