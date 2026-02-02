# 🚫 ForgetMeNot - 網站遺忘助手

![License](https://img.shields.io/badge/license-MIT-green)
![Manifest](https://img.shields.io/badge/Manifest-V3-blue)
![Platform](https://img.shields.io/badge/Chrome-Extension-googlechrome)

[English ver](README.md)

**ForgetMeNot** 是一個注重隱私的 Chrome 擴充功能。它的核心功能非常簡單且強大：**當您關閉某個網站的最後一個分頁時，自動清除該網站的所有瀏覽數據**（Cookies, Cache, LocalStorage 等）。

不再讓不需要的網站追蹤您的數位足跡，保持瀏覽器的輕量與隱私。

## ✨ 主要功能

*   **自動清除數據**：監測分頁狀態，僅在該網域的「最後一個分頁」關閉時執行清除，避免影響正在瀏覽中的頁面。
*   **雙重模式**：
    *   **⛔ 黑名單模式 (預設)**：只有列在名單上的網站，關閉時才會被清除數據。
    *   **🛡️ 白名單模式**：列在名單上的網站會被「保留」，其餘所有未列出的網站在關閉時都會被清除。
*   **強大的規則系統**：支援 **正則表達式 (Regex)**，讓您可以靈活地匹配網域（例如匹配所有子網域）。
*   **現代化架構**：基於 Chrome Manifest V3 開發，使用 Service Worker，效能更佳且更安全。
*   **美觀的介面**：簡潔的設定頁面與粉色系的成功提示通知。

## 🚀 安裝說明 (開發者模式)

由於本擴充功能尚未上架 Chrome 線上應用程式商店，您需要透過「載入未封裝項目」的方式安裝：

1.  **下載代碼**：將本專案下載或是 Clone 到您的電腦中。
2.  **開啟擴充功能管理頁面**：
    *   在 Chrome 瀏覽器網址列輸入 `chrome://extensions/` 並按下 Enter。
3.  **開啟開發人員模式**：
    *   點擊頁面右上角的 **「開發人員模式 (Developer mode)」** 開關使其變為藍色。
4.  **載入擴充功能**：
    *   點擊左上角的 **「載入未封裝項目 (Load unpacked)」** 按鈕。
    *   選擇包含 `manifest.json` 檔案的 `ForgetMeNot` 資料夾。
5.  **完成！** 您現在可以在擴充功能列看到 ForgetMeNot 的圖示。

## 📖 使用指南

### 設定頁面
點擊擴充功能圖示，選擇「選項 (Options)」進入設定頁面。

### 正則表達式 (Regex) 範例
在輸入框中，每一行代表一條規則。

*   **匹配特定網域** (記得將 `.` 轉義為 `\.`)：
    ```text
    example\.com
    ```
*   **匹配網域及其所有子網域** (例如 `mail.google.com`, `drive.google.com`)：
    ```text
    .*\.google\.com
    ```
*   **匹配包含特定關鍵字的網域**：
    ```text
    .*facebook.*
    ```

### 模式說明
*   **黑名單**：適合只想針對特定幾個網站（如新聞網站、社群媒體）進行清理的使用者。
*   **白名單**：適合極致隱私主義者。您可以將常用的網站（如 Email、公司系統）加入白名單，其他隨意瀏覽的網站關閉後都會自動無痕。

## 🔒 隱私與權限說明

本擴充功能需要以下權限才能運作，所有數據處理皆在您的**本地端**完成，不會上傳任何資料。

| 權限 | 原因 |
| :--- | :--- |
| `browsingData` | 用於執行清除 Cookies、Cache、LocalStorage 等操作。 |
| `tabs` | 用於監聽分頁的開啟與關閉，並判斷是否為最後一個分頁。 |
| `storage` | 用於儲存您的黑/白名單設定。 |
| `host_permissions` | 需要 `<all_urls>` 以便 Background Script 能讀取剛關閉分頁的 URL 來源，進行網域比對。 |

## 🛠️ 專案結構

```text
ForgetMeNot/
├── manifest.json   # 擴充功能設定檔
├── background.js   # 核心邏輯 (Service Worker)
├── options.html    # 設定頁面 HTML
├── options.js      # 設定頁面邏輯
├── styles.css      # 設定頁面樣式
└── icons/          # 圖示資料夾
