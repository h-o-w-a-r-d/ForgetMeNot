// options.js

document.addEventListener('DOMContentLoaded', () => {
  const modeSelect = document.getElementById('modeSelect');
  const rulesTextarea = document.getElementById('rulesTextarea');
  const saveBtn = document.getElementById('saveBtn');
  const modeHint = document.getElementById('modeHint');
  const toast = document.getElementById('toast');

  // 定義 Placeholder 提示文字
  const placeholders = {
    blacklist: "請輸入要自動清除的網域 Regex，每行一個。\n例如：\nfacebook\\.com\n.*\\.google\\.com",
    whitelist: "請輸入要「保留」數據的網域 Regex，每行一個。\n(未列出的網域將在關閉最後分頁時自動清除)\n例如：\nkeep-me-logged-in\\.com\nimportant-work\\.net"
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
      modeHint.innerHTML = '黑名單模式：只有<b>符合</b>下方規則的網站，關閉最後分頁時才會清除數據。';
    } else {
      modeHint.innerHTML = '🛡️ 白名單模式：<b>符合</b>下方規則的網站會被保留，<b>其餘所有網站</b>關閉最後分頁時都會清除數據。';
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
      showToast('🌸 設定已儲存成功！ ✨🧹');
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