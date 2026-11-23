
"use strict";

const barsContainer = document.getElementById("bars");
const message = document.getElementById("message");
const status = document.getElementById("status");

const actionType = document.getElementById("actionType");
const valuesInvolved = document.getElementById("valuesInvolved");
const whyText = document.getElementById("whyText");
const beforeArray = document.getElementById("beforeArray");
const afterArray = document.getElementById("afterArray");
const tipText = document.getElementById("tipText");
const chartStep = document.getElementById("chartStep");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const randomBtn = document.getElementById("randomBtn");
const arrayInput = document.getElementById("arrayInput");
const applyArrayBtn = document.getElementById("applyArrayBtn");
const resetBtn = document.getElementById("resetBtn");

const codeLines = document.querySelectorAll(".code-line");

let originalArray = [50, 30, 80, 20, 60];
let steps = [];
let currentStep = -1;
let timer = null;
let isPlaying = false;

const ANIMATION_SPEED = 1200;

// 1. Create Selection Sort Steps

function createSteps(inputArray) {
    const arr = [...inputArray];
    const result = [];

    let comparisons = 0;
    let swaps = 0;

    function addStep({
        line,
        type,
        action,
        values,
        why,
        message,
        tip,
        first = -1,
        second = -1,
        minIndex = -1,
        sortedCount = 0,
        before = arr
    }) {
        result.push({
            beforeArray: [...before],
            array: [...arr],
            line,
            type,
            action,
            values,
            why,
            message,
            tip,
            first,
            second,
            minIndex,
            sortedCount,
            comparisons,
            swaps
        });
    }

    addStep({
        line: 1,
        type: "ready",
        action: "Ready to Start",
        values: "No comparison yet",
        why: "Selection Sort finds the smallest value in the unsorted part and moves it to the correct position.",
        message: "Click Next Step or Start Sorting to begin.",
        tip: "Selection Sort grows the sorted part from left to right."
    });

    addStep({
        line: 2,
        type: "initialize",
        action: "Find Array Length",
        values: `Array: [${arr.join(", ")}]`,
        why: `The array contains ${arr.length} elements. The length tells the algorithm how many passes are needed.`,
        message: `The array contains ${arr.length} elements.`,
        tip: "An array of n elements needs at most n - 1 passes."
    });

    for (let i = 0; i < arr.length - 1; i++) {
        let minIndex = i;

        addStep({
            line: 3,
            type: "pass",
            action: `Pass ${i + 1}`,
            values: `Start at index ${i}, value ${arr[i]}.`,
            why: "The outer loop selects the first position of the unsorted part.",
            message: `Start pass ${i + 1}. Find the smallest value from index ${i} onward.`,
            tip: "The elements before index i are already sorted.",
            first: i,
            minIndex,
            sortedCount: i
        });

        addStep({
            line: 4,
            type: "minimum",
            action: "Set Initial Minimum",
            values: `Minimum = ${arr[minIndex]} at index ${minIndex}.`,
            why: "At the start of each pass, assume the first unsorted value is the smallest.",
            message: `Assume ${arr[minIndex]} is the minimum.`,
            tip: "minIndex stores the index of the smallest value found so far.",
            first: minIndex,
            minIndex,
            sortedCount: i
        });

        for (let j = i + 1; j < arr.length; j++) {
            addStep({
                line: 5,
                type: "compare",
                action: "Check Next Element",
                values: `Current minimum: ${arr[minIndex]}. Next value: ${arr[j]}.`,
                why: "The inner loop checks every remaining element in the unsorted part.",
                message: `Check index ${j}, value ${arr[j]}.`,
                tip: "Every remaining element must be checked to find the minimum.",
                first: j,
                second: minIndex,
                minIndex,
                sortedCount: i
            });

            comparisons++;

            addStep({
                line: 6,
                type: "compare",
                action: "Compare With Minimum",
                values: `${arr[j]} and ${arr[minIndex]}`,
                why: `Check whether ${arr[j]} is smaller than the current minimum ${arr[minIndex]}.`,
                message: `Is ${arr[j]} < ${arr[minIndex]}?`,
                tip: "The comparison uses <, so equal values do not change the minimum.",
                first: j,
                second: minIndex,
                minIndex,
                sortedCount: i
            });

            if (arr[j] < arr[minIndex]) {
                minIndex = j;

                addStep({
                    line: 7,
                    type: "minimum",
                    action: "Update Minimum",
                    values: `New minimum: ${arr[minIndex]} at index ${minIndex}.`,
                    why: `${arr[j]} is smaller than the previous minimum, so minIndex is updated.`,
                    message: `New minimum found: ${arr[minIndex]}.`,
                    tip: "Remember the index of the smallest value found so far.",
                    first: minIndex,
                    second: j,
                    minIndex,
                    sortedCount: i
                });
            } else {
                addStep({
                    line: 6,
                    type: "no-swap",
                    action: "Minimum Unchanged",
                    values: `${arr[j]} and ${arr[minIndex]}`,
                    why: `${arr[j]} is not smaller than ${arr[minIndex]}, so the current minimum remains unchanged.`,
                    message: `Keep ${arr[minIndex]} as the minimum.`,
                    tip: "A comparison does not always change minIndex.",
                    first: j,
                    second: minIndex,
                    minIndex,
                    sortedCount: i
                });
            }
        }

        addStep({
            line: 10,
            type: "save",
            action: "Save Current Value",
            values: `temp = ${arr[i]}`,
            why: `Save ${arr[i]} before replacing the value at index ${i}.`,
            message: `Save ${arr[i]} in temp.`,
            tip: "The temporary variable prevents a value from being lost.",
            first: i,
            second: minIndex,
            minIndex,
            sortedCount: i
        });

        const beforeSwap = [...arr];
        const temp = arr[i];

        addStep({
            line: 11,
            type: "swap",
            action: "Move Minimum",
            values: `${arr[minIndex]} moves to index ${i}.`,
            why: "The smallest value found in this pass belongs at the start of the unsorted part.",
            message: `Move ${arr[minIndex]} to index ${i}.`,
            tip: "The minimum value is placed in its correct position.",
            first: i,
            second: minIndex,
            minIndex,
            sortedCount: i,
            before: beforeSwap
        });

        arr[i] = arr[minIndex];

        addStep({
            line: 12,
            type: "swap",
            action: "Complete the Swap",
            values: `Place saved value ${temp} at index ${minIndex}.`,
            why: "The saved value completes the exchange between arr[i] and arr[minIndex].",
            message: `Place ${temp} at index ${minIndex}.`,
            tip: "The two values have now exchanged positions.",
            first: i,
            second: minIndex,
            minIndex,
            sortedCount: i,
            before: beforeSwap
        });

        arr[minIndex] = temp;

        if (minIndex !== i) {
            swaps++;
        }

        addStep({
            line: 13,
            type: "pass-complete",
            action: "Pass Complete",
            values: `Sorted prefix: [${arr.slice(0, i + 1).join(", ")}]`,
            why: `The smallest value in the unsorted part is now at index ${i}.`,
            message: `Position ${i} is now sorted.`,
            tip: "The sorted part grows by one element after each pass.",
            first: i,
            sortedCount: i + 1
        });
    }

    addStep({
        line: 14,
        type: "done",
        action: "Sorting Completed",
        values: `Final array: [${arr.join(", ")}]`,
        why: "All passes are complete. The array is now sorted in ascending order.",
        message: `Sorting completed! [${arr.join(", ")}]`,
        tip: "Selection Sort uses O(n²) time and O(1) extra space.",
        sortedCount: arr.length
    });

    return result;
}

// 2. Render Array Bars

function renderBars(array, first = -1, second = -1, type = "", minIndex = -1, sortedCount = 0) {
    barsContainer.innerHTML = "";

    const maxValue = Math.max(...array.map(v => Math.abs(v)), 1);

    array.forEach((value, index) => {
        const bar = document.createElement("div");

        bar.className = "bar";
        bar.style.height = `${Math.max(8, (Math.abs(value) / maxValue) * 90)}%`;
        bar.textContent = value;
        bar.title = `Index ${index}: ${value}`;

        if (type === "done" || index < sortedCount) {
            bar.classList.add("sorted");
        } else if (index === minIndex) {
            bar.classList.add("swapping");
        } else if (index === first || index === second) {
            if (type === "compare" || type === "no-swap") {
                bar.classList.add("comparing");
            }

            if (type === "swap" || type === "save" || type === "minimum") {
                bar.classList.add("swapping");
            }
        }

        barsContainer.appendChild(bar);
    });
}

// 3. Highlight Java Code Line

function highlightCodeLine(lineNumber) {
    codeLines.forEach(line => {
        line.classList.toggle(
            "active",
            Number(line.dataset.line) === lineNumber
        );
    });
}

// 4. Render Before and After Arrays

function renderArrayValues(container, array, previous, first, second) {
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

// 5. Show Learning Details

function showLearningDetails(step) {
    actionType.textContent = step.action;
    valuesInvolved.textContent = step.values;
    whyText.textContent = step.why;
    tipText.textContent = step.tip;

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
}

// 6. Update Buttons

function updateButtons() {
    const isDone = currentStep >= steps.length - 1;

    if (isPlaying) {
        startBtn.textContent = "⏸ Pause Sorting";
    } else if (isDone) {
        startBtn.textContent = "↻ Restart Sorting";
    } else if (currentStep >= 0) {
        startBtn.textContent = "▶ Resume Sorting";
    } else {
        startBtn.textContent = "▶ Start Sorting";
    }

    startBtn.disabled = false;
    stepBtn.disabled = isPlaying || isDone;
    prevBtn.disabled = isPlaying || currentStep <= 0;
    randomBtn.disabled = isPlaying;
    arrayInput.disabled = isPlaying;
    applyArrayBtn.disabled = isPlaying;
    resetBtn.disabled = isPlaying;
}

// 7. Render a Specific Step

function renderStep(index) {
    if (index < 0 || index >= steps.length) return;

    currentStep = index;

    const step = steps[currentStep];

    renderBars(
        step.array,
        step.first,
        step.second,
        step.type,
        step.minIndex,
        step.sortedCount
    );

    highlightCodeLine(step.line);
    showLearningDetails(step);

    message.textContent = step.message;
    status.textContent = `Step ${currentStep + 1} of ${steps.length}`;

    chartStep.textContent = `Step ${currentStep + 1}`;

    updateButtons();
}

// 8. Stop Animation

function stopAnimation() {
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }

    isPlaying = false;
    updateButtons();
}

// 9. Reset Visualizer

function resetVisualizer() {
    stopAnimation();

    steps = createSteps(originalArray);
    currentStep = -1;

    renderBars(originalArray);
    highlightCodeLine(1);

    message.textContent = "Ready! Click Next Step or Start Sorting.";
    status.textContent = "Ready to sort";
    actionType.textContent = "Ready to Start";
    valuesInvolved.textContent = "No comparison yet";

    whyText.textContent =
        "Selection Sort finds the smallest value in the unsorted part of the array.";

    tipText.textContent =
        "Click Next Step to see how the minimum is found and moved.";

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

    chartStep.textContent = "Initial array";

    updateButtons();
}

// 10. Start / Pause / Resume / Restart

startBtn.addEventListener("click", () => {
    if (isPlaying) {
        stopAnimation();
        message.textContent = "Sorting paused. Click Resume Sorting to continue.";
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

// 11. Next Step

stepBtn.addEventListener("click", () => {
    if (isPlaying) return;

    if (currentStep < steps.length - 1) {
        renderStep(currentStep + 1);
    }
});

// 12. Previous Step

prevBtn.addEventListener("click", () => {
    if (isPlaying) return;

    if (currentStep > 0) {
        renderStep(currentStep - 1);
    }
});

// 13. Generate New Array

randomBtn.addEventListener("click", () => {
    if (isPlaying) return;

    originalArray = Array.from(
        { length: 7 },
        () => Math.floor(Math.random() * 90) + 10
    );

    resetVisualizer();
});

// 14. Reset

resetBtn.addEventListener("click", () => {
    if (isPlaying) return;

    resetVisualizer();
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

// 15. Initialize

resetVisualizer();
