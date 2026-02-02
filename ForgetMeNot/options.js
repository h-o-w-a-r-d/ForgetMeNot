// options.js

document.addEventListener('DOMContentLoaded', () => {
  const modeSelect = document.getElementById('modeSelect');
  const rulesTextarea = document.getElementById('rulesTextarea');
  const saveBtn = document.getElementById('saveBtn');
  const modeHint = document.getElementById('modeHint');
  const toast = document.getElementById('toast');

  // 定義 Placeholder 提示文字
  const placeholders = {
    blacklist: "Please enter the domains(Regex) to be automatically cleared, one per line.\n e.g. : \nfacebook\\.com\n.*\\.google\\.com",
    whitelist: "Please enter the domain(Regex) names for which you want to retain data, one per line.\n(Domains not listed will be automatically cleared when the last page is closed.)\n e.g. : \nkeep-me-logged-in\\.com\nimportant-work\\.net"
  };

  // 1. 讀取設定
  chrome.storage.local.get({
    mode: 'blacklist',
    rules: ''
  }, (items) => {
    modeSelect.value = items.mode;
    rulesTextarea.value = items.rules;
    updateUI(items.mode);
  });

  // 2. 監聽模式切換，更新提示文字
  modeSelect.addEventListener('change', (e) => {
    updateUI(e.target.value);
  });

  function updateUI(mode) {
    rulesTextarea.placeholder = placeholders[mode];
    if (mode === 'blacklist') {
      modeHint.innerHTML = '⛔ Blacklist mode: Data will only be cleared when a website that meets the rules below is closed.';
    } else {
      modeHint.innerHTML = '🛡️ Whitelist mode: Websites that meet the rules below will be retained, while data for all other websites will be cleared when the last page is closed.';
    }
  }

  // 3. 儲存設定
  saveBtn.addEventListener('click', () => {
    const mode = modeSelect.value;
    const rulesStr = rulesTextarea.value;
    
    // 驗證 Regex 格式
    const lines = rulesStr.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        try {
          new RegExp(line);
        } catch (e) {
          alert(`❌ 第 ${i + 1} 行的正則表達式有誤：\n${line}\n\n請修正後再試。`);
          return;
        }
      }
    }

    // 儲存到 chrome.storage
    chrome.storage.local.set({
      mode: mode,
      rules: rulesStr
    }, () => {
      showToast('🌸 Settings saved successfully！ ✨🧹');
    });
  });

  // 顯示粉色系提示
  function showToast(message) {
    toast.textContent = message;
    toast.className = "show";
    setTimeout(() => { 
      toast.className = toast.className.replace("show", ""); 
    }, 3000);
  }
});