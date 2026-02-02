// background.js

// 用於在記憶體中暫存 tabId -> url 的映射
// 注意：Service Worker 可能會重啟，因此在 onStartup 時我們會嘗試重新構建這個 Map
let tabUrlCache = {};

// 初始化：擴充功能啟動或重啟時，抓取當前所有分頁以填滿 Cache
chrome.runtime.onStartup.addListener(initializeTabCache);
chrome.runtime.onInstalled.addListener(initializeTabCache);

async function initializeTabCache() {
  tabUrlCache = {}; // 重置
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    if (tab.id && tab.url) {
      tabUrlCache[tab.id] = tab.url;
    }
  });
  console.log("ForgetMeNot: Tab cache initialized.", Object.keys(tabUrlCache).length, "tabs found.");
}

// 監聽分頁更新：當 URL 改變時更新 Cache
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    tabUrlCache[tabId] = changeInfo.url;
  }
});

// 監聽分頁替換：例如預渲染分頁變為可見時
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  delete tabUrlCache[removedTabId];
  // 新的 tabId 通常會隨後觸發 onUpdated 或需要主動查詢，這裡做個保險查詢
  chrome.tabs.get(addedTabId, (tab) => {
    if (chrome.runtime.lastError) return;
    tabUrlCache[addedTabId] = tab.url;
  });
});

// 核心邏輯：監聽分頁關閉
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // 1. 從 Cache 獲取剛關閉的分頁 URL
  const closedUrl = tabUrlCache[tabId];
  
  // 清除 Cache 中的紀錄
  delete tabUrlCache[tabId];

  if (!closedUrl || !isValidUrl(closedUrl)) {
    return; // 如果沒有 URL 紀錄或是無效 URL (如 chrome://)，則忽略
  }

  try {
    const closedOrigin = new URL(closedUrl).origin;
    const closedHostname = new URL(closedUrl).hostname;

    console.log(`ForgetMeNot: Tab closed. Domain: ${closedHostname}`);

    // 2. 檢查該網域是否還有其他分頁開啟中
    const remainingTabs = await chrome.tabs.query({});
    const isDomainActive = remainingTabs.some(tab => {
      if (!tab.url || !isValidUrl(tab.url)) return false;
      return new URL(tab.url).hostname === closedHostname;
    });

    if (isDomainActive) {
      console.log(`ForgetMeNot: Domain ${closedHostname} still active in other tabs. Skipping.`);
      return;
    }

    // 3. 讀取設定並決定是否清除
    const settings = await chrome.storage.local.get({
      mode: 'blacklist', // 預設黑名單
      rules: ''          // 預設無規則
    });

    const shouldClean = checkRules(closedHostname, settings.mode, settings.rules);

    if (shouldClean) {
      performCleaning(closedOrigin, closedHostname);
    }

  } catch (error) {
    console.error("ForgetMeNot Error:", error);
  }
});

// 輔助函式：檢查 URL 是否為有效的 http/https
function isValidUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}

// 輔助函式：規則比對邏輯
function checkRules(hostname, mode, rulesStr) {
  const rules = rulesStr.split('\n').filter(line => line.trim() !== '');
  
  // 如果沒有規則，行為取決於模式
  // 黑名單模式下沒規則 = 不刪除任何東西
  // 白名單模式下沒規則 = 刪除所有東西
  if (rules.length === 0) {
    return mode === 'whitelist'; 
  }

  let isMatch = false;
  for (const rule of rules) {
    try {
      // 支援正則表達式
      const regex = new RegExp(rule.trim(), 'i'); // 'i' 忽略大小寫
      if (regex.test(hostname)) {
        isMatch = true;
        break;
      }
    } catch (e) {
      console.warn(`Invalid Regex in settings: ${rule}`);
    }
  }

  if (mode === 'blacklist') {
    // 黑名單：匹配到了才刪除
    return isMatch;
  } else {
    // 白名單：匹配到了"不"刪除 (即：沒匹配到才刪除)
    return !isMatch;
  }
}

// 執行清除動作
function performCleaning(origin, hostname) {
  console.log(`ForgetMeNot: Cleaning data for ${origin} ...`);

  const removalOptions = {
    "origins": [origin] // 僅針對該來源清除，避免誤刪其他網站
  };

  const dataToRemove = {
    "cache": true,
    "cookies": true,
    "localStorage": true,
    "indexedDB": true,
    "serviceWorkers": true,
    "webSQL": true
  };

  chrome.browsingData.remove(removalOptions, dataToRemove, () => {
    console.log(`ForgetMeNot: Successfully cleaned ${hostname} (Cookies, Cache, Storage).`);
  });
}