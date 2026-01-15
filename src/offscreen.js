import { ClusteringEngine } from './clustering.js';

const engine = new ClusteringEngine();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'CLUSTER_TABS') {
        handleClustering(message.tabs, message.screenWidth, sendResponse);
        return true; // Keep channel open for async response
    }
});

async function handleClustering(tabs, screenWidth, sendResponse) {
    try {
        console.log("[Grooopy Offscreen] Clustering", tabs.length, "tabs, screen:", screenWidth);
        const groups = await engine.clusterTabs(tabs, screenWidth || 1920);
        console.log("[Grooopy Offscreen] Result:", groups);
        sendResponse({ groups });
    } catch (error) {
        console.error("[Grooopy Offscreen] Failed:", error);
        sendResponse({ error: error.message });
    }
}
