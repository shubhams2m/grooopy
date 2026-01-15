import { TabManager } from './src/tabManager.js';

// Initialize the Tab Manager
const tabManager = new TabManager();

// Setup Listeners
// Manual trigger only - listeners removed.


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GROUP_NOW') {
    tabManager.regroupTabs();
    sendResponse({ status: 'ok' });
  } else if (request.action === 'UNGROUP_ALL') {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      tabManager.ungroupAll(tabs);
      sendResponse({ status: 'ok' });
    });
  }
});
