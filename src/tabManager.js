const OFFSCREEN_DOCUMENT_PATH = 'src/offscreen.html';

export class TabManager {
    constructor() {
        this.isGrouping = false;
    }

    async createOffscreenDocument() {
        if (await chrome.offscreen.hasDocument()) return;
        await chrome.offscreen.createDocument({
            url: OFFSCREEN_DOCUMENT_PATH,
            reasons: [chrome.offscreen.Reason.WORKERS],
            justification: 'Running AI model for tab clustering'
        });
    }

    /**
     * Get current window width for screen-aware grouping
     */
    async getScreenWidth() {
        try {
            const window = await chrome.windows.getCurrent();
            return window.width || 1920;
        } catch {
            return 1920; // Default fallback
        }
    }

    async regroupTabs() {
        if (this.isGrouping) return;
        this.isGrouping = true;

        try {
            await this.createOffscreenDocument();
            const tabs = await chrome.tabs.query({ currentWindow: true });
            const screenWidth = await this.getScreenWidth();

            console.log(`[Grooopy] Grouping ${tabs.length} tabs, screen width: ${screenWidth}px`);

            // Send tabs to offscreen for clustering
            const response = await chrome.runtime.sendMessage({
                action: 'CLUSTER_TABS',
                tabs: tabs,
                screenWidth: screenWidth
            });

            if (response && response.groups) {
                await this.applyGroups(response.groups, tabs);
            } else if (response && response.error) {
                console.error("[Grooopy] Clustering Error:", response.error);
            }

        } catch (error) {
            console.error("[Grooopy] Context Error:", error);
        } finally {
            this.isGrouping = false;
        }
    }

    async applyGroups(groups, allTabs) {
        // First ungroup all to start fresh
        const tabsInGroups = allTabs.filter(t => t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE);
        if (tabsInGroups.length > 0) {
            try {
                await chrome.tabs.ungroup(tabsInGroups.map(t => t.id));
            } catch (e) {
                console.warn("[Grooopy] Could not ungroup some tabs:", e);
            }
        }

        // Apply new groups
        for (const groupDef of groups) {
            if (groupDef.tabIds.length === 0) continue;

            // Only create groups with 2+ tabs or if it's misc
            if (groupDef.tabIds.length === 1 && groupDef.name !== 'MISC') {
                continue; // Leave single tabs ungrouped
            }

            try {
                const groupId = await chrome.tabs.group({ tabIds: groupDef.tabIds });
                await chrome.tabGroups.update(groupId, {
                    title: groupDef.name,
                    color: groupDef.color
                });
            } catch (e) {
                console.warn("[Grooopy] Could not create group:", groupDef.name, e);
            }
        }
    }

    async ungroupAll(tabs) {
        const tabsInGroups = tabs.filter(t => t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE);
        if (tabsInGroups.length > 0) {
            await chrome.tabs.ungroup(tabsInGroups.map(t => t.id));
        }
    }
}
