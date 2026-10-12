/**
 * Instant Auto-Generating UPI QR Code Generator (Zero-Button + PWA)
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
const resetAllBtn = document.getElementById("resetAllBtn");
const installPwaBtn = document.getElementById("installPwaBtn");
const toast = document.getElementById("toast");

let currentUpi = "";
let currentAmount = "";
let lastRenderedUri = "";
let toastTimer = null;
let prevUpiVal = "";
let prevAmtVal = "";

// Show Toast Notification (Top floating banner)
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove("hidden");
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

// Check if string is a valid UPI ID (e.g. name@bank)
function isValidUpi(str) {
  if (!str) return false;
  return /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z0-9.\-_]{2,}$/.test(str.trim());
}

// Extract UPI ID from any text if present
function extractUpiId(str) {
  if (!str) return "";
  const match = str.match(/([a-zA-Z0-9.\-_]{2,}@[a-zA-Z0-9.\-_]{2,})/);
  return match ? match[1] : "";
}

// Sanitize amount: strip currency symbols, commas, spaces, keep digits and at most 1 decimal dot
function sanitizeAmount(raw) {
  if (!raw) return "";
  let clean = raw.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  if (parts.length > 2) {
    clean = parts[0] + "." + parts.slice(1).join("");
  }
  return clean;
}

// Check if a pasted string is purely a monetary amount (no '@' and reasonable P2P order range)
function isPureAmountString(str) {
  if (!str || str.includes("@")) return false;
  // Allow digits, commas, dots, spaces, and currency symbols (₹, Rs, INR)
  if (!/^[₹\s,0-9.rRsSiInN]+$/.test(str.trim())) return false;
  const numStr = sanitizeAmount(str);
  if (!numStr) return false;
  const val = parseFloat(numStr);
  // Ensure it's a valid positive amount and not a 10-digit mobile number (>= 1,000,000,000)
  return !isNaN(val) && val > 0 && val <= 10000000;
}

// Build standard NPCI UPI URI
function getUpiUri(upiId, amount) {
  let uri = `upi://pay?pa=${encodeURIComponent(upiId)}&cu=INR`;
  if (amount && parseFloat(amount) > 0) {
    uri += `&am=${parseFloat(amount).toFixed(2)}`;
  }
  return uri;
}

// Show placeholder when no valid UPI ID is present
function showPlaceholder() {
  currentUpi = "";
  currentAmount = "";
  lastRenderedUri = "";
  upiDisplay.classList.add("hidden");
  downloadBtn.disabled = true;
  if (resetAllBtn) resetAllBtn.classList.add("hidden");

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
      <span>Paste UPI ID above</span>
    </div>
  `;
}

// Wipe everything for the next Bybit order
function resetAll(focusUpi = true) {
  upiIdInput.value = "";
  amountInput.value = "";
  prevUpiVal = "";
  prevAmtVal = "";
  clearBtn.classList.add("hidden");
  clearAmountBtn.classList.add("hidden");
  showPlaceholder();
  if (focusUpi) {
    upiIdInput.focus();
  }
}

// Update clear buttons visibility
function syncClearButtons() {
  if (upiIdInput.value.trim()) {
    clearBtn.classList.remove("hidden");
  } else {
    clearBtn.classList.add("hidden");
  }

  if (amountInput.value.trim()) {
    clearAmountBtn.classList.remove("hidden");
  } else {
    clearAmountBtn.classList.add("hidden");
  }
}

// Live Auto-Generate QR Code
function updateLiveQr() {
  syncClearButtons();

  const upiRaw = upiIdInput.value.trim();
  const amtRaw = sanitizeAmount(amountInput.value.trim());

  if (!isValidUpi(upiRaw)) {
    showPlaceholder();
    return;
  }

  currentUpi = upiRaw;
  const numAmt = parseFloat(amtRaw);
  currentAmount = (!isNaN(numAmt) && numAmt > 0) ? numAmt.toFixed(2) : "";

  // Update Above-QR UPI & Exact Amount Badge
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
  if (resetAllBtn) resetAllBtn.classList.remove("hidden");

  const uri = getUpiUri(currentUpi, currentAmount);
  if (uri === lastRenderedUri) {
    return; // Already rendered this exact QR
  }
  lastRenderedUri = uri;

  qrcodeBox.innerHTML = "";
  if (window.QRCode) {
    try {
      new QRCode(qrcodeBox, {
        text: uri,
        width: 224,
        height: 224,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch (err) {
      console.error("QR Code generation error:", err);
    }
  }
}

// =========================================================================
// Smart Auto-Routing, Auto-Jump Cursor & Auto-Hide Keyboard
// =========================================================================

// 1. Handle UPI ID Box Input & Paste
upiIdInput.addEventListener("input", (e) => {
  const rawVal = upiIdInput.value;
  const delta = Math.abs(rawVal.length - prevUpiVal.length);
  const isBulkInsert =
    delta >= 2 ||
    (e && (e.inputType === "insertFromPaste" || e.inputType === "insertReplacementText"));

  if (isBulkInsert) {
    // Check if user pasted an Amount into the UPI box by mistake
    const newlyInserted = rawVal.replace(prevUpiVal, "").trim() || rawVal.trim();
    if (!rawVal.includes("@") && isPureAmountString(newlyInserted)) {
      const cleanAmt = sanitizeAmount(newlyInserted);
      amountInput.value = cleanAmt;
      prevAmtVal = cleanAmt;
      upiIdInput.value = prevUpiVal;
      updateLiveQr();

      if (isValidUpi(upiIdInput.value)) {
        upiIdInput.blur(); // Both filled -> hide keyboard
      } else {
        upiIdInput.focus(); // Keep waiting for UPI ID
      }
      return;
    }

    // Check if user pasted text containing a UPI ID
    const extractedUpi = extractUpiId(rawVal);
    if (extractedUpi) {
      // Check if the pasted text ALSO had an amount next to it (e.g. "name@ybl 1456.09")
      const remainder = rawVal.replace(extractedUpi, "").trim();
      if (remainder && isPureAmountString(remainder)) {
        const cleanAmt = sanitizeAmount(remainder);
        amountInput.value = cleanAmt;
        prevAmtVal = cleanAmt;
      }

      upiIdInput.value = extractedUpi;
      prevUpiVal = extractedUpi;
      updateLiveQr();

      // Auto-Jump to Amount if empty, or Auto-Hide keyboard if Amount is already filled
      if (!amountInput.value.trim()) {
        amountInput.focus();
      } else {
        upiIdInput.blur();
      }
      return;
    }
  }

  // Normal single-character typing
  upiIdInput.value = rawVal.replace(/\s+/g, "");
  prevUpiVal = upiIdInput.value;
  updateLiveQr();
});

upiIdInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (!amountInput.value.trim()) {
      amountInput.focus();
    } else {
      upiIdInput.blur();
    }
  }
});

// 2. Handle Amount Box Input & Paste
amountInput.addEventListener("input", (e) => {
  const rawVal = amountInput.value;
  const delta = Math.abs(rawVal.length - prevAmtVal.length);
  const isBulkInsert =
    delta >= 2 ||
    (e && (e.inputType === "insertFromPaste" || e.inputType === "insertReplacementText")) ||
    /[₹,\s]/.test(rawVal);

  // Check if user pasted a UPI ID (contains '@') into the Amount box by mistake
  if (rawVal.includes("@")) {
    const extractedUpi = extractUpiId(rawVal);
    if (extractedUpi) {
      upiIdInput.value = extractedUpi;
      prevUpiVal = extractedUpi;
    }
    const remainder = rawVal.replace(extractedUpi, "").trim();
    const cleanRem = isPureAmountString(remainder) ? sanitizeAmount(remainder) : prevAmtVal;
    amountInput.value = cleanRem;
    prevAmtVal = cleanRem;
    updateLiveQr();

    if (isValidUpi(upiIdInput.value) && amountInput.value.trim()) {
      amountInput.blur(); // Both filled -> hide keyboard
    } else if (!amountInput.value.trim()) {
      amountInput.focus();
    }
    return;
  }

  // Sanitize amount
  const sanitized = sanitizeAmount(rawVal);
  amountInput.value = sanitized;
  prevAmtVal = sanitized;
  updateLiveQr();

  // If this was a paste / Gboard chip tap:
  if (isBulkInsert && sanitized) {
    if (isValidUpi(upiIdInput.value)) {
      // Both UPI ID and Amount are now present -> Auto-hide keyboard!
      amountInput.blur();
    } else {
      // UPI ID is still empty -> Auto-jump cursor to UPI ID box!
      upiIdInput.focus();
    }
  }
});

amountInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (!isValidUpi(upiIdInput.value)) {
      upiIdInput.focus();
    } else {
      amountInput.blur();
    }
  }
});

// Clear Buttons
clearBtn.addEventListener("click", () => {
  upiIdInput.value = "";
  prevUpiVal = "";
  updateLiveQr();
  upiIdInput.focus();
});

clearAmountBtn.addEventListener("click", () => {
  amountInput.value = "";
  prevAmtVal = "";
  updateLiveQr();
  amountInput.focus();
});

if (resetAllBtn) {
  resetAllBtn.addEventListener("click", () => {
    resetAll(true);
  });
}

// Copy UPI ID from badge above QR
copyUpiBtn.addEventListener("click", async () => {
  if (!currentUpi) return;

  try {
    await navigator.clipboard.writeText(currentUpi);
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

// Download QR Code & immediately wipe both boxes for next Bybit order
downloadBtn.addEventListener("click", () => {
  if (!currentUpi) return;

  const source = qrcodeBox.querySelector("canvas") || qrcodeBox.querySelector("img");
  if (!source) {
    showToast("QR code not ready");
    return;
  }

  // Generate crisp 512x512 canvas with clean white quiet zone
  const size = 512;
  const padding = 40;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = size;
  exportCanvas.height = size;
  const ctx = exportCanvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(source, padding, padding, size - padding * 2, size - padding * 2);

  const cleanId = currentUpi.replace(/[^a-zA-Z0-9]/g, "_");
  const amtSuffix = currentAmount ? `-${currentAmount}` : "";
  const filename = `upi-qr-${cleanId}${amtSuffix}.png`;

  triggerDownload(exportCanvas, filename);

  // Reset everything clean for the next Bybit order
  resetAll(true);
});

// =========================================================================
// Fullscreen PWA Registration & Install Prompt
// =========================================================================
let deferredPrompt = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installPwaBtn) {
    installPwaBtn.classList.remove("hidden");
  }
});

if (installPwaBtn) {
  installPwaBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      installPwaBtn.classList.add("hidden");
    }
    deferredPrompt = null;
  });
}

window.addEventListener("appinstalled", () => {
  if (installPwaBtn) {
    installPwaBtn.classList.add("hidden");
  }
  deferredPrompt = null;
});

// Initialize on Load
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const upiFromUrl = params.get("upi") || params.get("pa");
  const amtFromUrl = params.get("am") || params.get("amount");

  if (upiFromUrl) {
    upiIdInput.value = upiFromUrl.trim();
    prevUpiVal = upiIdInput.value;
    if (amtFromUrl) {
      amountInput.value = sanitizeAmount(amtFromUrl.trim());
      prevAmtVal = amountInput.value;
    }
    updateLiveQr();
  } else {
    showPlaceholder();
    upiIdInput.focus();
  }
});
