"use strict";

// ==========================================
// ELEMENTS
// ==========================================

const barsContainer = document.getElementById("bars");
const treeContainer = document.getElementById("heap-tree");
const message = document.getElementById("message");
const statusTag = document.getElementById("status");
const actionType = document.getElementById("actionType");
const valuesInvolved = document.getElementById("valuesInvolved");
const whyText = document.getElementById("whyText");
const tipText = document.getElementById("tipText");
const chartStep = document.getElementById("chartStep");
const chartCaption = document.getElementById("chartCaption");
const stepCounter = document.getElementById("stepCounter");
const heapInfo = document.getElementById("heapInfo");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const randomBtn = document.getElementById("randomBtn");
const arrayInput = document.getElementById("arrayInput");
const applyArrayBtn = document.getElementById("applyArrayBtn");
const resetBtn = document.getElementById("resetBtn");

const codeLines = document.querySelectorAll(".code-line");

const ANIMATION_SPEED = 850;
const SWAP_TYPES = ["swap"];

let originalArray = [30, 70, 20, 90, 50, 10, 60];
let steps = [];
let currentStep = -1;
let timer = null;
let isPlaying = false;


// ==========================================
// BUILD HEAP SORT STEPS
// ==========================================

function buildSteps(input) {
    const arr = [...input];
    const n = arr.length;
    const result = [];

    // Number of values that are still inside the heap
    let heapSize = n;

    function addStep(data) {
        result.push({
            line: data.line,
            type: data.type,
            action: data.action,
            values: data.values,
            why: data.why,
            message: data.message,
            tip: data.tip,

            root: data.root ?? -1,
            first: data.first ?? -1,
            second: data.second ?? -1,
            heapSize: data.heapSize ?? heapSize,

            array: [...arr]
        });
    }

    // Java: heapify(arr, size, i)
    function heapify(size, i) {
        addStep({
            line: 15,
            type: "heapify",
            action: "Call heapify()",
            values: `i = ${i}, value = ${arr[i]}, heap size = ${size}`,
            why: "heapify fixes the subtree rooted at index i so the parent is not smaller than its children.",
            message: `Check the node ${arr[i]} at index ${i}.`,
            tip: "In a max-heap every parent is greater than or equal to its children.",
            root: i,
            first: i
        });

        let largest = i;

        addStep({
            line: 16,
            type: "largest",
            action: "Assume Parent Is Largest",
            values: `largest = ${i} (value ${arr[i]})`,
            why: "We start by assuming the parent is already the biggest of the three.",
            message: `largest = ${i}, which holds ${arr[i]}.`,
            tip: "largest stores an index, not a value.",
            root: i,
            first: i
        });

        const left = 2 * i + 1;
        const right = 2 * i + 2;

        addStep({
            line: 17,
            type: "children",
            action: "Find Left Child",
            values: left < size
                ? `left = 2 * ${i} + 1 = ${left} (value ${arr[left]})`
                : `left = 2 * ${i} + 1 = ${left} (outside the heap)`,
            why: "In an array-based heap, the left child of index i is at 2i + 1.",
            message: left < size
                ? `The left child is ${arr[left]} at index ${left}.`
                : `Index ${left} is not inside the heap, so there is no left child.`,
            tip: "No tree is stored. The array positions give the tree shape.",
            root: i,
            first: left < size ? left : i
        });

        addStep({
            line: 18,
            type: "children",
            action: "Find Right Child",
            values: right < size
                ? `right = 2 * ${i} + 2 = ${right} (value ${arr[right]})`
                : `right = 2 * ${i} + 2 = ${right} (outside the heap)`,
            why: "The right child of index i is at 2i + 2.",
            message: right < size
                ? `The right child is ${arr[right]} at index ${right}.`
                : `Index ${right} is not inside the heap, so there is no right child.`,
            tip: "Indexes at or after the heap size are already sorted.",
            root: i,
            first: right < size ? right : i
        });

        // Compare with the left child
        if (left < size) {
            const bigger = arr[left] > arr[largest];

            addStep({
                line: 20,
                type: "compare",
                action: "Compare Left Child",
                values: `${arr[left]} > ${arr[largest]} ?`,
                why: "The biggest of parent, left child and right child must end up on top.",
                message: bigger
                    ? `${arr[left]} is larger than ${arr[largest]}.`
                    : `${arr[left]} is not larger than ${arr[largest]}.`,
                tip: "Only the left child is compared here.",
                root: i,
                first: left,
                second: largest
            });

            if (bigger) {
                largest = left;

                addStep({
                    line: 21,
                    type: "largest",
                    action: "Update Largest",
                    values: `largest = ${left} (value ${arr[left]})`,
                    why: "The left child is bigger, so it becomes the new largest.",
                    message: `largest now points to index ${left}.`,
                    tip: "The right child is compared with this new largest.",
                    root: i,
                    first: left
                });
            }
        } else {
            addStep({
                line: 20,
                type: "compare",
                action: "Skip Left Child",
                values: `left = ${left} is not less than heap size ${size}`,
                why: "A child outside the heap must never be used.",
                message: "There is no left child inside the heap, so skip the comparison.",
                tip: "Both conditions in the if statement must be true.",
                root: i,
                first: i
            });
        }

        // Compare with the right child
        if (right < size) {
            const bigger = arr[right] > arr[largest];

            addStep({
                line: 23,
                type: "compare",
                action: "Compare Right Child",
                values: `${arr[right]} > ${arr[largest]} ?`,
                why: "The right child competes with the current largest value.",
                message: bigger
                    ? `${arr[right]} is larger than ${arr[largest]}.`
                    : `${arr[right]} is not larger than ${arr[largest]}.`,
                tip: "After this check, largest points to the biggest of the three.",
                root: i,
                first: right,
                second: largest
            });

            if (bigger) {
                largest = right;

                addStep({
                    line: 24,
                    type: "largest",
                    action: "Update Largest",
                    values: `largest = ${right} (value ${arr[right]})`,
                    why: "The right child is bigger, so it becomes the new largest.",
                    message: `largest now points to index ${right}.`,
                    tip: "Now the parent will be swapped with this child.",
                    root: i,
                    first: right
                });
            }
        } else {
            addStep({
                line: 23,
                type: "compare",
                action: "Skip Right Child",
                values: `right = ${right} is not less than heap size ${size}`,
                why: "A child outside the heap must never be used.",
                message: "There is no right child inside the heap, so skip the comparison.",
                tip: "Leaf nodes have no children at all.",
                root: i,
                first: i
            });
        }

        // Does the parent need to move down?
        addStep({
            line: 26,
            type: "check",
            action: "Is the Parent the Largest?",
            values: `largest = ${largest}, i = ${i}`,
            why: "If a child is larger, the parent has to move down.",
            message: largest !== i
                ? `${arr[largest]} is larger than the parent ${arr[i]}, so swap them.`
                : `${arr[i]} is already the largest. This subtree is a valid heap.`,
            tip: largest !== i
                ? "The swap may break the heap rule lower down, so heapify continues."
                : "No swap means heapify stops here.",
            root: i,
            first: i,
            second: largest
        });

        if (largest === i) {
            return;
        }

        const temp = arr[i];

        addStep({
            line: 27,
            type: "save",
            action: "Save Parent in temp",
            values: `temp = ${temp}`,
            why: "The parent value is saved before it is overwritten.",
            message: `Store ${temp} in the temporary variable.`,
            tip: "A temporary variable prevents losing a value during a swap.",
            root: i,
            first: i,
            second: largest
        });

        arr[i] = arr[largest];

        addStep({
            line: 28,
            type: "swap",
            action: "Move Larger Child Up",
            values: `arr[${i}] = ${arr[i]}`,
            why: "The larger child moves up into the parent position.",
            message: `Copy ${arr[i]} into index ${i}.`,
            tip: "The saved value is restored to the child position next.",
            root: i,
            first: i,
            second: largest
        });

        arr[largest] = temp;

        addStep({
            line: 29,
            type: "swap",
            action: "Move Parent Down",
            values: `arr[${largest}] = ${temp}`,
            why: "The old parent takes the child's position to finish the swap.",
            message: `Place ${temp} at index ${largest}.`,
            tip: "The parent moved down, so check its new children.",
            root: i,
            first: i,
            second: largest
        });

        addStep({
            line: 30,
            type: "recurse",
            action: "Heapify the Child Subtree",
            values: `heapify(arr, ${size}, ${largest})`,
            why: "The value that moved down may be smaller than its new children.",
            message: `Repeat the same check for index ${largest}.`,
            tip: "heapify walks down until the heap rule holds.",
            root: largest,
            first: largest
        });

        heapify(size, largest);
    }

    // Start
    addStep({
        line: 1,
        type: "ready",
        action: "Ready to Start",
        values: `Array: [${arr.join(", ")}]`,
        why: "Heap Sort turns the array into a max-heap, then sorts it from the back.",
        message: "Click Next Step to begin Heap Sort.",
        tip: "The tree is only a picture of the array positions."
    });

    addStep({
        line: 2,
        type: "init",
        action: "Read Array Length",
        values: `n = ${n}`,
        why: "The length decides where the last parent node is.",
        message: `The array has ${n} values.`,
        tip: "The last parent is at index n / 2 - 1."
    });

    // Phase 1: build the max-heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        addStep({
            line: 4,
            type: "build",
            action: "Build Heap: Next Parent",
            values: `i = ${i}, value = ${arr[i]}`,
            why: "Leaves are already valid heaps, so we start from the last parent and move up to the root.",
            message: `Heapify the subtree rooted at index ${i}.`,
            tip: "Building the heap takes only O(n) time.",
            root: i,
            first: i
        });

        addStep({
            line: 5,
            type: "build",
            action: "Call heapify()",
            values: `heapify(arr, ${n}, ${i})`,
            why: "heapify pushes this parent down until it is larger than both children.",
            message: `Call heapify for index ${i}.`,
            tip: "The whole array becomes a max-heap after the loop.",
            root: i,
            first: i
        });

        heapify(n, i);
    }

    addStep({
        line: 7,
        type: "heap-ready",
        action: "Max-Heap Built",
        values: `Largest value ${arr[0]} is at the root (index 0)`,
        why: "In a max-heap the root is always the biggest value.",
        message: `The max-heap is ready. The root ${arr[0]} will be moved to the end.`,
        tip: "Now we repeat: swap root to the end, shrink the heap, heapify.",
        root: 0,
        first: 0
    });

    // Phase 2: move the largest value to the end
    for (let i = n - 1; i > 0; i--) {
        addStep({
            line: 7,
            type: "extract",
            action: "Take the Largest Value",
            values: `i = ${i}, root = ${arr[0]}, last heap value = ${arr[i]}`,
            why: "The root is the biggest value, so it belongs at index i.",
            message: `Swap the root ${arr[0]} with ${arr[i]} at index ${i}.`,
            tip: "Everything after the heap is already sorted.",
            root: 0,
            first: 0,
            second: i
        });

        const temp = arr[0];

        addStep({
            line: 8,
            type: "save",
            action: "Save Root in temp",
            values: `temp = ${temp}`,
            why: "The largest value is saved before the root is overwritten.",
            message: `Store ${temp} in the temporary variable.`,
            tip: "Same three-step swap as in other sorts.",
            root: 0,
            first: 0,
            second: i
        });

        arr[0] = arr[i];

        addStep({
            line: 9,
            type: "swap",
            action: "Move Last Value to Root",
            values: `arr[0] = ${arr[0]}`,
            why: "The last heap value takes the root position.",
            message: `Copy ${arr[0]} into index 0.`,
            tip: "This value is probably small, so the heap rule is now broken at the root.",
            root: 0,
            first: 0,
            second: i
        });

        arr[i] = temp;
        heapSize = i;

        addStep({
            line: 10,
            type: "swap",
            action: "Place Largest at the End",
            values: `arr[${i}] = ${temp}`,
            why: "The largest value is now in its final sorted position.",
            message: `${temp} is fixed at index ${i}. The heap shrinks to ${heapSize} value(s).`,
            tip: "Sorted positions are shown in green and leave the heap tree.",
            root: 0,
            first: 0,
            second: i
        });

        addStep({
            line: 11,
            type: "heapify",
            action: "Repair the Heap",
            values: `heapify(arr, ${i}, 0)`,
            why: "The new root may be smaller than its children, so push it down.",
            message: `Call heapify on the root with heap size ${i}.`,
            tip: "Each repair takes O(log n) time.",
            root: 0,
            first: 0
        });

        heapify(i, 0);
    }

    heapSize = 0;

    addStep({
        line: 13,
        type: "done",
        action: "Sorting Completed",
        values: `Final array: [${arr.join(", ")}]`,
        why: "Every value was moved to its final position.",
        message: `Heap Sort completed: [${arr.join(", ")}].`,
        tip: "Time: O(n log n) in best, average and worst case. Extra space: O(1).",
        heapSize: 0
    });

    return result;
}


// ==========================================
// DRAW ARRAY BARS
// ==========================================

function renderBars(array, step) {
    barsContainer.innerHTML = "";

    const maxValue = Math.max(1, ...array.map(value => Math.abs(value)));

    array.forEach((value, index) => {
        const bar = document.createElement("div");

        bar.className = "bar";
        bar.style.height =
            `${Math.max(8, (Math.abs(value) / maxValue) * 90)}%`;

        bar.textContent = value;
        bar.title = `Index ${index}: ${value}`;

        const isSorted = index >= step.heapSize;
        const isChosen = index === step.first || index === step.second;

        if (isSorted) {
            bar.classList.add("sorted");
        } else if (SWAP_TYPES.includes(step.type) && isChosen) {
            bar.classList.add("swapping");
        } else if (index === step.root) {
            bar.classList.add("pivot");
        } else if (isChosen) {
            bar.classList.add("comparing");
        }

        barsContainer.appendChild(bar);
    });
}


// ==========================================
// HEAP TREE
// ==========================================
// The array is drawn as a binary tree:
// children of index i are 2i + 1 and 2i + 2.

function createHeapNode(index, step) {
    const size = step.array.length;

    if (index >= size) return null;

    const item = document.createElement("div");
    item.className = "tree-item";

    const box = document.createElement("div");
    box.className = "tree-node is-seen";

    const cell = document.createElement("span");
    cell.className = "tree-cell";
    cell.textContent = step.array[index];
    cell.title = `Index ${index}`;

    const isSorted = index >= step.heapSize;
    const isChosen = index === step.first || index === step.second;
    const isSwap = SWAP_TYPES.includes(step.type);

    if (isSorted) {
        cell.classList.add("is-fixed");
        box.classList.add("is-done");
    } else if (isSwap && isChosen) {
        cell.classList.add("is-active", "is-swap");
        box.classList.add("is-swapping");
    } else if (index === step.root) {
        cell.classList.add("is-pivot");
        box.classList.add("is-current");
    } else if (isChosen) {
        cell.classList.add("is-active");
    }

    box.appendChild(cell);
    item.appendChild(box);

    const kids = [
        createHeapNode(2 * index + 1, step),
        createHeapNode(2 * index + 2, step)
    ].filter(Boolean);

    if (kids.length > 0) {
        const children = document.createElement("div");
        children.className = "tree-children";

        kids.forEach(kid => children.appendChild(kid));
        item.appendChild(children);
    }

    return item;
}

function renderTree(step) {
    treeContainer.innerHTML = "";

    treeContainer.appendChild(createHeapNode(0, step));

    // Keep the active node centred (sideways only)
    const current = treeContainer.querySelector(".is-current, .is-swapping");

    if (current) {
        const nodeBox = current.getBoundingClientRect();
        const hostBox = treeContainer.getBoundingClientRect();

        treeContainer.scrollLeft +=
            (nodeBox.left + nodeBox.width / 2) -
            (hostBox.left + hostBox.width / 2);
    }
}


// ==========================================
// HIGHLIGHT CODE LINE
// ==========================================

function highlightCodeLine(lineNumber) {
    codeLines.forEach((line, index) => {
        const actualLine = Number(line.dataset.line || index + 1);

        line.classList.toggle("active", actualLine === lineNumber);
    });
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

    heapInfo.textContent = step.root >= 0
        ? `Index ${step.root} = ${step.array[step.root]} · Heap size ${step.heapSize}`
        : `Heap size ${step.heapSize}`;
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
    renderTree(step);
    highlightCodeLine(step.line);
    showLearningDetails(step);

    statusTag.textContent = `Step ${index + 1} of ${steps.length}`;
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

    const initialStep = steps[0];

    renderBars(originalArray, initialStep);
    renderTree(initialStep);
    highlightCodeLine(1);

    actionType.textContent = "Ready to start";
    message.textContent = "Click Next Step to begin Heap Sort.";

    valuesInvolved.textContent =
        `Array: [${originalArray.join(", ")}]`;

    whyText.textContent =
        "Heap Sort turns the array into a max-heap, then sorts it from the back.";

    tipText.textContent =
        "For index i, the children are at 2i + 1 and 2i + 2.";

    statusTag.textContent = "Ready to sort";
    chartStep.textContent = "Waiting to start";
    chartCaption.textContent = "Click Next Step to begin sorting.";
    stepCounter.textContent = "Step 0";
    heapInfo.textContent = "Not selected";

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
// NEXT / PREVIOUS STEP
// ==========================================

stepBtn.addEventListener("click", () => {
    if (!isPlaying && currentStep < steps.length - 1) {
        renderStep(currentStep + 1);
    }
});

prevBtn.addEventListener("click", () => {
    if (!isPlaying && currentStep > 0) {
        renderStep(currentStep - 1);
    }
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
// CUSTOM ARRAY INPUT AND NEW ARRAY
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

function generateRandomArray() {
    if (isPlaying) return;

    const values = new Set();

    while (values.size < 7) {
        values.add(Math.floor(Math.random() * 90) + 10);
    }

    originalArray = [...values];
    syncArrayInput();
    AlgoLab.showHint(ARRAY_HINT, false);
    resetVisualizer();
}

applyArrayBtn.addEventListener("click", loadCustomArray);
randomBtn.addEventListener("click", generateRandomArray);

arrayInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        loadCustomArray();
    }
});

syncArrayInput();


// ==========================================
// INITIALIZE
// ==========================================

resetVisualizer();
