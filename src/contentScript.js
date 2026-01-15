/**
 * Content Script for Grooopy
 * Extracts page title, meta description, and main content for clustering.
 */

(function () {
    function getMetaDescription() {
        const meta = document.querySelector('meta[name="description"]');
        return meta ? meta.content : '';
    }

    function getMainContent() {
        // Simple heuristic: Get H1s and first few paragraphs
        const h1s = Array.from(document.querySelectorAll('h1')).map(el => el.innerText).join(' ');
        const ps = Array.from(document.querySelectorAll('p')).slice(0, 5).map(el => el.innerText).join(' ');
        return (h1s + " " + ps).replace(/\s+/g, ' ').trim().slice(0, 1000); // Limit to 1000 chars
    }

    const title = document.title;
    const description = getMetaDescription();
    const content = getMainContent();

    // Send back to background
    return {
        title,
        description,
        content,
        url: window.location.href
    };
})();
