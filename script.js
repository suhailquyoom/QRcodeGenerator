/**
 * UPI QR Code Generator - Script
 * Compliant with standard NPCI UPI 2.0 specifications.
 */

// Bank / PSP Suffix Registry for Handle Recognition
const UPI_HANDLES = {
  // Google Pay
  "okaxis": "Axis Bank (GPay)",
  "okhdfcbank": "HDFC Bank (GPay)",
  "oksbi": "SBI (GPay)",
  "okicici": "ICICI Bank (GPay)",
  // PhonePe
  "ybl": "Yes Bank (PhonePe)",
  "ibl": "ICICI Bank (PhonePe)",
  "axl": "Axis Bank (PhonePe)",
  // Paytm
  "paytm": "Paytm Payments Bank",
  // BHIM & Banks
  "upi": "BHIM / NPCI",
  "icici": "ICICI iMobile",
  "hdfcbank": "HDFC Bank",
  "sbi": "SBI YONO",
  "barodampay": "Bank of Baroda",
  "pnb": "PNB One",
  "kotak": "Kotak 811",
  "indus": "IndusInd Bank",
  "federal": "Federal Bank",
  "rbl": "RBL Bank",
  "aubank": "AU Small Finance",
  "idfcfirst": "IDFC FIRST Bank",
  "airtel": "Airtel Payments Bank",
  "postbank": "India Post Payments",
  "apl": "Amazon Pay",
  "wa": "WhatsApp Pay",
  "jupiteraxis": "Jupiter",
  "slice": "Slice UPI",
  "naviaxis": "Navi UPI"
};

// State
let qrcodeInstance = null;
let debounceTimer = null;
let userManuallyEditedName = false;

// DOM Elements
const upiIdInput = document.getElementById("upiId");
const payeeNameInput = document.getElementById("payeeName");
const amountInput = document.getElementById("amount");
const txnNoteInput = document.getElementById("txnNote");
const bankBadge = document.getElementById("bankBadge");
const upiIdHelper = document.getElementById("upiIdHelper");

const qrcodeContainer = document.getElementById("qrcodeContainer");
const qrLoadingState = document.getElementById("qrLoadingState");

const previewPayeeName = document.getElementById("previewPayeeName");
const previewUpiId = document.getElementById("previewUpiId");
const previewAmountTag = document.getElementById("previewAmountTag");
const previewAmountText = document.getElementById("previewAmountText");
const previewNoteTag = document.getElementById("previewNoteTag");
const previewNoteText = document.getElementById("previewNoteText");
const rawUriText = document.getElementById("rawUriText");
const openIntentLink = document.getElementById("openIntentLink");

const generateBtn = document.getElementById("generateBtn");
const resetBtn = document.getElementById("resetBtn");
const downloadQrBtn = document.getElementById("downloadQrBtn");
const printStandeeBtn = document.getElementById("printStandeeBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const copyVpaBtn = document.getElementById("copyVpaBtn");
const clearAmountBtn = document.getElementById("clearAmountBtn");

const nameInfoModal = document.getElementById("nameInfoModal");
const openNameInfoBtn = document.getElementById("openNameInfoBtn");
const closeNameInfoBtn = document.getElementById("closeNameInfoBtn");
const gotItBtn = document.getElementById("gotItBtn");
const toast = document.getElementById("toast");

// Toast Utility
function showToast(message, duration = 2500) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, duration);
}

// Convert username format (e.g., "suhail.quyoom" or "rahul_sharma") to Title Case ("Suhail Quyoom")
function formatSuggestedName(raw) {
  if (!raw) return "";
  // If it's a mobile number, return empty
  if (/^\d{10}$/.test(raw)) return "";
  
  return raw
    .replace(/[._\-+]/g, " ")
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Identify Bank / PSP from UPI ID
function detectBankHandle(upiId) {
  if (!upiId || !upiId.includes("@")) {
    bankBadge.classList.add("hidden");
    return null;
  }

  const parts = upiId.trim().toLowerCase().split("@");
  if (parts.length < 2) {
    bankBadge.classList.add("hidden");
    return null;
  }

  const handle = parts[1];
  const detected = UPI_HANDLES[handle];

  if (detected) {
    bankBadge.textContent = "✓ " + detected;
    bankBadge.classList.remove("hidden");
  } else if (handle.length >= 3) {
    bankBadge.textContent = "UPI: @" + handle;
    bankBadge.classList.remove("hidden");
  } else {
    bankBadge.classList.add("hidden");
  }

  return detected;
}

// Validate UPI ID format
function isValidUpiId(upiId) {
  if (!upiId) return false;
  // UPI format: username@handle (standard RFC-compliant UPI regex)
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId.trim());
}

// Construct UPI URI Payload
function buildUpiUri() {
  const upiId = (upiIdInput.value || "").trim();
  const payeeName = (payeeNameInput.value || "").trim();
  const amount = (amountInput.value || "").trim();
  const note = (txnNoteInput.value || "").trim();

  if (!upiId) return "";

  const params = new URLSearchParams();
  params.set("pa", upiId);

  if (payeeName) {
    params.set("pn", payeeName);
  }

  if (amount && parseFloat(amount) > 0) {
    params.set("am", parseFloat(amount).toFixed(2));
  }

  params.set("cu", "INR");

  if (note) {
    params.set("tn", note);
  }

  return `upi://pay?${params.toString()}`;
}

// Render QR Code
function renderQrCode() {
  const upiUri = buildUpiUri();
  const upiId = (upiIdInput.value || "").trim();
  const payeeName = (payeeNameInput.value || "").trim();
  const amount = (amountInput.value || "").trim();
  const note = (txnNoteInput.value || "").trim();

  // Update Preview Card Text
  previewUpiId.textContent = upiId || "yourname@bank";
  previewPayeeName.textContent = payeeName || (upiId ? "Payee" : "Payee Name");

  // Update Amount Badge
  if (amount && parseFloat(amount) > 0) {
    previewAmountText.textContent = `₹${parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    previewAmountTag.classList.remove("hidden");
  } else {
    previewAmountTag.classList.add("hidden");
  }

  // Update Note Badge
  if (note) {
    previewNoteText.textContent = `"${note}"`;
    previewNoteTag.classList.remove("hidden");
  } else {
    previewNoteTag.classList.add("hidden");
  }

  // Update Raw URI Text & Intent link
  if (upiUri) {
    rawUriText.textContent = upiUri;
    openIntentLink.href = upiUri;
  } else {
    rawUriText.textContent = "upi://pay?pa=...";
    openIntentLink.href = "#";
  }

  // If no UPI ID is entered, display neutral placeholder state
  if (!upiId) {
    qrcodeContainer.innerHTML = `
      <div class="qr-placeholder-state">
        <svg class="qr-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
          <path d="M7 17h.01"></path>
          <path d="M17 17h.01"></path>
          <path d="M7 7h.01"></path>
          <path d="M17 7h.01"></path>
        </svg>
        <span class="qr-placeholder-text">Enter UPI ID above to generate QR code</span>
      </div>
    `;
    return;
  }

  // Generate QR Code using QRCode library
  if (!window.QRCode) {
    return;
  }

  // Clear previous QR
  qrcodeContainer.innerHTML = "";

  try {
    qrcodeInstance = new QRCode(qrcodeContainer, {
      text: upiUri,
      width: 210,
      height: 210,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch (err) {
    console.error("QR Code generation error:", err);
  }
}

// Debounced QR update
function scheduleQrUpdate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    renderQrCode();
  }, 120);
}

// Handle UPI ID Input Change
upiIdInput.addEventListener("input", () => {
  const upiVal = upiIdInput.value.trim();
  detectBankHandle(upiVal);

  // If user hasn't explicitly customized name yet, auto-suggest from UPI ID prefix
  if (!userManuallyEditedName && upiVal.includes("@")) {
    const userPrefix = upiVal.split("@")[0];
    const suggested = formatSuggestedName(userPrefix);
    if (suggested && !payeeNameInput.value) {
      payeeNameInput.value = suggested;
    }
  }

  // Validation feedback
  if (upiVal && !isValidUpiId(upiVal)) {
    upiIdHelper.innerHTML = `<span style="color:#dc2626;">Please check format: e.g. <code>username@bank</code></span>`;
  } else {
    upiIdHelper.innerHTML = `Standard UPI format: <code>username@bankhandle</code>`;
  }

  scheduleQrUpdate();
});

// Payee Name Input Change
payeeNameInput.addEventListener("input", () => {
  if (payeeNameInput.value.trim().length > 0) {
    userManuallyEditedName = true;
  }
  scheduleQrUpdate();
});

// Amount Input Change
amountInput.addEventListener("input", () => {
  scheduleQrUpdate();
});

// Txn Note Input Change
txnNoteInput.addEventListener("input", () => {
  scheduleQrUpdate();
});

// Quick Amount Chips
document.querySelectorAll(".amount-chip[data-amount]").forEach(chip => {
  chip.addEventListener("click", () => {
    amountInput.value = chip.getAttribute("data-amount");
    scheduleQrUpdate();
  });
});

clearAmountBtn.addEventListener("click", () => {
  amountInput.value = "";
  scheduleQrUpdate();
});

// Generate / Update Button
generateBtn.addEventListener("click", () => {
  if (!upiIdInput.value.trim()) {
    upiIdInput.focus();
    showToast("Please enter a UPI ID first");
    return;
  }
  renderQrCode();
  showToast("QR Code updated!");
});

// Reset Button - Clears all fields
resetBtn.addEventListener("click", () => {
  upiIdInput.value = "";
  payeeNameInput.value = "";
  amountInput.value = "";
  txnNoteInput.value = "";
  userManuallyEditedName = false;
  bankBadge.classList.add("hidden");
  upiIdHelper.innerHTML = `Standard UPI format: <code>username@bankhandle</code>`;
  renderQrCode();
  upiIdInput.focus();
  showToast("Form cleared");
});

// Copy UPI ID Button
copyVpaBtn.addEventListener("click", async () => {
  const upiId = (upiIdInput.value || "").trim();
  if (!upiId) {
    upiIdInput.focus();
    showToast("Please enter a UPI ID first");
    return;
  }

  try {
    await navigator.clipboard.writeText(upiId);
    showToast(`Copied UPI ID: ${upiId}`);
  } catch (err) {
    showToast("Failed to copy to clipboard");
  }
});

// Copy UPI Link Button
copyLinkBtn.addEventListener("click", async () => {
  const upiUri = buildUpiUri();
  if (!upiUri) {
    upiIdInput.focus();
    showToast("Please enter a UPI ID first");
    return;
  }

  try {
    await navigator.clipboard.writeText(upiUri);
    showToast("Copied UPI Payment Link to clipboard!");
  } catch (err) {
    showToast("Failed to copy link");
  }
});

// Print Standee Button
printStandeeBtn.addEventListener("click", () => {
  const upiId = (upiIdInput.value || "").trim();
  if (!upiId) {
    upiIdInput.focus();
    showToast("Please enter a UPI ID first");
    return;
  }
  window.print();
});

// Download QR as Branded PNG Image
downloadQrBtn.addEventListener("click", () => {
  const upiId = (upiIdInput.value || "").trim();
  if (!upiId) {
    upiIdInput.focus();
    showToast("Please enter a UPI ID first");
    return;
  }

  const qrCanvas = qrcodeContainer.querySelector("canvas");
  const qrImg = qrcodeContainer.querySelector("img");
  
  if (!qrCanvas && !qrImg) {
    showToast("Please generate a QR code first");
    return;
  }

  const payeeName = (payeeNameInput.value || "").trim() || "Payee";
  const amount = (amountInput.value || "").trim();

  // Create a high-res composite canvas
  const cardWidth = 600;
  const cardHeight = 780;
  const canvas = document.createElement("canvas");
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cardWidth, cardHeight);

  // Border
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#0f172a";
  ctx.strokeRect(16, 16, cardWidth - 32, cardHeight - 32);

  // Header Banner
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(16, 16, cardWidth - 32, 70);

  // Header Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BHARAT QR  •  UPI", cardWidth / 2, 58);

  // Scan & Pay Text
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 24px -apple-system, sans-serif";
  ctx.fillText("SCAN & PAY WITH ANY APP", cardWidth / 2, 130);

  // Function to draw QR and footer
  const finishDownload = (sourceImage) => {
    // QR Image Frame
    const qrSize = 340;
    const qrX = (cardWidth - qrSize) / 2;
    const qrY = 160;

    // Draw white background & border for QR
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

    // Draw QR Code
    ctx.drawImage(sourceImage, qrX, qrY, qrSize, qrSize);

    // Payee Name
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 28px -apple-system, sans-serif";
    ctx.fillText(payeeName, cardWidth / 2, 560);

    // UPI ID
    ctx.fillStyle = "#2563eb";
    ctx.font = "bold 20px monospace";
    ctx.fillText(upiId, cardWidth / 2, 596);

    // Amount (if any)
    if (amount && parseFloat(amount) > 0) {
      ctx.fillStyle = "#16a34a";
      ctx.font = "bold 22px -apple-system, sans-serif";
      ctx.fillText(`Amount: ₹${parseFloat(amount).toFixed(2)}`, cardWidth / 2, 632);
    }

    // Supported Apps Footer
    ctx.strokeStyle = "#cbd5e1";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(40, 670);
    ctx.lineTo(cardWidth - 40, 670);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 15px -apple-system, sans-serif";
    ctx.fillText("ACCEPTED: GOOGLE PAY • PHONEPE • PAYTM • BHIM • CRED", cardWidth / 2, 715);

    // Convert to PNG download
    const link = document.createElement("a");
    const cleanFileName = upiId.replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `UPI_QR_${cleanFileName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("Downloaded UPI QR Code as PNG!");
  };

  if (qrImg && qrImg.src && qrImg.src.startsWith("data:image")) {
    const img = new Image();
    img.onload = () => finishDownload(img);
    img.src = qrImg.src;
  } else if (qrCanvas && qrCanvas.width > 0) {
    finishDownload(qrCanvas);
  } else {
    showToast("Unable to export QR image");
  }
});

// Modal Event Listeners
openNameInfoBtn.addEventListener("click", () => {
  nameInfoModal.showModal();
});

closeNameInfoBtn.addEventListener("click", () => {
  nameInfoModal.close();
});

gotItBtn.addEventListener("click", () => {
  nameInfoModal.close();
});

nameInfoModal.addEventListener("click", (e) => {
  const rect = nameInfoModal.getBoundingClientRect();
  const isInDialog = (
    rect.top <= e.clientY &&
    e.clientY <= rect.top + rect.height &&
    rect.left <= e.clientX &&
    e.clientX <= rect.left + rect.width
  );
  if (!isInDialog) {
    nameInfoModal.close();
  }
});

// Initialize on Load
window.addEventListener("DOMContentLoaded", () => {
  // Start with clean, empty fields
  upiIdInput.value = "";
  payeeNameInput.value = "";
  amountInput.value = "";
  txnNoteInput.value = "";
  userManuallyEditedName = false;
  detectBankHandle("");
  renderQrCode();
  upiIdInput.focus();
});
