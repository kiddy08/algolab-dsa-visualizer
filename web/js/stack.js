"use strict";

// ==========================================
// ELEMENTS
// ==========================================

const stackView = document.getElementById("stackView");
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
const topInfo = document.getElementById("topInfo");
const historyBox = document.getElementById("historyBox");

const valueInput = document.getElementById("valueInput");
const pushBtn = document.getElementById("pushBtn");
const popBtn = document.getElementById("popBtn");
const peekBtn = document.getElementById("peekBtn");
const isEmptyBtn = document.getElementById("isEmptyBtn");
const sizeBtn = document.getElementById("sizeBtn");
const randomBtn = document.getElementById("randomBtn");
const clearBtn = document.getElementById("clearBtn");
const autoToggle = document.getElementById("autoToggle");
const capacitySelect = document.getElementById("capacitySelect");
const speedSelect = document.getElementById("speedSelect");
const stackBadge = document.getElementById("stackBadge");
const returnBadge = document.getElementById("returnBadge");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");

const codeLines = document.querySelectorAll(".code-line");

let capacity = 8;
let animationSpeed = 800;

function defaultHint() {
    return `Push a whole number from 1 to 999. The stack holds up to ${capacity} values.`;
}

// The stack that the next operation will change
let initialStack = [10, 20, 30];
let liveStack = [...initialStack];
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

        stack: [...liveStack],
        top: data.top ?? liveStack.length - 1,
        mark: data.mark ?? null,
        returned: data.returned ?? null,
        history: [...opLog]
    });
}

function topMark(kind) {
    return liveStack.length > 0
        ? { index: liveStack.length - 1, kind }
        : null;
}

function pushOperation(value) {
    const top = liveStack.length - 1;

    addStep({
        line: 9,
        type: "call",
        action: `Call push(${value})`,
        values: `value = ${value}, top = ${top}`,
        why: "push adds a new value on top of the stack.",
        message: `Start pushing ${value}.`,
        tip: "Only the top of a stack can be changed."
    });

    const full = liveStack.length === capacity;

    addStep({
        line: 10,
        type: "check",
        action: "Check for Overflow",
        values: `top = ${top}, data.length - 1 = ${capacity - 1}`,
        why: "A full array has no free slot, so we must check before writing.",
        message: full
            ? "top is the last index, so the stack is full."
            : "top is below the last index, so there is free space.",
        tip: "Trying to push onto a full stack is called Stack Overflow.",
        mark: topMark("read")
    });

    if (full) {
        addStep({
            line: 11,
            type: "error",
            action: "Stack Overflow",
            values: `Cannot push ${value}`,
            why: "The stack is full, so the exception is thrown and nothing changes.",
            message: `Stack Overflow! ${value} was not added.`,
            tip: "Pop a value first to free a slot.",
            mark: topMark("remove")
        });

        opLog.push(`push(${value}) → Overflow`);
        return;
    }

    addStep({
        line: 12,
        type: "grow",
        action: "Move top Up",
        values: `top = ${top} → ${top + 1}`,
        why: "++top moves the top pointer to the next free slot first.",
        message: `top now points to index ${top + 1}.`,
        tip: "The new value is written after top has moved.",
        top: top + 1,
        mark: { index: top + 1, kind: "pending" }
    });

    liveStack.push(value);

    addStep({
        line: 12,
        type: "store",
        action: "Store the Value",
        values: `data[${top + 1}] = ${value}`,
        why: "The value is written into the slot that top points to.",
        message: `${value} is stored at index ${top + 1}.`,
        tip: "The newest value is always at the top.",
        mark: topMark("new")
    });

    opLog.push(`push(${value})`);

    addStep({
        line: 13,
        type: "done",
        action: "push() Finished",
        values: `size = ${liveStack.length}`,
        why: "The method ends. The stack now has one more value.",
        message: `${value} is on top. The stack has ${liveStack.length} value(s).`,
        tip: "push is O(1) because nothing has to move."
    });
}

function popOperation() {
    const top = liveStack.length - 1;

    addStep({
        line: 15,
        type: "call",
        action: "Call pop()",
        values: `top = ${top}`,
        why: "pop removes the value on top of the stack and returns it.",
        message: "Start popping the top value.",
        tip: "pop always removes the most recently pushed value."
    });

    const empty = liveStack.length === 0;

    addStep({
        line: 16,
        type: "check",
        action: "Check for Underflow",
        values: `top == -1 ?  (top = ${top})`,
        why: "An empty stack has nothing to remove, so we must check first.",
        message: empty
            ? "top is -1, so the stack is empty."
            : `top is ${top}, so the stack has values.`,
        tip: "Trying to pop from an empty stack is called Stack Underflow.",
        mark: topMark("read")
    });

    if (empty) {
        addStep({
            line: 17,
            type: "error",
            action: "Stack Underflow",
            values: "Nothing to pop",
            why: "The stack is empty, so the exception is thrown.",
            message: "Stack Underflow! There is no value to remove.",
            tip: "Push a value first."
        });

        opLog.push("pop() → Underflow");
        return;
    }

    const value = liveStack[top];

    addStep({
        line: 18,
        type: "read",
        action: "Read the Top Value",
        values: `data[${top}] = ${value}`,
        why: "return data[top--] reads the value first, then moves top down.",
        message: `The value ${value} will be returned.`,
        tip: "The value is read before top changes.",
        mark: { index: top, kind: "remove" },
        returned: value
    });

    liveStack.pop();

    addStep({
        line: 18,
        type: "shrink",
        action: "Move top Down",
        values: `top = ${top} → ${top - 1}`,
        why: "top-- makes the slot part of the free space again.",
        message: `${value} is removed. top now points to index ${top - 1}.`,
        tip: "The old number may stay in memory, but the stack ignores it.",
        returned: value
    });

    opLog.push(`pop() → ${value}`);

    addStep({
        line: 19,
        type: "done",
        action: "pop() Finished",
        values: `returned ${value}, size = ${liveStack.length}`,
        why: "The method ends and gives the removed value back to the caller.",
        message: `pop() returned ${value}. The stack has ${liveStack.length} value(s).`,
        tip: "pop is O(1) because only top changes.",
        returned: value
    });
}

function peekOperation() {
    const top = liveStack.length - 1;

    addStep({
        line: 21,
        type: "call",
        action: "Call peek()",
        values: `top = ${top}`,
        why: "peek looks at the top value without removing it.",
        message: "Start peeking at the top value.",
        tip: "peek never changes the stack."
    });

    const empty = liveStack.length === 0;

    addStep({
        line: 22,
        type: "check",
        action: "Check if Empty",
        values: `top == -1 ?  (top = ${top})`,
        why: "There is no top value when the stack is empty.",
        message: empty
            ? "top is -1, so the stack is empty."
            : `top is ${top}, so the stack has values.`,
        tip: "Peeking at an empty stack is an error.",
        mark: topMark("read")
    });

    if (empty) {
        addStep({
            line: 23,
            type: "error",
            action: "Stack Is Empty",
            values: "Nothing to peek at",
            why: "The stack is empty, so the exception is thrown.",
            message: "The stack is empty. There is no top value.",
            tip: "Push a value first."
        });

        opLog.push("peek() → Empty");
        return;
    }

    const value = liveStack[top];

    addStep({
        line: 24,
        type: "read",
        action: "Return the Top Value",
        values: `data[${top}] = ${value}`,
        why: "The value at index top is returned, and top stays where it is.",
        message: `The top value is ${value}.`,
        tip: "The stack looks exactly the same afterwards.",
        mark: { index: top, kind: "read" },
        returned: value
    });

    opLog.push(`peek() → ${value}`);

    addStep({
        line: 25,
        type: "done",
        action: "peek() Finished",
        values: `returned ${value}, size = ${liveStack.length}`,
        why: "The method ends. Nothing was removed.",
        message: `peek() returned ${value}. The stack is unchanged.`,
        tip: "peek is O(1).",
        returned: value
    });
}

function isEmptyOperation() {
    const top = liveStack.length - 1;
    const empty = liveStack.length === 0;

    addStep({
        line: 27,
        type: "call",
        action: "Call isEmpty()",
        values: `top = ${top}`,
        why: "isEmpty tells us whether the stack has any values.",
        message: "Start checking if the stack is empty.",
        tip: "It does not change the stack."
    });

    addStep({
        line: 28,
        type: "read",
        action: "Compare top with -1",
        values: `${top} == -1  →  ${empty}`,
        why: "An empty stack is the only case where top is -1.",
        message: empty
            ? "top is -1, so the answer is true."
            : `top is ${top}, so the answer is false.`,
        tip: "Always use isEmpty() before pop or peek in real programs.",
        mark: topMark("read"),
        returned: String(empty)
    });

    opLog.push(`isEmpty() → ${empty}`);

    addStep({
        line: 29,
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
    const top = liveStack.length - 1;
    const size = liveStack.length;

    addStep({
        line: 31,
        type: "call",
        action: "Call size()",
        values: `top = ${top}`,
        why: "size tells us how many values are stored.",
        message: "Start counting the values.",
        tip: "It does not change the stack."
    });

    addStep({
        line: 32,
        type: "read",
        action: "Calculate top + 1",
        values: `${top} + 1 = ${size}`,
        why: "Indexes start at 0, so the number of values is top + 1.",
        message: `The stack holds ${size} value(s).`,
        tip: "No loop is needed, so size is O(1).",
        mark: topMark("read"),
        returned: size
    });

    opLog.push(`size() → ${size}`);

    addStep({
        line: 33,
        type: "done",
        action: "size() Finished",
        values: `returned ${size}`,
        why: "The method ends and returns the count.",
        message: `size() returned ${size}.`,
        tip: "A stack with top = -1 has size 0.",
        returned: size
    });
}


// ==========================================
// DRAW THE STACK
// ==========================================

function renderStack(step) {
    stackView.innerHTML = "";

    for (let index = capacity - 1; index >= 0; index--) {
        const slot = document.createElement("div");
        slot.className = "stack-slot";

        const label = document.createElement("span");
        label.className = "slot-index";
        label.textContent = index;

        const box = document.createElement("div");
        box.className = "slot-box";

        const filled = index < step.stack.length;

        if (filled) {
            box.textContent = step.stack[index];
            box.classList.add("filled");

            if (index === step.stack.length - 1) {
                box.classList.add("is-top");
            }
        }

        if (step.mark && step.mark.index === index) {
            box.classList.add(`mark-${step.mark.kind}`);

            if (step.mark.kind === "pending") {
                box.textContent = "?";
            }
        }

        const pointer = document.createElement("span");
        pointer.className = "slot-pointer";

        if (step.top === index) {
            pointer.textContent = "◄ top";
        }

        slot.append(label, box, pointer);
        stackView.appendChild(slot);
    }

    const floor = document.createElement("div");
    floor.className = "stack-floor";

    const floorLabel = document.createElement("span");
    floorLabel.className = "slot-pointer";
    floorLabel.style.gridColumn = "3";

    if (step.top === -1) {
        floorLabel.textContent = "◄ top";
    }

    floor.appendChild(floorLabel);
    stackView.appendChild(floor);
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

function highlightCodeLine(lineNumber) {
    codeLines.forEach((line, index) => {
        const actualLine = Number(line.dataset.line || index + 1);

        line.classList.toggle("active", actualLine === lineNumber);
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

    const lock = isPlaying;

    [
        valueInput, pushBtn, popBtn, peekBtn, isEmptyBtn,
        sizeBtn, randomBtn, clearBtn, resetBtn,
        capacitySelect, speedSelect
    ].forEach(control => {
        control.disabled = lock;
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

    renderStack(step);
    renderHistory(step.history);
    highlightCodeLine(step.line);

    actionType.textContent = step.action;
    AlgoLab.setChip(document.getElementById("stepChip"), step.type);
    valuesInvolved.textContent = step.values;
    whyText.textContent = step.why;
    tipText.textContent = step.tip;
    message.textContent = step.message;

    currentAction.classList.toggle("is-error", step.type === "error");

    const size = step.stack.length;

    let pointerText = `top = ${step.top}`;

    if (step.top === -1) {
        pointerText += " (empty)";
    } else if (step.top < size) {
        pointerText += ` (value ${step.stack[step.top]})`;
    }

    topInfo.textContent =
        `${pointerText} · size ${size} / ${capacity}` +
        (step.returned !== null ? ` · returned ${step.returned}` : "");

    const used = step.stack.length;

    stackBadge.className = "stack-badge " + (
        used === capacity ? "is-full" : used === 0 ? "is-empty" : "is-ok"
    );

    stackBadge.textContent =
        used === capacity ? "FULL"
        : used === 0 ? "EMPTY"
        : `${used} / ${capacity} used`;

    returnBadge.hidden = step.returned === null;
    returnBadge.textContent =
        step.returned === null ? "" : `Returned: ${step.returned}`;

    statusTag.textContent = index === 0 ? "Ready" : `Step ${index + 1} of ${steps.length}`;
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

function readPushValue() {
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

function resetTimeline(stack) {
    stopAnimation();

    initialStack = [...stack];
    liveStack = [...stack];
    opLog = [];
    steps = [];
    lastOpStart = 0;

    addStep({
        line: 1,
        type: "ready",
        action: "Ready to Start",
        values: stack.length > 0
            ? `Stack (bottom → top): [${stack.join(", ")}]`
            : "The stack is empty (top = -1).",
        why: "A stack only lets you change the top. The last value pushed is the first one popped.",
        message: "Choose a value and click Push, Pop or Peek.",
        tip: "top is the index of the newest value. An empty stack has top = -1."
    });

    renderStep(0);
    AlgoLab.showHint(defaultHint(), false);
}

function randomStack() {
    const size = 3 + Math.floor(Math.random() * 3);
    const values = new Set();

    while (values.size < size) {
        values.add(Math.floor(Math.random() * 90) + 10);
    }

    return [...values];
}


function suggestValue() {
    for (let tries = 0; tries < 30; tries++) {
        const value = Math.floor(Math.random() * 90) + 10;

        if (!liveStack.includes(value)) {
            return value;
        }
    }

    return 99;
}


// ==========================================
// EVENTS
// ==========================================

pushBtn.addEventListener("click", () => {
    if (isPlaying) return;

    const value = readPushValue();

    if (value !== null) {
        const before = liveStack.length;

        runOperation(() => pushOperation(value));

        // Make repeated pushes quick: suggest a fresh value
        if (liveStack.length > before) {
            valueInput.value = suggestValue();
        }
    }
});

valueInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        pushBtn.click();
    }
});

popBtn.addEventListener("click", () => runOperation(popOperation));
peekBtn.addEventListener("click", () => runOperation(peekOperation));
isEmptyBtn.addEventListener("click", () => runOperation(isEmptyOperation));
sizeBtn.addEventListener("click", () => runOperation(sizeOperation));

randomBtn.addEventListener("click", () => {
    if (!isPlaying) resetTimeline(randomStack());
});

clearBtn.addEventListener("click", () => {
    if (!isPlaying) resetTimeline([]);
});

resetBtn.addEventListener("click", () => {
    if (!isPlaying) resetTimeline(initialStack);
});

capacitySelect.addEventListener("change", () => {
    if (isPlaying) return;

    capacity = Number(capacitySelect.value);
    resetTimeline(liveStack.slice(0, capacity));
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

resetTimeline(initialStack);
