"use strict";

// ==========================================
// PURE BINARY HEAP LOGIC FUNCTIONS (Testable)
// ==========================================

const MAX_NODES = 15;

function parentIdx(i) {
    return Math.floor((i - 1) / 2);
}

function leftIdx(i) {
    return 2 * i + 1;
}

function rightIdx(i) {
    return 2 * i + 2;
}

function heapHeight(size) {
    if (size <= 0) return 0;
    return Math.floor(Math.log2(size)) + 1;
}

// Returns true if child at idxB should be above parent at idxA
function shouldSwap(arr, idxA, idxB, mode) {
    if (mode === "max") {
        return arr[idxB] > arr[idxA];
    }
    return arr[idxB] < arr[idxA];
}

function isValidHeap(arr, mode) {
    for (let i = 0; i < arr.length; i++) {
        const l = leftIdx(i);
        const r = rightIdx(i);
        if (l < arr.length && shouldSwap(arr, i, l, mode)) return false;
        if (r < arr.length && shouldSwap(arr, i, r, mode)) return false;
    }
    return true;
}

function buildHeapSilent(values, mode) {
    const arr = values.slice(0, MAX_NODES).map(Number);
    const n = arr.length;
    for (let start = Math.floor(n / 2) - 1; start >= 0; start--) {
        let i = start;
        while (leftIdx(i) < n) {
            let best = leftIdx(i);
            const r = rightIdx(i);
            if (r < n && shouldSwap(arr, best, r, mode)) {
                best = r;
            }
            if (!shouldSwap(arr, i, best, mode)) break;
            const tmp = arr[i];
            arr[i] = arr[best];
            arr[best] = tmp;
            i = best;
        }
    }
    return arr;
}

// Compute SVG layout for a complete binary tree stored in an array (0..n-1)
function computeHeapLayout(arr) {
    const n = arr.length;
    const nodes = [];
    const edges = [];
    if (n === 0) return { nodes, edges, width: 640, height: 260 };

    // Use inorder rank on array indices so complete binary tree stays symmetric & non-overlapping
    let order = 0;
    let maxDepth = 0;

    function walk(idx, depth) {
        if (idx >= n) return;
        walk(2 * idx + 1, depth + 1);
        const rank = order++;
        if (depth > maxDepth) maxDepth = depth;
        nodes.push({
            index: idx,
            value: arr[idx],
            rank,
            depth,
            parentIndex: idx > 0 ? parentIdx(idx) : null
        });
        walk(2 * idx + 2, depth + 1);
    }

    walk(0, 0);

    const hGap = Math.max(48, Math.min(74, Math.floor(600 / Math.max(1, n))));
    const vGap = 64;
    const width = Math.max(640, (n + 1) * hGap + 40);
    const height = Math.max(260, (maxDepth + 1) * vGap + 70);
    const startX = (width - (n - 1) * hGap) / 2;

    const posByIndex = new Map();
    nodes.forEach(item => {
        item.x = Math.round(startX + item.rank * hGap);
        item.y = Math.round(44 + item.depth * vGap);
        posByIndex.set(item.index, item);
    });

    // Sort nodes by array index 0..n-1 for clean rendering
    nodes.sort((a, b) => a.index - b.index);

    nodes.forEach(item => {
        if (item.parentIndex !== null && posByIndex.has(item.parentIndex)) {
            const p = posByIndex.get(item.parentIndex);
            edges.push({
                from: p.index,
                to: item.index,
                x1: p.x,
                y1: p.y,
                x2: item.x,
                y2: item.y
            });
        }
    });

    return { nodes, edges, width, height };
}


// ==========================================
// DOM ELEMENTS & STATE
// ==========================================

const treeSvg = document.getElementById("treeSvg");
const heapArrayBox = document.getElementById("heapArrayBox");
const formulaBox = document.getElementById("formulaBox");
const currentAction = document.getElementById("currentAction");
const stepChip = document.getElementById("stepChip");
const message = document.getElementById("message");
const statusTag = document.getElementById("status");
const actionType = document.getElementById("actionType");
const valuesInvolved = document.getElementById("valuesInvolved");
const whyText = document.getElementById("whyText");
const tipText = document.getElementById("tipText");
const chartStep = document.getElementById("chartStep");
const chartCaption = document.getElementById("chartCaption");
const stepCounter = document.getElementById("stepCounter");
const pointerInfo = document.getElementById("pointerInfo");
const historyBox = document.getElementById("historyBox");
const treeBadge = document.getElementById("treeBadge");
const returnBadge = document.getElementById("returnBadge");
const codePanelTag = document.getElementById("codePanelTag");

const heapModeSelect = document.getElementById("heapModeSelect");
const valueInput = document.getElementById("valueInput");
const randomValueBtn = document.getElementById("randomValueBtn");
const insertBtn = document.getElementById("insertBtn");
const extractBtn = document.getElementById("extractBtn");
const peekBtn = document.getElementById("peekBtn");
const arrayInput = document.getElementById("arrayInput");
const applyArrayBtn = document.getElementById("applyArrayBtn");
const randomHeapBtn = document.getElementById("randomHeapBtn");
const clearBtn = document.getElementById("clearBtn");
const autoToggle = document.getElementById("autoToggle");
const speedSelect = document.getElementById("speedSelect");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");

const codeLines = document.querySelectorAll(".code-line");

let heapMode = "min"; // "min" or "max"
let animationSpeed = 800;
let initialRawValues = [40, 20, 60, 10, 50, 30, 70];
let liveHeap = [];
let opLog = [];

// Top-level steps and currentStep for enhance.js compatibility
let steps = [];
let currentStep = 0;
let lastOpStart = 0;
let timer = null;
let isPlaying = false;

function modeTitle() {
    return heapMode === "min" ? "Min-Heap" : "Max-Heap";
}

function cmpSymbol() {
    return heapMode === "min" ? "<" : ">";
}

function defaultHint() {
    return `Enter a value from 1 to 999 (max ${MAX_NODES} nodes). Switch Min-Heap / Max-Heap in the top right.`;
}


// ==========================================
// STEP SNAPSHOT BUILDER
// ==========================================

function addStep(data) {
    steps.push({
        line: data.line || 1,
        type: data.type || "ready",
        action: data.action || "Step",
        values: data.values || "",
        why: data.why || "",
        message: data.message || "",
        tip: data.tip || `${modeTitle()}: parent is always ${heapMode === "min" ? "<=" : ">="} its children.`,

        heap: [...liveHeap],
        mode: heapMode,
        currentIdx: data.currentIdx ?? null,
        compareIdx: data.compareIdx ?? null,
        swapIndices: data.swapIndices ? [...data.swapIndices] : [],
        newIdx: data.newIdx ?? null,
        foundIdx: data.foundIdx ?? null,
        pathEdges: data.pathEdges ? [...data.pathEdges] : [],
        formula: data.formula || "parent(i) = (i - 1) / 2 · left(i) = 2i + 1 · right(i) = 2i + 2",
        returned: data.returned ?? null,
        iVar: data.iVar ?? (data.currentIdx !== undefined && data.currentIdx !== null ? data.currentIdx : "–"),
        valVar: data.valVar ?? null,
        history: [...opLog]
    });
}


// ==========================================
// HEAP OPERATIONS (Insert, Extract, Peek, BuildHeap)
// ==========================================

function insertOperation(val) {
    addStep({
        line: 5,
        type: "call",
        action: `Call insert(${val})`,
        values: `val = ${val}, size = ${liveHeap.length}`,
        why: `insert adds ${val} at the next available leaf slot (index size), then sifts it up until the ${modeTitle()} property holds.`,
        message: `Start inserting ${val} into the ${modeTitle()}.`,
        valVar: val
    });

    if (liveHeap.length >= MAX_NODES) {
        opLog.push(`insert(${val}) → Full`);
        addStep({
            line: 6,
            type: "error",
            action: "Heap Is Full",
            values: `size = ${liveHeap.length} / ${MAX_NODES}`,
            why: `The array capacity (${MAX_NODES}) is full, so no more elements can be inserted.`,
            message: `Heap Overflow! Cannot insert ${val} (max ${MAX_NODES} nodes).`,
            tip: "Extract the root or click Clear first.",
            valVar: val
        });
        return;
    }

    let i = liveHeap.length;
    liveHeap.push(val);

    addStep({
        line: 8,
        type: "store",
        action: `Place ${val} at Index ${i}`,
        values: `i = ${i}, heap[${i}] = ${val}, size = ${liveHeap.length}`,
        why: "To keep the binary tree complete, the new element is always placed at the end of the array first.",
        message: `Placed ${val} at array index ${i}. Now sift up if needed.`,
        newIdx: i,
        iVar: i,
        valVar: val,
        formula: i > 0
            ? `i = ${i} · parent(${i}) = (${i} - 1) / 2 = ${parentIdx(i)}`
            : "i = 0 (root node has no parent)"
    });

    while (i > 0) {
        const p = parentIdx(i);
        const needSwap = shouldSwap(liveHeap, p, i, heapMode);
        const edgeKey = `${p}->${i}`;

        addStep({
            line: 9,
            type: "compare",
            action: `Compare with Parent at Index ${p}`,
            values: `heap[${i}] (${liveHeap[i]}) ${cmpSymbol()} heap[${p}] (${liveHeap[p]}) ? → ${needSwap}`,
            why: `In a ${modeTitle()}, a child swaps with its parent if child ${cmpSymbol()} parent.`,
            message: needSwap
                ? `${liveHeap[i]} ${cmpSymbol()} parent ${liveHeap[p]}, so sift ${liveHeap[i]} up.`
                : `${liveHeap[i]} is in order with parent ${liveHeap[p]}. Sift-up stops.`,
            currentIdx: i,
            compareIdx: p,
            pathEdges: [edgeKey],
            iVar: i,
            valVar: val,
            formula: `parent(${i}) = (${i} - 1) / 2 = ${p}`
        });

        if (!needSwap) break;

        const tmp = liveHeap[i];
        liveHeap[i] = liveHeap[p];
        liveHeap[p] = tmp;

        addStep({
            line: 10,
            type: "swap",
            action: `Swap Index ${i} and Parent ${p}`,
            values: `heap[${p}] = ${liveHeap[p]}, heap[${i}] = ${liveHeap[i]}`,
            why: `${liveHeap[p]} moves up to index ${p} and ${liveHeap[i]} moves down to index ${i}.`,
            message: `Swapped ${liveHeap[p]} up to index ${p}.`,
            swapIndices: [i, p],
            pathEdges: [edgeKey],
            iVar: p,
            valVar: val,
            formula: `swapped index ${i} ↔ parent ${p}`
        });

        i = p;
    }

    opLog.push(`insert(${val})`);
    addStep({
        line: 13,
        type: "done",
        action: "insert() Finished",
        values: `root = ${liveHeap[0]}, size = ${liveHeap.length}`,
        why: `The ${modeTitle()} property is restored. Sift-up took at most O(log n) steps.`,
        message: `${val} is settled at index ${i}.`,
        newIdx: i,
        returned: val,
        iVar: i,
        valVar: val
    });
}

function siftDownSteps(startIdx, contextLabel) {
    let i = startIdx;
    const n = liveHeap.length;

    while (leftIdx(i) < n) {
        const l = leftIdx(i);
        const r = rightIdx(i);
        let best = l;

        if (r < n && shouldSwap(liveHeap, l, r, heapMode)) {
            best = r;
        }

        const edges = [`${i}->${l}`];
        if (r < n) edges.push(`${i}->${r}`);

        addStep({
            line: 25,
            type: "check",
            action: `${contextLabel}: Check Children of Index ${i}`,
            values: r < n
                ? `left = heap[${l}] (${liveHeap[l]}), right = heap[${r}] (${liveHeap[r]}) → best child = index ${best} (${liveHeap[best]})`
                : `left = heap[${l}] (${liveHeap[l]}), no right child → best child = index ${l} (${liveHeap[l]})`,
            why: `Pick the ${heapMode === "min" ? "smaller" : "larger"} child of index ${i} to compare with the parent.`,
            message: `Best child of ${liveHeap[i]} (index ${i}) is ${liveHeap[best]} at index ${best}.`,
            currentIdx: i,
            compareIdx: best,
            pathEdges: edges,
            iVar: i,
            formula: `left(${i}) = ${l}${r < n ? ` · right(${i}) = ${r}` : ""}`
        });

        const needSwap = shouldSwap(liveHeap, i, best, heapMode);

        addStep({
            line: 28,
            type: "compare",
            action: `Compare Parent ${liveHeap[i]} with Child ${liveHeap[best]}`,
            values: `heap[${best}] (${liveHeap[best]}) ${cmpSymbol()} heap[${i}] (${liveHeap[i]}) ? → ${needSwap}`,
            why: `If the ${heapMode === "min" ? "smallest" : "largest"} child is ${heapMode === "min" ? "smaller" : "larger"} than the parent, swap them.`,
            message: needSwap
                ? `${liveHeap[best]} ${cmpSymbol()} ${liveHeap[i]} — swap parent with child at index ${best}.`
                : `${liveHeap[i]} already satisfies the ${modeTitle()} rule. Stop sifting down.`,
            currentIdx: i,
            compareIdx: best,
            pathEdges: [`${i}->${best}`],
            iVar: i,
            formula: `compare index ${i} (${liveHeap[i]}) vs index ${best} (${liveHeap[best]})`
        });

        if (!needSwap) break;

        const tmp = liveHeap[i];
        liveHeap[i] = liveHeap[best];
        liveHeap[best] = tmp;

        addStep({
            line: 29,
            type: "swap",
            action: `Swap Index ${i} and Child ${best}`,
            values: `heap[${i}] = ${liveHeap[i]}, heap[${best}] = ${liveHeap[best]}`,
            why: `${liveHeap[i]} moves up to index ${i} and ${liveHeap[best]} moves down to index ${best}.`,
            message: `Swapped ${liveHeap[i]} and ${liveHeap[best]}. Continue sifting from index ${best}.`,
            swapIndices: [i, best],
            pathEdges: [`${i}->${best}`],
            iVar: best,
            formula: `swapped index ${i} ↔ child ${best}`
        });

        i = best;
    }

    return i;
}

function extractOperation() {
    const opName = heapMode === "min" ? "extractMin" : "extractMax";

    addStep({
        line: 15,
        type: "call",
        action: `Call ${opName}()`,
        values: `size = ${liveHeap.length}`,
        why: `${opName} removes and returns the ${heapMode === "min" ? "minimum" : "maximum"} element at index 0 (root).`,
        message: `Start extracting the root of the ${modeTitle()}.`,
        currentIdx: liveHeap.length > 0 ? 0 : null
    });

    if (liveHeap.length === 0) {
        opLog.push(`${opName}() → Empty`);
        addStep({
            line: 16,
            type: "error",
            action: "Heap Underflow (Empty)",
            values: "size == 0",
            why: "Cannot extract from an empty heap.",
            message: "Heap is empty! Insert values first.",
            returned: "empty"
        });
        return;
    }

    const rootVal = liveHeap[0];

    if (liveHeap.length === 1) {
        liveHeap.pop();
        opLog.push(`${opName}() → ${rootVal}`);
        addStep({
            line: 20,
            type: "done",
            action: `${opName}() Finished`,
            values: `returned = ${rootVal}, size = 0`,
            why: "The only element was removed, leaving the heap empty.",
            message: `Extracted ${rootVal}. The heap is now empty.`,
            returned: rootVal
        });
        return;
    }

    const lastVal = liveHeap.pop();
    liveHeap[0] = lastVal;

    addStep({
        line: 18,
        type: "store",
        action: `Move Last Element ${lastVal} to Root`,
        values: `root = ${rootVal}, heap[0] = ${lastVal}, new size = ${liveHeap.length}`,
        why: "We save heap[0] to return later, move the last leaf into index 0 to keep the tree complete, and then sift it down.",
        message: `Saved ${rootVal} and moved last element ${lastVal} to index 0.`,
        currentIdx: 0,
        returned: rootVal,
        iVar: 0,
        valVar: rootVal
    });

    const finalIdx = siftDownSteps(0, "Sift-Down");

    opLog.push(`${opName}() → ${rootVal}`);
    addStep({
        line: 20,
        type: "done",
        action: `${opName}() Returned ${rootVal}`,
        values: `returned = ${rootVal}, new root = ${liveHeap[0]}, size = ${liveHeap.length}`,
        why: `The ${modeTitle()} property is restored in O(log n) time and ${rootVal} is returned.`,
        message: `${opName}() returned ${rootVal}. ${liveHeap[finalIdx]} settled at index ${finalIdx}.`,
        foundIdx: 0,
        returned: rootVal,
        iVar: finalIdx,
        valVar: rootVal
    });
}

function peekOperation() {
    addStep({
        line: 34,
        type: "call",
        action: "Call peek()",
        values: `size = ${liveHeap.length}`,
        why: "peek reads the root element at index 0 without modifying the heap.",
        message: "Check the root of the heap."
    });

    if (liveHeap.length === 0) {
        opLog.push("peek() → Empty");
        addStep({
            line: 35,
            type: "error",
            action: "Heap Is Empty",
            values: "size == 0",
            why: "There is no root element when size is 0.",
            message: "Heap is empty! Nothing to peek.",
            returned: "empty"
        });
        return;
    }

    const top = liveHeap[0];
    opLog.push(`peek() → ${top}`);

    addStep({
        line: 36,
        type: "done",
        action: `Root Value Is ${top}`,
        values: `heap[0] = ${top}`,
        why: `The ${heapMode === "min" ? "smallest" : "largest"} element is always at index 0, so peek is O(1).`,
        message: `peek() returned ${top}.`,
        foundIdx: 0,
        returned: top,
        iVar: 0,
        valVar: top
    });
}

function buildHeapOperation(rawArray) {
    liveHeap = rawArray.slice(0, MAX_NODES).map(Number);
    const n = liveHeap.length;
    const firstParent = Math.floor(n / 2) - 1;

    addStep({
        line: 39,
        type: "call",
        action: `Call buildHeap() on ${n} Elements`,
        values: `array = [${liveHeap.join(", ")}], last parent = index ${firstParent}`,
        why: "Floyd's buildHeap algorithm starts at the last non-leaf parent (size / 2 - 1) and calls siftDown backwards to index 0 in O(n) total time.",
        message: `Loaded raw array. Starting bottom-up heapify from index ${firstParent} down to 0.`,
        tip: "Bottom-up buildHeap runs in O(n) time — faster than inserting n items one by one in O(n log n)."
    });

    for (let i = firstParent; i >= 0; i--) {
        addStep({
            line: 40,
            type: "check",
            action: `Heapify Subtree at Index ${i} (${liveHeap[i]})`,
            values: `i = ${i}, heap[${i}] = ${liveHeap[i]}`,
            why: "All leaves are already valid 1-node heaps. We repair each parent subtree from bottom to top.",
            message: `Call siftDown(${i}) on node ${liveHeap[i]}.`,
            currentIdx: i,
            iVar: i
        });

        siftDownSteps(i, `siftDown(${i})`);
    }

    opLog.push(`buildHeap(${modeTitle()})`);
    addStep({
        line: 42,
        type: "done",
        action: `${modeTitle()} Built in O(n)`,
        values: `heap = [${liveHeap.join(", ")}], root = ${liveHeap[0]}`,
        why: `Every parent now satisfies the ${modeTitle()} property.`,
        message: `${modeTitle()} ready! Root is ${liveHeap[0]}.`,
        foundIdx: 0,
        returned: liveHeap[0],
        iVar: 0
    });
}


// ==========================================
// SVG TREE & BACKING ARRAY RENDERER
// ==========================================

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
}

function renderHeapSvg(step) {
    if (!treeSvg) return;
    treeSvg.innerHTML = "";

    const layout = computeHeapLayout(step.heap);
    treeSvg.setAttribute("width", String(layout.width));
    treeSvg.setAttribute("height", String(layout.height));
    treeSvg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);

    if (layout.nodes.length === 0) {
        const emptyText = svgEl("text", {
            x: layout.width / 2,
            y: layout.height / 2,
            class: "tree-empty-text"
        });
        emptyText.textContent = "Heap is empty (size = 0) — Insert a value or click New Random Heap";
        treeSvg.appendChild(emptyText);
        return;
    }

    const pathSet = new Set(step.pathEdges || []);
    const swapSet = new Set(step.swapIndices || []);

    // Draw edges
    layout.edges.forEach(edge => {
        const key = `${edge.from}->${edge.to}`;
        const line = svgEl("line", {
            x1: edge.x1,
            y1: edge.y1,
            x2: edge.x2,
            y2: edge.y2,
            class: "tree-edge" + (pathSet.has(key) ? " is-path" : "")
        });
        treeSvg.appendChild(line);
    });

    // Draw nodes
    layout.nodes.forEach(node => {
        const classes = ["tree-svg-node"];
        if (step.foundIdx === node.index) classes.push("is-found");
        else if (swapSet.has(node.index)) classes.push("is-swap");
        else if (step.newIdx === node.index) classes.push("is-new");
        else if (step.currentIdx === node.index || step.compareIdx === node.index) classes.push("is-current");
        else if (node.index === 0) classes.push("is-waiting");

        const g = svgEl("g", {
            class: classes.join(" "),
            "data-index": node.index
        });

        const circle = svgEl("circle", {
            cx: node.x,
            cy: node.y,
            r: 21,
            class: "main-circle"
        });

        const label = svgEl("text", {
            x: node.x,
            y: node.y,
            class: "node-val"
        });
        label.textContent = node.value;

        const idxText = svgEl("text", {
            x: node.x,
            y: node.y + 32,
            class: "node-idx"
        });
        idxText.textContent = `[${node.index}]`;

        g.appendChild(circle);
        g.appendChild(label);
        g.appendChild(idxText);

        if (node.index === 0) {
            const rootTag = svgEl("text", {
                x: node.x,
                y: node.y - 27,
                class: "node-tag"
            });
            rootTag.textContent = step.mode === "min" ? "MIN" : "MAX";
            g.appendChild(rootTag);
        }

        treeSvg.appendChild(g);
    });
}

function renderBackingArray(step) {
    if (!heapArrayBox) return;
    heapArrayBox.innerHTML = "";

    if (!step.heap || step.heap.length === 0) {
        const empty = document.createElement("span");
        empty.className = "tree-aux-empty";
        empty.textContent = "[ empty ]";
        heapArrayBox.appendChild(empty);
    } else {
        const swapSet = new Set(step.swapIndices || []);
        step.heap.forEach((val, idx) => {
            const cell = document.createElement("span");
            const cls = ["heap-array-cell"];
            if (swapSet.has(idx)) cls.push("is-swap");
            else if (step.newIdx === idx || step.foundIdx === idx) cls.push("is-new");
            else if (step.currentIdx === idx || step.compareIdx === idx) cls.push("is-current");
            else if (idx === 0) cls.push("is-root");

            cell.className = cls.join(" ");
            cell.innerHTML = `<span>${val}</span><small>[${idx}]</small>`;
            heapArrayBox.appendChild(cell);
        });
    }

    if (formulaBox) {
        formulaBox.innerHTML = "";
        const span = document.createElement("span");
        span.className = "tree-aux-empty";
        span.textContent = step.formula || "parent(i) = (i - 1) / 2 · left(i) = 2i + 1 · right(i) = 2i + 2";
        formulaBox.appendChild(span);
    }
}

function renderHistory(history) {
    if (!historyBox) return;
    historyBox.innerHTML = "";

    if (!history || history.length === 0) {
        const empty = document.createElement("p");
        empty.className = "history-empty";
        empty.textContent = "No operations yet.";
        historyBox.appendChild(empty);
        return;
    }

    const recent = history.slice(-10);
    recent.forEach((entry, index) => {
        const chip = document.createElement("span");
        chip.className = "array-value" + (index === recent.length - 1 ? " changed" : "");
        chip.textContent = entry;
        historyBox.appendChild(chip);
    });
}

function highlightCodeLine(lineNumber) {
    codeLines.forEach((line, index) => {
        const actualLine = Number(line.dataset.line || index + 1);
        line.classList.toggle("active", actualLine === lineNumber);
    });
}

function updateButtons() {
    const atEnd = currentStep >= steps.length - 1;

    if (startBtn) {
        startBtn.textContent = isPlaying ? "⏸ Pause" : "▶ Replay Operation";
        startBtn.disabled = steps.length <= 1;
    }
    if (stepBtn) stepBtn.disabled = isPlaying || atEnd;
    if (prevBtn) prevBtn.disabled = isPlaying || currentStep <= 0;

    if (extractBtn) {
        extractBtn.textContent = heapMode === "min" ? "Extract Min" : "Extract Max";
    }
    if (codePanelTag) {
        codePanelTag.textContent = heapMode === "min" ? "MinHeap.java" : "MaxHeap.java";
    }

    const lock = isPlaying;
    [
        heapModeSelect, valueInput, randomValueBtn, insertBtn, extractBtn,
        peekBtn, arrayInput, applyArrayBtn, randomHeapBtn, clearBtn,
        resetBtn, speedSelect
    ].forEach(ctrl => {
        if (ctrl) ctrl.disabled = lock;
    });
}

function renderStep(index) {
    if (index < 0 || index >= steps.length) return;

    currentStep = index;
    const step = steps[index];

    renderHeapSvg(step);
    renderBackingArray(step);
    renderHistory(step.history);
    highlightCodeLine(step.line);

    if (actionType) actionType.textContent = step.action;
    if (window.AlgoLab && AlgoLab.setChip) {
        AlgoLab.setChip(stepChip, step.type);
    }
    if (valuesInvolved) valuesInvolved.textContent = step.values;
    if (whyText) whyText.textContent = step.why;
    if (tipText) tipText.textContent = step.tip;
    if (message) message.textContent = step.message;
    if (currentAction) currentAction.classList.toggle("is-error", step.type === "error");

    const count = step.heap.length;
    const height = heapHeight(count);
    const rootVal = count > 0 ? step.heap[0] : "null";

    if (pointerInfo) {
        pointerInfo.textContent =
            `mode = ${step.mode === "min" ? "Min-Heap" : "Max-Heap"} · root = ${rootVal} · size = ${count} · height = ${height}` +
            (step.returned !== null ? ` · returned ${step.returned}` : "");
    }

    if (treeBadge) {
        treeBadge.className = "stack-badge " + (
            count >= MAX_NODES ? "is-full" : count === 0 ? "is-empty" : "is-ok"
        );
        treeBadge.textContent = count === 0
            ? `${step.mode === "min" ? "Min-Heap" : "Max-Heap"} · EMPTY`
            : `${step.mode === "min" ? "Min-Heap" : "Max-Heap"} · ${count} / ${MAX_NODES} nodes · height ${height}`;
    }

    if (returnBadge) {
        returnBadge.hidden = step.returned === null;
        returnBadge.textContent = step.returned === null ? "" : `Returned: ${step.returned}`;
    }

    if (statusTag) statusTag.textContent = index === 0 ? "Ready" : `Step ${index + 1} of ${steps.length}`;
    if (chartStep) chartStep.textContent = step.action;
    if (chartCaption) chartCaption.textContent = step.message;
    if (stepCounter) {
        stepCounter.textContent = `Step ${index + 1} of ${steps.length}`;
        if (window.AlgoLab && AlgoLab.setProgress) {
            AlgoLab.setProgress(stepCounter, index, steps.length);
        }
    }

    updateButtons();
}


// ==========================================
// ANIMATION & TIMELINE CONTROL
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

    const delay = window.AlgoLab && AlgoLab.interval
        ? AlgoLab.interval(animationSpeed)
        : animationSpeed;

    timer = setInterval(() => {
        if (currentStep < steps.length - 1) {
            renderStep(currentStep + 1);
        }
        if (currentStep >= steps.length - 1) {
            stopAnimation();
        }
    }, delay);
}

function runOperation(buildFn) {
    if (isPlaying) return;
    lastOpStart = steps.length;
    buildFn();
    renderStep(lastOpStart);

    if (autoToggle && autoToggle.checked) {
        startAnimation();
    }
}

function readNodeValue() {
    if (!valueInput) return null;
    const raw = valueInput.value.trim();
    if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 999) {
        if (window.AlgoLab && AlgoLab.showHint) {
            AlgoLab.showHint("Enter a whole number between 1 and 999.", true);
        }
        valueInput.focus();
        return null;
    }
    if (window.AlgoLab && AlgoLab.showHint) {
        AlgoLab.showHint(defaultHint(), false);
    }
    return Number(raw);
}

function suggestNextValue() {
    for (let i = 0; i < 40; i++) {
        const candidate = Math.floor(Math.random() * 90) + 10;
        if (!liveHeap.includes(candidate)) return candidate;
    }
    return 25;
}

function resetTimeline(rawValues) {
    stopAnimation();
    initialRawValues = [...rawValues];
    liveHeap = buildHeapSilent(initialRawValues, heapMode);
    if (arrayInput && initialRawValues.length > 0) {
        arrayInput.value = initialRawValues.join(", ");
    }
    opLog = [];
    steps = [];
    lastOpStart = 0;

    addStep({
        line: 1,
        type: "ready",
        action: `Ready (${modeTitle()})`,
        values: liveHeap.length > 0
            ? `Heap array: [${liveHeap.join(", ")}]`
            : "The heap is empty (size = 0).",
        why: `A ${modeTitle()} keeps the ${heapMode === "min" ? "smallest" : "largest"} value at index 0 so peek is O(1) and insert/extract are O(log n).`,
        message: `Choose a value to Insert, click ${heapMode === "min" ? "Extract Min" : "Extract Max"}, or Build Heap from an array.`,
        tip: "For index i: parent = (i - 1) / 2, left = 2i + 1, right = 2i + 2."
    });

    renderStep(0);
    if (window.AlgoLab && AlgoLab.showHint) {
        AlgoLab.showHint(defaultHint(), false);
    }
}

function loadCustomHeapArray() {
    if (isPlaying || !arrayInput) return;
    const parsed = window.AlgoLab && AlgoLab.parseArray
        ? AlgoLab.parseArray(arrayInput.value, { min: 1, max: MAX_NODES, minValue: 1, maxValue: 999 })
        : { values: [40, 20, 60, 10, 50, 30, 70] };

    if (parsed.error) {
        if (window.AlgoLab && AlgoLab.showHint) AlgoLab.showHint(parsed.error, true);
        arrayInput.focus();
        return;
    }

    initialRawValues = [...parsed.values];
    stopAnimation();
    opLog = [];
    steps = [];
    lastOpStart = 0;
    buildHeapOperation(initialRawValues);
    renderStep(0);
    if (autoToggle && autoToggle.checked) {
        startAnimation();
    }
}

function randomHeapValues() {
    const count = 6 + Math.floor(Math.random() * 4);
    const set = new Set();
    while (set.size < count) {
        set.add(Math.floor(Math.random() * 88) + 10);
    }
    return [...set];
}


// ==========================================
// EVENT LISTENERS
// ==========================================

if (heapModeSelect) {
    heapModeSelect.addEventListener("change", () => {
        if (isPlaying) return;
        heapMode = heapModeSelect.value === "max" ? "max" : "min";
        resetTimeline(liveHeap.length > 0 ? liveHeap : initialRawValues);
    });
}

if (insertBtn) {
    insertBtn.addEventListener("click", () => {
        const val = readNodeValue();
        if (val !== null) {
            runOperation(() => insertOperation(val));
            if (valueInput) valueInput.value = suggestNextValue();
        }
    });
}

if (extractBtn) {
    extractBtn.addEventListener("click", () => {
        runOperation(extractOperation);
    });
}

if (peekBtn) {
    peekBtn.addEventListener("click", () => {
        runOperation(peekOperation);
    });
}

if (randomValueBtn) {
    randomValueBtn.addEventListener("click", () => {
        if (!isPlaying && valueInput) {
            valueInput.value = suggestNextValue();
        }
    });
}

if (valueInput) {
    valueInput.addEventListener("keydown", e => {
        if (e.key === "Enter" && insertBtn) insertBtn.click();
    });
}

if (applyArrayBtn) {
    applyArrayBtn.addEventListener("click", loadCustomHeapArray);
}

if (arrayInput) {
    arrayInput.addEventListener("keydown", e => {
        if (e.key === "Enter") loadCustomHeapArray();
    });
}

if (randomHeapBtn) {
    randomHeapBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline(randomHeapValues());
    });
}

if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline([]);
    });
}

if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline(initialRawValues);
    });
}

if (speedSelect) {
    speedSelect.addEventListener("change", () => {
        animationSpeed = Number(speedSelect.value);
    });
}

if (stepBtn) {
    stepBtn.addEventListener("click", () => {
        if (!isPlaying && currentStep < steps.length - 1) {
            renderStep(currentStep + 1);
        }
    });
}

if (prevBtn) {
    prevBtn.addEventListener("click", () => {
        if (!isPlaying && currentStep > 0) {
            renderStep(currentStep - 1);
        }
    });
}

if (startBtn) {
    startBtn.addEventListener("click", () => {
        if (isPlaying) {
            stopAnimation();
            return;
        }
        if (currentStep >= steps.length - 1) {
            renderStep(lastOpStart);
        }
        startAnimation();
    });
}

// Initialize on load
resetTimeline(initialRawValues);
