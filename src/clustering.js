import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js for Chrome Extension environment
env.allowLocalModels = false;
env.useBrowserCache = true;

// CRITICAL: Disable ONNX Web Workers to avoid CSP blob: URL errors in Chrome Extensions
// Workers use blob: URLs which are blocked by extension CSP
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * GROOOPY - Intelligent Tab Clustering Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * A production-grade semantic clustering engine that intelligently groups browser
 * tabs using state-of-the-art NLP embeddings and hierarchical agglomerative clustering.
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  Tab Content Extraction → Embedding Generation → Multi-Signal Scoring      │
 * │         ↓                        ↓                       ↓                 │
 * │  Agglomerative Clustering → Hierarchical Merge → Semantic Naming           │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * Key Features:
 * - Content-first clustering with domain affinity boost
 * - Hierarchical agglomerative clustering (HAC) for optimal groupings
 * - Adaptive thresholds based on tab count and screen constraints
 * - Smart singleton handling with multi-pass consolidation
 * 
 * @author Grooopy Contributors
 * @license MIT
 */

export class ClusteringEngine {
    constructor(options = {}) {
        // Model configuration
        this.extractor = null;
        this.modelName = options.modelName || 'Xenova/all-MiniLM-L6-v2';
        this.embeddingDim = 384; // Dimension for all-MiniLM-L6-v2

        // ═══════════════════════════════════════════════════════════════════════
        // CLUSTERING HYPERPARAMETERS
        // These have been tuned through extensive testing across diverse tab sets
        // ═══════════════════════════════════════════════════════════════════════

        this.config = {
            // Primary clustering thresholds
            CONTENT_SIMILARITY_THRESHOLD: 0.38,  // Base semantic similarity threshold
            DOMAIN_AFFINITY_BOOST: 0.15,         // Boost for same-domain tabs
            URL_PATH_BOOST: 0.08,                // Boost for similar URL paths

            // Hierarchical merge thresholds
            MERGE_SIMILARITY_THRESHOLD: 0.30,    // Threshold for merging related groups
            FORCED_MERGE_MULTIPLIER: 1.5,        // Force merge when groups > capacity * this

            // Singleton handling
            SINGLETON_ABSORPTION_THRESHOLD: 0.25, // Lower bar for singleton absorption
            SINGLETON_CLUSTER_THRESHOLD: 0.33,   // Threshold for singletons to cluster together
            MIN_ORPHANS_FOR_MISC: 3,             // Minimum orphans before creating MISC

            // Screen capacity estimation
            PIXELS_PER_GROUP: 130,               // Estimated pixels per tab group
            MIN_GROUPS: 2,                       // Minimum groups to maintain
            MAX_GROUPS: 10,                      // Maximum groups regardless of screen

            // Debug mode
            DEBUG: options.debug || false
        };
    }

    /**
     * Initialize the embedding model (lazy loading)
     */
    async init() {
        if (!this.extractor) {
            this.log('🧠 Loading AI model:', this.modelName);
            const startTime = performance.now();
            this.extractor = await pipeline('feature-extraction', this.modelName);
            this.log(`✅ Model loaded in ${(performance.now() - startTime).toFixed(0)}ms`);
        }
    }

    /**
     * Debug logger
     */
    log(...args) {
        if (this.config.DEBUG) {
            console.log('[Grooopy]', ...args);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN ENTRY POINT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Cluster tabs using intelligent multi-signal semantic analysis
     * 
     * @param {chrome.tabs.Tab[]} tabs - Array of Chrome tab objects
     * @param {number} screenWidth - Window width for capacity estimation
     * @returns {Promise<ClusterResult[]>} Array of cluster definitions
     */
    async clusterTabs(tabs, screenWidth = 1920) {
        await this.init();

        const startTime = performance.now();
        this.log(`📊 Clustering ${tabs.length} tabs (screen: ${screenWidth}px)`);

        // Edge case: too few tabs
        if (tabs.length <= 2) {
            this.log('⚡ Too few tabs, skipping clustering');
            return [];
        }

        // Step 1: Extract and enrich tab data
        const enrichedTabs = await this.extractAndEnrichTabs(tabs);

        // Step 2: Generate embeddings
        const tabVectors = await this.generateEmbeddings(enrichedTabs);

        // Step 3: Build similarity matrix
        const similarityMatrix = this.buildSimilarityMatrix(tabVectors);

        // Step 4: Agglomerative clustering
        const groupCapacity = this.calculateGroupCapacity(screenWidth, tabs.length);
        let clusters = this.agglomerativeClustering(tabVectors, similarityMatrix, groupCapacity);

        // Step 5: Handle singletons intelligently
        clusters = this.consolidateSingletons(clusters, groupCapacity);

        // Step 6: Generate semantic names
        const result = await this.generateClusterMetadata(clusters);

        this.log(`✅ Clustering complete in ${(performance.now() - startTime).toFixed(0)}ms`);
        this.log(`📦 Created ${result.length} groups from ${tabs.length} tabs`);

        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONTENT EXTRACTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Extract rich content and metadata from each tab
     */
    async extractAndEnrichTabs(tabs) {
        const enriched = [];

        for (const tab of tabs) {
            const url = this.parseUrl(tab.url);
            let content = tab.title || '';

            // Try to extract page content via scripting
            if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
                try {
                    const injection = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            // Extract semantic content from the page
                            const getMeta = (name) =>
                                document.querySelector(`meta[name="${name}"]`)?.content ||
                                document.querySelector(`meta[property="${name}"]`)?.content || '';

                            const getText = (selector, limit = 1) =>
                                Array.from(document.querySelectorAll(selector))
                                    .slice(0, limit)
                                    .map(el => el.innerText?.trim())
                                    .filter(Boolean)
                                    .join(' ');

                            return {
                                title: document.title,
                                description: getMeta('description') || getMeta('og:description'),
                                keywords: getMeta('keywords'),
                                h1: getText('h1'),
                                h2: getText('h2', 3),
                                firstParagraph: getText('article p, main p, .content p, p', 2),
                                pathHint: window.location.pathname.replace(/[\/\-_\.]/g, ' ').trim()
                            };
                        }
                    });

                    if (injection?.[0]?.result) {
                        const r = injection[0].result;
                        content = [
                            r.title,
                            r.description,
                            r.keywords,
                            r.h1,
                            r.h2,
                            r.firstParagraph,
                            r.pathHint
                        ].filter(Boolean).join(' ').slice(0, 2000);
                    }
                } catch (e) {
                    // Scripting failed - use title only
                }
            }

            enriched.push({
                tab,
                content,
                domain: url.domain,
                baseDomain: url.baseDomain,
                pathTokens: url.pathTokens
            });
        }

        return enriched;
    }

    /**
     * Parse URL into components for similarity scoring
     */
    parseUrl(urlString) {
        try {
            const url = new URL(urlString);
            const hostname = url.hostname.replace(/^www\./, '');
            const parts = hostname.split('.');

            return {
                domain: hostname,
                baseDomain: parts.length >= 2 ? parts.slice(-2).join('.') : hostname,
                pathTokens: url.pathname
                    .split(/[\/\-_]/)
                    .filter(t => t.length > 2)
                    .slice(0, 5)
            };
        } catch {
            return { domain: '', baseDomain: '', pathTokens: [] };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EMBEDDING GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Generate embedding vectors for all tabs
     */
    async generateEmbeddings(enrichedTabs) {
        const vectors = [];

        for (const item of enrichedTabs) {
            const embedding = await this.getEmbedding(item.content);
            vectors.push({
                ...item,
                embedding
            });
        }

        return vectors;
    }

    /**
     * Generate normalized embedding for text
     */
    async getEmbedding(text) {
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return output.data;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SIMILARITY COMPUTATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Build full similarity matrix with multi-signal scoring
     */
    buildSimilarityMatrix(tabVectors) {
        const n = tabVectors.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const score = this.computePairwiseSimilarity(tabVectors[i], tabVectors[j]);
                matrix[i][j] = score;
                matrix[j][i] = score;
            }
        }

        return matrix;
    }

    /**
     * Compute multi-signal similarity between two tabs
     * 
     * Signals:
     * 1. Semantic content similarity (primary)
     * 2. Domain affinity boost
     * 3. URL path similarity boost
     */
    computePairwiseSimilarity(tab1, tab2) {
        // Primary: Semantic similarity
        const semanticSim = this.cosineSimilarity(tab1.embedding, tab2.embedding);

        // Signal 2: Domain affinity
        let domainBoost = 0;
        if (tab1.domain === tab2.domain) {
            domainBoost = this.config.DOMAIN_AFFINITY_BOOST;
        } else if (tab1.baseDomain === tab2.baseDomain) {
            domainBoost = this.config.DOMAIN_AFFINITY_BOOST * 0.5;
        }

        // Signal 3: URL path similarity
        let pathBoost = 0;
        const commonTokens = tab1.pathTokens.filter(t => tab2.pathTokens.includes(t));
        if (commonTokens.length > 0) {
            pathBoost = this.config.URL_PATH_BOOST *
                Math.min(1, commonTokens.length / Math.max(tab1.pathTokens.length, tab2.pathTokens.length, 1));
        }

        return semanticSim + domainBoost + pathBoost;
    }

    /**
     * Cosine similarity for normalized vectors (optimized)
     */
    cosineSimilarity(v1, v2) {
        let dot = 0;
        for (let i = 0; i < v1.length; i++) {
            dot += v1[i] * v2[i];
        }
        return dot;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AGGLOMERATIVE HIERARCHICAL CLUSTERING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Perform bottom-up agglomerative clustering
     * Uses average-linkage for cluster distance computation
     */
    agglomerativeClustering(tabVectors, similarityMatrix, targetGroups) {
        const n = tabVectors.length;

        // Initialize: each tab is its own cluster
        let clusters = tabVectors.map((tv, idx) => ({
            indices: [idx],
            items: [tv],
            embeddings: [tv.embedding],
            domains: new Set([tv.domain]),
            centroid: tv.embedding
        }));

        // Adaptive threshold based on number of tabs
        const adaptiveThreshold = this.computeAdaptiveThreshold(n, targetGroups);
        this.log(`🎯 Adaptive threshold: ${adaptiveThreshold.toFixed(3)}, target: ${targetGroups} groups`);

        // Merge clusters until we hit threshold or target
        while (clusters.length > targetGroups) {
            // Find best merge candidate
            const { i, j, similarity } = this.findBestMerge(clusters, similarityMatrix);

            // Stop if best similarity is below threshold
            if (similarity < adaptiveThreshold) {
                this.log(`⏹️ Stopping: best similarity ${similarity.toFixed(3)} < threshold`);
                break;
            }

            // Merge clusters
            const merged = this.mergeClusters(clusters[i], clusters[j]);

            // Update cluster list
            clusters = clusters.filter((_, idx) => idx !== i && idx !== j);
            clusters.push(merged);

            this.log(`🔗 Merged clusters (sim: ${similarity.toFixed(3)}), now ${clusters.length} groups`);
        }

        return clusters;
    }

    /**
     * Compute adaptive threshold based on tab count
     * More tabs = slightly lower threshold to allow more grouping
     */
    computeAdaptiveThreshold(tabCount, targetGroups) {
        const base = this.config.CONTENT_SIMILARITY_THRESHOLD;

        // Scale down threshold for larger tab sets
        const scaleFactor = Math.max(0.85, 1 - (tabCount - 10) * 0.01);

        return base * scaleFactor;
    }

    /**
     * Find the best pair of clusters to merge
     * Uses average-linkage: average similarity between all pairs
     */
    findBestMerge(clusters, originalMatrix) {
        let bestI = -1, bestJ = -1, bestSim = -Infinity;

        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                // Average linkage: mean similarity between all pairs
                let totalSim = 0;
                let count = 0;

                for (const idx1 of clusters[i].indices) {
                    for (const idx2 of clusters[j].indices) {
                        totalSim += originalMatrix[idx1][idx2];
                        count++;
                    }
                }

                const avgSim = count > 0 ? totalSim / count : 0;

                if (avgSim > bestSim) {
                    bestSim = avgSim;
                    bestI = i;
                    bestJ = j;
                }
            }
        }

        return { i: bestI, j: bestJ, similarity: bestSim };
    }

    /**
     * Merge two clusters
     */
    mergeClusters(c1, c2) {
        const indices = [...c1.indices, ...c2.indices];
        const items = [...c1.items, ...c2.items];
        const embeddings = [...c1.embeddings, ...c2.embeddings];
        const domains = new Set([...c1.domains, ...c2.domains]);

        return {
            indices,
            items,
            embeddings,
            domains,
            centroid: this.computeCentroid(embeddings)
        };
    }

    /**
     * Compute normalized centroid of embedding vectors
     */
    computeCentroid(embeddings) {
        if (embeddings.length === 0) return null;
        if (embeddings.length === 1) return embeddings[0];

        const dim = embeddings[0].length;
        const centroid = new Float32Array(dim);

        for (const emb of embeddings) {
            for (let i = 0; i < dim; i++) {
                centroid[i] += emb[i];
            }
        }

        // Normalize
        let mag = 0;
        for (let i = 0; i < dim; i++) {
            mag += centroid[i] * centroid[i];
        }
        mag = Math.sqrt(mag);

        if (mag > 0) {
            for (let i = 0; i < dim; i++) {
                centroid[i] /= mag;
            }
        }

        return centroid;
    }

    /**
     * Calculate optimal group capacity based on screen width
     */
    calculateGroupCapacity(screenWidth, tabCount) {
        const estimated = Math.floor(screenWidth / this.config.PIXELS_PER_GROUP);
        const clamped = Math.max(this.config.MIN_GROUPS, Math.min(this.config.MAX_GROUPS, estimated));
        const maxForTabs = Math.max(2, Math.ceil(tabCount / 2));

        return Math.min(clamped, maxForTabs);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SINGLETON CONSOLIDATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Intelligently handle singleton clusters
     * 
     * Strategy:
     * 1. Try to cluster singletons with each other
     * 2. Absorb remaining into closest clusters
     * 3. Create MISC only as last resort
     */
    consolidateSingletons(clusters, groupCapacity) {
        const singletons = clusters.filter(c => c.items.length === 1);
        let multiClusters = clusters.filter(c => c.items.length > 1);

        if (singletons.length === 0) return clusters;

        this.log(`🔍 Processing ${singletons.length} singleton(s)`);

        // Pass 1: Cluster singletons with each other
        const singletonGroups = this.clusterSingletonsTogether(singletons);
        const newMulti = singletonGroups.filter(c => c.items.length > 1);
        let orphans = singletonGroups.filter(c => c.items.length === 1);

        multiClusters = [...multiClusters, ...newMulti];
        this.log(`   Pass 1: ${newMulti.length} new groups formed, ${orphans.length} orphans remain`);

        // Pass 2: Try to absorb orphans into existing clusters
        const finalOrphans = [];
        for (const orphan of orphans) {
            const { cluster, similarity } = this.findClosestCluster(orphan, multiClusters);

            if (similarity >= this.config.SINGLETON_ABSORPTION_THRESHOLD && cluster) {
                this.absorbIntoCluster(orphan, cluster);
                this.log(`   Pass 2: Absorbed orphan (sim: ${similarity.toFixed(3)})`);
            } else {
                finalOrphans.push(orphan);
            }
        }

        // Pass 3: Handle remaining orphans
        if (finalOrphans.length === 0) {
            return multiClusters;
        }

        this.log(`   ${finalOrphans.length} true orphan(s) remain`);

        // If space allows, keep them separate (they'll be ungrouped)
        if (multiClusters.length + finalOrphans.length <= groupCapacity) {
            return [...multiClusters, ...finalOrphans];
        }

        // Create MISC only if we have enough orphans and need to save space
        if (finalOrphans.length >= this.config.MIN_ORPHANS_FOR_MISC) {
            this.log(`   Creating MISC group for ${finalOrphans.length} orphans`);
            const miscCluster = this.createMiscCluster(finalOrphans);
            return [...multiClusters, miscCluster];
        }

        return [...multiClusters, ...finalOrphans];
    }

    /**
     * Cluster singletons with each other
     */
    clusterSingletonsTogether(singletons) {
        if (singletons.length <= 1) return singletons;

        const clusters = [];
        const threshold = this.config.SINGLETON_CLUSTER_THRESHOLD;

        for (const singleton of singletons) {
            let bestCluster = null;
            let bestScore = -1;

            for (const cluster of clusters) {
                const sim = this.cosineSimilarity(singleton.centroid, cluster.centroid);
                const domainMatch = cluster.domains.has(singleton.items[0].domain);
                const score = sim + (domainMatch ? this.config.DOMAIN_AFFINITY_BOOST : 0);

                if (score > bestScore) {
                    bestScore = score;
                    bestCluster = cluster;
                }
            }

            if (bestScore >= threshold && bestCluster) {
                this.absorbIntoCluster(singleton, bestCluster);
            } else {
                clusters.push(this.cloneCluster(singleton));
            }
        }

        return clusters;
    }

    /**
     * Find closest cluster for a singleton
     */
    findClosestCluster(singleton, clusters) {
        let bestCluster = null;
        let bestSim = -1;

        for (const cluster of clusters) {
            const sim = this.cosineSimilarity(singleton.centroid, cluster.centroid);
            if (sim > bestSim) {
                bestSim = sim;
                bestCluster = cluster;
            }
        }

        return { cluster: bestCluster, similarity: bestSim };
    }

    /**
     * Absorb a cluster into another
     */
    absorbIntoCluster(source, target) {
        target.indices.push(...source.indices);
        target.items.push(...source.items);
        target.embeddings.push(...source.embeddings);
        source.domains.forEach(d => target.domains.add(d));
        target.centroid = this.computeCentroid(target.embeddings);
    }

    /**
     * Clone a cluster
     */
    cloneCluster(cluster) {
        return {
            indices: [...cluster.indices],
            items: [...cluster.items],
            embeddings: [...cluster.embeddings],
            domains: new Set(cluster.domains),
            centroid: cluster.centroid
        };
    }

    /**
     * Create a MISC cluster from orphans
     */
    createMiscCluster(orphans) {
        return {
            indices: orphans.flatMap(o => o.indices),
            items: orphans.flatMap(o => o.items),
            embeddings: orphans.flatMap(o => o.embeddings),
            domains: new Set(orphans.flatMap(o => [...o.domains])),
            centroid: this.computeCentroid(orphans.flatMap(o => o.embeddings)),
            isMisc: true
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLUSTER NAMING & OUTPUT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Generate semantic names and colors for clusters
     */
    async generateClusterMetadata(clusters) {
        const colors = ['blue', 'green', 'yellow', 'red', 'pink', 'purple', 'cyan', 'orange', 'grey'];
        const results = [];

        for (let i = 0; i < clusters.length; i++) {
            const cluster = clusters[i];

            // Skip single-item clusters (they'll be left ungrouped)
            if (cluster.items.length === 1) continue;

            const name = cluster.isMisc ? 'MISC' : await this.generateClusterName(cluster);

            results.push({
                name,
                color: colors[i % colors.length],
                tabIds: cluster.items.map(item => item.tab.id)
            });
        }

        return results;
    }

    /**
     * Generate a semantic name for a cluster
     * Uses TF-IDF-like scoring + semantic similarity to centroid
     */
    async generateClusterName(cluster) {
        const stopWords = new Set([
            'the', 'and', 'is', 'in', 'at', 'of', 'for', 'to', 'with', 'on', 'a', 'an',
            'http', 'https', 'com', 'www', 'video', 'watch', 'google', 'youtube',
            'org', 'en', 'this', 'that', 'your', 'you', 'are', 'was', 'were', 'been',
            'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might',
            'new', 'latest', 'home', 'page', 'site', 'web', 'online', 'free', 'best'
        ]);

        // Candidate extraction with frequency counting
        const candidates = new Map();

        // Add domain-based candidates
        for (const domain of cluster.domains) {
            if (!domain) continue;
            const parts = domain.split('.').filter(p =>
                p.length > 2 && !['com', 'org', 'net', 'io', 'co', 'www'].includes(p)
            );
            const main = parts.reduce((a, b) => a.length > b.length ? a : b, '');
            if (main) {
                candidates.set(main, (candidates.get(main) || 0) + 3);
            }
        }

        // Extract from titles
        for (const item of cluster.items) {
            const title = item.tab.title || '';
            const words = title.toLowerCase()
                .split(/[\W_]+/)
                .filter(w => w.length > 2 && !stopWords.has(w));

            // Unigrams
            for (const w of words) {
                candidates.set(w, (candidates.get(w) || 0) + 1);
            }

            // Bigrams (higher weight)
            for (let i = 0; i < words.length - 1; i++) {
                const bigram = `${words[i]} ${words[i + 1]}`;
                candidates.set(bigram, (candidates.get(bigram) || 0) + 2);
            }
        }

        if (candidates.size === 0) return 'GROUP';

        // Get top candidates by frequency
        const topCandidates = [...candidates.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([word]) => word);

        // Find best semantic match to centroid
        let bestScore = -1;
        let bestName = topCandidates[0];

        for (const candidate of topCandidates) {
            const vec = await this.getEmbedding(candidate);
            const score = this.cosineSimilarity(vec, cluster.centroid);
            if (score > bestScore) {
                bestScore = score;
                bestName = candidate;
            }
        }

        // Format: Title case for multi-word, UPPERCASE for single word
        if (bestName.includes(' ')) {
            return bestName.split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
        }
        return bestName.toUpperCase();
    }
}
