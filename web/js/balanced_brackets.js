"use strict";

// ==========================================
// ELEMENTS
// ==========================================

const exprStrip = document.getElementById("exprStrip");
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
const stackBadge = document.getElementById("stackBadge");
const verdictBadge = document.getElementById("verdictBadge");
const pairsBox = document.getElementById("pairsBox");

const exprInput = document.getElementById("exprInput");
const loadBtn = document.getElementById("loadBtn");
const goodBtn = document.getElementById("goodBtn");
const orderBtn = document.getElementById("orderBtn");
const unclosedBtn = document.getElementById("unclosedBtn");
const extraBtn = document.getElementById("extraBtn");
const speedSelect = document.getElementById("speedSelect");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");

const codeLines = document.querySelectorAll(".code-line");

const OPENING = "([{";
const CLOSING = ")]}";
const MAX_LENGTH = 16;
const DEFAULT_HINT =
    "Type up to 16 characters. Only ( ) [ ] { } are checked, other characters are skipped.";

const EXAMPLES = {
    good: "{[(1+2)*3]-4}",
    order: "([)]",
    unclosed: "{[(a+b)*c]",
    extra: "(a+b))"
};

let expression = EXAMPLES.good;
let steps = [];
let slotCount = 4;
let currentStep = 0;
let animationSpeed = 800;
let timer = null;
let isPlaying = false;


// ==========================================
// BUILD THE STEPS
// ==========================================

function buildSteps(expr) {
    const chars = [...expr];
    const result = [];

    // Each stack entry remembers where its bracket sits in the expression
    const stack = [];
    const matched = [];
    const pairs = [];

    let maxDepth = 0;

    function addStep(data) {
        maxDepth = Math.max(maxDepth, stack.length);

        result.push({
            line: data.line,
            type: data.type,
            action: data.action,
            values: data.values,
            why: data.why,
            message: data.message,
            tip: data.tip,

            index: data.index ?? -1,
            errorIndex: data.errorIndex ?? -1,
            stack: stack.map(entry => entry.char),
            waiting: stack.map(entry => entry.index),
            matched: [...matched],
            pairs: [...pairs],
            mark: data.mark ?? null,
            markAll: data.markAll ?? null,
            verdict: data.verdict ?? null
        });
    }

    function topMark(kind) {
        return stack.length > 0
            ? { index: stack.length - 1, kind }
            : null;
    }

    addStep({
        line: 1,
        type: "ready",
        action: "Ready to Start",
        values: `Expression: ${expr}`,
        why: "Every opening bracket waits on a stack until its closing bracket arrives.",
        message: "Click Next Step to begin checking the expression.",
        tip: "The newest opening bracket must be closed first (Last In, First Out)."
    });

    addStep({
        line: 2,
        type: "init",
        action: "Create an Empty Stack",
        values: "stack = [ ]",
        why: "The stack will hold opening brackets that still wait for a partner.",
        message: "The stack starts empty.",
        tip: "A balanced expression always ends with an empty stack."
    });

    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        const isOpen = OPENING.includes(c);
        const isClose = CLOSING.includes(c);

        addStep({
            line: 3,
            type: "read",
            action: `Read Character '${c}'`,
            values: `index ${i}: '${c}'`,
            why: "The loop looks at the expression one character at a time, from left to right.",
            message: `Now reading '${c}' at index ${i}.`,
            tip: "Each character is looked at exactly once, so the time is O(n).",
            index: i
        });

        addStep({
            line: 4,
            type: "check",
            action: "Is It an Opening Bracket?",
            values: `'${c}' is one of ( [ {  →  ${isOpen}`,
            why: "Opening brackets are saved, so we can match them later.",
            message: isOpen
                ? `'${c}' is an opening bracket.`
                : `'${c}' is not an opening bracket.`,
            tip: "Only ( [ { are opening brackets.",
            index: i
        });

        if (isOpen) {
            stack.push({ char: c, index: i });

            addStep({
                line: 5,
                type: "push",
                action: `Push '${c}'`,
                values: `stack = [ ${stack.map(entry => entry.char).join(" ")} ]`,
                why: "The opening bracket waits on the stack for its closing partner.",
                message: `'${c}' goes on top of the stack.`,
                tip: "The bracket on top is always the next one that must be closed.",
                index: i,
                mark: topMark("new")
            });

            continue;
        }

        addStep({
            line: 6,
            type: "check",
            action: "Is It a Closing Bracket?",
            values: `'${c}' is one of ) ] }  →  ${isClose}`,
            why: "A closing bracket must be compared with the opening bracket on top.",
            message: isClose
                ? `'${c}' is a closing bracket.`
                : `'${c}' is not a bracket, so it is skipped.`,
            tip: isClose
                ? "Closing brackets are never pushed."
                : "Numbers, letters and operators do not matter here.",
            index: i
        });

        if (!isClose) continue;

        const empty = stack.length === 0;

        addStep({
            line: 7,
            type: "check",
            action: "Is the Stack Empty?",
            values: `stack.isEmpty() → ${empty}`,
            why: "A closing bracket needs an opening bracket waiting on the stack.",
            message: empty
                ? `There is no opening bracket to match '${c}'.`
                : "The stack has an opening bracket to compare with.",
            tip: "Popping an empty stack would be an error, so we check first.",
            index: i,
            mark: topMark("read")
        });

        if (empty) {
            addStep({
                line: 8,
                type: "error",
                action: "Return false",
                values: `Extra closing bracket '${c}' at index ${i}`,
                why: "Nothing is waiting for this closing bracket, so the expression cannot be balanced.",
                message: `Not balanced: '${c}' at index ${i} has no opening bracket.`,
                tip: "The method stops as soon as it finds a mistake.",
                index: i,
                errorIndex: i,
                verdict: false
            });

            return { steps: result, maxDepth };
        }

        const top = stack[stack.length - 1];

        addStep({
            line: 10,
            type: "pop",
            action: `Pop '${top.char}'`,
            values: `open = '${top.char}'`,
            why: "The top of the stack is the newest opening bracket, so it is the one to compare.",
            message: `Remove '${top.char}' from the top of the stack.`,
            tip: "pop returns the removed value, so we can compare it.",
            index: i,
            mark: { index: stack.length - 1, kind: "remove" }
        });

        stack.pop();

        const ok = OPENING.indexOf(top.char) === CLOSING.indexOf(c);

        addStep({
            line: 11,
            type: "check",
            action: "Do They Match?",
            values: `matches('${top.char}', '${c}') → ${ok}`,
            why: "Each opening bracket needs its own kind of closing bracket.",
            message: ok
                ? `'${top.char}' and '${c}' are a pair.`
                : `'${top.char}' cannot be closed by '${c}'.`,
            tip: "( goes with ), [ goes with ] and { goes with }.",
            index: i
        });

        if (!ok) {
            addStep({
                line: 12,
                type: "error",
                action: "Return false",
                values: `'${top.char}' (index ${top.index}) vs '${c}' (index ${i})`,
                why: "The brackets are closed in the wrong order or with the wrong type.",
                message: `Not balanced: '${c}' at index ${i} does not match '${top.char}'.`,
                tip: "The newest opening bracket must be closed first.",
                index: i,
                errorIndex: i,
                verdict: false
            });

            return { steps: result, maxDepth };
        }

        matched.push(top.index, i);
        pairs.push(`${top.char} ${c}`);

        addStep({
            line: 11,
            type: "match",
            action: "Pair Matched",
            values: `${top.char} ${c}  (index ${top.index} and ${i})`,
            why: "The pair is complete, so nothing about it needs to be remembered.",
            message: `${top.char} ${c} is a matched pair.`,
            tip: "Matched pairs turn green.",
            index: i
        });
    }

    const empty = stack.length === 0;

    addStep({
        line: 16,
        type: empty ? "done" : "error",
        action: "Return stack.isEmpty()",
        values: `stack.isEmpty() → ${empty}`,
        why: "If any opening bracket is still waiting, it never got a closing partner.",
        message: empty
            ? "The stack is empty, so every bracket was matched. Balanced!"
            : `Not balanced: ${stack.length} opening bracket(s) were never closed.`,
        tip: empty
            ? "Empty stack at the end means the expression is balanced."
            : "Leftover opening brackets mean the expression is not balanced.",
        verdict: empty,
        markAll: empty ? null : "remove"
    });

    return { steps: result, maxDepth };
}


// ==========================================
// DRAW THE EXPRESSION
// ==========================================

function renderExpression(step) {
    exprStrip.innerHTML = "";

    [...expression].forEach((c, i) => {
        const cell = document.createElement("div");
        cell.className = "expr-cell";

        const box = document.createElement("div");
        box.className = "expr-char";
        box.textContent = c === " " ? "␣" : c;

        const isBracket = OPENING.includes(c) || CLOSING.includes(c);

        if (!isBracket) {
            box.classList.add("is-skipped");
        }

        if (step.matched.includes(i)) {
            box.classList.add("is-matched");
        } else if (step.waiting.includes(i)) {
            box.classList.add("is-waiting");
        }

        if (i === step.errorIndex) {
            box.classList.add("is-error");
        } else if (i === step.index && step.type !== "match") {
            box.classList.add("is-current");
        }

        const label = document.createElement("span");
        label.className = "expr-index";
        label.textContent = i;

        cell.append(box, label);
        exprStrip.appendChild(cell);
    });
}


// ==========================================
// DRAW THE STACK
// ==========================================

function renderStack(step) {
    stackView.innerHTML = "";

    const topIndex = step.stack.length - 1;

    for (let index = slotCount - 1; index >= 0; index--) {
        const slot = document.createElement("div");
        slot.className = "stack-slot";

        const label = document.createElement("span");
        label.className = "slot-index";
        label.textContent = index;

        const box = document.createElement("div");
        box.className = "slot-box bracket";

        if (index < step.stack.length) {
            box.textContent = step.stack[index];
            box.classList.add("filled");

            if (index === topIndex) {
                box.classList.add("is-top");
            }

            if (step.markAll) {
                box.classList.add(`mark-${step.markAll}`);
            }
        }

        if (step.mark && step.mark.index === index) {
            box.classList.add(`mark-${step.mark.kind}`);
        }

        const pointer = document.createElement("span");
        pointer.className = "slot-pointer";

        if (index === topIndex) {
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

    if (topIndex === -1) {
        floorLabel.textContent = "◄ top";
    }

    floor.appendChild(floorLabel);
    stackView.appendChild(floor);
}

function renderPairs(pairs) {
    pairsBox.innerHTML = "";

    if (pairs.length === 0) {
        const empty = document.createElement("p");
        empty.className = "history-empty";
        empty.textContent = "No pairs matched yet.";
        pairsBox.appendChild(empty);
        return;
    }

    pairs.forEach((pair, index) => {
        const chip = document.createElement("span");
        chip.className = "array-value";
        chip.textContent = pair;

        if (index === pairs.length - 1) {
            chip.classList.add("changed");
        }

        pairsBox.appendChild(chip);
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
    const done = currentStep >= steps.length - 1;

    if (isPlaying) {
        startBtn.textContent = "⏸ Pause";
    } else if (done && currentStep > 0) {
        startBtn.textContent = "↻ Check Again";
    } else if (currentStep > 0) {
        startBtn.textContent = "▶ Resume";
    } else {
        startBtn.textContent = "▶ Start Checking";
    }

    stepBtn.disabled = isPlaying || done;
    prevBtn.disabled = isPlaying || currentStep <= 0;

    [
        exprInput, loadBtn, goodBtn, orderBtn, unclosedBtn,
        extraBtn, resetBtn, speedSelect
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

    renderExpression(step);
    renderStack(step);
    renderPairs(step.pairs);
    highlightCodeLine(step.line);

    actionType.textContent = step.action;
    valuesInvolved.textContent = step.values;
    whyText.textContent = step.why;
    tipText.textContent = step.tip;
    message.textContent = step.message;

    currentAction.classList.toggle("is-error", step.verdict === false);

    const depth = step.stack.length;

    stackBadge.className =
        "stack-badge " + (depth === 0 ? "is-empty" : "is-ok");

    stackBadge.textContent =
        depth === 0 ? "Stack is empty" : `${depth} waiting in stack`;

    if (step.verdict === null) {
        verdictBadge.hidden = true;
    } else {
        verdictBadge.hidden = false;
        verdictBadge.className =
            "stack-badge " + (step.verdict ? "is-result" : "is-full");
        verdictBadge.textContent =
            step.verdict ? "✔ Balanced" : "✘ Not balanced";
    }

    statusTag.textContent =
        index === 0 ? "Ready" : `Step ${index + 1} of ${steps.length}`;
    chartStep.textContent = step.action;
    chartCaption.textContent = step.message;
    stepCounter.textContent = `Step ${index + 1} of ${steps.length}`;

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
    if (isPlaying) return;

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
// LOAD AN EXPRESSION
// ==========================================

function loadExpression(text) {
    stopAnimation();

    expression = text;
    exprInput.value = text;

    const built = buildSteps(expression);

    steps = built.steps;
    slotCount = Math.max(4, built.maxDepth);

    renderStep(0);
    AlgoLab.showHint(DEFAULT_HINT, false);
}

function loadFromInput() {
    if (isPlaying) return;

    const text = exprInput.value.trim();

    if (text === "") {
        AlgoLab.showHint("Please type an expression first.", true);
        exprInput.focus();
        return;
    }

    if ([...text].length > MAX_LENGTH) {
        AlgoLab.showHint(`Use at most ${MAX_LENGTH} characters.`, true);
        exprInput.focus();
        return;
    }

    loadExpression(text);
}


// ==========================================
// EVENTS
// ==========================================

loadBtn.addEventListener("click", loadFromInput);

exprInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        loadFromInput();
    }
});

goodBtn.addEventListener("click", () => loadExpression(EXAMPLES.good));
orderBtn.addEventListener("click", () => loadExpression(EXAMPLES.order));
unclosedBtn.addEventListener("click", () => loadExpression(EXAMPLES.unclosed));
extraBtn.addEventListener("click", () => loadExpression(EXAMPLES.extra));

resetBtn.addEventListener("click", () => {
    if (!isPlaying) loadExpression(expression);
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

    if (currentStep >= steps.length - 1) {
        renderStep(0);
    }

    startAnimation();
});


// ==========================================
// INITIALIZE
// ==========================================

loadExpression(expression);
