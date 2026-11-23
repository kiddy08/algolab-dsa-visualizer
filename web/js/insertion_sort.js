
"use strict";

const $ = (id) => document.getElementById(id);

const arrayInput = $("arrayInput");
const applyArrayBtn = $("applyArrayBtn");
const randomBtn = $("randomBtn");
const prevBtn = $("prevBtn");
const stepBtn = $("stepBtn");
const resetBtn = $("resetBtn");
const startBtn = $("startBtn");

const bars = $("bars");
const chartStep = $("chartStep");
const actionType = $("actionType");
const message = $("message");
const valuesInvolved = $("valuesInvolved");
const whyText = $("whyText");
const tipText = $("tipText");
const status = $("status");

let originalArray = [8, 4, 6, 2, 7];
let steps = [];
let currentStep = 0;
let timer = null;

const defaultTip =
    "Insertion Sort builds a sorted section from left to right.";

function saveStep(data) {
    steps.push({
        array: [...data.array],
        line: data.line,
        action: data.action,
        message: data.message,
        values: data.values || "No comparison yet",
        why: data.why,
        tip: data.tip || defaultTip,
        keyIndex: data.keyIndex ?? -1,
        compareIndex: data.compareIndex ?? -1,
        shiftIndex: data.shiftIndex ?? -1,
        sortedUntil: data.sortedUntil ?? 0
    });
}

function createSteps(input) {
    const arr = [...input];
    steps = [];

    saveStep({
        array: arr,
        line: 1,
        action: "Ready to start",
        message:
            "The first element is considered sorted. We will insert each next element into the correct position.",
        why:
            "Insertion Sort starts from index 1 because a single-element section is already sorted.",
        tip: "Index 0 is the starting sorted section.",
        sortedUntil: 0
    });

    for (let i = 1; i < arr.length; i++) {
        saveStep({
            array: arr,
            line: 1,
            action: "Start a new pass",
            message:
                `We are processing index ${i}. The current value is ${arr[i]}.`,
            values: `Index i = ${i}; value = ${arr[i]}`,
            why:
                "The outer loop selects the next element to insert into the sorted left section.",
            keyIndex: i,
            sortedUntil: i - 1
        });

        const key = arr[i];

        saveStep({
            array: arr,
            line: 2,
            action: "Select the key",
            message:
                `Store ${key} in key. We must find the correct position for it.`,
            values: `Key = ${key} at index ${i}`,
            why:
                "The key must be kept safe while larger elements are shifted to the right.",
            keyIndex: i,
            sortedUntil: i - 1
        });

        let j = i - 1;

        saveStep({
            array: arr,
            line: 3,
            action: "Check the left side",
            message:
                `Set j = ${j}. Start by checking the element immediately to the left of the key.`,
            values: `Key = ${key}; j = ${j}; arr[j] = ${arr[j]}`,
            why:
                "We compare the key with elements in the already-sorted left section.",
            keyIndex: i,
            compareIndex: j,
            sortedUntil: i - 1
        });

        while (true) {
            const condition = j >= 0 && arr[j] > key;

            saveStep({
                array: arr,
                line: 4,
                action: condition
                    ? "Condition is true"
                    : "Check the condition",
                message: condition
                    ? `${arr[j]} > ${key} is true. The larger element must move right.`
                    : j < 0
                        ? "j is less than 0. There are no more elements on the left."
                        : `${arr[j]} is not greater than ${key}. The correct position has been found.`,
                values: j >= 0
                    ? `arr[${j}] = ${arr[j]}; key = ${key}`
                    : `j = ${j}; key = ${key}`,
                why:
                    "Continue only while j is valid and the current left element is greater than the key.",
                keyIndex: i,
                compareIndex: j,
                sortedUntil: i - 1
            });

            if (!condition) {
                break;
            }

            arr[j + 1] = arr[j];

            saveStep({
                array: arr,
                line: 5,
                action: "Shift element right",
                message:
                    `Move ${arr[j + 1]} from index ${j} to index ${j + 1}.`,
                values:
                    `Shift ${arr[j + 1]} one position right; key = ${key}`,
                why:
                    "This makes room for the key at its correct position.",
                keyIndex: i,
                shiftIndex: j + 1,
                compareIndex: j,
                sortedUntil: i - 1
            });

            j--;

            saveStep({
                array: arr,
                line: 6,
                action: "Move j left",
                message:
                    `Decrease j to ${j}. Check the next element on the left.`,
                values: `j = ${j}; key = ${key}`,
                why:
                    "Continue checking the sorted section until we find an element no greater than the key.",
                keyIndex: i,
                compareIndex: j,
                sortedUntil: i - 1
            });
        }

        arr[j + 1] = key;

        saveStep({
            array: arr,
            line: 8,
            action: "Insert the key",
            message:
                `Place key ${key} at index ${j + 1}. The left section is now sorted.`,
            values: `key = ${key}; destination index = ${j + 1}`,
            why:
                "All larger elements have moved right, so arr[j + 1] is the correct position for the key.",
            keyIndex: j + 1,
            sortedUntil: i
        });
    }

    saveStep({
        array: arr,
        line: 9,
        action: "Sorting complete!",
        message: "Every element is now in ascending order.",
        values: `Sorted array: [${arr.join(", ")}]`,
        why: "The outer loop has processed every element.",
        tip:
            "Insertion Sort has O(n²) average and worst-case time complexity, and O(1) auxiliary space.",
        sortedUntil: arr.length - 1
    });

    return steps;
}

function renderStep() {
    const step = steps[currentStep];
    if (!step) return;

    bars.innerHTML = "";

    const maxAbs = Math.max(
        1,
        ...step.array.map(value => Math.abs(value))
    );

    step.array.forEach((value, index) => {
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.textContent = value;

        const height = 35 + (Math.abs(value) / maxAbs) * 145;
        bar.style.height = `${height}px`;
        bar.title = `Index ${index}: ${value}`;

        if (index <= step.sortedUntil) {
            bar.classList.add("sorted");
        }

        if (index === step.keyIndex) {
            bar.classList.remove("sorted");
            bar.classList.add("comparing");
        }

        if (
            index === step.compareIndex ||
            index === step.shiftIndex
        ) {
            bar.classList.remove("sorted");
            bar.classList.add("swapping");
        }

        bars.appendChild(bar);
    });

    document.querySelectorAll(".code-line").forEach(line => {
        line.classList.toggle(
            "active",
            Number(line.dataset.line) === step.line
        );
    });

    chartStep.textContent =
        `Step ${currentStep + 1} / ${steps.length}`;

    actionType.textContent = step.action;
    message.textContent = step.message;
    valuesInvolved.textContent = step.values;
    whyText.textContent = step.why;
    tipText.textContent = step.tip;

    status.textContent =
        currentStep === steps.length - 1
            ? "Sorting completed"
            : `Step ${currentStep + 1} of ${steps.length}`;

    prevBtn.disabled = currentStep === 0;
    stepBtn.disabled = currentStep === steps.length - 1;

    if (currentStep === steps.length - 1) {
        stopAuto();
    }
}

function stopAuto() {
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }

    startBtn.textContent =
        currentStep === steps.length - 1
            ? "↻ Restart Sorting"
            : "▶ Start Sorting";
}

function nextStep() {
    if (currentStep < steps.length - 1) {
        currentStep++;
        renderStep();
    }
}

function previousStep() {
    if (currentStep > 0) {
        currentStep--;
        renderStep();
    }
}

function resetVisualizer() {
    stopAuto();
    steps = createSteps(originalArray);
    currentStep = 0;
    renderStep();
}

function readArray() {
    const result = AlgoLab.parseArray(arrayInput.value, {
        min: 2,
        max: 15,
        minValue: -999,
        maxValue: 999
    });

    if (result.error) {
        AlgoLab.showHint(result.error, true);
        arrayInput.focus();
        return null;
    }

    AlgoLab.showHint("Enter 2–15 integers separated by commas.", false);
    return result.values;
}

applyArrayBtn.addEventListener("click", () => {
    const values = readArray();

    if (values !== null) {
        originalArray = values;
        resetVisualizer();
    }
});

randomBtn.addEventListener("click", () => {
    stopAuto();

    originalArray = Array.from(
        { length: 7 },
        () => Math.floor(Math.random() * 90) + 10
    );

    arrayInput.value = originalArray.join(", ");
    resetVisualizer();
});

stepBtn.addEventListener("click", () => {
    stopAuto();
    nextStep();
});

prevBtn.addEventListener("click", () => {
    stopAuto();
    previousStep();
});

startBtn.addEventListener("click", () => {
    if (timer !== null) {
        stopAuto();
        startBtn.textContent = "▶ Resume Sorting";
        return;
    }

    if (currentStep === steps.length - 1) {
        currentStep = 0;
        renderStep();
    }

    startBtn.textContent = "⏸ Pause Sorting";
    timer = setInterval(nextStep, AlgoLab.interval(900));
});

resetBtn.addEventListener("click", resetVisualizer);

arrayInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        applyArrayBtn.click();
    }
});

resetVisualizer();
