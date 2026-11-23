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
const enqueueBtn = document.getElementById("enqueueBtn");
const dequeueBtn = document.getElementById("dequeueBtn");
const peekBtn = document.getElementById("peekBtn");
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
    return `Enqueue a whole number from 1 to 999. The queue holds up to ${capacity} values.`;
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

function enqueueOperation(value) {
    addStep({
        line: 11,
        type: "call",
        action: `Call enqueue(${value})`,
        values: `value = ${value}, size = ${size}`,
        why: "enqueue adds a new value at the back (rear) of the queue.",
        message: `Start adding ${value} to the queue.`,
        tip: "New values always join at the rear."
    });

    const full = size === capacity;

    addStep({
        line: 12,
        type: "check",
        action: "Check for Overflow",
        values: `size == data.length ?  (${size} == ${capacity})`,
        why: "The queue is full only when every slot holds a value.",
        message: full
            ? "size equals the capacity, so every slot is used."
            : `size is ${size}, so there is a free slot.`,
        tip: "In a circular queue, full means size == capacity (not rear at the end)."
    });

    if (full) {
        addStep({
            line: 13,
            type: "error",
            action: "Queue Overflow",
            values: `Cannot enqueue ${value}`,
            why: "Every slot is used, so the exception is thrown and nothing changes.",
            message: `Queue Overflow! ${value} was not added.`,
            tip: "Dequeue a value first, or use a bigger capacity."
        });

        opLog.push(`enqueue(${value}) → Overflow`);
        return;
    }

    const newRear = (rear + 1) % capacity;
    const wraps = rear === capacity - 1;

    addStep({
        line: 14,
        type: "grow",
        action: wraps ? "Move rear (Wrap Around)" : "Move rear Forward",
        values: `rear = (${rear} + 1) % ${capacity} = ${newRear}`,
        why: "% data.length makes rear jump back to index 0 after the last index.",
        message: wraps
            ? `rear was at the last index, so it wraps around to index ${newRear}.`
            : `rear now points to index ${newRear}.`,
        tip: "This wrap-around is what lets a circular queue reuse freed slots.",
        mark: { index: newRear, kind: "pending" },
        rear: newRear
    });

    rear = newRear;
    liveData[rear] = value;

    addStep({
        line: 15,
        type: "store",
        action: "Store the Value",
        values: `data[${rear}] = ${value}`,
        why: "The value is written into the slot that rear points to.",
        message: `${value} is stored at index ${rear}.`,
        tip: "The newest value is always at the rear.",
        mark: { index: rear, kind: "new" }
    });

    size += 1;

    addStep({
        line: 16,
        type: "grow",
        action: "Increase size",
        values: `size = ${size - 1} → ${size}`,
        why: "size counts how many values are waiting in the queue.",
        message: `The queue now holds ${size} value(s).`,
        tip: "size tells full from empty, because front and rear can look the same in both cases.",
        mark: { index: rear, kind: "new" }
    });

    opLog.push(`enqueue(${value})`);

    addStep({
        line: 17,
        type: "done",
        action: "enqueue() Finished",
        values: `size = ${size}`,
        why: "The method ends. The queue now has one more value.",
        message: `${value} joined the rear. The queue has ${size} value(s).`,
        tip: "enqueue is O(1) because nothing has to move."
    });
}

function dequeueOperation() {
    addStep({
        line: 19,
        type: "call",
        action: "Call dequeue()",
        values: `front = ${front}, size = ${size}`,
        why: "dequeue removes the oldest value from the front and returns it.",
        message: "Start removing the front value.",
        tip: "The value that waited longest leaves first."
    });

    const empty = size === 0;

    addStep({
        line: 20,
        type: "check",
        action: "Check for Underflow",
        values: `size == 0 ?  (${size} == 0)`,
        why: "An empty queue has nothing to remove, so we must check first.",
        message: empty
            ? "size is 0, so the queue is empty."
            : `size is ${size}, so the queue has values.`,
        tip: "Trying to dequeue from an empty queue is called Queue Underflow.",
        mark: empty ? null : { index: front, kind: "read" }
    });

    if (empty) {
        addStep({
            line: 21,
            type: "error",
            action: "Queue Underflow",
            values: "Nothing to dequeue",
            why: "The queue is empty, so the exception is thrown.",
            message: "Queue Underflow! There is no value to remove.",
            tip: "Enqueue a value first."
        });

        opLog.push("dequeue() → Underflow");
        return;
    }

    const value = liveData[front];
    const oldFront = front;

    addStep({
        line: 22,
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

    // The slot is free again (the old number no longer counts)
    liveData[oldFront] = null;
    front = newFront;

    addStep({
        line: 23,
        type: "shrink",
        action: wraps ? "Move front (Wrap Around)" : "Move front Forward",
        values: `front = (${oldFront} + 1) % ${capacity} = ${newFront}`,
        why: "front moves to the next value. The old slot becomes free to reuse.",
        message: wraps
            ? `front was at the last index, so it wraps around to index ${newFront}.`
            : `${value} has left. front now points to index ${newFront}.`,
        tip: "Unlike a normal queue, this freed slot can be used again.",
        returned: value
    });

    size -= 1;

    addStep({
        line: 24,
        type: "shrink",
        action: "Decrease size",
        values: `size = ${size + 1} → ${size}`,
        why: "size counts how many values are waiting in the queue.",
        message: `The queue now holds ${size} value(s).`,
        tip: "When size reaches 0, the queue is empty.",
        returned: value
    });

    opLog.push(`dequeue() → ${value}`);

    addStep({
        line: 25,
        type: "done",
        action: "dequeue() Finished",
        values: `returned ${value}, size = ${size}`,
        why: "The method ends and gives the removed value back to the caller.",
        message: `dequeue() returned ${value}. The queue has ${size} value(s).`,
        tip: "dequeue is O(1) because only front and size change.",
        returned: value
    });
}

function peekOperation() {
    addStep({
        line: 28,
        type: "call",
        action: "Call peek()",
        values: `front = ${front}, size = ${size}`,
        why: "peek looks at the front value without removing it.",
        message: "Start peeking at the front value.",
        tip: "peek never changes the queue."
    });

    const empty = size === 0;

    addStep({
        line: 29,
        type: "check",
        action: "Check if Empty",
        values: `size == 0 ?  (${size} == 0)`,
        why: "There is no front value when the queue is empty.",
        message: empty ? "size is 0, so the queue is empty." : "The queue has values.",
        tip: "Peeking at an empty queue is an error.",
        mark: empty ? null : { index: front, kind: "read" }
    });

    if (empty) {
        addStep({
            line: 30,
            type: "error",
            action: "Queue Is Empty",
            values: "Nothing to peek at",
            why: "The queue is empty, so the exception is thrown.",
            message: "The queue is empty. There is no front value.",
            tip: "Enqueue a value first."
        });

        opLog.push("peek() → Empty");
        return;
    }

    const value = liveData[front];

    addStep({
        line: 31,
        type: "read",
        action: "Return the Front Value",
        values: `data[${front}] = ${value}`,
        why: "The value at index front is returned, and front stays where it is.",
        message: `The front value is ${value}.`,
        tip: "The queue looks exactly the same afterwards.",
        mark: { index: front, kind: "read" },
        returned: value
    });

    opLog.push(`peek() → ${value}`);

    addStep({
        line: 32,
        type: "done",
        action: "peek() Finished",
        values: `returned ${value}, size = ${size}`,
        why: "The method ends. Nothing was removed.",
        message: `peek() returned ${value}. The queue is unchanged.`,
        tip: "peek is O(1).",
        returned: value
    });
}

function isEmptyOperation() {
    const empty = size === 0;

    addStep({
        line: 34,
        type: "call",
        action: "Call isEmpty()",
        values: `size = ${size}`,
        why: "isEmpty tells us whether the queue has any values.",
        message: "Start checking if the queue is empty.",
        tip: "It does not change the queue."
    });

    addStep({
        line: 35,
        type: "read",
        action: "Compare size with 0",
        values: `${size} == 0  →  ${empty}`,
        why: "The queue is empty exactly when size is 0.",
        message: empty
            ? "size is 0, so the answer is true."
            : `size is ${size}, so the answer is false.`,
        tip: "Use isEmpty() before dequeue or peek in real programs.",
        mark: empty ? null : { index: front, kind: "read" },
        returned: String(empty)
    });

    opLog.push(`isEmpty() → ${empty}`);

    addStep({
        line: 36,
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
        line: 38,
        type: "call",
        action: "Call size()",
        values: `size = ${size}`,
        why: "size tells us how many values are waiting in the queue.",
        message: "Start reading the size.",
        tip: "It does not change the queue."
    });

    addStep({
        line: 39,
        type: "read",
        action: "Return size",
        values: `size = ${size}`,
        why: "The size variable is always kept up to date.",
        message: `The queue holds ${size} value(s).`,
        tip: "No loop is needed, so size is O(1).",
        returned: size
    });

    opLog.push(`size() → ${size}`);

    addStep({
        line: 40,
        type: "done",
        action: "size() Finished",
        values: `returned ${size}`,
        why: "The method ends and returns the count.",
        message: `size() returned ${size}.`,
        tip: "An empty queue has size 0.",
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
        valueInput, enqueueBtn, dequeueBtn, peekBtn, isEmptyBtn,
        sizeBtn, randomBtn, clearBtn, resetBtn,
        capacitySelect, speedSelect
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

function readEnqueueValue() {
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
            ? `Queue (front → rear): [${items.join(", ")}]`
            : "The queue is empty (size = 0).",
        why: "A circular queue treats the array as a ring. After the last index comes index 0 again.",
        message: "Choose a value and click Enqueue or Dequeue.",
        tip: "Use (index + 1) % capacity to move a pointer. It wraps back to 0 at the end."
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

enqueueBtn.addEventListener("click", () => {
    if (isPlaying) return;

    const value = readEnqueueValue();

    if (value !== null) {
        const before = size;

        runOperation(() => enqueueOperation(value));

        // Make repeated enqueues quick: suggest a fresh value
        if (size > before) {
            valueInput.value = suggestValue();
        }
    }
});

valueInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        enqueueBtn.click();
    }
});

dequeueBtn.addEventListener("click", () => runOperation(dequeueOperation));
peekBtn.addEventListener("click", () => runOperation(peekOperation));
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
