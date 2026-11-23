
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

// 1. Create Bubble Sort Steps

function createSteps(inputArray) {
    const arr = [...inputArray];
    const result = [];

    let loopI = -1;
    let loopJ = -1;

    function addStep({
        before,
        first = -1,
        second = -1,
        type,
        line,
        action,
        values,
        why,
        message,
        tip
    }) {
        result.push({
            i: loopI,
            j: loopJ,
            beforeArray: [...before],
            array: [...arr],
            first,
            second,
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
        before: arr,
        type: "ready",
        line: 1,
        action: "Ready to Start",
        values: "No comparison yet",
        why: "Bubble Sort compares neighbouring values to arrange them from smallest to largest.",
        message: "Click Next Step or Start Sorting to begin.",
        tip: "Ascending order means smallest to largest."
    });

    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = 0; j < arr.length - 1 - i; j++) {
            loopI = i;
            loopJ = j;
            const left = arr[j];
            const right = arr[j + 1];

            addStep({
                before: arr,
                first: j,
                second: j + 1,
                type: "compare",
                line: 3,
                action: "Compare Values",
                values: `${left} and ${right}`,
                why: `The condition checks whether ${left} is greater than ${right}.`,
                message: `Compare ${left} with ${right}.`,
                tip: "Bubble Sort compares neighbouring values."
            });

            if (left > right) {
                const beforeSwap = [...arr];
                const temp = arr[j];

                addStep({
                    before: arr,
                    first: j,
                    second: j + 1,
                    type: "save",
                    line: 4,
                    action: "Save the Left Value",
                    values: `temp = ${temp}`,
                    why: `We save ${temp} in a temporary variable so we do not lose it during the swap.`,
                    message: `Save ${temp} in temp.`,
                    tip: "A temporary variable helps exchange two values safely."
                });

                arr[j] = arr[j + 1];

                addStep({
                    before: beforeSwap,
                    first: j,
                    second: j + 1,
                    type: "swap",
                    line: 5,
                    action: "Move Right Value Left",
                    values: `${right} moves to the left`,
                    why: `Because ${left} is greater than ${right}, copy ${right} into the left position. The saved value is still in temp.`,
                    message: `Move ${right} into the left position.`,
                    tip: "This is an intermediate state. The saved value will fill the right position next."
                });

                const beforeFinalSwap = [...arr];
                arr[j + 1] = temp;

                addStep({
                    before: beforeFinalSwap,
                    first: j,
                    second: j + 1,
                    type: "swap",
                    line: 6,
                    action: "Finish the Swap",
                    values: `${right} and ${temp}`,
                    why: `Place the saved value ${temp} into the right position. Now the two values have exchanged places.`,
                    message: `Complete the swap: ${right} is on the left and ${temp} is on the right.`,
                    tip: "Lines 4, 5, and 6 work together to swap two values."
                });
            } else {
                addStep({
                    before: arr,
                    first: j,
                    second: j + 1,
                    type: "no-swap",
                    line: 3,
                    action: "No Swap Needed",
                    values: `${left} and ${right}`,
                    why: `${left} is less than or equal to ${right}, so these two values are already in the correct order.`,
                    message: `Keep ${left} and ${right} in their current positions.`,
                    tip: "When the left value is smaller, no swap is needed."
                });
            }
        }
    }

    result.push({
        beforeArray: [...arr],
        array: [...arr],
        first: -1,
        second: -1,
        type: "done",
        line: 9,
        action: "Sorting Completed",
        values: "All values",
        why: "All required comparisons are finished. The array is sorted in ascending order.",
        message: `Sorting completed! Final array: [${arr.join(", ")}].`,
        tip: "Basic Bubble Sort has O(n²) time complexity and O(1) auxiliary space."
    });

    return result;
}

// 2. Render Array Bars

function renderBars(array, first = -1, second = -1, type = "") {
    barsContainer.innerHTML = "";

    const maxValue = Math.max(...originalArray, 1);

    array.forEach((value, index) => {
        const bar = document.createElement("div");

        bar.className = "bar";
        bar.style.height = `${Math.max(8, (value / maxValue) * 90)}%`;
        bar.textContent = value;

        if (type === "done") {
            bar.classList.add("sorted");
        } else if (index === first || index === second) {
            if (type === "compare" || type === "no-swap") {
                bar.classList.add("comparing");
            }

            if (type === "swap" || type === "save") {
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

// 5. Show Learning Explanation

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
    if (index < 0 || index >= steps.length) {
        return;
    }

    currentStep = index;

    const step = steps[currentStep];

    renderBars(
        step.array,
        step.first,
        step.second,
        step.type
    );

    highlightCodeLine(step.line);
    showLearningDetails(step);

    message.textContent = step.message;
    status.textContent = `Step ${currentStep + 1} of ${steps.length}`;

    if (chartStep) {
        chartStep.textContent = `Step ${currentStep + 1}`;
    }

    updateButtons();
}

// 8. Pause / Stop Animation Timer

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

    message.textContent =
        "Ready! Click Next Step or Start Sorting.";

    status.textContent = "Ready to sort";

    actionType.textContent = "Ready to Start";
    valuesInvolved.textContent = "No comparison yet";

    whyText.textContent =
        "Bubble Sort compares neighbouring values to arrange them in order.";

    tipText.textContent =
        "Click Next Step to see exactly what happens.";

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

    if (chartStep) {
        chartStep.textContent = "Initial array";
    }

    updateButtons();
}

// 10. Start / Pause / Resume / Restart Sorting

startBtn.addEventListener("click", () => {
    // If running, pause the animation.
    if (isPlaying) {
        stopAnimation();
        message.textContent = "Sorting paused. Click Resume Sorting to continue.";
        return;
    }

    // If completed, prepare a fresh run.
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
    if (isPlaying) {
        return;
    }

    if (currentStep < steps.length - 1) {
        renderStep(currentStep + 1);
    }
});

// 12. Previous Step

prevBtn.addEventListener("click", () => {
    if (isPlaying) {
        return;
    }

    if (currentStep > 0) {
        renderStep(currentStep - 1);
    }
});

// 13. Generate New Array

randomBtn.addEventListener("click", () => {
    if (isPlaying) {
        return;
    }

    originalArray = Array.from(
        { length: 7 },
        () => Math.floor(Math.random() * 90) + 10
    );

    resetVisualizer();
});

// 14. Reset Button

resetBtn.addEventListener("click", () => {
    if (isPlaying) {
        return;
    }

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

// 15. Initialize Visualizer

resetVisualizer();
