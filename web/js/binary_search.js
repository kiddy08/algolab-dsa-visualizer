
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

const arrayInput = document.getElementById("arrayInput");
const applyArrayBtn = document.getElementById("applyArrayBtn");

const targetInput = document.getElementById("targetInput");
const targetDisplay = document.getElementById("targetDisplay");
const applyTargetBtn = document.getElementById("applyTargetBtn");

const rangeDisplay = document.getElementById("rangeDisplay");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const randomBtn = document.getElementById("randomBtn");
const resetBtn = document.getElementById("resetBtn");

const codeLines = document.querySelectorAll(".code-line");

let originalArray = [10, 20, 30, 40, 50, 60, 70];
let target = 50;

let steps = [];
let currentStep = -1;
let timer = null;
let isPlaying = false;

const ANIMATION_SPEED = 1200;

// =====================================
// 1. Create Binary Search Steps
// =====================================

function createSteps(inputArray, searchTarget) {
    const arr = [...inputArray];
    const result = [];

    let low = 0;
    let high = arr.length - 1;

    function addStep({
        type,
        line,
        index = -1,
        lowValue = low,
        highValue = high,
        action,
        values,
        why,
        message,
        tip
    }) {
        result.push({
            array: [...arr],
            beforeArray: [...arr],
            type,
            line,
            index,
            low: lowValue,
            high: highValue,
            action,
            values,
            why,
            message,
            tip
        });
    }

    addStep({
        type: "ready",
        line: 1,
        action: "Initialize Search",
        values: `Target = ${searchTarget}`,
        why: "Set low to the first index and high to the last index.",
        message: `Search for ${searchTarget} in [${arr.join(", ")}].`,
        tip: "Binary Search works only on sorted arrays."
    });

    while (low <= high) {
        addStep({
            type: "range",
            line: 3,
            action: "Check Search Range",
            values: `Low = ${low}, High = ${high}`,
            why: "Continue while low is less than or equal to high.",
            message: `The current search range is index ${low} to ${high}.`,
            tip: "Low and high mark the remaining search range."
        });

        const mid = low + Math.floor((high - low) / 2);
        const value = arr[mid];

        addStep({
            type: "checking",
            line: 4,
            index: mid,
            action: "Calculate Middle",
            values: `Low = ${low}, Mid = ${mid}, High = ${high}`,
            why: `Mid = ${low} + (${high} - ${low}) / 2 = ${mid}.`,
            message: `The middle index is ${mid}, containing ${value}.`,
            tip: "Integer division gives a whole-number index."
        });

        if (value === searchTarget) {
            addStep({
                type: "found",
                line: 5,
                index: mid,
                action: "Target Found!",
                values: `arr[${mid}] = ${value}`,
                why: `${value} equals ${searchTarget}, so return index ${mid}.`,
                message: `Found ${searchTarget} at index ${mid}.`,
                tip: "Java array indexes start at zero."
            });

            addStep({
                type: "done",
                line: 5,
                index: mid,
                action: "Search Completed",
                values: `Result = ${mid}`,
                why: "The target was found. No more elements need checking.",
                message: `Search completed. The target index is ${mid}.`,
                tip: "Binary Search can eliminate half the search range each iteration."
            });

            return result;
        }

        if (value < searchTarget) {
            addStep({
                type: "discarded",
                line: 6,
                index: mid,
                action: "Search Right Half",
                values: `${value} < ${searchTarget}`,
                why: `The array is sorted. Values at or below index ${mid} cannot contain the target.`,
                message: `${value} is smaller than ${searchTarget}. Move low to ${mid + 1}.`,
                tip: "When the middle value is too small, set low = mid + 1."
            });

            low = mid + 1;
        } else {
            addStep({
                type: "discarded",
                line: 7,
                index: mid,
                action: "Search Left Half",
                values: `${value} > ${searchTarget}`,
                why: `The array is sorted. Values at or above index ${mid} are too large.`,
                message: `${value} is greater than ${searchTarget}. Move high to ${mid - 1}.`,
                tip: "When the middle value is too large, set high = mid - 1."
            });

            high = mid - 1;
        }
    }

    addStep({
        type: "not-found",
        line: 9,
        action: "Target Not Found",
        values: `Target = ${searchTarget}`,
        why: "Low is now greater than high, so no search range remains.",
        message: `${searchTarget} is not in the array. Return -1.`,
        tip: "Binary Search returns -1 when the target is absent."
    });

    return result;
}

// =====================================
// 2. Draw Array Bars
// =====================================

function renderBars(array, step = null) {
    barsContainer.innerHTML = "";

    const maxValue = Math.max(
        ...array.map(value => Math.abs(value)),
        1
    );

    array.forEach((value, index) => {
        const bar = document.createElement("div");
        bar.className = "bar";

        bar.style.height =
            `${Math.max(8, Math.abs(value) / maxValue * 90)}%`;

        bar.textContent = value;
        bar.title = `Index ${index}: ${value}`;

        if (step) {
            const inRange =
                index >= step.low && index <= step.high;

            if (
                index === step.index &&
                (step.type === "found" || step.type === "done")
            ) {
                bar.classList.add("found");
            } else if (index === step.index) {
                bar.classList.add("comparing");
            } else if (!inRange && step.type !== "ready") {
                bar.style.opacity = "0.3";
            }
        }

        const indexLabel = document.createElement("small");
        indexLabel.textContent = index;
        indexLabel.style.display = "block";
        indexLabel.style.fontSize = "10px";

        bar.appendChild(indexLabel);
        barsContainer.appendChild(bar);
    });
}

// =====================================
// 3. Highlight Java Code
// =====================================

function highlightCodeLine(lineNumber) {
    codeLines.forEach(line => {
        line.classList.toggle(
            "active",
            Number(line.dataset.line) === lineNumber
        );
    });
}

// =====================================
// 4. Render Mini Arrays
// =====================================

function renderArrayValues(container, array, activeIndex) {
    container.innerHTML = "";

    array.forEach((value, index) => {
        const item = document.createElement("span");
        item.className = "array-value";
        item.textContent = value;

        if (index === activeIndex) {
            item.classList.add("active-value");
        }

        container.appendChild(item);
    });
}

// =====================================
// 5. Show Learning Details
// =====================================

function showLearningDetails(step) {
    actionType.textContent = step.action;
    valuesInvolved.textContent = step.values;
    whyText.textContent = step.why;
    tipText.textContent = step.tip;

    renderArrayValues(beforeArray, step.beforeArray, -1);
    renderArrayValues(afterArray, step.array, step.index);

    rangeDisplay.textContent =
        `Low: ${step.low} | Mid: ${step.index >= 0 ? step.index : "-"} | High: ${step.high}`;
}

// =====================================
// 6. Update Buttons
// =====================================

function updateButtons() {
    const isDone = currentStep >= steps.length - 1;

    // One button handles Start, Pause, Resume and Restart
    startBtn.disabled = false;

    if (isPlaying) {
        startBtn.textContent = "⏸ Pause Search";
    } else if (isDone) {
        startBtn.textContent = "↻ Restart Search";
    } else if (currentStep >= 0) {
        startBtn.textContent = "▶ Resume Search";
    } else {
        startBtn.textContent = "▶ Start Search";
    }

    stepBtn.disabled = isPlaying || isDone;
    prevBtn.disabled = isPlaying || currentStep <= 0;

    randomBtn.disabled = isPlaying;
    resetBtn.disabled = isPlaying;

    arrayInput.disabled = isPlaying;
    applyArrayBtn.disabled = isPlaying;

    targetInput.disabled = isPlaying;
    applyTargetBtn.disabled = isPlaying;
}

// =====================================
// 7. Render a Step
// =====================================

function renderStep(index) {
    if (index < 0 || index >= steps.length) return;

    currentStep = index;

    const step = steps[currentStep];

    renderBars(step.array, step);
    highlightCodeLine(step.line);
    showLearningDetails(step);

    message.textContent = step.message;
    status.textContent = `Step ${currentStep + 1} of ${steps.length}`;

    updateButtons();
}

// =====================================
// 8. Stop / Pause Animation Internally
// =====================================

function stopAnimation() {
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }

    isPlaying = false;
    updateButtons();
}

// =====================================
// 9. Reset Visualizer
// =====================================

function resetVisualizer() {
    stopAnimation();

    steps = createSteps(originalArray, target);
    currentStep = -1;

    targetDisplay.textContent = target;

    renderBars(originalArray);
    highlightCodeLine(1);

    message.textContent = "Ready! Click Next Step or Start Search.";
    status.textContent = "Ready to search";

    actionType.textContent = "Ready to Search";
    valuesInvolved.textContent = `Target = ${target}`;
    whyText.textContent = "Binary Search checks the middle element first.";
    tipText.textContent = "The array must be sorted.";

    rangeDisplay.textContent =
        `Low: 0 | Mid: - | High: ${originalArray.length - 1}`;

    renderArrayValues(beforeArray, originalArray, -1);
    renderArrayValues(afterArray, originalArray, -1);

    updateButtons();
}

// =====================================
// 10. Start / Pause / Resume / Restart
// =====================================

startBtn.addEventListener("click", () => {
    // Pause if animation is running
    if (isPlaying) {
        stopAnimation();
        return;
    }

    // Restart from the beginning if already completed
    if (currentStep >= steps.length - 1) {
        currentStep = -1;
        renderBars(originalArray);
        highlightCodeLine(1);

        message.textContent = "Restarting Binary Search...";
        status.textContent = "Ready to search";
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

// =====================================
// 11. Next Step
// =====================================

stepBtn.addEventListener("click", () => {
    if (!isPlaying && currentStep < steps.length - 1) {
        renderStep(currentStep + 1);
    }
});

// =====================================
// 12. Previous Step
// =====================================

prevBtn.addEventListener("click", () => {
    if (!isPlaying && currentStep > 0) {
        renderStep(currentStep - 1);
    }
});

// =====================================
// 13. Generate Random Sorted Array
// =====================================

randomBtn.addEventListener("click", () => {
    if (isPlaying) return;

    originalArray = Array.from(
        { length: 7 },
        () => Math.floor(Math.random() * 90) + 10
    ).sort((a, b) => a - b);

    arrayInput.value = originalArray.join(", ");
    resetVisualizer();
});

// =====================================
// 14. Apply Manual Array
// =====================================

applyArrayBtn.addEventListener("click", () => {
    if (isPlaying) return;

    const input = arrayInput.value.trim();

    if (!input) {
        message.textContent = "Please enter array elements.";
        if (window.AlgoLab && AlgoLab.showHint) AlgoLab.showHint("Please enter array elements.", true);
        arrayInput.focus();
        return;
    }

    const values = input.split(",").map(value => value.trim());

    if (values.some(value => !/^-?\d+$/.test(value))) {
        message.textContent =
            "Enter integers separated by commas, e.g. 5, 10, 20.";
        if (window.AlgoLab && AlgoLab.showHint) AlgoLab.showHint("Enter integers separated by commas, e.g. 5, 10, 20.", true);
        arrayInput.focus();
        return;
    }

    if (values.length < 2 || values.length > 15) {
        message.textContent = "Please enter between 2 and 15 elements.";
        if (window.AlgoLab && AlgoLab.showHint) AlgoLab.showHint("Please enter between 2 and 15 elements.", true);
        arrayInput.focus();
        return;
    }

    const newArray = values.map(Number);

    if (newArray.some(value => !Number.isSafeInteger(value))) {
        message.textContent = "Please enter valid integers.";
        arrayInput.focus();
        return;
    }

    // Binary Search requires sorted input
    if (window.AlgoLab && AlgoLab.showHint) AlgoLab.showHint("", false);
    originalArray = newArray.sort((a, b) => a - b);
    arrayInput.value = originalArray.join(", ");

    resetVisualizer();

    message.textContent =
        `Array sorted: [${originalArray.join(", ")}]. Ready to search.`;
});

// =====================================
// 15. Apply Target
// =====================================

applyTargetBtn.addEventListener("click", () => {
    if (isPlaying) return;

    const input = targetInput.value.trim();

    if (input === "" || !/^-?\d+$/.test(input)) {
        message.textContent = "Please enter a valid integer target.";
        targetInput.focus();
        return;
    }

    const newTarget = Number(input);

    if (!Number.isSafeInteger(newTarget)) {
        message.textContent = "Please enter a valid integer target.";
        targetInput.focus();
        return;
    }

    target = newTarget;
    resetVisualizer();
});

// =====================================
// 16. Reset Button
// =====================================

resetBtn.addEventListener("click", () => {
    if (!isPlaying) {
        resetVisualizer();
    }
});

// =====================================
// 17. Enter Key Support
// =====================================

arrayInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        applyArrayBtn.click();
    }
});

targetInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        applyTargetBtn.click();
    }
});

// =====================================
// 18. Initialize
// =====================================

resetVisualizer();
