/**
 * Minimal & Clean UPI QR Code Generator
 */

const qrForm = document.getElementById("qrForm");
const upiIdInput = document.getElementById("upiId");
const amountInput = document.getElementById("amount");
const clearBtn = document.getElementById("clearBtn");
const clearAmountBtn = document.getElementById("clearAmountBtn");
const qrcodeBox = document.getElementById("qrcode");
const upiDisplay = document.getElementById("upiDisplay");
const upiText = document.getElementById("upiText");
const amountBadge = document.getElementById("amountBadge");
const copyUpiBtn = document.getElementById("copyUpiBtn");
const copyIcon = document.getElementById("copyIcon");
const checkIcon = document.getElementById("checkIcon");
const downloadBtn = document.getElementById("downloadBtn");
const toast = document.getElementById("toast");

let currentUpi = "";
let currentAmount = "";
let toastTimer = null;

// Show Toast Notification (Top floating banner)
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove("hidden");
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2400);
}

// Build standard UPI URI with optional amount (NPCI standard)
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
  if (clearAmountBtn) clearAmountBtn.classList.add("hidden");
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

// Sanitize amount: remove commas, currency symbols, extra spaces, keep only digits and 1 dot
function sanitizeAmount(raw) {
  if (!raw) return "";
  let clean = raw.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  if (parts.length > 2) {
    clean = parts[0] + "." + parts.slice(1).join("");
  }
  return clean;
}

// Amount input events: enable keyboard auto-suggest & clipboard paste
function handleAmountInput() {
  const sanitized = sanitizeAmount(amountInput.value);
  if (amountInput.value !== sanitized) {
    amountInput.value = sanitized;
  }
  if (amountInput.value.trim()) {
    clearAmountBtn.classList.remove("hidden");
  } else {
    clearAmountBtn.classList.add("hidden");
  }
}

amountInput.addEventListener("input", handleAmountInput);

amountInput.addEventListener("paste", (e) => {
  // Allow immediate paste from mobile keyboard suggestions or clipboard
  setTimeout(() => {
    handleAmountInput();
  }, 0);
});

clearAmountBtn.addEventListener("click", () => {
  amountInput.value = "";
  clearAmountBtn.classList.add("hidden");
  amountInput.focus();
});

// UPI ID input events
upiIdInput.addEventListener("input", () => {
  if (upiIdInput.value.trim()) {
    clearBtn.classList.remove("hidden");
  } else {
    clearBtn.classList.add("hidden");
  }
});

clearBtn.addEventListener("click", () => {
  upiIdInput.value = "";
  clearBtn.classList.add("hidden");
  upiIdInput.focus();
});

// Generate QR Code
function generateQr() {
  const upiId = upiIdInput.value.trim();
  const amtRaw = sanitizeAmount(amountInput.value.trim());

  if (!upiId) {
    upiIdInput.focus();
    showToast("Please enter a UPI ID");
    return;
  }

  // Validate format basic check
  if (!upiId.includes("@")) {
    showToast("Please enter a valid UPI ID (e.g. name@bank)");
    upiIdInput.focus();
    return;
  }

  currentUpi = upiId;
  const numAmt = parseFloat(amtRaw);
  currentAmount = (!isNaN(numAmt) && numAmt > 0) ? numAmt.toFixed(2) : "";

  const uri = getUpiUri(currentUpi, currentAmount);

  // Clear inputs right after generating so user gets clean boxes
  upiIdInput.value = "";
  amountInput.value = "";
  clearBtn.classList.add("hidden");
  clearAmountBtn.classList.add("hidden");

  // Display the generated UPI ID badge & amount badge (ABOVE the QR code)
  upiText.textContent = currentUpi;
  if (currentAmount) {
    const formatted = parseFloat(currentAmount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    amountBadge.textContent = `₹${formatted}`;
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
      showToast("Error generating QR Code");
    }
  }

  // Notice: Redundant "QR Code generated" black toast is deliberately removed!
  // The QR code appears right on screen without distracting black toast popups.
}

// Form submit
qrForm.addEventListener("submit", (e) => {
  e.preventDefault();
  generateQr();
});

// Copy raw UPI ID from the badge above QR
copyUpiBtn.addEventListener("click", async () => {
  if (!currentUpi) return;

  try {
    await navigator.clipboard.writeText(currentUpi);
    // Instant visual feedback on button
    if (copyIcon && checkIcon) {
      copyIcon.classList.add("hidden");
      checkIcon.classList.remove("hidden");
      setTimeout(() => {
        copyIcon.classList.remove("hidden");
        checkIcon.classList.add("hidden");
      }, 1500);
    }
    showToast(`Copied: ${currentUpi}`);
  } catch {
    showToast("Failed to copy UPI ID");
  }
});

// Cross-platform file download
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

// Download QR Code & reset
downloadBtn.addEventListener("click", () => {
  if (!currentUpi) return;

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

  triggerDownload(exportCanvas, filename);

  // Reset to fresh state for next QR
  resetToPlaceholder();
  upiIdInput.value = "";
  amountInput.value = "";
  clearBtn.classList.add("hidden");
  clearAmountBtn.classList.add("hidden");
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
