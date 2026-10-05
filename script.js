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
const generateAnotherBtn = document.getElementById("generateAnotherBtn");
const toast = document.getElementById("toast");

let currentUpi = "";
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
  currentUpi = "";
  clearBtn.classList.add("hidden");
  upiDisplay.classList.add("hidden");
  downloadBtn.disabled = true;
  generateAnotherBtn.disabled = true;

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

// Generate QR Code from input and clear the text box
function generateQr() {
  const upiId = upiIdInput.value.trim();

  if (!upiId) {
    upiIdInput.focus();
    showToast("Please enter a UPI ID");
    return;
  }

  currentUpi = upiId;
  const uri = getUpiUri(currentUpi);

  // Clear the input text box as requested after generating QR
  upiIdInput.value = "";
  clearBtn.classList.add("hidden");

  // Display the generated UPI ID badge & enable actions
  upiText.textContent = currentUpi;
  upiDisplay.classList.remove("hidden");
  downloadBtn.disabled = false;
  generateAnotherBtn.disabled = false;

  // Render QR Code
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

  showToast("QR Code generated");
}

// Form submit (clicking "Generate" or pressing Enter)
qrForm.addEventListener("submit", (e) => {
  e.preventDefault();
  generateQr();
});

// Show/hide clear button as user types
upiIdInput.addEventListener("input", () => {
  if (upiIdInput.value.trim()) {
    clearBtn.classList.remove("hidden");
  } else {
    clearBtn.classList.add("hidden");
  }
});

// Clear button inside input
clearBtn.addEventListener("click", () => {
  upiIdInput.value = "";
  clearBtn.classList.add("hidden");
  upiIdInput.focus();
});

// "Generate Another" button: resets QR preview and focuses input
generateAnotherBtn.addEventListener("click", () => {
  resetToPlaceholder();
  upiIdInput.value = "";
  clearBtn.classList.add("hidden");
  upiIdInput.focus();
  showToast("Enter new UPI ID");
});

// Copy raw UPI ID from the badge below QR
copyUpiBtn.addEventListener("click", async () => {
  if (!currentUpi) return;

  try {
    await navigator.clipboard.writeText(currentUpi);
    showToast(`Copied: ${currentUpi}`);
  } catch {
    showToast("Failed to copy");
  }
});

// Download clean high-res PNG
downloadBtn.addEventListener("click", () => {
  if (!currentUpi) return;

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
    const cleanId = currentUpi.replace(/[^a-zA-Z0-9]/g, "_");
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
    generateQr();
  } else {
    resetToPlaceholder();
    upiIdInput.focus();
  }
});
