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

function queueSize() {
    return Math.max(0, rear - front + 1);
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

        data: [...liveData],
        front: data.front ?? front,
        rear: data.rear ?? rear,
        mark: data.mark ?? null,
        returned: data.returned ?? null,
        history: [...opLog]
    });
}

function enqueueOperation(value) {
    addStep({
        line: 10,
        type: "call",
        action: `Call enqueue(${value})`,
        values: `value = ${value}, rear = ${rear}`,
        why: "enqueue adds a new value at the back (rear) of the queue.",
        message: `Start adding ${value} to the queue.`,
        tip: "New values always join at the rear."
    });

    const full = rear === capacity - 1;

    addStep({
        line: 11,
        type: "check",
        action: "Check for Overflow",
        values: `rear == data.length - 1 ?  (${rear} == ${capacity - 1})`,
        why: "rear cannot move past the last index of the array.",
        message: full
            ? "rear is at the last index, so there is no room at the back."
            : "rear is below the last index, so there is room at the back.",
        tip: "A normal queue never reuses the slots that dequeue freed at the front.",
        mark: rear >= front ? { index: rear, kind: "read" } : null
    });

    if (full) {
        addStep({
            line: 12,
            type: "error",
            action: "Queue Overflow",
            values: `Cannot enqueue ${value}`,
            why: "rear is at the end of the array, so the exception is thrown and nothing changes.",
            message: front > 0
                ? `Queue Overflow! ${front} slot(s) at the front are free, but a normal queue cannot reuse them.`
                : `Queue Overflow! ${value} was not added.`,
            tip: front > 0
                ? "A circular queue solves this by wrapping rear around to the front."
                : "Dequeue a value first, or use a bigger capacity.",
            mark: { index: rear, kind: "remove" }
        });

        opLog.push(`enqueue(${value}) → Overflow`);
        return;
    }

    const index = rear + 1;

    addStep({
        line: 13,
        type: "grow",
        action: "Move rear Forward",
        values: `rear = ${rear} → ${index}`,
        why: "++rear moves the rear pointer to the next free slot first.",
        message: `rear now points to index ${index}.`,
        tip: "The new value is written after rear has moved.",
        rear: index,
        mark: { index, kind: "pending" }
    });

    rear = index;
    liveData[index] = value;

    addStep({
        line: 13,
        type: "store",
        action: "Store the Value",
        values: `data[${index}] = ${value}`,
        why: "The value is written into the slot that rear points to.",
        message: `${value} is stored at index ${index}.`,
        tip: "The newest value is always at the rear.",
        mark: { index, kind: "new" }
    });

    opLog.push(`enqueue(${value})`);

    addStep({
        line: 14,
        type: "done",
        action: "enqueue() Finished",
        values: `size = ${queueSize()}`,
        why: "The method ends. The queue now has one more value.",
        message: `${value} joined the rear. The queue has ${queueSize()} value(s).`,
        tip: "enqueue is O(1) because nothing has to move."
    });
}

function dequeueOperation() {
    addStep({
        line: 16,
        type: "call",
        action: "Call dequeue()",
        values: `front = ${front}, rear = ${rear}`,
        why: "dequeue removes the oldest value from the front and returns it.",
        message: "Start removing the front value.",
        tip: "The value that waited longest leaves first."
    });

    const empty = front > rear;

    addStep({
        line: 17,
        type: "check",
        action: "Check for Underflow",
        values: `front > rear ?  (${front} > ${rear})`,
        why: "When front has passed rear, the queue has nothing left to remove.",
        message: empty
            ? "front is past rear, so the queue is empty."
            : "front is not past rear, so the queue has values.",
        tip: "Trying to dequeue from an empty queue is called Queue Underflow.",
        mark: empty ? null : { index: front, kind: "read" }
    });

    if (empty) {
        addStep({
            line: 18,
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
        line: 19,
        type: "read",
        action: "Read the Front Value",
        values: `data[${front}] = ${value}`,
        why: "data[front++] reads the value first, then moves front forward.",
        message: `The value ${value} will be returned.`,
        tip: "The value is read before front changes.",
        mark: { index: front, kind: "remove" },
        returned: value
    });

    front += 1;

    addStep({
        line: 19,
        type: "shrink",
        action: "Move front Forward",
        values: `front = ${oldFront} → ${front}`,
        why: "front++ makes the next value the new front of the queue.",
        message: `${value} has left. front now points to index ${front}.`,
        tip: "The old slot is not reused. It stays grey until the queue empties.",
        returned: value
    });

    const nowEmpty = front > rear;

    addStep({
        line: 20,
        type: "check",
        action: "Is the Queue Empty Now?",
        values: `front > rear ?  (${front} > ${rear})  →  ${nowEmpty}`,
        why: "When the last value leaves, both pointers can go back to the start.",
        message: nowEmpty
            ? "The queue is empty now, so the pointers are reset."
            : "Other values are still waiting, so nothing else changes.",
        tip: "Without this reset, an empty queue could still be 'full'.",
        returned: value
    });

    if (nowEmpty) {
        front = 0;
        rear = -1;
        liveData = new Array(capacity).fill(null);

        addStep({
            line: [21, 22],
            type: "reset",
            action: "Reset front and rear",
            values: "front = 0, rear = -1",
            why: "All slots are free again, so the queue starts over from index 0.",
            message: "The queue is empty. front = 0 and rear = -1.",
            tip: "This is the same state as a brand new queue.",
            returned: value
        });
    }

    opLog.push(`dequeue() → ${value}`);

    addStep({
        line: 24,
        type: "done",
        action: "dequeue() Finished",
        values: `returned ${value}, size = ${queueSize()}`,
        why: "The method ends and gives the removed value back to the caller.",
        message: `dequeue() returned ${value}. The queue has ${queueSize()} value(s).`,
        tip: "dequeue is O(1) because only front changes.",
        returned: value
    });
}

function peekOperation() {
    addStep({
        line: 27,
        type: "call",
        action: "Call peek()",
        values: `front = ${front}, rear = ${rear}`,
        why: "peek looks at the front value without removing it.",
        message: "Start peeking at the front value.",
        tip: "peek never changes the queue."
    });

    const empty = front > rear;

    addStep({
        line: 28,
        type: "check",
        action: "Check if Empty",
        values: `front > rear ?  (${front} > ${rear})`,
        why: "There is no front value when the queue is empty.",
        message: empty
            ? "front is past rear, so the queue is empty."
            : "The queue has values.",
        tip: "Peeking at an empty queue is an error.",
        mark: empty ? null : { index: front, kind: "read" }
    });

    if (empty) {
        addStep({
            line: 29,
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
        line: 30,
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
        line: 31,
        type: "done",
        action: "peek() Finished",
        values: `returned ${value}, size = ${queueSize()}`,
        why: "The method ends. Nothing was removed.",
        message: `peek() returned ${value}. The queue is unchanged.`,
        tip: "peek is O(1).",
        returned: value
    });
}

function isEmptyOperation() {
    const empty = front > rear;

    addStep({
        line: 33,
        type: "call",
        action: "Call isEmpty()",
        values: `front = ${front}, rear = ${rear}`,
        why: "isEmpty tells us whether the queue has any values.",
        message: "Start checking if the queue is empty.",
        tip: "It does not change the queue."
    });

    addStep({
        line: 34,
        type: "read",
        action: "Compare front with rear",
        values: `${front} > ${rear}  →  ${empty}`,
        why: "The queue is empty exactly when front has moved past rear.",
        message: empty
            ? "front is past rear, so the answer is true."
            : "front is not past rear, so the answer is false.",
        tip: "Use isEmpty() before dequeue or peek in real programs.",
        mark: empty ? null : { index: front, kind: "read" },
        returned: String(empty)
    });

    opLog.push(`isEmpty() → ${empty}`);

    addStep({
        line: 35,
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
    const size = queueSize();

    addStep({
        line: 37,
        type: "call",
        action: "Call size()",
        values: `front = ${front}, rear = ${rear}`,
        why: "size tells us how many values are waiting in the queue.",
        message: "Start counting the values.",
        tip: "It does not change the queue."
    });

    addStep({
        line: 38,
        type: "read",
        action: "Calculate rear - front + 1",
        values: `${rear} - ${front} + 1 = ${size}`,
        why: "The values sit between front and rear, so we count that range.",
        message: `The queue holds ${size} value(s).`,
        tip: "No loop is needed, so size is O(1).",
        returned: size
    });

    opLog.push(`size() → ${size}`);

    addStep({
        line: 39,
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

        if (index === step.rear) {
            rearLabel.textContent = "rear ▼";
        }

        const box = document.createElement("div");
        box.className = "slot-box";

        const value = step.data[index];

        if (value !== null && value !== undefined) {
            if (index < step.front) {
                box.textContent = value;
                box.classList.add("is-used");
            } else if (index <= step.rear) {
                box.textContent = value;
                box.classList.add("filled");

                if (index === step.front) {
                    box.classList.add("is-top");
                }
            }
        }

        if (step.mark && step.mark.index === index) {
            box.classList.add(`mark-${step.mark.kind}`);

            if (step.mark.kind === "pending") {
                box.textContent = "?";
            }
        }

        const indexLabel = document.createElement("span");
        indexLabel.className = "slot-index";
        indexLabel.textContent = index;

        const frontLabel = document.createElement("span");
        frontLabel.className = "queue-label front";

        if (index === step.front) {
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

    const size = Math.max(0, step.rear - step.front + 1);
    const rearAtEnd = step.rear === capacity - 1;

    queueBadge.className = "stack-badge " + (
        size === 0 ? "is-empty"
        : rearAtEnd ? "is-full"
        : "is-ok"
    );

    queueBadge.textContent =
        size === 0 ? "EMPTY"
        : rearAtEnd && step.front > 0 ? "FULL (rear at end)"
        : rearAtEnd ? "FULL"
        : `${size} / ${capacity} used`;

    returnBadge.hidden = step.returned === null;
    returnBadge.textContent =
        step.returned === null ? "" : `Returned: ${step.returned}`;

    pointerInfo.textContent =
        `front = ${step.front} · rear = ${step.rear} · size ${size} / ${capacity}`;

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

function currentItems() {
    return front > rear ? [] : liveData.slice(front, rear + 1);
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
    opLog = [];
    steps = [];
    lastOpStart = 0;

    addStep({
        line: 1,
        type: "ready",
        action: "Ready to Start",
        values: items.length > 0
            ? `Queue (front → rear): [${items.join(", ")}]`
            : "The queue is empty (front = 0, rear = -1).",
        why: "A queue adds at the rear and removes from the front. The first value in is the first value out.",
        message: "Choose a value and click Enqueue or Dequeue.",
        tip: "front is the index of the oldest value. rear is the index of the newest value."
    });

    renderStep(0);
    AlgoLab.showHint(defaultHint(), false);
}

function randomItems() {
    const size = 3 + Math.floor(Math.random() * 3);
    const values = new Set();

    while (values.size < size) {
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
        const before = queueSize();
        const rearBefore = rear;

        runOperation(() => enqueueOperation(value));

        // Make repeated enqueues quick: suggest a fresh value
        if (rear > rearBefore || queueSize() > before) {
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
