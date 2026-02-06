// --- START OF FILE background.js ---

// background.js

let tabUrlCache = {};

// 初始化
chrome.runtime.onStartup.addListener(initializeTabCache);
chrome.runtime.onInstalled.addListener(initializeTabCache);

async function initializeTabCache() {
  tabUrlCache = {}; 
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    if (tab.id && tab.url) {
      tabUrlCache[tab.id] = tab.url;
    }
  });
  console.log("ForgetMeNot: Tab cache initialized.", Object.keys(tabUrlCache).length, "tabs found.");
}

// 監聽分頁更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    tabUrlCache[tabId] = changeInfo.url;
  }
});

// 監聽分頁替換
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  delete tabUrlCache[removedTabId];
  chrome.tabs.get(addedTabId, (tab) => {
    if (chrome.runtime.lastError) return;
    tabUrlCache[addedTabId] = tab.url;
  });
});

// 自動清理邏輯：分頁關閉時觸發
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const closedUrl = tabUrlCache[tabId];
  delete tabUrlCache[tabId];

  if (!closedUrl || !isValidUrl(closedUrl)) return;

  try {
    const closedOrigin = new URL(closedUrl).origin;
    const closedHostname = new URL(closedUrl).hostname;

    console.log(`ForgetMeNot: Tab closed. Domain: ${closedHostname}`);

    const remainingTabs = await chrome.tabs.query({});
    const isDomainActive = remainingTabs.some(tab => {
      if (!tab.url || !isValidUrl(tab.url)) return false;
      return new URL(tab.url).hostname === closedHostname;
    });

    if (isDomainActive) {
      console.log(`ForgetMeNot: Domain ${closedHostname} still active. Skipping.`);
      return;
    }

    const settings = await chrome.storage.local.get({ mode: 'blacklist', rules: '' });
    const shouldClean = checkRules(closedHostname, settings.mode, settings.rules);

    if (shouldClean) {
      performCleaning([closedOrigin], closedHostname);
    }

  } catch (error) {
    console.error("ForgetMeNot Error:", error);
  }
});

function isValidUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}

function checkRules(hostname, mode, rulesStr) {
  const rules = rulesStr.split('\n').filter(line => line.trim() !== '');
  
  if (rules.length === 0) return mode === 'whitelist'; 

  let isMatch = false;
  for (const rule of rules) {
    try {
      const regex = new RegExp(rule.trim(), 'i');
      if (regex.test(hostname)) {
        isMatch = true;
        break;
      }
    } catch (e) {
      console.warn(`Invalid Regex: ${rule}`);
    }
  }

  return mode === 'blacklist' ? isMatch : !isMatch;
}

// 執行清除：接收 origins 陣列
function performCleaning(originsList, hostnameLog) {
  console.log(`ForgetMeNot: Cleaning data for ${hostnameLog || originsList.length + ' origins'} ...`);

  const removalOptions = {
    "origins": originsList
  };

  const dataToRemove = {
    "cache": true,
    "cookies": true,
    "localStorage": true,
    "indexedDB": true,
    "serviceWorkers": true,
    "webSQL": true,
    "fileSystems": true
  };

  chrome.browsingData.remove(removalOptions, dataToRemove, () => {
    console.log(`ForgetMeNot: Cleaned.`);
  });
}

// 監聽來自 Options 頁面的手動清理指令
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CLEAN_NOW') {
    handleManualCleaning().then(() => {
      sendResponse({ success: true });
    });
    return true; 
  }
});

// --- 🔥 核心改進：手動清理邏輯 (Cookie + History 雙重掃描) ---
async function handleManualCleaning() {
  console.log("ForgetMeNot: Starting DEEP manual cleanup...");
  const settings = await chrome.storage.local.get({ mode: 'blacklist', rules: '' });

  // 1. 獲取白名單保護中的分頁
  const activeTabs = await chrome.tabs.query({});
  const activeHostnames = activeTabs
    .map(tab => {
      if (tab.url && isValidUrl(tab.url)) {
        try { return new URL(tab.url).hostname; } catch (e) { return null; }
      }
      return null;
    })
    .filter(h => h !== null);

  // 2. 收集所有潛在的目標網域 (Cookie + History)
  // 使用 Set 來避免重複
  const candidates = new Map(); // Key: Hostname, Value: Set<Origin>

  // (A) 掃描 Cookies
  const cookies = await chrome.cookies.getAll({});
  cookies.forEach(c => {
    let domain = c.domain.startsWith('.') ? c.domain.substring(1) : c.domain;
    if (!candidates.has(domain)) candidates.set(domain, new Set());
    
    // 推測 Origin
    candidates.get(domain).add(`http://${domain}`);
    candidates.get(domain).add(`https://${domain}`);
    candidates.get(domain).add(`http://www.${domain}`);
    candidates.get(domain).add(`https://www.${domain}`);
  });

  // (B) 掃描 History (為了抓出沒有 Cookie 但有 LocalStorage/Cache 的殘留網站)
  // 抓取過去 30 天的紀錄，最多 10000 條，應該夠抓出殘留垃圾了
  const historyItems = await chrome.history.search({
    text: '', 
    startTime: Date.now() - (1000 * 60 * 60 * 24 * 30), 
    maxResults: 10000 
  });
  
  historyItems.forEach(item => {
    if (!item.url || !isValidUrl(item.url)) return;
    try {
      const urlObj = new URL(item.url);
      const domain = urlObj.hostname;
      const origin = urlObj.origin; // 精確的 origin，例如 https://sub.example.com

      if (!candidates.has(domain)) candidates.set(domain, new Set());
      candidates.get(domain).add(origin);
    } catch(e) {}
  });

  const originsToDelete = new Set();

  // 3. 過濾並決定刪除誰
  for (const [domain, originSet] of candidates.entries()) {
    
    // --- 保護檢查 ---
    // 如果該網域(或其子網域)正在被使用，跳過
    const isProtected = activeHostnames.some(activeHost => {
      return activeHost === domain || activeHost.endsWith('.' + domain) || domain.endsWith('.' + activeHost);
    });

    if (isProtected) continue;

    // --- 規則檢查 (黑/白名單) ---
    const shouldClean = checkRules(domain, settings.mode, settings.rules);

    if (shouldClean) {
      // 將所有收集到的 Origin 加入待刪除清單
      originSet.forEach(origin => originsToDelete.add(origin));
    }
  }

  // 4. 執行批量刪除
  if (originsToDelete.size > 0) {
    const originList = Array.from(originsToDelete);
    console.log(`ForgetMeNot: Identified ${candidates.size} domains. Deleting ${originList.length} origins...`);
    
    // 分批執行，避免一次傳入太多 origin 導致瀏覽器卡頓 (雖然 Chrome API 應該能處理)
    // 這裡一次全丟進去，browsingData API 支援 array
    const removalOptions = {
      origins: originList
    };

    const dataToRemove = {
      "cache": true,
      "cookies": true,
      "localStorage": true,
      "indexedDB": true,
      "serviceWorkers": true,
      "webSQL": true,
      "fileSystems": true, // 檔案系統
      "pluginData": true    // 插件數據
    };

    await new Promise(resolve => {
      chrome.browsingData.remove(removalOptions, dataToRemove, () => {
        console.log("ForgetMeNot: Manual cleanup complete.");
        resolve();
      });
    });
  } else {
    console.log("ForgetMeNot: No matching data found to clean.");
  }
}