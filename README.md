# 🚫 ForgetMeNot - Website Oblivion Assistant

![License](https://img.shields.io/badge/license-MIT-green)
![Manifest](https://img.shields.io/badge/Manifest-V3-blue)
![Platform](https://img.shields.io/badge/Chrome-Extension-googlechrome)

[中文版](README_zh.md)

**ForgetMeNot** is a privacy-focused Chrome extension. Its core function is simple yet powerful: **Automatically clear all browsing data (Cookies, Cache, LocalStorage, etc.) for a website when you close its last remaining tab.**

Prevent unwanted websites from tracking your digital footprint and keep your browser lightweight and private.

---

## ✨ Key Features

* **Auto-Cleanup**: Monitors tab status and triggers cleanup only when the "last tab" of a specific domain is closed, ensuring no interference with your active browsing sessions.
* **Dual Modes**:
    * **⛔ Blacklist Mode (Default)**: Only websites listed will have their data cleared upon closing.
    * **🛡️ Whitelist Mode**: Websites listed are "kept/preserved," while all other unlisted websites are cleared when their tabs are closed.
* **Powerful Rule System**: Supports **Regular Expressions (Regex)**, allowing you to flexibly match domains (e.g., matching all subdomains).
* **Modern Architecture**: Built on Chrome Manifest V3 using Service Workers for better performance and enhanced security.
* **Beautiful Interface**: Clean settings page with aesthetic pink-themed success notifications.

## 🚀 Installation (Developer Mode)

Since this extension is not yet published on the Chrome Web Store, you can install it via "Load unpacked":

1.  **Download Code**: Download or clone this repository to your local machine.
2.  **Open Extensions Management**:
    * Enter `chrome://extensions/` in the Chrome address bar and press Enter.
3.  **Enable Developer Mode**:
    * Toggle the **"Developer mode"** switch in the top right corner to the ON position (blue).
4.  **Load Extension**:
    * Click the **"Load unpacked"** button in the top left.
    * Select the `ForgetMeNot` folder containing the `manifest.json` file.
5.  **Done!** You can now find the ForgetMeNot icon in your extension bar.

## 📖 Usage Guide

### Settings Page
Click the extension icon and select "Options" to enter the configuration page.

### Regex Examples
In the input field, each line represents one rule.

* **Match a specific domain** (Remember to escape `.` as `\.`):
    ```text
    example\.com
    ```
* **Match a domain and all its subdomains** (e.g., `mail.google.com`, `drive.google.com`):
    ```text
    .*\.google\.com
    ```
* **Match domains containing a specific keyword**:
    ```text
    .*facebook.*
    ```

### Mode Descriptions
* **Blacklist**: Ideal for users who only want to target specific websites (e.g., news sites, social media) for cleanup.
* **Whitelist**: Designed for privacy enthusiasts. You can whitelist essential sites (e.g., Email, internal company systems), and data for all other randomly browsed sites will be cleared automatically.

## 🔒 Privacy & Permissions

This extension requires the following permissions to function. All data processing is performed **locally** on your device; no data is uploaded.

| Permission | Reason |
| :--- | :--- |
| `browsingData` | Used to execute clearing of Cookies, Cache, LocalStorage, etc. |
| `tabs` | Used to monitor tab opening/closing and determine if a tab is the last one. |
| `storage` | Used to save your Blacklist/Whitelist configurations. |
| `host_permissions` | Requires `<all_urls>` so the background script can read the source URL of closed tabs for domain matching. |

## 🛠️ Project Structure

```text
ForgetMeNot/
├── manifest.json    # Extension manifest file
├── background.js    # Core logic (Service Worker)
├── options.html     # Settings page HTML
├── options.js       # Settings page logic
├── styles.css       # Settings page styles
└── icons/           # Icon folder
