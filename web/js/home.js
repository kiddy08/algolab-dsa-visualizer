"use strict";

(function () {
    const searchInput = document.getElementById("algorithmSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const categoryButtons = [...document.querySelectorAll("[data-filter-category]")];
    const difficultyButtons = [...document.querySelectorAll("[data-filter-difficulty]")];
    const categoryBlocks = [...document.querySelectorAll(".category-block")];
    const algoCards = [...document.querySelectorAll(".algo-card")];
    const filterResultCount = document.getElementById("filterResultCount");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const emptyStateResetBtn = document.getElementById("emptyStateResetBtn");
    const noResultsBox = document.getElementById("noResults");
    const themeToggleBtn = document.getElementById("homeThemeToggle");

    let activeCategory = "all";
    let activeDifficulty = "all";
    let searchQuery = "";

    // ==========================================
    // 1. THEME TOGGLE (Synced with enhance.js `algolab-theme`)
    // ==========================================

    function getSavedTheme() {
        try {
            return localStorage.getItem("algolab-theme") || "dark";
        } catch (e) {
            return "dark";
        }
    }

    function applyTheme(mode) {
        const isLight = mode === "light";
        document.body.classList.toggle("theme-light", isLight);
        document.body.classList.toggle("theme-dark", !isLight);
        if (themeToggleBtn) {
            themeToggleBtn.textContent = isLight ? "🌙" : "☀";
            themeToggleBtn.title = isLight ? "Switch to dark mode" : "Switch to light mode";
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const nextMode = document.body.classList.contains("theme-light") ? "dark" : "light";
            applyTheme(nextMode);
            try {
                localStorage.setItem("algolab-theme", nextMode);
            } catch (e) {
                // ignore storage errors
            }
        });
    }

    applyTheme(getSavedTheme());

    // ==========================================
    // 2. COMBINED SEARCH + CATEGORY + DIFFICULTY FILTER
    // ==========================================

    function applyFilters() {
        const q = searchQuery.trim().toLowerCase();
        let totalVisibleCards = 0;

        if (clearSearchBtn) {
            clearSearchBtn.classList.toggle("hidden", q.length === 0);
        }

        algoCards.forEach(card => {
            const cardCat = (card.dataset.category || "").toLowerCase();
            const cardDiff = (card.dataset.difficulty || "").toLowerCase();
            const searchable = ((card.dataset.search || "") + " " + card.textContent).toLowerCase();

            const matchCat = activeCategory === "all" || cardCat === activeCategory;
            const matchDiff = activeDifficulty === "all" || cardDiff === activeDifficulty;
            const matchQuery = q === "" || searchable.includes(q);

            const visible = matchCat && matchDiff && matchQuery;
            card.classList.toggle("hidden", !visible);
            if (visible) totalVisibleCards++;
        });

        // Hide entire category section if 0 cards inside it are visible
        categoryBlocks.forEach(block => {
            const visibleInBlock = block.querySelectorAll(".algo-card:not(.hidden)").length;
            block.classList.toggle("hidden", visibleInBlock === 0);
        });

        if (noResultsBox) {
            noResultsBox.classList.toggle("hidden", totalVisibleCards !== 0);
        }

        if (filterResultCount) {
            const isFiltered = activeCategory !== "all" || activeDifficulty !== "all" || q !== "";
            filterResultCount.textContent = isFiltered
                ? `Showing ${totalVisibleCards} of ${algoCards.length} algorithm entries`
                : `Showing all ${algoCards.length} algorithm entries across 24 visualizer pages (6 categories)`;
        }

        if (resetFiltersBtn) {
            const isFiltered = activeCategory !== "all" || activeDifficulty !== "all" || q !== "";
            resetFiltersBtn.classList.toggle("hidden", !isFiltered);
        }
    }

    function setCategoryFilter(cat) {
        activeCategory = cat;
        categoryButtons.forEach(btn => {
            const active = btn.dataset.filterCategory === cat;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
        });
        applyFilters();
    }

    function setDifficultyFilter(diff) {
        activeDifficulty = diff;
        difficultyButtons.forEach(btn => {
            const active = btn.dataset.filterDifficulty === diff;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
        });
        applyFilters();
    }

    function resetAllFilters() {
        searchQuery = "";
        if (searchInput) searchInput.value = "";
        activeCategory = "all";
        activeDifficulty = "all";
        categoryButtons.forEach(btn => {
            const active = btn.dataset.filterCategory === "all";
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
        });
        difficultyButtons.forEach(btn => {
            const active = btn.dataset.filterDifficulty === "all";
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
        });
        applyFilters();
    }

    if (searchInput) {
        searchInput.addEventListener("input", function () {
            searchQuery = this.value;
            applyFilters();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
            searchQuery = "";
            if (searchInput) {
                searchInput.value = "";
                searchInput.focus();
            }
            applyFilters();
        });
    }

    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            setCategoryFilter(btn.dataset.filterCategory);
        });
    });

    difficultyButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            setDifficultyFilter(btn.dataset.filterDifficulty);
        });
    });

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener("click", resetAllFilters);
    }

    if (emptyStateResetBtn) {
        emptyStateResetBtn.addEventListener("click", resetAllFilters);
    }

    // Category quick-filter links inside roadmap or category headers
    document.querySelectorAll("[data-jump-category]").forEach(el => {
        el.addEventListener("click", e => {
            const targetCat = el.dataset.jumpCategory;
            if (targetCat) {
                setCategoryFilter(targetCat);
            }
        });
    });

    applyFilters();
})();
