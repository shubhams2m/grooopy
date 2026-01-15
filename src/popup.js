/**
 * Grooopy Popup Script
 * Handles user interactions with the extension popup
 */

const groupBtn = document.getElementById('groupBtn');
const ungroupBtn = document.getElementById('ungroupBtn');
const status = document.getElementById('status');

/**
 * Update status message with animation
 */
function setStatus(message, type = 'info') {
    status.className = `status ${type}`;
    status.innerHTML = type === 'loading'
        ? `<span class="spinner"></span>${message}`
        : message;
}

/**
 * Set button loading state
 */
function setLoading(btn, loading) {
    btn.disabled = loading;
    if (loading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner"></span><span>Working...</span>';
    } else if (btn.dataset.originalText) {
        btn.innerHTML = btn.dataset.originalText;
    }
}

/**
 * Group tabs handler
 */
groupBtn.addEventListener('click', async () => {
    setLoading(groupBtn, true);
    setStatus('Analyzing tabs with AI...', 'loading');

    try {
        const response = await chrome.runtime.sendMessage({ action: 'GROUP_NOW' });

        if (response?.status === 'ok') {
            setStatus('✅ Tabs organized!', 'success');
        } else {
            setStatus('⚠️ Something went wrong', 'error');
        }
    } catch (error) {
        console.error('Grouping error:', error);
        setStatus('❌ Error: ' + error.message, 'error');
    } finally {
        setLoading(groupBtn, false);

        // Clear status after delay
        setTimeout(() => setStatus(''), 3000);
    }
});

/**
 * Ungroup all handler
 */
ungroupBtn.addEventListener('click', async () => {
    setLoading(ungroupBtn, true);
    setStatus('Removing groups...', 'loading');

    try {
        await chrome.runtime.sendMessage({ action: 'UNGROUP_ALL' });
        setStatus('✅ All groups removed', 'success');
    } catch (error) {
        console.error('Ungroup error:', error);
        setStatus('❌ Error: ' + error.message, 'error');
    } finally {
        setLoading(ungroupBtn, false);

        // Clear status after delay
        setTimeout(() => setStatus(''), 3000);
    }
});
