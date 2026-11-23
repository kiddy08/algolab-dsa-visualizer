
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

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const randomBtn = document.getElementById("randomBtn");
const resetBtn = document.getElementById("resetBtn");

const codeLines = document.querySelectorAll(".code-line");

let originalArray = [10, 20, 30, 40, 50];
let target = 30;
let steps = [];
let currentStep = -1;
let timer = null;
let isPlaying = false;

const ANIMATION_SPEED = 1200;

// =====================================
// 1. Create Linear Search Steps
// =====================================

function createSteps(inputArray, searchTarget) {
    const arr = [...inputArray];
    const result = [];

    function addStep({
        index = -1,
        type,
        line,
        action,
        values,
        why,
        message,
        tip
    }) {
        result.push({
            beforeArray: [...arr],
            array: [...arr],
            index,
            type,
            line,
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
        action: "Ready to Search",
        values: `Target = ${searchTarget}`,
        why: "We want to find the position of the target in the array.",
        message: `Search for ${searchTarget} in [${arr.join(", ")}].`,
        tip: "Linear Search checks elements one by one."
    });

    for (let i = 0; i < arr.length; i++) {
        const value = arr[i];

        addStep({
            index: i,
            type: "checking",
            line: 3,
            action: "Check This Value",
            values: `arr[${i}] = ${value}; target = ${searchTarget}`,
            why: `Check whether ${value} equals ${searchTarget}.`,
            message: `Checking index ${i}: is ${value} equal to ${searchTarget}?`,
            tip: "Array indexes start at 0, not 1."
        });

        if (value === searchTarget) {
            addStep({
                index: i,
                type: "found",
                line: 4,
                action: "Target Found!",
                values: `arr[${i}] = ${value}`,
                why: `${value} equals ${searchTarget}. Return index ${i}.`,
                message: `Found ${searchTarget} at index ${i}.`,
                tip: `Index ${i} is the ${i + 1} element when counting from 1.`
            });

            addStep({
                index: i,
                type: "done",
                line: 4,
                action: "Search Completed",
                values: `Target index = ${i}`,
                why: "The target was found, so the search can stop.",
                message: `Search completed. The index is ${i}.`,
                tip: "Linear Search stops when the target is found."
            });

            return result;
        }
    }

    addStep({
        index: -1,
        type: "not-found",
        line: 7,
        action: "Target Not Found",
        values: `Target = ${searchTarget}`,
        why: `No element equals ${searchTarget}.`,
        message: `${searchTarget} is not in the array. Return -1.`,
        tip: "-1 means the target was not found."
    });

    return result;
}

// =====================================
// 2. Draw Array Bars
// =====================================

function renderBars(array, activeIndex = -1, type = "") {
    barsContainer.innerHTML = "";

    const maxValue = Math.max(
        ...array.map(value => Math.abs(value)),
        1
    );

    array.forEach((value, index) => {
        const bar = document.createElement("div");
        bar.className = "bar";

        const height = Math.max(
            8,
            (Math.abs(value) / maxValue) * 90
        );

        bar.style.height = `${height}%`;
        bar.textContent = value;
        bar.title = `Index ${index}: ${value}`;

        if (index === activeIndex) {
            if (type === "found" || type === "done") {
                bar.classList.add("found");
            } else if (type === "checking") {
                bar.classList.add("comparing");
            }
        }

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
// 4. Display Array Values
// =====================================

function renderArrayValues(container, array, previous, activeIndex) {
    container.innerHTML = "";

    array.forEach((value, index) => {
        const item = document.createElement("span");

        item.className = "array-value";
        item.textContent = value;

        if (previous[index] !== value) {
            item.classList.add("changed");
        }

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

    renderArrayValues(
        beforeArray,
        step.beforeArray,
        step.beforeArray,
        -1
    );

    renderArrayValues(
        afterArray,
        step.array,
        step.beforeArray,
        step.index
    );
}

// =====================================
// 6. Update Buttons
// =====================================

function updateButtons() {
    const isDone = currentStep >= steps.length - 1;

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
// 7. Render Current Step
// =====================================

function renderStep(index) {
    if (index < 0 || index >= steps.length) return;

    currentStep = index;

    const step = steps[currentStep];

    renderBars(step.array, step.index, step.type);
    highlightCodeLine(step.line);
    showLearningDetails(step);

    message.textContent = step.message;
    status.textContent = `Step ${currentStep + 1} of ${steps.length}`;

    updateButtons();
}

// =====================================
// 8. Pause Animation Internally
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

    const targetCodeLine = document.querySelector(
        '.code-line[data-line="1"]'
    );

    if (targetCodeLine) {
        targetCodeLine.textContent = `int target = ${target};`;
    }

    renderBars(originalArray);
    highlightCodeLine(1);

    message.textContent = "Ready! Click Next Step or Start Search.";
    status.textContent = "Ready to search";

    actionType.textContent = "Ready to Search";
    valuesInvolved.textContent = `Target = ${target}`;
    whyText.textContent = "Linear Search checks elements one by one.";
    tipText.textContent = "The array does not need to be sorted.";

    renderArrayValues(
        beforeArray,
        originalArray,
        originalArray,
        -1
    );

    renderArrayValues(
        afterArray,
        originalArray,
        originalArray,
        -1
    );

    updateButtons();
}

// =====================================
// 10. Start / Pause / Resume / Restart
// =====================================

startBtn.addEventListener("click", () => {
    // Pause the animation if it is running
    if (isPlaying) {
        stopAnimation();
        return;
    }

    // Restart from the beginning if completed
    if (currentStep >= steps.length - 1) {
        currentStep = -1;
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
// 13. Generate Random Array
// =====================================

randomBtn.addEventListener("click", () => {
    if (isPlaying) return;

    originalArray = Array.from(
        { length: 7 },
        () => Math.floor(Math.random() * 90) + 10
    );

    arrayInput.value = originalArray.join(", ");

    resetVisualizer();
});

// =====================================
// 14. Apply Target
// =====================================

applyTargetBtn.addEventListener("click", () => {
    if (isPlaying) return;

    const inputValue = targetInput.value.trim();

    if (inputValue === "" || !/^-?\d+$/.test(inputValue)) {
        message.textContent = "Please enter a valid integer target.";
        targetInput.focus();
        return;
    }

    const newTarget = Number(inputValue);

    if (!Number.isSafeInteger(newTarget)) {
        message.textContent = "Please enter a valid integer target.";
        targetInput.focus();
        return;
    }

    target = newTarget;
    resetVisualizer();
});

// =====================================
// 15. Apply Manual Array
// =====================================

applyArrayBtn.addEventListener("click", () => {
    if (isPlaying) return;

    const input = arrayInput.value.trim();

    if (input === "") {
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

    if (window.AlgoLab && AlgoLab.showHint) AlgoLab.showHint("", false);
    originalArray = newArray;
    arrayInput.value = originalArray.join(", ");

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
