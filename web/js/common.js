// Keeps the highlighted Java line visible inside the code panel.
// Works on every page, so the page scripts do not need to change.
(function () {
    const box = document.querySelector(".code-content");
    if (!box) return;

    let frame = null;

    function revealActiveLine() {
        const line = box.querySelector(".code-line.active");
        if (!line) return;

        const boxRect = box.getBoundingClientRect();
        const lineRect = line.getBoundingClientRect();
        const margin = 30;

        if (lineRect.top < boxRect.top + margin ||
            lineRect.bottom > boxRect.bottom - margin) {
            box.scrollTop +=
                (lineRect.top + lineRect.height / 2) -
                (boxRect.top + boxRect.height / 2);
        }
    }

    new MutationObserver(function () {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(revealActiveLine);
    }).observe(box, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class"]
    });
})();

// =====================================
// Shared array helpers (input row on every page)
// =====================================
window.AlgoLab = {
    // Reads "5, 3, 8" -> { values: [5, 3, 8] } or { error: "..." }
    parseArray: function (text, options) {
        const o = Object.assign(
            { min: 2, max: 12, minValue: 1, maxValue: 999 },
            options
        );

        const raw = String(text).trim();

        if (raw === "") {
            return { error: "Please enter some numbers." };
        }

        const parts = raw.split(",").map(function (p) { return p.trim(); });

        if (parts.some(function (p) { return !/^-?\d+$/.test(p); })) {
            return { error: "Use whole numbers separated by commas, e.g. 8, 3, 5, 1." };
        }

        const values = parts.map(Number);

        if (values.length < o.min || values.length > o.max) {
            return { error: "Enter between " + o.min + " and " + o.max + " numbers." };
        }

        if (values.some(function (v) { return v < o.minValue || v > o.maxValue; })) {
            return { error: "Each number must be between " + o.minValue + " and " + o.maxValue + "." };
        }

        return { values: values };
    },

    // Shows a small message beside the array input
    showHint: function (text, isError) {
        const hint = document.getElementById("arrayHint");
        if (!hint) return;
        hint.textContent = text;
        hint.classList.toggle("error", Boolean(isError));
    }
};

// =====================================
// Queue type picker (queue pages)
// =====================================
(function () {
    const select = document.getElementById("queueType") || document.getElementById("listType") || document.getElementById("treeType");
    const button = document.getElementById("openQueueBtn") || document.getElementById("openListBtn") || document.getElementById("openTreeBtn");

    if (!select || !button) return;

    const here = decodeURIComponent(
        window.location.pathname.split("/").pop() || "index.html"
    );

    function sync() {
        button.disabled = select.value === here;
        button.title = button.disabled
            ? "You are already on this visualizer"
            : "Open " + select.options[select.selectedIndex].text;
    }

    select.addEventListener("change", sync);
    sync();

    button.addEventListener("click", function () {
        window.location.href = select.value;
    });
})();

// =====================================
// Step chip + progress bar (data structure pages)
// =====================================
AlgoLab.setChip = function (element, type) {
    if (!element) return;

    const labels = {
        ready: "Ready", init: "Setup", call: "Call", check: "Check",
        compare: "Compare", error: "Error", done: "Done", read: "Read",
        store: "Write", grow: "Update", shrink: "Update", shift: "Move",
        pointer: "Setup", reset: "Reset", push: "Push", pop: "Pop",
        match: "Match", swap: "Swap", save: "Save", recurse: "Recurse"
    };

    element.textContent = labels[type] || "Step";

    element.className = "step-chip" + (
        type === "error" ? " is-error"
        : type === "done" ? " is-done"
        : type === "check" || type === "compare" ? " is-check"
        : ""
    );
};

AlgoLab.setProgress = function (counter, index, total) {
    if (!counter || !counter.parentElement) return;

    const percent = total > 1 ? ((index + 1) / total) * 100 : 100;

    counter.parentElement.style.setProperty("--progress", percent + "%");
};

// Select the number when a number box gets focus, so typing replaces it
document.addEventListener("focusin", function (event) {
    const target = event.target;

    if (target && target.matches && target.matches('input[type="number"]')) {
        target.select();
    }
});

// =====================================
// Animation speed (set by the speed slider in enhance.js)
// =====================================
AlgoLab.speedFactor = 1;

AlgoLab.interval = function (baseMilliseconds) {
    return Math.max(120, Math.round(baseMilliseconds * AlgoLab.speedFactor));
};

try {
    const saved = localStorage.getItem("algolab-speed");

    if (saved === "0") AlgoLab.speedFactor = 1.6;
    else if (saved === "2") AlgoLab.speedFactor = 0.5;
} catch (error) {
    // storage can be blocked, the default speed stays
}
