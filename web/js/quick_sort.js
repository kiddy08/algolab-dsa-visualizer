
"use strict";

// ==========================================
// ELEMENTS
// ==========================================

const barsContainer = document.getElementById("bars");
const message = document.getElementById("message");
const status = document.getElementById("status");
const actionType = document.getElementById("actionType");
const valuesInvolved = document.getElementById("valuesInvolved");
const whyText = document.getElementById("whyText");
const tipText = document.getElementById("tipText");
const beforeArray = document.getElementById("beforeArray");
const afterArray = document.getElementById("afterArray");
const chartStep = document.getElementById("chartStep");
const chartCaption = document.getElementById("chartCaption");
const stepCounter = document.getElementById("stepCounter");
const treeContainer = document.getElementById("quick-tree");
const pivotValue = document.getElementById("pivotValue");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const randomBtn = document.getElementById("randomBtn");
const arrayInput = document.getElementById("arrayInput");
const applyArrayBtn = document.getElementById("applyArrayBtn");
const resetBtn = document.getElementById("resetBtn");

const codeLines = document.querySelectorAll(".code-line");

const ANIMATION_SPEED = 850;

let originalArray = [40, 20, 70, 10, 50, 30];
let steps = [];
let currentStep = -1;
let timer = null;
let isPlaying = false;


// ==========================================
// BUILD QUICK SORT STEPS
// ==========================================

function buildSteps(input) {
    const arr = [...input];
    const result = [];
    const fixedIndices = new Set();

    function pushStep(data) {
        const before = data.before ?? arr;
        const snapshot = data.snapshot ?? arr;

        result.push({
            line: data.line,
            type: data.type,
            action: data.action,
            values: data.values,
            why: data.why,
            message: data.message,
            tip: data.tip,

            path: data.path ?? null,

            low: data.low ?? -1,
            high: data.high ?? -1,
            first: data.first ?? -1,
            second: data.second ?? -1,
            pivotIndex: data.pivotIndex ?? -1,
            pivot: data.pivot ?? null,

            sortedIndices: [
                ...(data.sortedIndices ?? [...fixedIndices])
            ],

            beforeArray: [...before],
            array: [...snapshot]
        });
    }

    // Recursive Quick Sort
    function quickSort(low, high, path) {
        const addStep = data => pushStep({ ...data, path });

        addStep({
            line: 1,
            type: "call",
            action: "Call quickSort()",
            values: `Range: [${low}, ${high}]`,
            why: "Quick Sort processes a selected range of the array.",
            message: `Process indices ${low} through ${high}.`,
            tip: "Quick Sort divides the problem around a pivot.",
            low,
            high
        });

        // Check base condition
        if (low >= high) {
            if (low === high) {
                fixedIndices.add(low);
            }

            addStep({
                line: 2,
                type: "base",
                action: "Check Base Condition",
                values: low === high
                    ? `One element: ${arr[low]}`
                    : "Empty range",
                why: "A range with zero or one element does not need sorting.",
                message: "This range is already sorted.",
                tip: "Recursion stops when low is greater than or equal to high.",
                low,
                high
            });

            return;
        }

        // Partition the current range
        addStep({
            line: 3,
            type: "partition-call",
            action: "Partition the Array",
            values: `Range: [${arr.slice(low, high + 1).join(", ")}]`,
            why: "Partition places the pivot in its correct sorted position.",
            message: "Call partition() to separate values around the pivot.",
            tip: "This version uses the last element as the pivot.",
            low,
            high
        });

        const p = partition(low, high, path);

        // Sort the left part
        addStep({
            line: 4,
            type: "recursive-left",
            action: "Sort Left Partition",
            values: p > low
                ? `[${arr.slice(low, p).join(", ")}]`
                : "Empty left partition",
            why: "All values before the pivot belong to its left partition.",
            message: `Sort the range from ${low} to ${p - 1}.`,
            tip: "The pivot is excluded from both recursive calls.",
            low,
            high,
            first: p
        });

        quickSort(low, p - 1, path + "L");

        // Sort the right part
        addStep({
            line: 5,
            type: "recursive-right",
            action: "Sort Right Partition",
            values: p < high
                ? `[${arr.slice(p + 1, high + 1).join(", ")}]`
                : "Empty right partition",
            why: "All values after the pivot belong to its right partition.",
            message: `Sort the range from ${p + 1} to ${high}.`,
            tip: "Repeat partitioning until the subarrays are sorted.",
            low,
            high,
            first: p
        });

        quickSort(p + 1, high, path + "R");
    }

    // Lomuto partition method
    function partition(low, high, path) {
        const addStep = data => pushStep({ ...data, path });

        addStep({
            line: 9,
            type: "partition",
            action: "Enter partition()",
            values: `Range: [${arr.slice(low, high + 1).join(", ")}]`,
            why: "The partition function rearranges this range around a pivot.",
            message: "Begin partitioning the selected range.",
            tip: "The pivot used here is arr[high].",
            low,
            high
        });

        const pivot = arr[high];

        addStep({
            line: 10,
            type: "pivot",
            action: "Select Pivot",
            values: `Pivot = ${pivot}`,
            why: "The last element is selected as the pivot.",
            message: `Select ${pivot} as the pivot value.`,
            tip: "Values less than or equal to the pivot go to its left.",
            low,
            high,
            pivot,
            pivotIndex: high
        });

        let i = low - 1;

        addStep({
            line: 11,
            type: "pointer",
            action: "Initialize Pointer i",
            values: `i = ${i}`,
            why: "Pointer i marks the end of the section containing values <= pivot.",
            message: `Initialize i to ${i}.`,
            tip: "The left section is initially empty.",
            low,
            high,
            pivot,
            pivotIndex: high
        });

        // Scan the array from low to high - 1
        for (let j = low; j < high; j++) {
            addStep({
                line: 12,
                type: "loop",
                action: "Move Through Array",
                values: `j = ${j}, arr[j] = ${arr[j]}`,
                why: "Each value before the pivot is checked once.",
                message: `Inspect the value ${arr[j]} at index ${j}.`,
                tip: "The pivot itself is excluded from this loop.",
                low,
                high,
                first: j,
                pivot,
                pivotIndex: high
            });

            const current = arr[j];

            addStep({
                line: 13,
                type: "compare",
                action: "Compare with Pivot",
                values: `${current} <= ${pivot} ?`,
                why: "Values no greater than the pivot belong on its left side.",
                message: current <= pivot
                    ? `${current} is less than or equal to ${pivot}.`
                    : `${current} is greater than ${pivot}.`,
                tip: "Only values that satisfy the condition enter the left section.",
                low,
                high,
                first: j,
                pivot,
                pivotIndex: high
            });

            if (current <= pivot) {
                i++;

                addStep({
                    line: 14,
                    type: "pointer",
                    action: "Move Pointer i",
                    values: `i = ${i}`,
                    why: "The left-side section grows to include another value.",
                    message: `Increase i to ${i}.`,
                    tip: "The next value is placed at index i.",
                    low,
                    high,
                    first: i,
                    second: j,
                    pivot,
                    pivotIndex: high
                });

                // Save arr[i] in temp
                let temp = arr[i];

                addStep({
                    line: 15,
                    type: "swap",
                    action: "Save Value in temp",
                    values: `temp = ${temp}`,
                    why: "The original value at arr[i] is saved before swapping.",
                    message: `Store ${temp} in the temporary variable.`,
                    tip: "A temporary variable prevents losing a value during a swap.",
                    low,
                    high,
                    first: i,
                    second: j,
                    pivot,
                    pivotIndex: high
                });

                // arr[i] = arr[j]
                const oldValueAtI = arr[i];
                const beforeAssign = [...arr];

                arr[i] = arr[j];

                addStep({
                    line: 16,
                    type: "swap",
                    action: "Move Value Left",
                    values: `arr[${i}] = ${arr[j]}`,
                    why: "The value satisfying the pivot condition enters the left section.",
                    message: `Copy ${arr[j]} into index ${i}.`,
                    tip: "The saved value will be restored to the other index next.",
                    low,
                    high,
                    first: i,
                    second: j,
                    pivot,
                    pivotIndex: high,
                    before: beforeAssign
                });

                // arr[j] = temp
                const beforeFinishSwap = [...arr];

                arr[j] = temp;

                addStep({
                    line: 17,
                    type: "swap",
                    action: "Finish Swap",
                    values: `arr[${j}] = ${temp}`,
                    why: "The saved value completes the swap.",
                    message: `Place ${temp} at index ${j}.`,
                    tip: "The array now contains the same values, rearranged.",
                    low,
                    high,
                    first: i,
                    second: j,
                    pivot,
                    pivotIndex: high,
                    before: beforeFinishSwap
                });
            }
        }

        // Put the pivot into its final position
        const pivotFinal = i + 1;

        let temp = arr[pivotFinal];

        addStep({
            line: 20,
            type: "pivot-swap",
            action: "Save Pivot Position Value",
            values: `temp = ${temp}`,
            why: "Save the current value at the pivot's final position.",
            message: `Save ${temp} before moving the pivot.`,
            tip: "The pivot will be placed after all smaller values.",
            low,
            high,
            first: pivotFinal,
            second: high,
            pivot,
            pivotIndex: high
        });

        const beforePivotAssignment = [...arr];

        arr[pivotFinal] = arr[high];

        addStep({
            line: 21,
            type: "pivot-swap",
            action: "Move Pivot",
            values: `Move ${pivot} to index ${pivotFinal}`,
            why: "The pivot moves into the position that separates the two partitions.",
            message: `Place the pivot at index ${pivotFinal}.`,
            tip: "All values before the pivot are <= it, and values after it are > it.",
            low,
            high,
            first: pivotFinal,
            second: high,
            pivot,
            pivotIndex: pivotFinal,
            before: beforePivotAssignment
        });

        const beforePivotRestore = [...arr];

        arr[high] = temp;

        // The pivot is now permanently positioned
        fixedIndices.add(pivotFinal);

        addStep({
            line: 22,
            type: "pivot-swap",
            action: "Complete Pivot Swap",
            values: `Pivot ${pivot} fixed at index ${pivotFinal}`,
            why: "The pivot and the saved value complete the partition.",
            message: `Pivot ${pivot} is now at index ${pivotFinal}.`,
            tip: "This pivot position will not change in later recursive calls.",
            low,
            high,
            first: pivotFinal,
            second: high,
            pivot,
            pivotIndex: pivotFinal,
            sortedIndices: [...fixedIndices],
            before: beforePivotRestore
        });

        addStep({
            line: 23,
            type: "return-pivot",
            action: "Return Pivot Index",
            values: `p = ${pivotFinal}`,
            why: "Quick Sort uses the pivot index to sort the left and right partitions.",
            message: `Return index ${pivotFinal} to quickSort().`,
            tip: "The pivot is already in its final sorted position.",
            low,
            high,
            first: pivotFinal,
            pivot,
            pivotIndex: pivotFinal,
            sortedIndices: [...fixedIndices]
        });

        return pivotFinal;
    }

    // Starting explanation
    pushStep({
        line: 1,
        type: "ready",
        action: "Ready to Start",
        values: `Array: [${arr.join(", ")}]`,
        why: "Quick Sort selects a pivot, partitions the array, and recursively sorts each side.",
        message: "Click Next Step to begin Quick Sort.",
        tip: "This visualizer uses the last element as the pivot."
    });

    quickSort(0, arr.length - 1, "root");

    // Final state
    const allIndices = Array.from(
        { length: arr.length },
        (_, index) => index
    );

    pushStep({
        line: 7,
        type: "done",
        action: "Sorting Completed",
        values: `Final array: [${arr.join(", ")}]`,
        why: "All partitions are sorted and the array is in ascending order.",
        message: `Quick Sort completed: [${arr.join(", ")}].`,
        tip: "Average time complexity: O(n log n). Worst case: O(n²).",
        sortedIndices: allIndices,
        before: arr,
        snapshot: arr
    });

    return result;
}


// ==========================================
// DRAW ARRAY BARS
// ==========================================

function renderBars(array, step) {
    barsContainer.innerHTML = "";

    const maxValue = Math.max(
        1,
        ...array.map(value => Math.abs(value))
    );

    array.forEach((value, index) => {
        const bar = document.createElement("div");

        bar.className = "bar";
        bar.style.height =
            `${Math.max(8, (Math.abs(value) / maxValue) * 90)}%`;

        bar.textContent = value;
        bar.title = `Index ${index}: ${value}`;

        const isSelected =
            index === step.first || index === step.second;

        const isPivot = index === step.pivotIndex;

        const isFixed = step.sortedIndices.includes(index);

        if (
            step.type === "done" ||
            (isFixed && !isSelected && !isPivot)
        ) {
            bar.classList.add("sorted");
        } else if (
            step.type === "swap" ||
            step.type === "pivot-swap"
        ) {
            if (isSelected) {
                bar.classList.add("swapping");
            } else if (isPivot) {
                bar.classList.add("pivot");
            } else if (isFixed) {
                bar.classList.add("sorted");
            }
        } else if (isPivot) {
            bar.classList.add("pivot");
        } else if (isSelected) {
            bar.classList.add("comparing");
        } else if (isFixed) {
            bar.classList.add("sorted");
        }

        barsContainer.appendChild(bar);
    });
}


// ==========================================
// HIGHLIGHT CODE LINE
// ==========================================

function highlightCodeLine(lineNumber) {
    codeLines.forEach((line, index) => {
        const actualLine = Number(
            line.dataset.line || index + 1
        );

        line.classList.toggle(
            "active",
            actualLine === lineNumber
        );
    });
}


// ==========================================
// RENDER BEFORE / AFTER ARRAYS
// ==========================================

function renderArrayValues(
    container,
    array,
    previous,
    first,
    second
) {
    if (!container) return;

    container.innerHTML = "";

    array.forEach((value, index) => {
        const item = document.createElement("span");

        item.className = "array-value";
        item.textContent = value;

        if (previous[index] !== value) {
            item.classList.add("changed");
        }

        if (index === first || index === second) {
            item.classList.add("active-value");
        }

        container.appendChild(item);
    });
}


// ==========================================
// QUICK SORT TREE
// ==========================================
// Every quickSort() call is one node. The pivot splits a node
// into a left child (values <= pivot) and a right child (values > pivot).

const TREE_STEP_TYPES = [
    "call", "partition-call", "partition", "pivot", "pointer",
    "loop", "compare", "swap", "pivot-swap", "return-pivot"
];

const ACTIVE_CELL_TYPES = [
    "loop", "compare", "pointer", "swap", "pivot-swap"
];

const SWAP_TYPES = ["swap", "pivot-swap"];

function collectTreeNodes(lastIndex) {
    const nodes = new Map();

    for (let i = 0; i <= lastIndex; i++) {
        const s = steps[i];

        // Skip the intro / final step and empty ranges
        if (s.path === null || s.low > s.high) continue;

        let node = nodes.get(s.path);

        if (!node) {
            node = {
                path: s.path,
                low: s.low,
                high: s.high,
                values: s.array.slice(s.low, s.high + 1),
                pivotIndex: -1,
                fixedIndex: -1
            };

            nodes.set(s.path, node);
        }

        if (TREE_STEP_TYPES.includes(s.type)) {
            node.values = s.array.slice(s.low, s.high + 1);
        }

        if (s.pivotIndex >= 0) {
            node.pivotIndex = s.pivotIndex;
        }

        if (
            s.type === "return-pivot" ||
            (s.type === "pivot-swap" && s.line === 22)
        ) {
            node.fixedIndex = s.pivotIndex;
        }
    }

    return nodes;
}

function createTreeItem(path, ctx) {
    const node = ctx.nodes.get(path);
    if (!node) return null;

    const { step, sorted } = ctx;

    // A node is complete when every position in it is final
    let complete = true;

    for (let i = node.low; i <= node.high; i++) {
        if (!sorted.has(i)) {
            complete = false;
            break;
        }
    }

    const values = complete
        ? step.array.slice(node.low, node.high + 1)
        : node.values;

    const isActiveNode = path === ctx.activePath;
    const isSwap = SWAP_TYPES.includes(step.type);

    const item = document.createElement("div");
    item.className = "tree-item";

    const box = document.createElement("div");
    box.className = "tree-node is-seen";

    values.forEach((value, offset) => {
        const index = node.low + offset;
        const cell = document.createElement("span");

        cell.className = "tree-cell";
        cell.textContent = value;

        if (complete || index === node.fixedIndex) {
            cell.classList.add("is-fixed");
        } else if (index === node.pivotIndex) {
            cell.classList.add("is-pivot");
        } else if (
            isActiveNode &&
            ACTIVE_CELL_TYPES.includes(step.type) &&
            (index === step.first || index === step.second)
        ) {
            cell.classList.add("is-active");

            if (isSwap) {
                cell.classList.add("is-swap");
            }
        }

        box.appendChild(cell);
    });

    if (complete) box.classList.add("is-done");

    if (isActiveNode) {
        box.classList.add("is-current");

        if (isSwap) box.classList.add("is-swapping");
    }

    item.appendChild(box);

    const kids = [
        createTreeItem(path + "L", ctx),
        createTreeItem(path + "R", ctx)
    ].filter(Boolean);

    if (kids.length > 0) {
        const children = document.createElement("div");
        children.className = "tree-children";

        kids.forEach(kid => children.appendChild(kid));
        item.appendChild(children);
    }

    return item;
}

function renderTree(index) {
    treeContainer.innerHTML = "";

    const nodes = collectTreeNodes(index);

    // Before the first call, show the untouched array as the root
    if (!nodes.has("root")) {
        nodes.set("root", {
            path: "root",
            low: 0,
            high: originalArray.length - 1,
            values: originalArray.slice(),
            pivotIndex: -1,
            fixedIndex: -1
        });
    }

    const step = index >= 0
        ? steps[index]
        : {
            type: "ready",
            array: originalArray,
            sortedIndices: [],
            first: -1,
            second: -1,
            path: null
        };

    const ctx = {
        nodes,
        step,
        sorted: new Set(step.sortedIndices),
        activePath: step.path
    };

    treeContainer.appendChild(createTreeItem("root", ctx));

    // Keep the active node centred (sideways only)
    const current = treeContainer.querySelector(".is-current");

    if (current) {
        const nodeBox = current.getBoundingClientRect();
        const hostBox = treeContainer.getBoundingClientRect();

        treeContainer.scrollLeft +=
            (nodeBox.left + nodeBox.width / 2) -
            (hostBox.left + hostBox.width / 2);
    }
}


// ==========================================
// UPDATE EXPLANATION
// ==========================================

function showLearningDetails(step) {
    actionType.textContent = step.action;
    valuesInvolved.textContent = step.values;
    whyText.textContent = step.why;
    tipText.textContent = step.tip;
    message.textContent = step.message;

    renderArrayValues(
        beforeArray,
        step.beforeArray,
        step.beforeArray,
        step.first,
        step.second
    );

    renderArrayValues(
        afterArray,
        step.array,
        step.beforeArray,
        step.first,
        step.second
    );

    pivotValue.textContent =
        step.pivot === null || step.pivot === undefined
            ? "Not selected"
            : step.pivot;
}


// ==========================================
// BUTTON STATES
// ==========================================

function updateButtons() {
    const done = currentStep >= steps.length - 1;

    if (isPlaying) {
        startBtn.textContent = "⏸ Pause Sorting";
    } else if (done && currentStep >= 0) {
        startBtn.textContent = "↻ Restart Sorting";
    } else if (currentStep >= 0) {
        startBtn.textContent = "▶ Resume Sorting";
    } else {
        startBtn.textContent = "▶ Start Sorting";
    }

    stepBtn.disabled = isPlaying || done;
    prevBtn.disabled = isPlaying || currentStep <= 0;
    randomBtn.disabled = isPlaying;
    arrayInput.disabled = isPlaying;
    applyArrayBtn.disabled = isPlaying;
    resetBtn.disabled = isPlaying;
}


// ==========================================
// SHOW CURRENT STEP
// ==========================================

function renderStep(index) {
    if (index < 0 || index >= steps.length) {
        return;
    }

    currentStep = index;

    const step = steps[index];

    renderBars(step.array, step);
    highlightCodeLine(step.line);
    showLearningDetails(step);
    renderTree(index);

    status.textContent = `Step ${index + 1} of ${steps.length}`;
    chartStep.textContent = step.action;
    chartCaption.textContent = step.message;
    stepCounter.textContent = `Step ${index + 1} of ${steps.length}`;

    updateButtons();
}


// ==========================================
// STOP AUTOPLAY
// ==========================================

function stopAnimation() {
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }

    isPlaying = false;
    updateButtons();
}


// ==========================================
// RESET VISUALIZER
// ==========================================

function resetVisualizer() {
    stopAnimation();

    steps = buildSteps(originalArray);
    currentStep = -1;

    const initialStep = {
        type: "ready",
        array: originalArray,
        sortedIndices: [],
        first: -1,
        second: -1,
        pivotIndex: -1
    };

    renderBars(originalArray, initialStep);
    renderTree(-1);
    highlightCodeLine(1);

    actionType.textContent = "Ready to start";
    message.textContent = "Click Next Step to begin Quick Sort.";

    valuesInvolved.textContent =
        `Array: [${originalArray.join(", ")}]`;

    whyText.textContent =
        "Quick Sort chooses a pivot and separates smaller and larger values.";

    tipText.textContent =
        "The last element is used as the pivot.";

    status.textContent = "Ready to sort";
    chartStep.textContent = "Waiting to start";
    chartCaption.textContent = "Click Next Step to begin sorting.";
    stepCounter.textContent = "Step 0";
    pivotValue.textContent = "Not selected";

    renderArrayValues(
        beforeArray,
        originalArray,
        originalArray,
        -1,
        -1
    );

    renderArrayValues(
        afterArray,
        originalArray,
        originalArray,
        -1,
        -1
    );

    updateButtons();
}


// ==========================================
// START / PAUSE / RESUME
// ==========================================

startBtn.addEventListener("click", () => {
    if (isPlaying) {
        stopAnimation();

        message.textContent =
            "Sorting paused. Click Resume Sorting to continue.";

        return;
    }

    if (currentStep >= steps.length - 1) {
        resetVisualizer();
    }

    isPlaying = true;
    updateButtons();

    timer = setInterval(() => {
        if (currentStep < steps.length - 1) {
            renderStep(currentStep + 1);
        }

        if (currentStep >= steps.length - 1) {
            stopAnimation();
        }
    }, AlgoLab.interval(ANIMATION_SPEED));
});


// ==========================================
// NEXT STEP
// ==========================================

stepBtn.addEventListener("click", () => {
    if (!isPlaying && currentStep < steps.length - 1) {
        renderStep(currentStep + 1);
    }
});


// ==========================================
// PREVIOUS STEP
// ==========================================

prevBtn.addEventListener("click", () => {
    if (!isPlaying && currentStep > 0) {
        renderStep(currentStep - 1);
    }
});


// ==========================================
// GENERATE NEW ARRAY
// ==========================================

randomBtn.addEventListener("click", () => {
    if (isPlaying) {
        return;
    }

    const values = new Set();

    while (values.size < 6) {
        values.add(Math.floor(Math.random() * 90) + 10);
    }

    originalArray = [...values];

    resetVisualizer();
});


// ==========================================
// RESET BUTTON
// ==========================================

resetBtn.addEventListener("click", () => {
    if (!isPlaying) {
        resetVisualizer();
    }
});


// ==========================================
// CUSTOM ARRAY INPUT
// ==========================================

const ARRAY_HINT = "Enter 2–12 whole numbers (1–999) separated by commas.";

function syncArrayInput() {
    arrayInput.value = originalArray.join(", ");
}

function loadCustomArray() {
    if (isPlaying) return;

    const result = AlgoLab.parseArray(arrayInput.value, {
        min: 2,
        max: 12,
        minValue: 1,
        maxValue: 999
    });

    if (result.error) {
        AlgoLab.showHint(result.error, true);
        arrayInput.focus();
        return;
    }

    originalArray = result.values;
    syncArrayInput();
    AlgoLab.showHint(ARRAY_HINT, false);
    resetVisualizer();
}

applyArrayBtn.addEventListener("click", loadCustomArray);

arrayInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        loadCustomArray();
    }
});

// "New Array" already creates the random array above;
// this keeps the text box in sync with it.
randomBtn.addEventListener("click", () => {
    if (isPlaying) return;

    syncArrayInput();
    AlgoLab.showHint(ARRAY_HINT, false);
});

syncArrayInput();

// ==========================================
// INITIALIZE
// ==========================================

resetVisualizer();
