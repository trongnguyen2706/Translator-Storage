function createTooltip() {
  const existing = document.getElementById("vocal-tooltip");
  if (existing) return existing;

  const tooltip = document.createElement("div");
  tooltip.id = "vocal-tooltip";
  tooltip.style.cssText = `
    position: absolute;
    z-index: 2147483647;
    background: #1e1e2e;
    color: #cdd6f4;
    border: 1px solid #45475a;
    border-radius: 10px;
    padding: 14px 16px;
    max-width: 340px;
    min-width: 240px;
    font-family: sans-serif;
    font-size: 13px;
    line-height: 1.6;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    display: none; `;
  document.body.appendChild(tooltip);
  return tooltip;
}

function showTooltip(word, rect, data) {
  const tooltip = createToolTip();

  tooltip.innerHTML = `
     <div style="font-size:15px;font-weight:600;color:#cba6f7;margin-bottom:8px">${word}</div>
    <div style="color:#a6e3a1;margin-bottom:8px">${data.translation}</div>
    <div style="color:#89b4fa;font-size:11px;margin-bottom:4px">ĐỒNG NGHĨA</div>
    <div style="margin-bottom:8px">${data.synonyms.join(", ")}</div>
    <div style="color:#89b4fa;font-size:11px;margin-bottom:4px">VÍ DỤ</div>
    <div style="color:#bac2de">${data.examples.map((e) => `• ${e}`).join("<br>")}</div>
    `;

  const top = rect.top + window.scrollY - tooltip.offsetHeight - 12;
  const left = Math.min(
    rect.left + window.scrollX,
    window.innerWidth - 360, // tránh bị tràn ra ngoài màn hình
  );

  tooltip.style.top =
    (top < window.scrollY ? rect.bottom + window.scrollY + 8 : top) + "px";
  tooltip.style.left = Math.max(8, left) + "px";
  tooltip.style.display = "block";
}

function hideTooltip() {
  const tooltip = document.getElementById("vocab-tooltip");
  if (tooltip) tooltip.style.display = "none";
}

function safeSendMessage(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        void chrome.runtime.lastError;
        console.warn("[Vocab] background was sleeping, retrying...");
        setTimeout(() => {
          chrome.runtime.sendMessage(msg, (retryResponse) => {
            void chrome.runtime.lastError;
            resolve(retryResponse);
          });
        }, 300);
        return;
      }
      resolve(response);
    });
  });
}

let debounceTimer = null;
let lastWord = "";
let lastRequestTime = 0;
const MIN_INTERVAL = 2000;
const cache = new Map();

document.addEventListener("mouseup", (e) => {
  // Click vào tooltip thì không làm gì
  if (e.target.closest("#vocab-tooltip")) return;

  const selection = window.getSelection();
  const text = selection?.toString().trim();

  if (!text || text.length < 2 || text.length > 100) {
    hideTooltip();
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Show loading state ngay lập tức
  const tooltip = createTooltip();
  showLoadingTooltip(text, rect);

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    safeSendMessage({ type: "TRANSLATE", word: text }).then((response) => {
      if (response?.error) {
        hideTooltip();
        return;
      }
      showTooltip(text, rect, response);
    });
  }, 500);
});

function showLoadingTooltip(word, rect) {
  const tooltip = createTooltip();
  tooltip.innerHTML = `
    <div style="font-size:15px;font-weight:600;color:#cba6f7;margin-bottom:8px">${word}</div>
    <div style="color:#6c7086">Đang dịch...</div>
  `;
  const top = rect.top + window.scrollY - 80;
  const left = Math.min(rect.left + window.scrollX, window.innerWidth - 360);
  tooltip.style.top =
    (top < window.scrollY ? rect.bottom + window.scrollY + 8 : top) + "px";
  tooltip.style.left = Math.max(8, left) + "px";
  tooltip.style.display = "block";
}

// Click ra ngoài thì ẩn tooltip
document.addEventListener("mousedown", (e) => {
  if (!e.target.closest("#vocab-tooltip")) {
    hideTooltip();
  }
});
