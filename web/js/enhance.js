// =====================================
// AlgoLab learning tools (loaded on every visualizer page)
//  1 Copy code        2 Help popup        3 Keyboard shortcuts
//  4 Speed slider     5 Step counter + progress bar
//  6 Comparisons / swaps counters         7 Variable watch box
//  8 Code auto-scroll (common.js)         9 Home search (index.html)
// 10 Preset inputs   11 Complexity popup 12 Dark mode
// 13 Finish summary  14 Quiz mode        15 Share link
// =====================================
(function () {
    "use strict";

    const FILE = (window.location.pathname.split("/").pop() || "index.html")
        .replace(/\.html$/, "");

    if (FILE === "index" || FILE === "") return;

    // ---------- small helpers ----------

    const $ = (selector, root) => (root || document).querySelector(selector);
    const $$ = (selector, root) => [...(root || document).querySelectorAll(selector)];

    function make(tag, className, text) {
        const element = document.createElement(tag);

        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;

        return element;
    }

    const store = {
        get(key, fallback) {
            try {
                const value = localStorage.getItem("algolab-" + key);

                return value === null ? fallback : value;
            } catch (error) {
                return fallback;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem("algolab-" + key, value);
            } catch (error) {
                // storage can be blocked, the setting still works for this visit
            }
        }
    };

    // Reads a variable that a page script declared with let / const
    function pageVar(name) {
        try {
            return (0, eval)(name);
        } catch (error) {
            return undefined;
        }
    }

    function getSteps() {
        const steps = pageVar("steps");

        return Array.isArray(steps) ? steps : [];
    }

    function getIndex() {
        const index = pageVar("currentStep");

        return typeof index === "number" ? index : -1;
    }

    const NEXT = "#stepBtn, #next-btn";
    const PREV = "#prevBtn, #prev-btn";
    const PLAY = "#startBtn, #play-btn";
    const RESET = "#resetBtn, #reset-btn";
    const ARRAY_INPUT = "#arrayInput, #array-input";
    const LOAD = "#applyArrayBtn, #load-btn";

    const SORTS = ["bubble_sort", "selection_sort", "insertion_sort", "quick_sort", "merge_sort", "heap_sort"];
    const SEARCHES = ["linear_search", "binary_search"];

    const KIND = SORTS.includes(FILE) ? "sort"
        : SEARCHES.includes(FILE) ? "search"
        : FILE === "balanced_brackets" ? "brackets"
        : "structure";

    function titleOf(step) {
        return step ? (step.action || step.title || "") : "";
    }

    function whyOf(step) {
        return step ? (step.why || step.text || step.message || "") : "";
    }


    // ---------- toast ----------

    let toastTimer = null;

    function toast(message) {
        let box = $("#enhToast");

        if (!box) {
            box = make("div", "enh-toast");
            box.id = "enhToast";
            box.setAttribute("role", "status");
            document.body.appendChild(box);
        }

        box.textContent = message;
        box.classList.add("is-visible");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => box.classList.remove("is-visible"), 2200);
    }


    // ---------- modal ----------

    let activeModal = null;

    function closeModal() {
        if (activeModal) {
            activeModal.remove();
            activeModal = null;
        }
    }

    function openModal(title, buildBody, options) {
        closeModal();

        const overlay = make("div", "enh-overlay");
        const card = make("div", "enh-modal");

        card.setAttribute("role", "dialog");
        card.setAttribute("aria-modal", "true");

        const head = make("div", "enh-modal-head");
        head.appendChild(make("h3", "", title));

        const close = make("button", "enh-modal-close", "✕");
        close.setAttribute("aria-label", "Close");
        close.addEventListener("click", closeModal);
        head.appendChild(close);

        const body = make("div", "enh-modal-body");
        buildBody(body);

        card.append(head, body);
        overlay.appendChild(card);

        overlay.addEventListener("click", event => {
            if (event.target === overlay && !(options && options.sticky)) closeModal();
        });

        document.body.appendChild(overlay);
        activeModal = overlay;

        return { overlay, card, body };
    }

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && activeModal && !activeModal.dataset.sticky) {
            closeModal();
        }
    });


    // =====================================
    // 12  DARK MODE + toolbar buttons (Help, Theme)
    // =====================================

    function applyTheme(dark) {
        document.body.classList.toggle("theme-dark", dark);

        const button = $("#enhTheme");

        if (button) {
            button.textContent = dark ? "☀" : "🌙";
            button.title = dark ? "Switch to light mode" : "Switch to dark mode";
        }
    }

    const topbar = $(".topbar");

    if (topbar) {
        const tools = make("div", "enh-tools");

        const help = make("button", "enh-icon", "?");
        help.id = "enhHelp";
        help.title = "Help: how to use this page";
        help.setAttribute("aria-label", "Help");

        const theme = make("button", "enh-icon", "🌙");
        theme.id = "enhTheme";
        theme.setAttribute("aria-label", "Toggle dark mode");

        tools.append(help, theme);

        const home = $(".home-btn", topbar);

        if (home) topbar.insertBefore(tools, home);
        else topbar.appendChild(tools);

        theme.addEventListener("click", () => {
            const dark = !document.body.classList.contains("theme-dark");

            applyTheme(dark);
            store.set("theme", dark ? "dark" : "light");
        });

        help.addEventListener("click", openHelp);
    }

    applyTheme(store.get("theme", "light") === "dark");


    // =====================================
    // 11  COMPLEXITY POPUP
    // =====================================

    const COMPLEXITY = {
        "O(1)": {
            name: "Constant time",
            text: "The work does not depend on how many items there are. Pushing onto a stack takes the same time with 10 items or 10 million.",
            growth: n => 1
        },
        "O(log n)": {
            name: "Logarithmic time",
            text: "Every step throws away half of the remaining items. Binary search finds a value among 1,000,000 items in about 20 steps.",
            growth: n => Math.ceil(Math.log2(n))
        },
        "O(n)": {
            name: "Linear time",
            text: "The work grows in step with the number of items. Doubling the items doubles the work, like reading every name in a list once.",
            growth: n => n
        },
        "O(n log n)": {
            name: "Linearithmic time",
            text: "Split the items again and again (log n levels) and do about n work on each level. Merge sort and heap sort work this way.",
            growth: n => Math.round(n * Math.log2(n))
        },
        "O(n²)": {
            name: "Quadratic time",
            text: "Every item is compared with every other item, so doubling the items makes the work four times bigger. Bubble, selection and insertion sort are O(n²) in the worst case.",
            growth: n => n * n
        }
    };

    function complexityKey(text) {
        const match = /O\(([^)]*)\)/.exec(text);

        if (!match) return null;

        const inside = match[1].replace(/\s+/g, " ").trim()
            .replace("n^2", "n²").replace("n2", "n²");

        return "O(" + inside + ")";
    }

    $$(".complexity span").forEach(chip => {
        chip.classList.add("enh-clickable");
        chip.setAttribute("tabindex", "0");
        chip.setAttribute("role", "button");
        chip.title = "Click to learn what this means";

        const show = () => openComplexity(chip.textContent.trim());

        chip.addEventListener("click", show);
        chip.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                show();
            }
        });
    });

    function openComplexity(label) {
        const key = complexityKey(label);
        const info = key ? COMPLEXITY[key] : null;

        openModal(label, body => {
            if (!info) {
                body.appendChild(make("p", "", "Big-O describes how the running time or memory grows when the number of items (n) grows."));
                return;
            }

            body.appendChild(make("p", "enh-lead", `${key} means ${info.name.toLowerCase()}.`));
            body.appendChild(make("p", "", info.text));
            body.appendChild(make("p", "", "n is the number of items. Here is how many basic steps it needs:"));

            const table = make("table", "enh-table");
            const header = make("tr");

            ["n (items)", "steps"].forEach(text => header.appendChild(make("th", "", text)));
            table.appendChild(header);

            [4, 8, 16, 100].forEach(n => {
                const row = make("tr");

                row.appendChild(make("td", "", String(n)));
                row.appendChild(make("td", "", info.growth(n).toLocaleString()));
                table.appendChild(row);
            });

            body.appendChild(table);
            body.appendChild(make("p", "enh-note", "Space complexity uses the same idea, but counts memory instead of time."));
        });
    }


    // =====================================
    // 2 / 3  HELP POPUP + KEYBOARD SHORTCUTS
    // =====================================

    const TERMS = {
        bubble_sort: [
            ["Pass", "One trip through the array, comparing neighbouring values."],
            ["Swap", "Exchange two values. A temporary variable keeps one of them safe."],
            ["Sorted part", "After every pass the biggest remaining value has bubbled to the end."]
        ],
        selection_sort: [
            ["minIndex", "The index of the smallest value found so far in this pass."],
            ["Sorted prefix", "The front part of the array that is already final."],
            ["Swap", "At the end of each pass the minimum is swapped into place."]
        ],
        insertion_sort: [
            ["key", "The value being inserted into the sorted part on the left."],
            ["Shift", "A bigger value moves one place right to make room for the key."],
            ["Sorted part", "The values to the left of the key are always in order."]
        ],
        quick_sort: [
            ["Pivot", "The value everything else is compared with. Here it is the last element."],
            ["Partition", "Move smaller values to the left of the pivot and bigger ones to the right."],
            ["i and j", "j scans the array. i marks the end of the 'smaller than pivot' section."],
            ["Recursion", "The left and right parts are sorted the same way."]
        ],
        merge_sort: [
            ["Divide", "Split the array into two halves until each part has one value."],
            ["Merge", "Combine two sorted parts into one sorted part by taking the smaller front value."],
            ["Base case", "A part with 0 or 1 value is already sorted, so recursion stops."]
        ],
        heap_sort: [
            ["Max-heap", "A tree where every parent is bigger than or equal to its children."],
            ["heapify", "Push a value down until the heap rule holds again."],
            ["Index rules", "For index i: left child = 2i + 1, right child = 2i + 2."]
        ],
        linear_search: [
            ["Target", "The value you are looking for."],
            ["Index", "The position of a value. The first value is at index 0."],
            ["Linear", "Check every value one by one until you find the target."]
        ],
        binary_search: [
            ["low / high / mid", "The left end, right end and middle of the part still being searched."],
            ["Sorted array", "Binary search only works when the values are in order."],
            ["Halving", "Each comparison removes half of the remaining values."]
        ],
        stack: [
            ["LIFO", "Last In, First Out. The newest value leaves first."],
            ["top", "Index of the newest value. An empty stack has top = -1."],
            ["Overflow / Underflow", "Pushing onto a full stack / popping from an empty stack."]
        ],
        balanced_brackets: [
            ["Stack", "Opening brackets wait on a stack until their closing partner arrives."],
            ["Matching pair", "( with ), [ with ], { with }."],
            ["Balanced", "Every bracket is matched and the stack is empty at the end."]
        ]
    };

    const QUEUE_TERMS = [
        ["FIFO", "First In, First Out. The value that waited longest leaves first."],
        ["front / rear", "front is where values leave. rear is where values join."],
        ["Overflow / Underflow", "Adding to a full queue / removing from an empty queue."]
    ];

    const LIST_TERMS = [
        ["Node", "One element of the list. It holds data and pointers."],
        ["HEAD", "A pointer to the first node. The list is lost without it."],
        ["next / prev", "Pointers to the following / previous node. null means 'nothing'."],
        ["ptr / tail", "Helper pointers that walk along the list."]
    ];

    TERMS.queue = QUEUE_TERMS;
    TERMS.circular_queue = [
        ...QUEUE_TERMS,
        ["% (modulo)", "(index + 1) % capacity wraps the index back to 0 after the last slot."]
    ];
    TERMS.priority_queue = [
        ["Priority", "A smaller number means a higher priority (P1 leaves first)."],
        ["Stable order", "Values with equal priority leave in the order they arrived."],
        ["Shift", "Values move one slot to make room, or to close the gap."]
    ];
    TERMS.deque = [
        ["Deque", "Double-ended queue: add and remove at both ends."],
        ["front / rear", "Both ends can grow and shrink. Both wrap around the array."],
        ["% (modulo)", "Keeps indexes inside the array, so no slot is wasted."]
    ];

    ["linked_list", "doubly_linked_list", "circular_linked_list", "doubly_circular_linked_list"]
        .forEach(name => {
            TERMS[name] = LIST_TERMS;
        });

    TERMS.graph = [
        ["BFS (Breadth-First Search)", "Explores vertices wave by wave using a FIFO Queue. Finds shortest path in unweighted graphs."],
        ["DFS (Depth-First Search)", "Explores each branch as deep as possible using a LIFO Stack or Recursion before backtracking."],
        ["Dijkstra's Algorithm", "Finds shortest weighted paths from source using a Min-Priority Queue (requires non-negative weights)."],
        ["A* Search Algorithm", "Guides shortest path search toward Goal using f(n) = g(n) + h(n) where g is actual cost and h is heuristic."]
    ];
    TERMS.bst = [
        ["BST property", "Every key in the left subtree is smaller than the node, and every key in the right subtree is larger."],
        ["Inorder successor", "The smallest key in the right subtree — used to replace a deleted node that has two children."],
        ["Height", "Number of levels from root to the deepest leaf. Balanced = O(log n), skewed chain = O(n)."]
    ];
    TERMS.trie = [
        ["Trie (Prefix Tree)", "A multi-way tree where each edge represents a letter and words with the same prefix share nodes."],
        ["isEndOfWord (★)", "Marks that the path from the root to this node forms a complete stored word, not just a prefix."],
        ["startsWith (Autocomplete)", "Walks the prefix in O(L) time, then collects all stored words in that subtree."],
        ["Pruning on delete", "When deleting a word, leaf nodes with no children and isEndOfWord == false are removed bottom-up."]
    ];
    TERMS.avl_tree = [
        ["Balance factor (bf)", "bf(node) = height(left) - height(right). In an AVL tree every node must have bf in {-1, 0, +1}."],
        ["LL / RR (Single Rotation)", "LL (bf > 1, left child bf >= 0) uses rotateRight. RR (bf < -1, right child bf <= 0) uses rotateLeft."],
        ["LR / RL (Double Rotation)", "LR rotates the left child left then the parent right. RL rotates the right child right then the parent left."]
    ];
    TERMS.heap = [
        ["Min-Heap / Max-Heap", "Min-Heap keeps every parent <= its children (smallest at root). Max-Heap keeps every parent >= its children (largest at root)."],
        ["Complete binary tree", "Every level is filled left-to-right with no gaps, so the tree fits inside a plain array."],
        ["Sift-Up / Sift-Down", "Sift-Up bubbles a new leaf up to restore heap order; Sift-Down pushes a replacement root down."],
        ["Index math", "For index i: parent = (i - 1) / 2, left child = 2i + 1, right child = 2i + 2."]
    ];
    TERMS.tree_traversals = [
        ["Inorder (L-N-R)", "Visit Left subtree, then current Node, then Right subtree. Produces sorted order on a BST."],
        ["Preorder (N-L-R)", "Visit current Node first, then Left subtree, then Right subtree."],
        ["Postorder (L-R-N)", "Visit Left subtree, then Right subtree, and current Node last."],
        ["Level-Order (BFS)", "Visit nodes level by level from top to bottom using a FIFO Queue."]
    ];

    let shortcutsEnabled = store.get("shortcuts", "on") === "on";

    function shortcutsOn() {
        return shortcutsEnabled;
    }

    function openHelp() {
        openModal("How to use this page", body => {
            const guide = make("ol", "enh-list");

            [
                "Java Code (left): the highlighted yellow line is the line that is running now.",
                "Visualization (middle): see the values change. Colors tell you what is happening.",
                "Understand This Line (right): why the line runs, which values are used, and a tip.",
                "Use Next Step and Previous to move one step at a time, or Start / Replay to watch it play.",
                "Change the Speed slider if the animation is too fast or too slow.",
                "Click the Time / Space badges at the top to see what Big-O means."
            ].forEach(text => guide.appendChild(make("li", "", text)));

            body.appendChild(guide);

            const terms = TERMS[FILE];

            if (terms) {
                body.appendChild(make("h4", "", "Key terms on this page"));

                const list = make("dl", "enh-terms");

                terms.forEach(([word, meaning]) => {
                    list.appendChild(make("dt", "", word));
                    list.appendChild(make("dd", "", meaning));
                });

                body.appendChild(list);
            }

            body.appendChild(make("h4", "", "Keyboard shortcuts"));

            const keys = make("p", "enh-keys");
            keys.innerHTML =
                "<kbd>→</kbd> Next &nbsp; <kbd>←</kbd> Previous &nbsp; <kbd>Space</kbd> Play / Pause &nbsp; <kbd>R</kbd> Reset &nbsp; <kbd>?</kbd> Help";
            body.appendChild(keys);

            const label = make("label", "enh-check");
            const box = make("input");

            box.type = "checkbox";
            box.checked = shortcutsOn();
            box.addEventListener("change", () => {
                shortcutsEnabled = box.checked;
                store.set("shortcuts", box.checked ? "on" : "off");
                toast(box.checked ? "Keyboard shortcuts on" : "Keyboard shortcuts off");
            });

            label.append(box, document.createTextNode(" Use keyboard shortcuts"));
            body.appendChild(label);
        });
    }

    document.addEventListener("keydown", event => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (!shortcutsOn() || activeModal) return;

        const target = event.target;
        const tag = target && target.tagName;

        if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

        let selector = null;

        if (event.key === "ArrowRight") selector = NEXT;
        else if (event.key === "ArrowLeft") selector = PREV;
        else if (event.key === " ") selector = PLAY;
        else if (event.key === "r" || event.key === "R") selector = RESET;
        else if (event.key === "?") {
            event.preventDefault();
            openHelp();
            return;
        }

        if (!selector) return;

        const button = $(selector);

        if (button && !button.disabled) {
            event.preventDefault();
            button.click();
        }
    });


    // a focused button would also be clicked by the Space key on key-up
    document.addEventListener("keyup", event => {
        if (event.key !== " " || !shortcutsOn() || activeModal) return;

        const tag = event.target && event.target.tagName;

        if (tag === "BUTTON" || tag === "A") event.preventDefault();
    });


    // =====================================
    // 1  COPY CODE
    // =====================================

    const codeHead = $(".code-panel .panel-heading");

    if (codeHead) {
        const copy = make("button", "enh-copy", "📋 Copy");

        copy.title = "Copy the full Java code";
        codeHead.appendChild(copy);

        copy.addEventListener("click", () => {
            const text = $$(".code-content .code-line")
                .map(line => line.textContent.replace(/^\s*\d+\s{2}/, ""))
                .join("\n");

            const done = ok => {
                copy.textContent = ok ? "✔ Copied!" : "Press Ctrl+C";
                setTimeout(() => {
                    copy.textContent = "📋 Copy";
                }, 2000);
            };

            const fallback = () => {
                const area = document.createElement("textarea");

                area.value = text;
                area.style.position = "fixed";
                area.style.opacity = "0";
                document.body.appendChild(area);
                area.select();

                let ok = false;

                try {
                    ok = document.execCommand("copy");
                } catch (error) {
                    ok = false;
                }

                area.remove();
                done(ok);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => done(true), fallback);
            } else {
                fallback();
            }
        });
    }


    // =====================================
    // 4  SPEED SLIDER
    // =====================================

    const controls = $(".control-bar .controls");
    const extra = make("div", "enh-extra");

    const SPEEDS = [
        { name: "Slow", factor: 1.6, select: "1400" },
        { name: "Normal", factor: 1, select: "800" },
        { name: "Fast", factor: 0.5, select: "400" }
    ];

    const speedWrap = make("label", "enh-speed");
    const speedInput = make("input");
    const speedText = make("span", "enh-speed-text");

    speedInput.type = "range";
    speedInput.min = "0";
    speedInput.max = "2";
    speedInput.step = "1";
    speedInput.id = "enhSpeed";
    speedInput.setAttribute("aria-label", "Animation speed");

    speedWrap.append(document.createTextNode("Speed "), speedInput, speedText);
    extra.appendChild(speedWrap);

    function applySpeed(position) {
        const speed = SPEEDS[position];

        speedInput.value = String(position);
        speedText.textContent = speed.name;

        if (window.AlgoLab) window.AlgoLab.speedFactor = speed.factor;

        const select = $("#speedSelect");

        if (select) {
            select.value = speed.select;
            select.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }

    // the page's own Speed drop-down is replaced by the slider
    ["#speedSelect", "label[for='speedSelect']"].forEach(selector => {
        $$(selector).forEach(element => element.classList.add("enh-hidden"));
    });

    speedInput.addEventListener("input", () => {
        applySpeed(Number(speedInput.value));
        store.set("speed", speedInput.value);
    });

    applySpeed(Number(store.get("speed", "1")));


    // =====================================
    // 5  STEP COUNTER + PROGRESS BAR
    // =====================================

    const counterBox = $(".step-counter");

    function updateProgress() {
        if (!counterBox) return;

        const steps = getSteps();
        const index = getIndex();

        if (steps.length <= 1) {
            counterBox.style.setProperty("--progress", "0%");
            return;
        }

        const percent = Math.max(0, Math.min(1, (index + 1) / steps.length)) * 100;

        counterBox.style.setProperty("--progress", percent + "%");
    }


    // =====================================
    // 6  COUNTERS (comparisons, swaps ...)   7  VARIABLE WATCH
    // =====================================

    function count(steps, index, test) {
        let total = 0;

        for (let i = 0; i <= index && i < steps.length; i++) {
            if (test(steps[i])) total += 1;
        }

        return total;
    }

    function mergeComparisons(detail) {
        const match = /Left: \[(.*?)\] \| Right: \[(.*?)\]/.exec(detail || "");

        if (!match) return 0;

        const left = match[1].split(",").map(Number).filter(Number.isFinite);
        const right = match[2].split(",").map(Number).filter(Number.isFinite);

        let i = 0;
        let j = 0;
        let comparisons = 0;

        while (i < left.length && j < right.length) {
            comparisons += 1;

            if (left[i] <= right[j]) i += 1;
            else j += 1;
        }

        return comparisons;
    }

    const COUNTERS = {
        bubble_sort: (s, i) => ({
            Comparisons: count(s, i, x => x.type === "compare"),
            Swaps: count(s, i, x => x.action === "Finish the Swap")
        }),
        selection_sort: (s, i) => ({
            Comparisons: s[i] ? s[i].comparisons : 0,
            Swaps: s[i] ? s[i].swaps : 0
        }),
        insertion_sort: (s, i) => ({
            // arr[j] > key is evaluated when the result is shown: true, or false while j >= 0
            Comparisons: count(s, i, x =>
                x.action === "Condition is true" ||
                (x.action === "Check the condition" && x.compareIndex >= 0)
            ),
            Shifts: count(s, i, x => x.action === "Shift element right")
        }),
        quick_sort: (s, i) => ({
            Comparisons: count(s, i, x => x.type === "compare"),
            Swaps: count(s, i, x => x.action === "Finish Swap" || x.action === "Complete Pivot Swap")
        }),
        merge_sort: (s, i) => {
            let comparisons = 0;

            for (let k = 0; k <= i && k < s.length; k++) {
                if (s[k].type === "merge") comparisons += mergeComparisons(s[k].detail);
            }

            return {
                Comparisons: comparisons,
                Merges: count(s, i, x => x.type === "merge")
            };
        },
        heap_sort: (s, i) => ({
            Comparisons: count(s, i, x => x.action === "Compare Left Child" || x.action === "Compare Right Child"),
            Swaps: count(s, i, x => x.action === "Move Parent Down" || x.action === "Place Largest at the End")
        }),
        linear_search: (s, i) => ({
            Comparisons: count(s, i, x => x.type === "checking")
        }),
        binary_search: (s, i) => ({
            Comparisons: count(s, i, x => x.type === "checking")
        }),
        balanced_brackets: (s, i) => ({
            Pushes: count(s, i, x => x.type === "push"),
            Pops: count(s, i, x => x.type === "pop")
        })
    };

    function counters(steps, index) {
        if (index < 0) index = -1;

        const custom = COUNTERS[FILE];

        if (custom) return custom(steps, index);

        const step = steps[index];

        return step && Array.isArray(step.history)
            ? { Operations: step.history.length }
            : {};
    }

    const show = value => (value === undefined || value === null || value === -1 || value === "")
        ? "–"
        : String(value);

    function parse(text, pattern) {
        const match = pattern.exec(text || "");

        return match ? match[1] : undefined;
    }

    const WATCH = {
        bubble_sort: s => [["i", s.i], ["j", s.j], ["temp", parse(s.values, /temp = (\S+)/)]],
        selection_sort: s => [
            ["i", s.sortedCount],
            ["j", s.type === "compare" ? s.first : undefined],
            ["minIndex", s.minIndex]
        ],
        insertion_sort: s => [
            ["i", s.keyIndex],
            ["j", s.compareIndex],
            ["key", parse(s.values, /[Kk]ey = (\d+)/)],
            ["sorted until", s.sortedUntil]
        ],
        quick_sort: s => [
            ["low", s.low],
            ["high", s.high],
            ["pivot", s.pivot],
            ["i", ["pointer", "swap"].includes(s.type) ? s.first : undefined],
            ["j", ["loop", "compare"].includes(s.type) ? s.first : ["pointer", "swap"].includes(s.type) ? s.second : undefined]
        ],
        merge_sort: s => [
            ["depth", typeof s.path === "string" ? s.path.length - 4 : undefined],
            ["part", s.array ? "[" + s.array.join(", ") + "]" : undefined]
        ],
        heap_sort: s => [
            ["i", s.root],
            ["heap size", s.heapSize],
            ["compare", s.second >= 0 ? `idx ${s.first} and ${s.second}` : undefined]
        ],
        linear_search: s => [
            ["i", s.index],
            ["target", ($("#targetInput") || {}).value]
        ],
        binary_search: s => [
            ["low", s.low],
            ["high", s.high],
            ["mid", s.index],
            ["target", ($("#targetInput") || {}).value]
        ],
        balanced_brackets: s => [
            ["i", s.index],
            ["char", s.index >= 0 ? (pageVar("expression") || "")[s.index] : undefined],
            ["stack", s.stack ? (s.stack.join(" ") || "empty") : undefined]
        ],
        graph: s => [
            ["algo", s.algoId],
            ["current", s.currentNode],
            ["visited", s.visitedNodes ? s.visitedNodes.length : 0],
            ["path", s.pathNodes && s.pathNodes.length ? s.pathNodes.join("→") : "–"]
        ],
        bst: s => [
            ["node", s.nodeVar],
            ["key", s.keyVar],
            ["returned", s.returned]
        ],
        trie: s => [
            ["word", s.wordVar],
            ["char", s.chVar],
            ["prefix", s.prefixVar],
            ["returned", s.returned]
        ],
        avl_tree: s => [
            ["node", s.nodeVar],
            ["bf", s.bfVar],
            ["rotation", s.rotVar],
            ["returned", s.returned]
        ],
        heap: s => [
            ["mode", s.mode === "max" ? "Max-Heap" : "Min-Heap"],
            ["i", s.iVar],
            ["val", s.valVar],
            ["root", s.heap && s.heap.length ? s.heap[0] : "empty"],
            ["returned", s.returned]
        ],
        tree_traversals: s => [
            ["mode", s.mode],
            ["node", s.nodeVar],
            ["visited", s.visited && s.visited.length ? s.visited.join(", ") : "empty"]
        ]
    };

    // ---- build the two boxes in the explanation panel ----

    const currentAction = $(".explanation-panel .current-action");
    let statsBox = null;
    let watchBox = null;

    if (currentAction) {
        statsBox = make("div", "detail-block enh-stats");
        statsBox.id = "enhStats";
        currentAction.after(statsBox);

        if (WATCH[FILE]) {
            watchBox = make("div", "detail-block enh-watch");
            watchBox.id = "enhWatchBox";
            watchBox.appendChild(make("h4", "", "Variable watch"));

            const chips = make("div", "enh-chips");
            chips.id = "enhWatch";
            watchBox.appendChild(chips);

            statsBox.after(watchBox);
        }
    }

    function chip(name, value) {
        const element = make("span", "enh-chip");

        element.append(make("span", "", name + " "), make("strong", "", String(value)));

        return element;
    }

    function renderInsights() {
        const steps = getSteps();
        const index = getIndex();

        if (statsBox) {
            statsBox.innerHTML = "";

            const shown = Math.max(0, index + 1);

            statsBox.appendChild(chip("Step", `${shown} / ${steps.length}`));

            Object.entries(counters(steps, index)).forEach(([name, value]) => {
                statsBox.appendChild(chip(name, value));
            });
        }

        if (watchBox) {
            const target = $("#enhWatch");
            const step = steps[index];

            target.innerHTML = "";

            if (!step) {
                target.appendChild(make("span", "enh-muted", "Start the animation to see the values."));
            } else {
                WATCH[FILE](step).forEach(([name, value]) => {
                    target.appendChild(chip(name, show(value)));
                });
            }
        }

        updateProgress();
    }


    // =====================================
    // 13  FINISH SUMMARY (algorithm pages)
    // =====================================

    let shownRun = null;

    function runKey(steps) {
        return steps.length + ":" + (steps[0] ? JSON.stringify(steps[0].array || steps[0].nodes || "") : "");
    }

    function checkFinished() {
        if (KIND === "structure") return;

        const steps = getSteps();
        const index = getIndex();

        if (steps.length < 3) return;

        if (index < steps.length - 1) {
            shownRun = null;
            return;
        }

        const key = runKey(steps);

        if (shownRun === key || index < 2) return;

        shownRun = key;

        const results = counters(steps, index);
        const time = $$(".complexity span").map(span => span.textContent.trim());

        const card = make("div", "enh-summary");
        card.setAttribute("role", "status");

        card.appendChild(make("h4", "", "🎉 Finished!"));

        const list = make("ul", "");

        [
            ["Total steps", steps.length],
            ...Object.entries(results)
        ].forEach(([name, value]) => {
            const item = make("li");

            item.append(make("span", "", name), make("strong", "", String(value)));
            list.appendChild(item);
        });

        card.appendChild(list);

        if (time.length > 0) {
            card.appendChild(make("p", "enh-summary-note", time.join("  ·  ")));
        }

        const actions = make("div", "enh-summary-actions");
        const again = make("button", "btn ghost", "↺ Try again");
        const close = make("button", "btn primary", "Close");

        again.addEventListener("click", () => {
            card.remove();

            const reset = $(RESET);

            if (reset && !reset.disabled) reset.click();
        });
        close.addEventListener("click", () => card.remove());

        actions.append(again, close);
        card.appendChild(actions);

        $$(".enh-summary").forEach(old => old.remove());
        document.body.appendChild(card);

        setTimeout(() => card.remove(), 14000);
    }


    // =====================================
    // 14  QUIZ MODE
    // =====================================

    const score = { right: 0, total: 0 };
    let quizOn = false;
    let bypass = false;

    const quizLabel = make("label", "enh-quiz");
    const quizBox = make("input");
    const scoreText = make("span", "enh-score");

    quizBox.type = "checkbox";
    quizBox.id = "enhQuiz";
    scoreText.hidden = true;
    quizLabel.append(quizBox, document.createTextNode(" Quiz mode"), scoreText);
    quizLabel.title = "Guess the next step before you click Next";
    extra.appendChild(quizLabel);

    function updateScore() {
        scoreText.hidden = !quizOn;
        scoreText.textContent = ` (${score.right}/${score.total})`;
    }

    quizBox.addEventListener("change", () => {
        quizOn = quizBox.checked;

        const auto = $("#autoToggle");

        if (auto) {
            if (quizOn) auto.checked = false;
            auto.disabled = quizOn;
        }

        updateScore();
        toast(quizOn ? "Quiz mode on: guess before you click Next Step" : "Quiz mode off");
    });

    function shuffle(items) {
        const copy = [...items];

        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [copy[i], copy[j]] = [copy[j], copy[i]];
        }

        return copy;
    }

    function buildQuestion(steps, index) {
        const next = steps[index + 1];
        const correct = titleOf(next);

        if (!next || !correct || /^Ready/i.test(correct)) return null;

        const others = shuffle([...new Set(steps.map(titleOf))]
            .filter(title => title && title !== correct && !/^Ready/i.test(title)));

        if (others.length < 2) return null;

        return {
            now: titleOf(steps[index]),
            correct,
            why: whyOf(next),
            options: shuffle([correct, others[0], others[1]])
        };
    }

    function askQuestion(question, proceed) {
        const modal = openModal("Quick quiz", body => {
            if (question.now) {
                body.appendChild(make("p", "enh-muted", `Now: ${question.now}`));
            }

            body.appendChild(make("p", "enh-lead", "What will happen in the next step?"));

            const list = make("div", "enh-options");
            const feedback = make("div", "enh-feedback");

            feedback.hidden = true;

            question.options.forEach(option => {
                const button = make("button", "enh-option", option);

                button.addEventListener("click", () => {
                    if (list.dataset.answered) return;

                    list.dataset.answered = "yes";
                    score.total += 1;

                    const right = option === question.correct;

                    if (right) score.right += 1;

                    updateScore();

                    $$(".enh-option", list).forEach(item => {
                        if (item.textContent === question.correct) item.classList.add("is-right");
                        else if (item === button) item.classList.add("is-wrong");

                        item.disabled = true;
                    });

                    feedback.hidden = false;
                    feedback.innerHTML = "";
                    feedback.appendChild(make("strong", "", right ? "✔ Correct!" : "✘ Not quite."));

                    if (!right) {
                        feedback.appendChild(make("span", "", ` The next step is: ${question.correct}.`));
                    }

                    if (question.why) {
                        feedback.appendChild(make("p", "enh-muted", question.why));
                    }

                    const go = make("button", "btn primary", "Continue ▶");

                    go.addEventListener("click", () => {
                        closeModal();
                        proceed();
                    });

                    feedback.appendChild(go);
                    go.focus();
                });

                list.appendChild(button);
            });

            body.append(list, feedback);
        }, { sticky: true });

        modal.overlay.dataset.sticky = "yes";
    }

    document.addEventListener("click", event => {
        const target = event.target instanceof Element ? event.target : null;

        if (!target || !quizOn || bypass) return;

        const play = target.closest(PLAY);

        if (play && !play.disabled) {
            event.stopImmediatePropagation();
            event.preventDefault();
            toast("Quiz mode is on: use Next Step (autoplay is paused)");
            return;
        }

        const next = target.closest(NEXT);

        if (!next || next.disabled) return;

        const question = buildQuestion(getSteps(), getIndex());

        if (!question) return;

        event.stopImmediatePropagation();
        event.preventDefault();

        askQuestion(question, () => {
            bypass = true;
            next.click();
            bypass = false;
        });
    }, true);


    // =====================================
    // 15  SHARE LINK  +  10  PRESET INPUTS
    // =====================================

    const arrayInput = $(ARRAY_INPUT);
    const exprInput = $("#exprInput");
    const loadButton = $(LOAD) || $("#loadBtn");

    const share = make("button", "btn ghost enh-share", "🔗 Share link");

    share.title = "Copy a link that opens this page with the same values";
    extra.appendChild(share);

    function shareUrl() {
        const base = window.location.href.split("?")[0].split("#")[0];
        let query = "";

        if (arrayInput && arrayInput.value.trim()) {
            query = "arr=" + arrayInput.value.replace(/\s+/g, "");
        } else if (exprInput && exprInput.value.trim()) {
            // only the characters that would break the link are encoded
            query = "expr=" + exprInput.value.trim()
                .replace(/[%&#+\s]/g, character => encodeURIComponent(character));
        }

        return query ? `${base}?${query}` : base;
    }

    share.addEventListener("click", () => {
        const url = shareUrl();

        const done = ok => toast(ok ? "Link copied!" : "Copy this link: " + url);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => done(true), () => done(false));
        } else {
            const area = document.createElement("textarea");

            area.value = url;
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();

            let ok = false;

            try {
                ok = document.execCommand("copy");
            } catch (error) {
                ok = false;
            }

            area.remove();
            done(ok);
        }
    });

    // open the page with values from the link: ?arr=50,30,80  or  ?expr={[()]}
    (function readLink() {
        const params = new URLSearchParams(window.location.search);

        if (arrayInput && loadButton && params.has("arr")) {
            const text = params.get("arr");

            if (/^\d+(,\d+)*$/.test(text)) {
                arrayInput.value = text;
                loadButton.click();
            }
        } else if (exprInput && loadButton && params.has("expr")) {
            exprInput.value = params.get("expr").slice(0, 16);
            loadButton.click();
        }
    })();

    // ---- presets ----

    function distinctValues(count) {
        const values = new Set();

        while (values.size < count) {
            values.add(Math.floor(Math.random() * 90) + 10);
        }

        return [...values];
    }

    function presetValues(kind, count) {
        if (kind === "sorted") return distinctValues(count).sort((a, b) => a - b);
        if (kind === "reverse") return distinctValues(count).sort((a, b) => b - a);
        if (kind === "random") return distinctValues(count);

        // duplicates: only a few different numbers
        const pool = distinctValues(3);

        const values = Array.from({ length: count }, () =>
            pool[Math.floor(Math.random() * pool.length)]
        );

        return values;
    }

    if (arrayInput && loadButton && !["bst", "tree_traversals", "heap", "avl_tree", "trie", "graph"].includes(FILE)) {
        const group = make("div", "op-group enh-presets");

        group.appendChild(make("span", "enh-presets-label", "Presets"));

        [
            ["sorted", "Sorted", "Best case for many sorts"],
            ["reverse", "Reverse", "Worst case for many sorts"],
            ["random", "Random", "A typical input"],
            ["duplicates", "Duplicates", "Only a few different values"]
        ].forEach(([kind, label, tip]) => {
            const button = make("button", "btn ghost", label);

            button.title = tip;
            button.addEventListener("click", () => {
                if (button.disabled) return;

                const current = arrayInput.value.split(",").filter(part => part.trim() !== "").length;
                const count = Math.max(5, Math.min(10, current || 7));

                arrayInput.value = presetValues(kind, count).join(", ");
                loadButton.click();
            });

            group.appendChild(button);
        });

        const row = arrayInput.closest(".search-settings");

        if (row) {
            const hint = $(".array-hint", row);

            if (hint) row.insertBefore(group, hint);
            else row.appendChild(group);
        }
    }


    // =====================================
    // PUT THE EXTRA CONTROLS IN THE CONTROL BAR
    // =====================================

    if (controls) {
        controls.insertBefore(extra, controls.firstChild);
    }


    // =====================================
    // KEEP EVERYTHING IN SYNC WITH THE PAGE
    // =====================================

    let queued = false;

    function refresh() {
        if (queued) return;

        queued = true;

        requestAnimationFrame(() => {
            queued = false;
            renderInsights();
            checkFinished();
        });
    }

    const watched = [$(".step-counter"), $(".current-action")].filter(Boolean);

    if (window.MutationObserver) {
        const observer = new MutationObserver(refresh);

        watched.forEach(element => {
            observer.observe(element, { childList: true, subtree: true, characterData: true });
        });
    }

    // some pages change the step without touching those elements
    $$(NEXT + "," + PREV + "," + PLAY + "," + RESET).forEach(button => {
        button.addEventListener("click", () => setTimeout(refresh, 30));
    });

    refresh();
})();
