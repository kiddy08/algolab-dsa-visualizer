"use strict";

// ==========================================
// ELEMENTS
// ==========================================

const ringView = document.getElementById("ringView");
const currentAction = document.getElementById("currentAction");
const message = document.getElementById("message");
const statusTag = document.getElementById("status");
const actionType = document.getElementById("actionType");
const valuesInvolved = document.getElementById("valuesInvolved");
const whyText = document.getElementById("whyText");
const tipText = document.getElementById("tipText");
const chartStep = document.getElementById("chartStep");
const chartCaption = document.getElementById("chartCaption");
const stepCounter = document.getElementById("stepCounter");
const queueBadge = document.getElementById("queueBadge");
const returnBadge = document.getElementById("returnBadge");
const pointerInfo = document.getElementById("pointerInfo");
const historyBox = document.getElementById("historyBox");

const valueInput = document.getElementById("valueInput");
const addFrontBtn = document.getElementById("addFrontBtn");
const addRearBtn = document.getElementById("addRearBtn");
const removeFrontBtn = document.getElementById("removeFrontBtn");
const removeRearBtn = document.getElementById("removeRearBtn");
const peekFrontBtn = document.getElementById("peekFrontBtn");
const peekRearBtn = document.getElementById("peekRearBtn");
const isEmptyBtn = document.getElementById("isEmptyBtn");
const sizeBtn = document.getElementById("sizeBtn");
const randomBtn = document.getElementById("randomBtn");
const clearBtn = document.getElementById("clearBtn");
const autoToggle = document.getElementById("autoToggle");
const capacitySelect = document.getElementById("capacitySelect");
const speedSelect = document.getElementById("speedSelect");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");

const codeLines = document.querySelectorAll(".code-line");

let capacity = 8;
let animationSpeed = 800;

function defaultHint() {
    return `Add a whole number from 1 to 999. The deque holds up to ${capacity} values.`;
}

// The queue that the next operation will change
let initialItems = [10, 20, 30];
let liveData = [];
let front = 0;
let rear = -1;
let size = 0;
let opLog = [];

// One timeline for everything: every operation adds its steps to the end
let steps = [];
let currentStep = 0;
let lastOpStart = 0;
let timer = null;
let isPlaying = false;


// ==========================================
// BUILD STEPS (one function per operation)
// ==========================================

function addStep(data) {
    steps.push({
        line: data.line,
        type: data.type,
        action: data.action,
        values: data.values,
        why: data.why,
        message: data.message,
        tip: data.tip,

        data: [...liveData],
        front,
        rear,
        size,
        mark: data.mark ?? null,
        returned: data.returned ?? null,
        history: [...opLog]
    });
}

function checkFullSteps(callLine, name, value) {
    addStep({
        line: callLine,
        type: "call",
        action: `Call ${name}(${value})`,
        values: `value = ${value}, size = ${size}`,
        why: name === "addFront"
            ? "addFront puts a new value before the current front."
            : "addRear puts a new value after the current rear.",
        message: `Start adding ${value} at the ${name === "addFront" ? "front" : "rear"}.`,
        tip: "A deque can grow at both ends."
    });

    const full = size === capacity;

    addStep({
        line: callLine + 1,
        type: "check",
        action: "Check for Overflow",
        values: `size == data.length ?  (${size} == ${capacity})`,
        why: "The deque is full only when every slot holds a value.",
        message: full
            ? "size equals the capacity, so every slot is used."
            : `size is ${size}, so there is a free slot.`,
        tip: "Trying to add to a full deque is called Deque Overflow."
    });

    if (full) {
        addStep({
            line: callLine + 2,
            type: "error",
            action: "Deque Overflow",
            values: `Cannot add ${value}`,
            why: "Every slot is used, so the exception is thrown and nothing changes.",
            message: `Deque Overflow! ${value} was not added.`,
            tip: "Remove a value first, or use a bigger capacity."
        });

        opLog.push(`${name}(${value}) → Overflow`);
    }

    return full;
}

function checkEmptySteps(callLine, name, noun) {
    addStep({
        line: callLine,
        type: "call",
        action: `Call ${name}()`,
        values: `front = ${front}, size = ${size}`,
        why: name.startsWith("remove")
            ? `${name} takes a value away and returns it.`
            : `${name} looks at a value without removing it.`,
        message: `Start ${name.startsWith("remove") ? "removing" : "peeking at"} the ${noun} value.`,
        tip: name.startsWith("remove")
            ? "Only the two ends can be changed."
            : "Peeking never changes the deque."
    });

    const empty = size === 0;
    const probe = noun === "front" ? front : (front + size - 1) % capacity;

    addStep({
        line: callLine + 1,
        type: "check",
        action: "Check if Empty",
        values: `size == 0 ?  (${size} == 0)`,
        why: "An empty deque has no values to use, so we must check first.",
        message: empty ? "size is 0, so the deque is empty." : `size is ${size}, so the deque has values.`,
        tip: "Using an empty deque is an error (Underflow).",
        mark: empty ? null : { index: probe, kind: "read" }
    });

    if (empty) {
        const word = name.startsWith("remove") ? "Underflow" : "Is Empty";

        addStep({
            line: callLine + 2,
            type: "error",
            action: `Deque ${word}`,
            values: "Nothing there",
            why: "The deque is empty, so the exception is thrown.",
            message: `Deque ${word}! There is no ${noun} value.`,
            tip: "Add a value first."
        });

        opLog.push(`${name}() → ${name.startsWith("remove") ? "Underflow" : "Empty"}`);
    }

    return empty;
}

function addFrontOperation(value) {
    if (checkFullSteps(10, "addFront", value)) return;

    const oldFront = front;
    const newFront = (front - 1 + capacity) % capacity;
    const wraps = front === 0;

    front = newFront;

    addStep({
        line: 13,
        type: "grow",
        action: wraps ? "Move front Back (Wrap Around)" : "Move front Back",
        values: `front = (${oldFront} - 1 + ${capacity}) % ${capacity} = ${newFront}`,
        why: "front moves one step backwards, to the free slot before the old front.",
        message: wraps
            ? `front was at index 0, so it wraps around to index ${newFront}.`
            : `front now points to index ${newFront}.`,
        tip: "Adding data.length first keeps the result from going negative.",
        mark: { index: newFront, kind: "pending" }
    });

    liveData[front] = value;

    if (size === 0) {
        rear = front;
    }

    addStep({
        line: 14,
        type: "store",
        action: "Store the Value",
        values: `data[${front}] = ${value}`,
        why: "The value is written into the slot that front points to.",
        message: `${value} is stored at index ${front}.`,
        tip: "The newest front value is now the first one out at the front.",
        mark: { index: front, kind: "new" }
    });

    size += 1;

    addStep({
        line: 15,
        type: "grow",
        action: "Increase size",
        values: `size = ${size - 1} → ${size}`,
        why: "size counts how many values are in the deque.",
        message: `The deque now holds ${size} value(s).`,
        tip: "size tells full from empty.",
        mark: { index: front, kind: "new" }
    });

    opLog.push(`addFront(${value})`);

    addStep({
        line: 16,
        type: "done",
        action: "addFront() Finished",
        values: `size = ${size}`,
        why: "The method ends. The deque now has one more value.",
        message: `${value} is at the front. The deque has ${size} value(s).`,
        tip: "addFront is O(1) because nothing has to move."
    });
}

function addRearOperation(value) {
    if (checkFullSteps(18, "addRear", value)) return;

    const newRear = (front + size) % capacity;
    const wraps = front + size >= capacity;

    rear = newRear;

    addStep({
        line: 21,
        type: "grow",
        action: wraps ? "Find the Rear Slot (Wrap Around)" : "Find the Rear Slot",
        values: `rear = (${front} + ${size}) % ${capacity} = ${newRear}`,
        why: "The next free slot after the last value is at front + size, wrapped around.",
        message: wraps
            ? `front + size goes past the last index, so it wraps around to index ${newRear}.`
            : `The new value will go to index ${newRear}.`,
        tip: "% data.length wraps the index back to 0 after the last slot.",
        mark: { index: newRear, kind: "pending" }
    });

    liveData[rear] = value;

    addStep({
        line: 22,
        type: "store",
        action: "Store the Value",
        values: `data[${rear}] = ${value}`,
        why: "The value is written into the rear slot.",
        message: `${value} is stored at index ${rear}.`,
        tip: "The newest rear value is the last one out at the front.",
        mark: { index: rear, kind: "new" }
    });

    size += 1;

    addStep({
        line: 23,
        type: "grow",
        action: "Increase size",
        values: `size = ${size - 1} → ${size}`,
        why: "size counts how many values are in the deque.",
        message: `The deque now holds ${size} value(s).`,
        tip: "size tells full from empty.",
        mark: { index: rear, kind: "new" }
    });

    opLog.push(`addRear(${value})`);

    addStep({
        line: 24,
        type: "done",
        action: "addRear() Finished",
        values: `size = ${size}`,
        why: "The method ends. The deque now has one more value.",
        message: `${value} is at the rear. The deque has ${size} value(s).`,
        tip: "addRear is O(1) because nothing has to move."
    });
}

function removeFrontOperation() {
    if (checkEmptySteps(26, "removeFront", "front")) return;

    const value = liveData[front];
    const oldFront = front;

    addStep({
        line: 29,
        type: "read",
        action: "Read the Front Value",
        values: `data[${front}] = ${value}`,
        why: "The front value is saved in value before front moves.",
        message: `The value ${value} will be returned.`,
        tip: "The value is read before front changes.",
        mark: { index: front, kind: "remove" },
        returned: value
    });

    const newFront = (front + 1) % capacity;
    const wraps = front === capacity - 1;

    liveData[oldFront] = null;
    front = newFront;

    addStep({
        line: 30,
        type: "shrink",
        action: wraps ? "Move front (Wrap Around)" : "Move front Forward",
        values: `front = (${oldFront} + 1) % ${capacity} = ${newFront}`,
        why: "front moves to the next value. The old slot is free again.",
        message: wraps
            ? `front was at the last index, so it wraps around to index ${newFront}.`
            : `${value} has left. front now points to index ${newFront}.`,
        tip: "The freed slot can be used by addRear or addFront later.",
        returned: value
    });

    size -= 1;

    addStep({
        line: 31,
        type: "shrink",
        action: "Decrease size",
        values: `size = ${size + 1} → ${size}`,
        why: "size counts how many values are in the deque.",
        message: `The deque now holds ${size} value(s).`,
        tip: "When size reaches 0, the deque is empty.",
        returned: value
    });

    opLog.push(`removeFront() → ${value}`);

    addStep({
        line: 32,
        type: "done",
        action: "removeFront() Finished",
        values: `returned ${value}, size = ${size}`,
        why: "The method ends and gives the removed value back to the caller.",
        message: `removeFront() returned ${value}. The deque has ${size} value(s).`,
        tip: "removeFront is O(1).",
        returned: value
    });
}

function removeRearOperation() {
    if (checkEmptySteps(35, "removeRear", "rear")) return;

    const rearIndex = (front + size - 1) % capacity;

    rear = rearIndex;

    addStep({
        line: 38,
        type: "read",
        action: "Find the Rear Slot",
        values: `rear = (${front} + ${size} - 1) % ${capacity} = ${rearIndex}`,
        why: "The last value sits at front + size - 1, wrapped around.",
        message: `The rear value is at index ${rearIndex}.`,
        tip: "No pointer is stored for the rear. It is calculated.",
        mark: { index: rearIndex, kind: "read" }
    });

    const value = liveData[rearIndex];

    addStep({
        line: 39,
        type: "read",
        action: "Read the Rear Value",
        values: `data[${rearIndex}] = ${value}`,
        why: "The rear value is saved in value before it is removed.",
        message: `The value ${value} will be returned.`,
        tip: "The value is read before size changes.",
        mark: { index: rearIndex, kind: "remove" },
        returned: value
    });

    liveData[rearIndex] = null;
    size -= 1;
    rear = (rearIndex - 1 + capacity) % capacity;

    addStep({
        line: 40,
        type: "shrink",
        action: "Decrease size",
        values: `size = ${size + 1} → ${size}`,
        why: "Reducing size is enough. The slot at the rear is free again.",
        message: `${value} has left. The deque now holds ${size} value(s).`,
        tip: "front does not move when the rear value is removed.",
        returned: value
    });

    opLog.push(`removeRear() → ${value}`);

    addStep({
        line: 41,
        type: "done",
        action: "removeRear() Finished",
        values: `returned ${value}, size = ${size}`,
        why: "The method ends and gives the removed value back to the caller.",
        message: `removeRear() returned ${value}. The deque has ${size} value(s).`,
        tip: "removeRear is O(1).",
        returned: value
    });
}

function peekFrontOperation() {
    if (checkEmptySteps(44, "peekFront", "front")) return;

    const value = liveData[front];

    addStep({
        line: 47,
        type: "read",
        action: "Return the Front Value",
        values: `data[${front}] = ${value}`,
        why: "The value at index front is returned, and nothing moves.",
        message: `The front value is ${value}.`,
        tip: "The deque looks exactly the same afterwards.",
        mark: { index: front, kind: "read" },
        returned: value
    });

    opLog.push(`peekFront() → ${value}`);

    addStep({
        line: 48,
        type: "done",
        action: "peekFront() Finished",
        values: `returned ${value}, size = ${size}`,
        why: "The method ends. Nothing was removed.",
        message: `peekFront() returned ${value}. The deque is unchanged.`,
        tip: "peekFront is O(1).",
        returned: value
    });
}

function peekRearOperation() {
    if (checkEmptySteps(50, "peekRear", "rear")) return;

    const rearIndex = (front + size - 1) % capacity;
    const value = liveData[rearIndex];

    addStep({
        line: 53,
        type: "read",
        action: "Return the Rear Value",
        values: `data[(${front} + ${size} - 1) % ${capacity}] = data[${rearIndex}] = ${value}`,
        why: "The rear slot is calculated, then its value is returned.",
        message: `The rear value is ${value}.`,
        tip: "The deque looks exactly the same afterwards.",
        mark: { index: rearIndex, kind: "read" },
        returned: value
    });

    opLog.push(`peekRear() → ${value}`);

    addStep({
        line: 54,
        type: "done",
        action: "peekRear() Finished",
        values: `returned ${value}, size = ${size}`,
        why: "The method ends. Nothing was removed.",
        message: `peekRear() returned ${value}. The deque is unchanged.`,
        tip: "peekRear is O(1).",
        returned: value
    });
}

function isEmptyOperation() {
    const empty = size === 0;

    addStep({
        line: 56,
        type: "call",
        action: "Call isEmpty()",
        values: `size = ${size}`,
        why: "isEmpty tells us whether the deque has any values.",
        message: "Start checking if the deque is empty.",
        tip: "It does not change the deque."
    });

    addStep({
        line: 57,
        type: "read",
        action: "Compare size with 0",
        values: `${size} == 0  →  ${empty}`,
        why: "The deque is empty exactly when size is 0.",
        message: empty
            ? "size is 0, so the answer is true."
            : `size is ${size}, so the answer is false.`,
        tip: "Use isEmpty() before removing in real programs.",
        mark: empty ? null : { index: front, kind: "read" },
        returned: String(empty)
    });

    opLog.push(`isEmpty() → ${empty}`);

    addStep({
        line: 58,
        type: "done",
        action: "isEmpty() Finished",
        values: `returned ${empty}`,
        why: "The method ends and returns the answer.",
        message: `isEmpty() returned ${empty}.`,
        tip: "isEmpty is O(1).",
        returned: String(empty)
    });
}

function sizeOperation() {
    addStep({
        line: 60,
        type: "call",
        action: "Call size()",
        values: `size = ${size}`,
        why: "size tells us how many values are in the deque.",
        message: "Start reading the size.",
        tip: "It does not change the deque."
    });

    addStep({
        line: 61,
        type: "read",
        action: "Return size",
        values: `size = ${size}`,
        why: "The size variable is always kept up to date.",
        message: `The deque holds ${size} value(s).`,
        tip: "No loop is needed, so size is O(1).",
        returned: size
    });

    opLog.push(`size() → ${size}`);

    addStep({
        line: 62,
        type: "done",
        action: "size() Finished",
        values: `returned ${size}`,
        why: "The method ends and returns the count.",
        message: `size() returned ${size}.`,
        tip: "An empty deque has size 0.",
        returned: size
    });
}


// ==========================================
// DRAW THE QUEUE
// ==========================================

function renderHistory(history) {
    historyBox.innerHTML = "";

    if (history.length === 0) {
        const empty = document.createElement("p");
        empty.className = "history-empty";
        empty.textContent = "No operations yet.";
        historyBox.appendChild(empty);
        return;
    }

    const recent = history.slice(-10);

    recent.forEach((entry, index) => {
        const chip = document.createElement("span");
        chip.className = "array-value";
        chip.textContent = entry;

        if (index === recent.length - 1) {
            chip.classList.add("changed");
        }

        historyBox.appendChild(chip);
    });
}


// ==========================================
// HIGHLIGHT CODE LINE
// ==========================================

function highlightCodeLine(lineSpec) {
    const active = Array.isArray(lineSpec) ? lineSpec : [lineSpec];

    codeLines.forEach((line, index) => {
        const actualLine = Number(line.dataset.line || index + 1);

        line.classList.toggle("active", active.includes(actualLine));
    });
}


// ==========================================
// BUTTON STATES
// ==========================================

function updateButtons() {
    const atEnd = currentStep >= steps.length - 1;

    startBtn.textContent = isPlaying
        ? "⏸ Pause"
        : "▶ Replay Operation";

    stepBtn.disabled = isPlaying || atEnd;
    prevBtn.disabled = isPlaying || currentStep <= 0;
    startBtn.disabled = steps.length <= 1;

    [
        valueInput, addFrontBtn, addRearBtn, removeFrontBtn, removeRearBtn,
        peekFrontBtn, peekRearBtn, isEmptyBtn, sizeBtn, randomBtn,
        clearBtn, resetBtn, capacitySelect, speedSelect
    ].forEach(control => {
        control.disabled = isPlaying;
    });
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

    const pending = step.mark !== null && step.mark.kind === "pending";

    RingView.render(ringView, {
        capacity,
        values: step.data,
        front: step.front,
        rear: step.rear,
        showRear: step.size > 0 || pending,
        topIndex: step.size > 0 ? step.front : -1,
        mark: step.mark,
        centerTop: `${step.size} / ${capacity}`,
        centerBottom: "used"
    });

    renderHistory(step.history);
    highlightCodeLine(step.line);

    actionType.textContent = step.action;
    AlgoLab.setChip(document.getElementById("stepChip"), step.type);
    valuesInvolved.textContent = step.values;
    whyText.textContent = step.why;
    tipText.textContent = step.tip;
    message.textContent = step.message;

    currentAction.classList.toggle("is-error", step.type === "error");

    queueBadge.className = "stack-badge " + (
        step.size === 0 ? "is-empty"
        : step.size === capacity ? "is-full"
        : "is-ok"
    );

    queueBadge.textContent =
        step.size === 0 ? "EMPTY"
        : step.size === capacity ? "FULL"
        : `${step.size} / ${capacity} used`;

    returnBadge.hidden = step.returned === null;
    returnBadge.textContent =
        step.returned === null ? "" : `Returned: ${step.returned}`;

    pointerInfo.textContent =
        `front = ${step.front} · rear = ${step.rear} · size ${step.size} / ${capacity}`;

    statusTag.textContent =
        index === 0 ? "Ready" : `Step ${index + 1} of ${steps.length}`;
    chartStep.textContent = step.action;
    chartCaption.textContent = step.message;
    stepCounter.textContent = `Step ${index + 1} of ${steps.length}`;
    AlgoLab.setProgress(stepCounter, index, steps.length);

    updateButtons();
}


// ==========================================
// PLAY / PAUSE
// ==========================================

function stopAnimation() {
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }

    isPlaying = false;
    updateButtons();
}

function startAnimation() {
    if (isPlaying || currentStep >= steps.length - 1) return;

    isPlaying = true;
    updateButtons();

    timer = setInterval(() => {
        if (currentStep < steps.length - 1) {
            renderStep(currentStep + 1);
        }

        if (currentStep >= steps.length - 1) {
            stopAnimation();
        }
    }, animationSpeed);
}


// ==========================================
// RUN ONE OPERATION
// ==========================================

function runOperation(build) {
    if (isPlaying) return;

    lastOpStart = steps.length;

    build();

    // Show the first new step, then let the animation continue
    renderStep(lastOpStart);

    if (autoToggle.checked) {
        startAnimation();
    }
}

function readValue() {
    const text = valueInput.value.trim();

    if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > 999) {
        AlgoLab.showHint("Enter a whole number between 1 and 999.", true);
        valueInput.focus();
        return null;
    }

    AlgoLab.showHint(defaultHint(), false);
    return Number(text);
}


// ==========================================
// RESET THE TIMELINE
// ==========================================

// Values from front to rear (wraps around the array)
function currentItems() {
    const items = [];

    for (let offset = 0; offset < size; offset++) {
        items.push(liveData[(front + offset) % capacity]);
    }

    return items;
}

function resetTimeline(items) {
    stopAnimation();

    initialItems = [...items];
    liveData = new Array(capacity).fill(null);

    items.forEach((value, index) => {
        liveData[index] = value;
    });

    front = 0;
    rear = items.length - 1;
    size = items.length;
    opLog = [];
    steps = [];
    lastOpStart = 0;

    addStep({
        line: 1,
        type: "ready",
        action: "Ready to Start",
        values: items.length > 0
            ? `Deque (front → rear): [${items.join(", ")}]`
            : "The deque is empty (size = 0).",
        why: "A deque lets you work at both ends. front moves backwards for addFront and forwards for removeFront.",
        message: "Choose a value, then add or remove at either end.",
        tip: "Both ends wrap around the array, so no slot is wasted."
    });

    renderStep(0);
    AlgoLab.showHint(defaultHint(), false);
}

function randomItems() {
    const count = 3 + Math.floor(Math.random() * 3);
    const values = new Set();

    while (values.size < count) {
        values.add(Math.floor(Math.random() * 90) + 10);
    }

    return [...values];
}

function suggestValue() {
    const waiting = currentItems();

    for (let tries = 0; tries < 30; tries++) {
        const value = Math.floor(Math.random() * 90) + 10;

        if (!waiting.includes(value)) {
            return value;
        }
    }

    return 99;
}


// ==========================================
// EVENTS
// ==========================================

function addAt(operation) {
    if (isPlaying) return;

    const value = readValue();

    if (value !== null) {
        const before = size;

        runOperation(() => operation(value));

        // Make repeated adds quick: suggest a fresh value
        if (size > before) {
            valueInput.value = suggestValue();
        }
    }
}

addFrontBtn.addEventListener("click", () => addAt(addFrontOperation));
addRearBtn.addEventListener("click", () => addAt(addRearOperation));

valueInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        addRearBtn.click();
    }
});

removeFrontBtn.addEventListener("click", () => runOperation(removeFrontOperation));
removeRearBtn.addEventListener("click", () => runOperation(removeRearOperation));
peekFrontBtn.addEventListener("click", () => runOperation(peekFrontOperation));
peekRearBtn.addEventListener("click", () => runOperation(peekRearOperation));
isEmptyBtn.addEventListener("click", () => runOperation(isEmptyOperation));
sizeBtn.addEventListener("click", () => runOperation(sizeOperation));

randomBtn.addEventListener("click", () => {
    if (!isPlaying) resetTimeline(randomItems());
});

clearBtn.addEventListener("click", () => {
    if (!isPlaying) resetTimeline([]);
});

resetBtn.addEventListener("click", () => {
    if (!isPlaying) resetTimeline(initialItems);
});

capacitySelect.addEventListener("change", () => {
    if (isPlaying) return;

    const items = currentItems();

    capacity = Number(capacitySelect.value);
    resetTimeline(items.slice(0, capacity));
});

speedSelect.addEventListener("change", () => {
    animationSpeed = Number(speedSelect.value);
});

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

startBtn.addEventListener("click", () => {
    if (isPlaying) {
        stopAnimation();
        return;
    }

    // At the end of the timeline, replay the latest operation
    if (currentStep >= steps.length - 1) {
        renderStep(lastOpStart);
    }

    startAnimation();
});


// ==========================================
// INITIALIZE
// ==========================================

resetTimeline(initialItems);
