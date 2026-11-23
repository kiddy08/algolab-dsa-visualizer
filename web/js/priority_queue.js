"use strict";

// ==========================================
// ELEMENTS
// ==========================================

const queueView = document.getElementById("queueView");
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
const priorityInput = document.getElementById("priorityInput");
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
    return `Value 1 to 999, priority 1 to 9. The queue holds up to ${capacity} values.`;
}

// The queue that the next operation will change
let initialItems = [
    { value: 10, priority: 1 },
    { value: 30, priority: 4 },
    { value: 20, priority: 7 }
];

let liveItems = [];
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

function copyItems() {
    return liveItems.map(item => (item ? { ...item } : null));
}

function addStep(data) {
    steps.push({
        line: data.line,
        type: data.type,
        action: data.action,
        values: data.values,
        why: data.why,
        message: data.message,
        tip: data.tip,

        items: copyItems(),
        size,
        marks: data.marks ?? [],
        returned: data.returned ?? null,
        history: [...opLog]
    });
}

function enqueueOperation(value, priority) {
    addStep({
        line: 11,
        type: "call",
        action: `Call enqueue(${value}, P${priority})`,
        values: `v = ${value}, p = ${priority}, size = ${size}`,
        why: "enqueue adds a value together with its priority.",
        message: `Start adding ${value} with priority ${priority}.`,
        tip: "A smaller priority number means a higher priority."
    });

    const full = size === capacity;

    addStep({
        line: 12,
        type: "check",
        action: "Check for Overflow",
        values: `size == value.length ?  (${size} == ${capacity})`,
        why: "The queue is full only when every slot holds a value.",
        message: full
            ? "size equals the capacity, so every slot is used."
            : `size is ${size}, so there is a free slot.`,
        tip: "Trying to add to a full queue is called Queue Overflow."
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

        opLog.push(`enqueue(${value}, P${priority}) → Overflow`);
        return;
    }

    let i = size - 1;

    addStep({
        line: 14,
        type: "pointer",
        action: "Start at the Last Value",
        values: `i = size - 1 = ${i}`,
        why: "We look for the right place by walking backwards from the last value.",
        message: i >= 0
            ? `Start comparing at index ${i}.`
            : "The queue is empty, so there is nothing to compare.",
        tip: "The values behind the new one must move one slot to the right.",
        marks: i >= 0 ? [{ index: i, kind: "read" }] : []
    });

    while (i >= 0 && liveItems[i].priority > priority) {
        addStep({
            line: 15,
            type: "compare",
            action: "Compare Priorities",
            values: `priority[${i}] = ${liveItems[i].priority} > ${priority}  →  true`,
            why: "A larger number means a lower priority, so this value must stay behind the new one.",
            message: `P${liveItems[i].priority} is lower than P${priority}, so ${liveItems[i].value} moves right.`,
            tip: "Equal priorities do not move, so arrival order is kept.",
            marks: [{ index: i, kind: "read" }]
        });

        liveItems[i + 1] = { ...liveItems[i] };

        addStep({
            line: [16, 17, 18],
            type: "shift",
            action: "Shift Right",
            values: `slot ${i} → slot ${i + 1}, then i = ${i - 1}`,
            why: "The value and its priority are copied one slot to the right to make room.",
            message: `${liveItems[i].value} moves from index ${i} to index ${i + 1}.`,
            tip: "Both arrays (value and priority) must move together.",
            marks: [
                { index: i, kind: "read" },
                { index: i + 1, kind: "new" }
            ]
        });

        i -= 1;
    }

    addStep({
        line: 15,
        type: "compare",
        action: "Compare Priorities",
        values: i >= 0
            ? `priority[${i}] = ${liveItems[i].priority} > ${priority}  →  false`
            : "i = -1, so the loop ends",
        why: "The loop stops when no value is left or the priority is not lower.",
        message: i >= 0
            ? `P${liveItems[i].priority} is not lower than P${priority}, so the new value goes right after it.`
            : "Every value was lower, so the new value goes to the front.",
        tip: "The new value belongs at index i + 1.",
        marks: i >= 0 ? [{ index: i, kind: "read" }] : []
    });

    liveItems[i + 1] = { value, priority };

    addStep({
        line: [20, 21],
        type: "store",
        action: "Place the New Value",
        values: `value[${i + 1}] = ${value}, priority[${i + 1}] = ${priority}`,
        why: "The new value and its priority are written into the gap.",
        message: `${value} (P${priority}) is stored at index ${i + 1}.`,
        tip: "The array stays sorted by priority.",
        marks: [{ index: i + 1, kind: "new" }]
    });

    size += 1;

    addStep({
        line: 22,
        type: "grow",
        action: "Increase size",
        values: `size = ${size - 1} → ${size}`,
        why: "size counts how many values are waiting.",
        message: `The queue now holds ${size} value(s).`,
        tip: "The front always holds the highest priority.",
        marks: [{ index: i + 1, kind: "new" }]
    });

    opLog.push(`enqueue(${value}, P${priority})`);

    addStep({
        line: 23,
        type: "done",
        action: "enqueue() Finished",
        values: `size = ${size}`,
        why: "The method ends. The queue is still sorted by priority.",
        message: `${value} (P${priority}) is in place. The queue has ${size} value(s).`,
        tip: "enqueue is O(n) because values may have to shift."
    });
}

function dequeueOperation() {
    addStep({
        line: 25,
        type: "call",
        action: "Call dequeue()",
        values: `size = ${size}`,
        why: "dequeue removes the value with the highest priority.",
        message: "Start removing the highest priority value.",
        tip: "It is always at index 0."
    });

    const empty = size === 0;

    addStep({
        line: 26,
        type: "check",
        action: "Check for Underflow",
        values: `size == 0 ?  (${size} == 0)`,
        why: "An empty queue has nothing to remove, so we must check first.",
        message: empty
            ? "size is 0, so the queue is empty."
            : `size is ${size}, so the queue has values.`,
        tip: "Trying to dequeue from an empty queue is called Queue Underflow.",
        marks: empty ? [] : [{ index: 0, kind: "read" }]
    });

    if (empty) {
        addStep({
            line: 27,
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

    const first = { ...liveItems[0] };

    addStep({
        line: 28,
        type: "read",
        action: "Read the Highest Priority Value",
        values: `v = value[0] = ${first.value}  (P${first.priority})`,
        why: "The value at index 0 has the highest priority, so it leaves first.",
        message: `${first.value} (P${first.priority}) will be returned.`,
        tip: "The value is saved before the others shift.",
        marks: [{ index: 0, kind: "remove" }],
        returned: first.value
    });

    for (let i = 1; i < size; i++) {
        liveItems[i - 1] = { ...liveItems[i] };

        addStep({
            line: [29, 30, 31],
            type: "shift",
            action: "Shift Left",
            values: `slot ${i} → slot ${i - 1}`,
            why: "Every value moves one slot to the left to fill the gap at the front.",
            message: `${liveItems[i - 1].value} moves from index ${i} to index ${i - 1}.`,
            tip: "This is why dequeue takes O(n) time here.",
            marks: [
                { index: i, kind: "read" },
                { index: i - 1, kind: "new" }
            ],
            returned: first.value
        });
    }

    liveItems[size - 1] = null;
    size -= 1;

    addStep({
        line: 33,
        type: "shrink",
        action: "Decrease size",
        values: `size = ${size + 1} → ${size}`,
        why: "The last slot is no longer part of the queue.",
        message: `The queue now holds ${size} value(s).`,
        tip: "When size reaches 0, the queue is empty.",
        returned: first.value
    });

    opLog.push(`dequeue() → ${first.value}`);

    addStep({
        line: 34,
        type: "done",
        action: "dequeue() Finished",
        values: `returned ${first.value}, size = ${size}`,
        why: "The method ends and gives the removed value back to the caller.",
        message: `dequeue() returned ${first.value}. The queue has ${size} value(s).`,
        tip: "The next highest priority is now at the front.",
        returned: first.value
    });
}

function peekOperation() {
    addStep({
        line: 37,
        type: "call",
        action: "Call peek()",
        values: `size = ${size}`,
        why: "peek looks at the highest priority value without removing it.",
        message: "Start peeking at the front value.",
        tip: "peek never changes the queue."
    });

    const empty = size === 0;

    addStep({
        line: 38,
        type: "check",
        action: "Check if Empty",
        values: `size == 0 ?  (${size} == 0)`,
        why: "There is no front value when the queue is empty.",
        message: empty ? "size is 0, so the queue is empty." : "The queue has values.",
        tip: "Peeking at an empty queue is an error.",
        marks: empty ? [] : [{ index: 0, kind: "read" }]
    });

    if (empty) {
        addStep({
            line: 39,
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

    const first = liveItems[0];

    addStep({
        line: 40,
        type: "read",
        action: "Return the Front Value",
        values: `value[0] = ${first.value}  (P${first.priority})`,
        why: "The value at index 0 is returned, and nothing moves.",
        message: `The highest priority value is ${first.value} (P${first.priority}).`,
        tip: "The queue looks exactly the same afterwards.",
        marks: [{ index: 0, kind: "read" }],
        returned: first.value
    });

    opLog.push(`peek() → ${first.value}`);

    addStep({
        line: 41,
        type: "done",
        action: "peek() Finished",
        values: `returned ${first.value}, size = ${size}`,
        why: "The method ends. Nothing was removed.",
        message: `peek() returned ${first.value}. The queue is unchanged.`,
        tip: "peek is O(1).",
        returned: first.value
    });
}

function isEmptyOperation() {
    const empty = size === 0;

    addStep({
        line: 43,
        type: "call",
        action: "Call isEmpty()",
        values: `size = ${size}`,
        why: "isEmpty tells us whether the queue has any values.",
        message: "Start checking if the queue is empty.",
        tip: "It does not change the queue."
    });

    addStep({
        line: 44,
        type: "read",
        action: "Compare size with 0",
        values: `${size} == 0  →  ${empty}`,
        why: "The queue is empty exactly when size is 0.",
        message: empty
            ? "size is 0, so the answer is true."
            : `size is ${size}, so the answer is false.`,
        tip: "Use isEmpty() before dequeue or peek in real programs.",
        marks: empty ? [] : [{ index: 0, kind: "read" }],
        returned: String(empty)
    });

    opLog.push(`isEmpty() → ${empty}`);

    addStep({
        line: 45,
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
        line: 47,
        type: "call",
        action: "Call size()",
        values: `size = ${size}`,
        why: "size tells us how many values are waiting in the queue.",
        message: "Start reading the size.",
        tip: "It does not change the queue."
    });

    addStep({
        line: 48,
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
        line: 49,
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

function renderQueue(step) {
    queueView.innerHTML = "";

    for (let index = 0; index < capacity; index++) {
        const slot = document.createElement("div");
        slot.className = "queue-slot";

        const rearLabel = document.createElement("span");
        rearLabel.className = "queue-label rear";

        if (step.size > 0 && index === step.size - 1) {
            rearLabel.textContent = "rear ▼";
        }

        const box = document.createElement("div");
        box.className = "slot-box";

        const item = step.items[index];

        if (item) {
            box.classList.add("filled", "pq-box");
            box.classList.add(
                item.priority <= 3 ? "prio-high"
                : item.priority <= 6 ? "prio-mid"
                : "prio-low"
            );

            if (index === 0) {
                box.classList.add("is-top");
            }

            const value = document.createElement("span");
            value.className = "pq-value";
            value.textContent = item.value;

            const priority = document.createElement("span");
            priority.className = "pq-priority";
            priority.textContent = `P${item.priority}`;

            box.append(value, priority);
        }

        step.marks.forEach(mark => {
            if (mark.index === index) {
                box.classList.add(`mark-${mark.kind}`);
            }
        });

        const indexLabel = document.createElement("span");
        indexLabel.className = "slot-index";
        indexLabel.textContent = index;

        const frontLabel = document.createElement("span");
        frontLabel.className = "queue-label front";

        if (index === 0) {
            frontLabel.textContent = "▲ front";
        }

        slot.append(rearLabel, box, indexLabel, frontLabel);
        queueView.appendChild(slot);
    }
}

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
        valueInput, priorityInput, enqueueBtn, dequeueBtn, peekBtn,
        isEmptyBtn, sizeBtn, randomBtn, clearBtn, resetBtn,
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

    renderQueue(step);
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
        `size = ${step.size} / ${capacity} · front = highest priority`;

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

function readInputs() {
    const valueText = valueInput.value.trim();
    const priorityText = priorityInput.value.trim();

    if (!/^\d+$/.test(valueText) || Number(valueText) < 1 || Number(valueText) > 999) {
        AlgoLab.showHint("Enter a whole number between 1 and 999 for the value.", true);
        valueInput.focus();
        return null;
    }

    if (!/^\d+$/.test(priorityText) || Number(priorityText) < 1 || Number(priorityText) > 9) {
        AlgoLab.showHint("Enter a priority between 1 (highest) and 9 (lowest).", true);
        priorityInput.focus();
        return null;
    }

    AlgoLab.showHint(defaultHint(), false);

    return { value: Number(valueText), priority: Number(priorityText) };
}


// ==========================================
// RESET THE TIMELINE
// ==========================================

function currentItems() {
    return liveItems.slice(0, size).map(item => ({ ...item }));
}

function resetTimeline(items) {
    stopAnimation();

    initialItems = items.map(item => ({ ...item }));
    liveItems = new Array(capacity).fill(null);

    items.forEach((item, index) => {
        liveItems[index] = { ...item };
    });

    size = items.length;
    opLog = [];
    steps = [];
    lastOpStart = 0;

    addStep({
        line: 1,
        type: "ready",
        action: "Ready to Start",
        values: items.length > 0
            ? `Queue (front → rear): [${items.map(item => `${item.value} (P${item.priority})`).join(", ")}]`
            : "The queue is empty (size = 0).",
        why: "The array is kept sorted by priority, so the highest priority value is always at the front.",
        message: "Choose a value and a priority, then click Enqueue.",
        tip: "A smaller priority number means a higher priority. Equal priorities keep their arrival order."
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

    const items = [...values].map(value => ({
        value,
        priority: Math.floor(Math.random() * 9) + 1
    }));

    // Stable sort: the highest priority comes first
    return items
        .map((item, index) => ({ item, index }))
        .sort((a, b) => a.item.priority - b.item.priority || a.index - b.index)
        .map(entry => entry.item);
}

function suggestInputs() {
    const waiting = currentItems().map(item => item.value);

    let value = 99;

    for (let tries = 0; tries < 30; tries++) {
        const candidate = Math.floor(Math.random() * 90) + 10;

        if (!waiting.includes(candidate)) {
            value = candidate;
            break;
        }
    }

    valueInput.value = value;
    priorityInput.value = Math.floor(Math.random() * 9) + 1;
}


// ==========================================
// EVENTS
// ==========================================

enqueueBtn.addEventListener("click", () => {
    if (isPlaying) return;

    const input = readInputs();

    if (input !== null) {
        const before = size;

        runOperation(() => enqueueOperation(input.value, input.priority));

        // Make repeated enqueues quick: suggest fresh inputs
        if (size > before) {
            suggestInputs();
        }
    }
});

[valueInput, priorityInput].forEach(input => {
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            enqueueBtn.click();
        }
    });
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

    capacity = Number(capacitySelect.value);
    resetTimeline(currentItems().slice(0, capacity));
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
