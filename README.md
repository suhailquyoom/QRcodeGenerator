# UPI QR Code Generator ⚡

A lightweight, simple, and private website to generate instant, scannable UPI QR codes for any UPI ID (VPA) with custom Payee Name, optional fixed amounts, and transaction notes.

---

## ✨ Features

- **Instant QR Generation**: Type any UPI ID (e.g., `someone@okaxis`, `9876543210@paytm`, `user@ybl`) to get a high-contrast, scannable QR code in real-time.
- **Payee Name Support**: Encodes the Payee Name into the official UPI spec (`&pn=...`) and prints it clearly on the card.
- **Smart Bank / PSP Recognition**: Automatically detects and shows badges for Google Pay (`@okaxis`, `@oksbi`), PhonePe (`@ybl`, `@ibl`), Paytm (`@paytm`), BHIM (`@upi`), and major Indian banks.
- **Smart Name Auto-Fill**: Auto-extracts potential names from handle prefixes (e.g., `rahul.sharma@...` → "Rahul Sharma") to save typing.
- **Zero-Dependency & 100% Offline**: Uses a bundled local QR library (`qrcode.min.js`). No external API or internet connection required.
- **Download Branded Standee (PNG)**: One-click export of a store-ready payment card with Bharat QR/UPI header, QR code, payee name, UPI ID, and accepted app logos.
- **Print Ready Poster / Standee**: Formatted `@media print` layout so you can directly press "Print Standee" (or `Ctrl + P`) to print a clean counter poster for your shop, desk, or event.
- **Direct UPI Intent Testing**: On mobile devices, tap "Pay on Mobile" to test the link directly in installed apps.
- **Optional Amount & Notes**: Set fixed amounts (with quick chips for ₹100, ₹250, ₹500, ₹1000) or leave blank for open-amount payments.

---

## 🔒 Important Note on Bank Record Verification

Under National Payments Corporation of India (NPCI) and Reserve Bank of India (RBI) regulations:
- **Bank account holder records are protected for privacy:** Anonymous public websites are not permitted to scrape or look up private bank account records for arbitrary UPI IDs without regulated merchant KYC and API keys.
- **Real-Time Verification During Scan:** When a payer scans this generated QR code using **Google Pay, PhonePe, Paytm, BHIM, or Navi**, the scanning app automatically queries NPCI servers in real-time and displays the official, verified bank account holder name on the payer's screen before requiring their UPI PIN.

---

## 🚀 How to Run

No build step or installation required! Simply:

1. Double-click or open [`index.html`](file:///d:/Suhail%20Quyoom/upi-qr-generator/index.html) in any web browser (Google Chrome, Microsoft Edge, Firefox, Safari).
2. Enter your UPI ID and Payee Name.
3. Download the QR image or click **Print Standee** to print.

---

## 📂 File Structure

```text
upi-qr-generator/
├── index.html        # Main semantic HTML5 interface
├── style.css         # Modern styling and print layout (@media print)
├── script.js         # QR generation, bank detection, and canvas export logic
├── qrcode.min.js     # Standalone local QR code generator library
└── README.md         # Documentation
```
