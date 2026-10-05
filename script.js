/**
 * Minimal & Clean UPI QR Code Generator
 */

const qrForm = document.getElementById("qrForm");
const upiIdInput = document.getElementById("upiId");
const amountInput = document.getElementById("amount");
const clearBtn = document.getElementById("clearBtn");
const qrcodeBox = document.getElementById("qrcode");
const upiDisplay = document.getElementById("upiDisplay");
const upiText = document.getElementById("upiText");
const amountBadge = document.getElementById("amountBadge");
const copyUpiBtn = document.getElementById("copyUpiBtn");
const downloadBtn = document.getElementById("downloadBtn");
const toast = document.getElementById("toast");

let currentUpi = "";
let currentAmount = "";
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

// Build standard UPI URI with optional amount
function getUpiUri(upiId, amount) {
  let uri = `upi://pay?pa=${encodeURIComponent(upiId)}&cu=INR`;
  if (amount && parseFloat(amount) > 0) {
    uri += `&am=${parseFloat(amount).toFixed(2)}`;
  }
  return uri;
}

// Reset state to empty placeholder
function resetToPlaceholder() {
  currentUpi = "";
  currentAmount = "";
  clearBtn.classList.add("hidden");
  upiDisplay.classList.add("hidden");
  downloadBtn.disabled = true;

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

// Generate QR Code from inputs and clear the text boxes
function generateQr() {
  const upiId = upiIdInput.value.trim();
  const amt = amountInput.value.trim();

  if (!upiId) {
    upiIdInput.focus();
    showToast("Please enter a UPI ID");
    return;
  }

  currentUpi = upiId;
  currentAmount = (amt && parseFloat(amt) > 0) ? parseFloat(amt).toFixed(2) : "";

  const uri = getUpiUri(currentUpi, currentAmount);

  // Clear inputs right after generating so user gets clean boxes
  upiIdInput.value = "";
  amountInput.value = "";
  clearBtn.classList.add("hidden");

  // Display the generated UPI ID badge & amount badge
  upiText.textContent = currentUpi;
  if (currentAmount) {
    amountBadge.textContent = `₹${parseFloat(currentAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    amountBadge.classList.remove("hidden");
  } else {
    amountBadge.classList.add("hidden");
  }
  upiDisplay.classList.remove("hidden");
  downloadBtn.disabled = false;

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

// Form submit (clicking "Generate QR" or pressing Enter)
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

// Robust cross-platform file download for mobile & desktop
function triggerDownload(canvas, filename) {
  if (canvas.toBlob) {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = blobUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }, "image/png");
  } else {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = dataUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
    }, 1000);
  }
}

// Download QR Code & immediately reset to fresh site
downloadBtn.addEventListener("click", () => {
  if (!currentUpi) return;

  // Retrieve canvas or img element synchronously from container
  const source = qrcodeBox.querySelector("canvas") || qrcodeBox.querySelector("img");
  if (!source) {
    showToast("QR code not ready");
    return;
  }

  // Generate crisp 512x512 canvas with clean margins
  const size = 512;
  const padding = 40;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = size;
  exportCanvas.height = size;
  const ctx = exportCanvas.getContext("2d");

  // Pure white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Draw QR code centered
  ctx.drawImage(source, padding, padding, size - padding * 2, size - padding * 2);

  const cleanId = currentUpi.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `upi-qr-${cleanId}.png`;

  // Trigger mobile-safe download
  triggerDownload(exportCanvas, filename);

  // Immediately wipe the site clean to fresh state!
  resetToPlaceholder();
  upiIdInput.value = "";
  amountInput.value = "";
  clearBtn.classList.add("hidden");
  upiIdInput.focus();
  showToast("Downloaded! Screen cleared for next QR");
});

// Initialize on Load
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const upiFromUrl = params.get("upi") || params.get("pa");
  const amtFromUrl = params.get("am") || params.get("amount");

  if (upiFromUrl) {
    upiIdInput.value = upiFromUrl.trim();
    if (amtFromUrl) {
      amountInput.value = amtFromUrl.trim();
    }
    generateQr();
  } else {
    resetToPlaceholder();
    upiIdInput.focus();
  }
});
