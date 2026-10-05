/**
 * Minimal & Clean UPI QR Code Generator
 */

const qrForm = document.getElementById("qrForm");
const upiIdInput = document.getElementById("upiId");
const clearBtn = document.getElementById("clearBtn");
const qrcodeBox = document.getElementById("qrcode");
const upiDisplay = document.getElementById("upiDisplay");
const upiText = document.getElementById("upiText");
const copyUpiBtn = document.getElementById("copyUpiBtn");
const downloadBtn = document.getElementById("downloadBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const newQrBtn = document.getElementById("newQrBtn");
const toast = document.getElementById("toast");

let debounceTimer = null;
let toastTimer = null;

// Show Toast Notification
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove("hidden");
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

// Build standard UPI URI
function getUpiUri(upiId) {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&cu=INR`;
}

// Reset state to empty placeholder
function resetToPlaceholder() {
  clearBtn.classList.add("hidden");
  upiDisplay.classList.add("hidden");
  newQrBtn.classList.add("hidden");
  downloadBtn.disabled = true;
  copyLinkBtn.disabled = true;

  qrcodeBox.innerHTML = `
    <div class="placeholder">
      <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
        <path d="M7 17h.01"></path>
        <path d="M17 17h.01"></path>
        <path d="M7 7h.01"></path>
        <path d="M7 17h.01"></path>
      </svg>
      <span>Enter UPI ID above</span>
    </div>
  `;
}

// Render QR Code dynamically
function render() {
  const upiId = upiIdInput.value.trim();

  if (!upiId) {
    resetToPlaceholder();
    return;
  }

  clearBtn.classList.remove("hidden");
  upiText.textContent = upiId;
  upiDisplay.classList.remove("hidden");
  newQrBtn.classList.remove("hidden");
  downloadBtn.disabled = false;
  copyLinkBtn.disabled = false;

  const uri = getUpiUri(upiId);
  qrcodeBox.innerHTML = "";

  if (window.QRCode) {
    try {
      new QRCode(qrcodeBox, {
        text: uri,
        width: 216,
        height: 216,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (err) {
      console.error("QR Code generation error:", err);
    }
  }
}

// Form submit (e.g. pressing Enter or clicking "Generate")
qrForm.addEventListener("submit", (e) => {
  e.preventDefault();
  render();
  if (!upiIdInput.value.trim()) {
    upiIdInput.focus();
  }
});

// Real-time live generation as the user types
upiIdInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(render, 120);
});

// Auto-select text on click/focus so typing immediately replaces previous ID
upiIdInput.addEventListener("focus", () => {
  if (upiIdInput.value) {
    upiIdInput.select();
  }
});

// Clear button inside input
clearBtn.addEventListener("click", () => {
  upiIdInput.value = "";
  render();
  upiIdInput.focus();
});

// Generate for another UPI button
newQrBtn.addEventListener("click", () => {
  upiIdInput.value = "";
  render();
  upiIdInput.focus();
  showToast("Ready for new UPI ID");
});

// Copy raw UPI ID
copyUpiBtn.addEventListener("click", async () => {
  const upiId = upiIdInput.value.trim();
  if (!upiId) return;

  try {
    await navigator.clipboard.writeText(upiId);
    showToast(`Copied: ${upiId}`);
  } catch {
    showToast("Failed to copy");
  }
});

// Copy UPI payment link
copyLinkBtn.addEventListener("click", async () => {
  const upiId = upiIdInput.value.trim();
  if (!upiId) return;

  try {
    await navigator.clipboard.writeText(getUpiUri(upiId));
    showToast("Copied UPI payment link");
  } catch {
    showToast("Failed to copy link");
  }
});

// Download clean high-res PNG
downloadBtn.addEventListener("click", () => {
  const upiId = upiIdInput.value.trim();
  if (!upiId) return;

  const qrCanvas = qrcodeBox.querySelector("canvas");
  const qrImg = qrcodeBox.querySelector("img");

  const saveCanvas = (source) => {
    const size = 480;
    const padding = 40;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Clean white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Centered QR Code
    ctx.drawImage(source, padding, padding, size - padding * 2, size - padding * 2);

    // Save PNG
    const link = document.createElement("a");
    const cleanId = upiId.replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `upi-qr-${cleanId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("Downloaded QR Code");
  };

  if (qrImg && qrImg.src && qrImg.src.startsWith("data:image")) {
    const img = new Image();
    img.onload = () => saveCanvas(img);
    img.src = qrImg.src;
  } else if (qrCanvas && qrCanvas.width > 0) {
    saveCanvas(qrCanvas);
  }
});

// Initialize on Load
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const upiFromUrl = params.get("upi") || params.get("pa");
  if (upiFromUrl) {
    upiIdInput.value = upiFromUrl.trim();
  }
  render();
  upiIdInput.focus();
});
