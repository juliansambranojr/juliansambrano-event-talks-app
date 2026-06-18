// State Management
let state = {
    releases: [],
    filteredReleases: [],
    currentCategory: 'all',
    searchQuery: '',
    selectedReleaseForShare: null
};

// DOM Elements
const elements = {
    btnRefresh: document.getElementById('btn-refresh'),
    refreshSpinner: document.getElementById('refresh-spinner'),
    refreshStaticIcon: document.getElementById('refresh-static-icon'),
    searchInput: document.getElementById('search-input'),
    categoryFilters: document.getElementById('category-filters'),
    visibleCount: document.getElementById('visible-count'),
    totalCount: document.getElementById('total-count'),
    
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    btnRetry: document.getElementById('btn-retry'),
    noResultsState: document.getElementById('no-results-state'),
    timelineContainer: document.getElementById('timeline-container'),
    releasesList: document.getElementById('releases-list'),
    
    // Modal
    shareModal: document.getElementById('share-modal'),
    modalClose: document.getElementById('modal-close'),
    modalPreviewDate: document.getElementById('modal-preview-date'),
    modalPreviewCategory: document.getElementById('modal-preview-category'),
    modalPreviewText: document.getElementById('modal-preview-text'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCount: document.getElementById('char-count'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    modalTweetBtn: document.getElementById('modal-tweet-btn'),
    btnExportCsv: document.getElementById('btn-export-csv')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Refresh button
    elements.btnRefresh.addEventListener('click', () => fetchReleases(true));
    elements.btnRetry.addEventListener('click', () => fetchReleases(true));
    
    // Search
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        applyFilters();
    });
    
    // Category chips
    elements.categoryFilters.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;
        
        // Update active class
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        state.currentCategory = chip.dataset.category;
        applyFilters();
    });
    
    // Modal Close actions
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalCancelBtn.addEventListener('click', closeModal);
    elements.shareModal.addEventListener('click', (e) => {
        if (e.target === elements.shareModal) closeModal();
    });
    
    // Tweet Textarea length listener
    elements.tweetTextarea.addEventListener('input', (e) => {
        const length = e.target.value.length;
        elements.charCount.textContent = length;
        if (length > 280) {
            elements.charCount.parentElement.classList.add('limit-exceeded');
            elements.modalTweetBtn.disabled = true;
        } else {
            elements.charCount.parentElement.classList.remove('limit-exceeded');
            elements.modalTweetBtn.disabled = false;
        }
    });
    
    // Confirm Send Tweet
    elements.modalTweetBtn.addEventListener('click', () => {
        const text = elements.tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        closeModal();
    });
    
    // Export CSV
    elements.btnExportCsv.addEventListener('click', exportToCSV);
}

// Fetch Release Notes
async function fetchReleases(forceRefresh = false) {
    showState('loading');
    setRefreshButtonState(true);
    
    const url = forceRefresh ? '/api/releases?refresh=true' : '/api/releases';
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
            state.releases = result.data;
            applyFilters();
            showState('success');
        } else {
            throw new Error(result.error || 'Invalid data structure received.');
        }
    } catch (error) {
        console.error('Error fetching releases:', error);
        elements.errorMessage.textContent = error.message || 'Could not fetch release notes.';
        showState('error');
    } finally {
        setRefreshButtonState(false);
    }
}

// Set loading animation on header refresh button
function setRefreshButtonState(isLoading) {
    if (isLoading) {
        elements.btnRefresh.disabled = true;
        elements.refreshSpinner.classList.remove('hidden');
        elements.refreshStaticIcon.classList.add('hidden');
    } else {
        elements.btnRefresh.disabled = false;
        elements.refreshSpinner.classList.add('hidden');
        elements.refreshStaticIcon.classList.remove('hidden');
    }
}

// Display/Hide containers based on view state
function showState(view) {
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.noResultsState.classList.add('hidden');
    elements.timelineContainer.classList.add('hidden');
    
    if (view === 'loading') {
        elements.loadingState.classList.remove('hidden');
    } else if (view === 'error') {
        elements.errorState.classList.remove('hidden');
    } else if (view === 'success') {
        if (state.filteredReleases.length === 0) {
            elements.noResultsState.classList.remove('hidden');
        } else {
            elements.timelineContainer.classList.remove('hidden');
        }
    }
}

// Convert HTML content into simple text description
function htmlToPlainText(htmlString) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    return tempDiv.innerText || tempDiv.textContent || '';
}

// Filter logic
function applyFilters() {
    state.filteredReleases = state.releases.filter(release => {
        // 1. Category Filter
        const categoryMatch = state.currentCategory === 'all' || 
            release.category.toLowerCase() === state.currentCategory;
            
        // 2. Search query filter
        const textToSearch = `${release.date} ${release.category} ${htmlToPlainText(release.content)}`.toLowerCase();
        const searchMatch = !state.searchQuery || textToSearch.includes(state.searchQuery);
        
        return categoryMatch && searchMatch;
    });
    
    // Update labels
    elements.visibleCount.textContent = state.filteredReleases.length;
    elements.totalCount.textContent = state.releases.length;
    
    renderTimeline();
    
    if (state.filteredReleases.length === 0 && state.releases.length > 0) {
        showState('success'); // will trigger noResultsState since length is 0
    }
}

// Render dynamic Release Cards
function renderTimeline() {
    elements.releasesList.innerHTML = '';
    
    state.filteredReleases.forEach((release, index) => {
        const card = document.createElement('div');
        card.className = 'release-card';
        card.style.animationDelay = `${index * 0.05}s`;
        
        const categoryClass = `badge-${release.category.toLowerCase()}`;
        
        card.innerHTML = `
            <div class="card-header">
                <div class="meta-info">
                    <span class="release-date">${release.date}</span>
                    <span class="badge ${categoryClass}">${release.category}</span>
                </div>
                <div class="share-action">
                    <button class="btn-copy" data-index="${index}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>Copy</span>
                    </button>
                    <button class="btn-share" data-index="${index}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>Share</span>
                    </button>
                </div>
            </div>
            <div class="card-body">
                ${release.content}
            </div>
        `;
        
        // Listen to copy button
        card.querySelector('.btn-copy').addEventListener('click', (e) => {
            copyReleaseToClipboard(release, e.currentTarget);
        });
        
        // Listen to share button
        card.querySelector('.btn-share').addEventListener('click', () => {
            openShareModal(release);
        });
        
        elements.releasesList.appendChild(card);
    });
}

// Tweet/X Share Modal Actions
function openShareModal(release) {
    state.selectedReleaseForShare = release;
    
    // Set date and category preview
    elements.modalPreviewDate.textContent = release.date;
    elements.modalPreviewCategory.textContent = release.category;
    elements.modalPreviewCategory.className = `badge badge-${release.category.toLowerCase()}`;
    
    // Get clean text for preview
    const rawText = htmlToPlainText(release.content);
    elements.modalPreviewText.textContent = rawText;
    
    // Build premium pre-filled tweet text
    // Format: BQ Update | June 17, 2026
    // [Feature]: ...
    const intro = `BigQuery Update | ${release.date}\n\n📢 [${release.category}]: `;
    const tags = `\n\n#GoogleCloud #BigQuery`;
    
    // Calculate space left for the main description
    const maxDescLength = 280 - intro.length - tags.length;
    
    let cleanDesc = rawText.trim();
    if (cleanDesc.length > maxDescLength) {
        cleanDesc = cleanDesc.slice(0, maxDescLength - 3) + '...';
    }
    
    const draftText = `${intro}${cleanDesc}${tags}`;
    
    elements.tweetTextarea.value = draftText;
    elements.charCount.textContent = draftText.length;
    
    if (draftText.length > 280) {
        elements.charCount.parentElement.classList.add('limit-exceeded');
        elements.modalTweetBtn.disabled = true;
    } else {
        elements.charCount.parentElement.classList.remove('limit-exceeded');
        elements.modalTweetBtn.disabled = false;
    }
    
    // Display Modal
    elements.shareModal.classList.remove('hidden');
}

function closeModal() {
    elements.shareModal.classList.add('hidden');
    state.selectedReleaseForShare = null;
}

// Copy single release note to clipboard
async function copyReleaseToClipboard(release, buttonEl) {
    const plainTextContent = htmlToPlainText(release.content).trim();
    const formattedText = `BigQuery Update [${release.category}] - ${release.date}\n\n${plainTextContent}`;
    
    try {
        await navigator.clipboard.writeText(formattedText);
        
        // Visual Feedback
        buttonEl.classList.add('copied');
        const textSpan = buttonEl.querySelector('span');
        const originalText = textSpan.textContent;
        textSpan.textContent = 'Copied!';
        
        setTimeout(() => {
            buttonEl.classList.remove('copied');
            textSpan.textContent = originalText;
        }, 1500);
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert('Could not copy to clipboard. Please try manually copying.');
    }
}

// Export current list to CSV
function exportToCSV() {
    if (state.filteredReleases.length === 0) {
        alert('No releases available to export.');
        return;
    }
    
    // Header
    const csvRows = [['Date', 'Category', 'Plain Text Content', 'HTML Content']];
    
    state.filteredReleases.forEach(release => {
        const plainText = htmlToPlainText(release.content).trim();
        csvRows.push([
            release.date,
            release.category,
            plainText,
            release.content
        ]);
    });
    
    // Escape and join
    const csvContent = csvRows.map(row => {
        return row.map(val => {
            const escaped = val.replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(',');
    }).join('\n');
    
    // Download trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bigquery_releases_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

