# UPI QR Code Generator ⚡

A clean, minimal, and private website to generate instant UPI payment QR codes.

---

## ✨ Features

- **Ultra-clean UI**: Just enter a UPI ID to get a crisp, scannable QR code immediately.
- **No Clutter**: Stripped of all extra badges, logos, and unnecessary fields.
- **Instant Actions**:
  - **Download QR (PNG)**: Crisp, high-resolution QR image with clean margins.
  - **Copy UPI Link**: One-click copy of the standard `upi://pay?pa=...&cu=INR` deep link.
  - **Copy UPI ID**: Quick-copy button for the raw UPI ID.
- **URL Parameter Support**: Load any UPI directly via query string, e.g. `?upi=yourname@bank` or `?pa=yourname@bank`.
- **100% Client-Side & Private**: Uses local [`qrcode.min.js`](qrcode.min.js). Zero network requests, zero server dependencies.

---

## 🚀 Deploy to Vercel

1. Push or upload these files to a GitHub repository.
2. Import the repository in [vercel.com/new](https://vercel.com/new).
3. Click **Deploy** (framework preset: **Other**).

Your site will be live instantly!

---

## 📂 File Structure

```text
upi-qr-generator/
├── index.html        # Minimal semantic HTML5 interface
├── style.css         # Modern, clean minimalist styling
├── script.js         # Fast QR generation & export logic
├── qrcode.min.js     # Standalone local QR code generator
├── vercel.json       # Vercel deployment configuration
└── README.md         # Documentation
```
