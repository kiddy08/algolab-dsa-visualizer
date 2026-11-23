"use strict";

// ==========================================
// PURE TRIE LOGIC FUNCTIONS (Testable)
// ==========================================

const MAX_WORDS = 10;
const MAX_WORD_LEN = 7;

function createTrieNode(ch = "", prefix = "") {
    return {
        ch,
        prefix,
        isEndOfWord: false,
        children: {}
    };
}

function cloneTrie(node) {
    if (!node) return null;
    const copy = {
        ch: node.ch,
        prefix: node.prefix,
        isEndOfWord: Boolean(node.isEndOfWord),
        children: {}
    };
    Object.keys(node.children).sort().forEach(k => {
        copy.children[k] = cloneTrie(node.children[k]);
    });
    return copy;
}

function trieNodeCount(node) {
    if (!node) return 0;
    let total = 1;
    Object.keys(node.children).forEach(k => {
        total += trieNodeCount(node.children[k]);
    });
    return total;
}

function trieCollectWords(node, out = []) {
    if (!node) return out;
    if (node.isEndOfWord) out.push(node.prefix);
    Object.keys(node.children).sort().forEach(k => {
        trieCollectWords(node.children[k], out);
    });
    return out;
}

function trieInsertSilent(root, word) {
    let curr = root;
    const clean = String(word).toLowerCase().trim();
    if (!clean) return root;
    let built = "";
    for (const ch of clean) {
        built += ch;
        if (!curr.children[ch]) {
            curr.children[ch] = createTrieNode(ch, built);
        }
        curr = curr.children[ch];
    }
    curr.isEndOfWord = true;
    return root;
}

function trieFindNode(root, str) {
    let curr = root;
    for (const ch of str) {
        if (!curr.children[ch]) return null;
        curr = curr.children[ch];
    }
    return curr;
}

// Compute multi-way tree layout for SVG
function computeTrieLayout(root) {
    const nodes = [];
    const edges = [];
    if (!root) return { nodes, edges, width: 640, height: 270 };

    let leafCounter = 0;
    let maxDepth = 0;

    function assignPositions(node, depth, parentPrefix) {
        if (depth > maxDepth) maxDepth = depth;
        const keys = Object.keys(node.children).sort();
        const childPositions = [];

        if (keys.length === 0) {
            const xRank = leafCounter++;
            childPositions.push(xRank);
        } else {
            keys.forEach(k => {
                const childX = assignPositions(node.children[k], depth + 1, node.prefix);
                childPositions.push(childX);
            });
        }

        const avgX = childPositions.reduce((a, b) => a + b, 0) / childPositions.length;
        nodes.push({
            id: node.prefix || "ROOT",
            ch: node.ch || "•",
            prefix: node.prefix,
            isEndOfWord: node.isEndOfWord,
            depth,
            xRank: avgX,
            parentId: parentPrefix === null ? null : (parentPrefix || "ROOT")
        });

        return avgX;
    }

    assignPositions(root, 0, null);

    const totalLeaves = Math.max(1, leafCounter);
    const hGap = Math.max(58, Math.min(86, Math.floor(580 / totalLeaves)));
    const vGap = 54;
    const width = Math.max(640, (totalLeaves + 1) * hGap + 60);
    const height = Math.max(275, (maxDepth + 1) * vGap + 65);
    const startX = (width - (totalLeaves - 1) * hGap) / 2;

    const byId = new Map();
    nodes.forEach(n => {
        n.x = Math.round(startX + n.xRank * hGap);
        n.y = Math.round(36 + n.depth * vGap);
        byId.set(n.id, n);
    });

    nodes.forEach(n => {
        if (n.parentId !== null && byId.has(n.parentId)) {
            const p = byId.get(n.parentId);
            edges.push({
                from: p.id,
                to: n.id,
                x1: p.x,
                y1: p.y,
                x2: n.x,
                y2: n.y
            });
        }
    });

    return { nodes, edges, width, height };
}


// ==========================================
// DOM ELEMENTS & STATE
// ==========================================

const treeSvg = document.getElementById("treeSvg");
const wordsBox = document.getElementById("wordsBox");
const matchesBox = document.getElementById("matchesBox");
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

const wordInput = document.getElementById("wordInput");
const randomWordBtn = document.getElementById("randomWordBtn");
const insertBtn = document.getElementById("insertBtn");
const searchBtn = document.getElementById("searchBtn");
const prefixBtn = document.getElementById("prefixBtn");
const deleteBtn = document.getElementById("deleteBtn");
const presetAnimalsBtn = document.getElementById("presetAnimalsBtn");
const presetCodeBtn = document.getElementById("presetCodeBtn");
const clearBtn = document.getElementById("clearBtn");
const autoToggle = document.getElementById("autoToggle");
const speedSelect = document.getElementById("speedSelect");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");

const codeLines = document.querySelectorAll(".code-line");

let animationSpeed = 800;
let initialWords = ["cat", "car", "card", "care", "dog"];
let liveRoot = createTrieNode("", "");
let opLog = [];

// Top-level steps and currentStep for enhance.js compatibility
let steps = [];
let currentStep = 0;
let lastOpStart = 0;
let timer = null;
let isPlaying = false;

const WORD_SUGGESTIONS = ["cart", "cap", "dot", "door", "tree", "trie", "try", "cat", "car", "code", "algo", "lab"];

function defaultHint() {
    return `Enter 1–${MAX_WORD_LEN} letters (a–z, max ${MAX_WORDS} words). Nodes with a purple ring (★) mark the end of a stored word.`;
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
        tip: data.tip || "Time complexity is O(L) where L is the length of the word or prefix.",

        trie: cloneTrie(liveRoot),
        currentId: data.currentId ?? null,
        newIds: data.newIds ? [...data.newIds] : [],
        foundIds: data.foundIds ? [...data.foundIds] : [],
        deleteIds: data.deleteIds ? [...data.deleteIds] : [],
        pathEdges: data.pathEdges ? [...data.pathEdges] : [],
        matches: data.matches ? [...data.matches] : [],
        returned: data.returned ?? null,
        wordVar: data.wordVar ?? "–",
        chVar: data.chVar ?? "–",
        prefixVar: data.prefixVar ?? '""',
        history: [...opLog]
    });
}


// ==========================================
// TRIE OPERATIONS (Insert, Search, startsWith, Delete)
// ==========================================

function insertWordOperation(word) {
    const existingWords = trieCollectWords(liveRoot);

    addStep({
        line: 6,
        type: "call",
        action: `Call insert("${word}")`,
        values: `word = "${word}", length = ${word.length}`,
        why: "insert starts at the root and follows (or creates) one child edge per character in word.",
        message: `Start inserting "${word}" into the Trie.`,
        currentId: "ROOT",
        wordVar: word,
        prefixVar: '""'
    });

    if (existingWords.length >= MAX_WORDS && !existingWords.includes(word)) {
        opLog.push(`insert("${word}") → Limit`);
        addStep({
            line: 6,
            type: "error",
            action: "Word Limit Reached",
            values: `words = ${existingWords.length} / ${MAX_WORDS}`,
            why: `This visualizer caps stored words at ${MAX_WORDS} so the SVG tree remains readable.`,
            message: `Cannot insert "${word}": maximum of ${MAX_WORDS} words reached.`,
            wordVar: word
        });
        return;
    }

    let curr = liveRoot;
    let built = "";
    const edges = [];
    const createdIds = [];

    for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        const prevId = built || "ROOT";
        built += ch;
        const nextId = built;
        const exists = Boolean(curr.children[ch]);

        if (!exists) {
            curr.children[ch] = createTrieNode(ch, built);
            createdIds.push(nextId);
        }

        edges.push(`${prevId}->${nextId}`);
        curr = curr.children[ch];

        addStep({
            line: exists ? 10 : 9,
            type: exists ? "compare" : "store",
            action: exists
                ? `Char '${ch}' Exists → Move to "${built}"`
                : `Create New Node '${ch}' for "${built}"`,
            values: `char = '${ch}' (index ${i}), prefix = "${built}"`,
            why: exists
                ? `Child '${ch}' already exists under "${prevId === "ROOT" ? "" : prevId}", so we share the existing prefix node.`
                : `No '${ch}' child under "${prevId === "ROOT" ? "" : prevId}", so putIfAbsent creates a new TrieNode.`,
            message: exists
                ? `Followed existing edge '${ch}' to "${built}".`
                : `Created new node '${ch}' at prefix "${built}".`,
            currentId: nextId,
            newIds: createdIds,
            pathEdges: edges,
            wordVar: word,
            chVar: ch,
            prefixVar: `"${built}"`
        });
    }

    const alreadyWord = curr.isEndOfWord;
    curr.isEndOfWord = true;
    opLog.push(`insert("${word}")`);

    addStep({
        line: 12,
        type: "done",
        action: `Mark isEndOfWord = true at "${word}" ★`,
        values: `node = "${word}", isEndOfWord = true`,
        why: "Setting isEndOfWord = true marks that the path from root to this node is a complete stored word.",
        message: alreadyWord
            ? `"${word}" was already marked as a word (duplicate ignored).`
            : `Inserted "${word}"! Node '${word[word.length - 1]}' is now marked ★.`,
        foundIds: [built],
        newIds: createdIds,
        pathEdges: edges,
        returned: `"${word}"`,
        wordVar: word,
        prefixVar: `"${word}"`
    });
}

function searchWordOperation(word) {
    addStep({
        line: 15,
        type: "call",
        action: `Call search("${word}")`,
        values: `word = "${word}"`,
        why: "search walks character by character from root and checks if the final node has isEndOfWord == true.",
        message: `Start searching for exact word "${word}".`,
        currentId: "ROOT",
        wordVar: word,
        prefixVar: '""'
    });

    let curr = liveRoot;
    let built = "";
    const edges = [];

    for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        const prevId = built || "ROOT";

        if (!curr.children[ch]) {
            opLog.push(`search("${word}") → false`);
            addStep({
                line: 27,
                type: "error",
                action: `Missing Edge '${ch}' — Return false`,
                values: `prefix = "${built}", missing char = '${ch}'`,
                why: `curr.children does not contain '${ch}', so "${word}" is not in the Trie.`,
                message: `No child '${ch}' under "${built || "ROOT"}" — "${word}" not found.`,
                currentId: prevId,
                pathEdges: edges,
                returned: "false",
                wordVar: word,
                chVar: ch,
                prefixVar: `"${built}"`
            });
            return;
        }

        built += ch;
        edges.push(`${prevId}->${built}`);
        curr = curr.children[ch];

        addStep({
            line: 28,
            type: "compare",
            action: `Found Char '${ch}' → Advance to "${built}"`,
            values: `char = '${ch}', prefix = "${built}"`,
            why: `Edge '${ch}' exists, so advance pointer curr to child "${built}".`,
            message: `Matched '${ch}' (prefix "${built}").`,
            currentId: built,
            pathEdges: edges,
            wordVar: word,
            chVar: ch,
            prefixVar: `"${built}"`
        });
    }

    const ok = Boolean(curr.isEndOfWord);
    opLog.push(`search("${word}") → ${ok}`);

    addStep({
        line: 17,
        type: ok ? "done" : "error",
        action: ok ? `Word "${word}" Found (isEndOfWord == true)` : `"${word}" Is Only a Prefix (isEndOfWord == false)`,
        values: `node = "${built}", isEndOfWord = ${ok}`,
        why: ok
            ? "All characters matched and isEndOfWord is true, so the exact word exists in the Trie."
            : `The path "${word}" exists as a prefix of longer word(s), but "${word}" itself was never inserted.`,
        message: ok
            ? `search("${word}") returned true!`
            : `search("${word}") returned false (prefix exists, but not marked ★).`,
        foundIds: ok ? [built] : [],
        currentId: ok ? null : built,
        pathEdges: edges,
        matches: ok ? [word] : [],
        returned: String(ok),
        wordVar: word,
        prefixVar: `"${built}"`
    });
}

function startsWithOperation(prefix) {
    addStep({
        line: 20,
        type: "call",
        action: `Call startsWith("${prefix}")`,
        values: `prefix = "${prefix}"`,
        why: "startsWith checks whether the prefix path exists in the Trie (regardless of isEndOfWord) and can autocomplete all words under that subtree.",
        message: `Check prefix "${prefix}" from root.`,
        currentId: "ROOT",
        wordVar: prefix,
        prefixVar: '""'
    });

    let curr = liveRoot;
    let built = "";
    const edges = [];

    for (let i = 0; i < prefix.length; i++) {
        const ch = prefix[i];
        const prevId = built || "ROOT";

        if (!curr.children[ch]) {
            opLog.push(`startsWith("${prefix}") → false`);
            addStep({
                line: 27,
                type: "error",
                action: `Missing Edge '${ch}' — Prefix Not Found`,
                values: `stopped at "${built}", missing '${ch}'`,
                why: `No word in the Trie starts with "${prefix}" because edge '${ch}' is missing.`,
                message: `startsWith("${prefix}") returned false.`,
                currentId: prevId,
                pathEdges: edges,
                returned: "false",
                wordVar: prefix,
                chVar: ch,
                prefixVar: `"${built}"`
            });
            return;
        }

        built += ch;
        edges.push(`${prevId}->${built}`);
        curr = curr.children[ch];

        addStep({
            line: 28,
            type: "compare",
            action: `Matched '${ch}' → Advance to "${built}"`,
            values: `char = '${ch}', prefix = "${built}"`,
            why: "Follow the character edge down the Trie.",
            message: `Reached prefix node "${built}".`,
            currentId: built,
            pathEdges: edges,
            wordVar: prefix,
            chVar: ch,
            prefixVar: `"${built}"`
        });
    }

    const matchingWords = trieCollectWords(curr);
    opLog.push(`startsWith("${prefix}") → true (${matchingWords.length})`);

    addStep({
        line: 21,
        type: "done",
        action: `Prefix "${prefix}" Exists! (${matchingWords.length} Word${matchingWords.length === 1 ? "" : "s"} Matched)`,
        values: `matches = [${matchingWords.join(", ")}]`,
        why: "walkPrefix returned a non-null node. Every word in its subtree starts with this prefix.",
        message: `startsWith("${prefix}") returned true! Autocomplete: [${matchingWords.join(", ")}].`,
        foundIds: [built, ...matchingWords],
        pathEdges: edges,
        matches: matchingWords,
        returned: `true (${matchingWords.join(", ")})`,
        wordVar: prefix,
        prefixVar: `"${built}"`
    });
}

function deleteWordOperation(word) {
    addStep({
        line: 33,
        type: "call",
        action: `Call delete(root, "${word}", 0)`,
        values: `word = "${word}"`,
        why: "delete walks down to the end of the word, unmarks isEndOfWord, and prunes any nodes that are no longer part of another word.",
        message: `Start deleting "${word}" from the Trie.`,
        currentId: "ROOT",
        wordVar: word,
        prefixVar: '""'
    });

    const pathNodes = [liveRoot];
    const edges = [];
    let curr = liveRoot;
    let built = "";

    for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        const prevId = built || "ROOT";

        if (!curr.children[ch]) {
            opLog.push(`delete("${word}") → Not Found`);
            addStep({
                line: 41,
                type: "error",
                action: `"${word}" Not Found (Missing '${ch}')`,
                values: `missing char = '${ch}' at prefix "${built}"`,
                why: "next == null, so the word is not in the Trie and nothing is deleted.",
                message: `Cannot delete "${word}": not found in Trie.`,
                currentId: prevId,
                pathEdges: edges,
                returned: "false",
                wordVar: word,
                chVar: ch,
                prefixVar: `"${built}"`
            });
            return;
        }

        built += ch;
        edges.push(`${prevId}->${built}`);
        curr = curr.children[ch];
        pathNodes.push(curr);

        addStep({
            line: 40,
            type: "compare",
            action: `Walk Down '${ch}' to "${built}"`,
            values: `idx = ${i}, char = '${ch}', prefix = "${built}"`,
            why: "Descend to the target node before deciding which nodes can be safely pruned.",
            message: `Moved to "${built}".`,
            currentId: built,
            pathEdges: edges,
            wordVar: word,
            chVar: ch,
            prefixVar: `"${built}"`
        });
    }

    if (!curr.isEndOfWord) {
        opLog.push(`delete("${word}") → Prefix Only`);
        addStep({
            line: 35,
            type: "error",
            action: `"${word}" Is Only a Prefix (Not a Stored Word)`,
            values: `node = "${word}", isEndOfWord = false`,
            why: "curr.isEndOfWord is false, so this string was never inserted as a standalone word.",
            message: `"${word}" is a prefix of another word, not a stored word — nothing deleted.`,
            currentId: built,
            pathEdges: edges,
            returned: "false",
            wordVar: word,
            prefixVar: `"${built}"`
        });
        return;
    }

    curr.isEndOfWord = false;
    const hasChildren = Object.keys(curr.children).length > 0;

    addStep({
        line: 36,
        type: "shrink",
        action: `Unmark isEndOfWord at "${word}"`,
        values: `node = "${word}", isEndOfWord = false, children = ${Object.keys(curr.children).length}`,
        why: hasChildren
            ? `"${word}" has child nodes for longer words, so we only clear isEndOfWord and keep the node.`
            : `"${word}" has no children, so we can prune unused nodes going back up.`,
        message: hasChildren
            ? `Unmarked ★ on "${word}". Node stays because longer words share this prefix.`
            : `Unmarked ★ on "${word}". Now pruning unused leaf nodes upwards.`,
        deleteIds: [built],
        pathEdges: edges,
        wordVar: word,
        prefixVar: `"${built}"`
    });

    // Backtrack & prune nodes that have no children and !isEndOfWord
    for (let i = word.length - 1; i >= 0; i--) {
        const childNode = pathNodes[i + 1];
        const parentNode = pathNodes[i];
        const ch = word[i];
        const canPrune = !childNode.isEndOfWord && Object.keys(childNode.children).length === 0;

        if (!canPrune) break;

        delete parentNode.children[ch];

        addStep({
            line: 43,
            type: "shrink",
            action: `Prune Unused Node '${ch}' ("${childNode.prefix}")`,
            values: `removed '${ch}' from "${parentNode.prefix || "ROOT"}"`,
            why: `Node "${childNode.prefix}" has no children and isEndOfWord is false, so it is removed from its parent.`,
            message: `Pruned unused node '${ch}' ("${childNode.prefix}").`,
            currentId: parentNode.prefix || "ROOT",
            wordVar: word,
            chVar: ch,
            prefixVar: `"${parentNode.prefix}"`
        });
    }

    opLog.push(`delete("${word}")`);
    addStep({
        line: 46,
        type: "done",
        action: `delete("${word}") Finished`,
        values: `remaining words = [${trieCollectWords(liveRoot).join(", ")}]`,
        why: "Word removed and all shared prefixes for other words remain intact.",
        message: `Deleted "${word}" from the Trie.`,
        returned: `deleted "${word}"`,
        wordVar: word
    });
}


// ==========================================
// SVG TRIE RENDERER
// ==========================================

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
}

function renderTrieSvg(step) {
    if (!treeSvg) return;
    treeSvg.innerHTML = "";

    const layout = computeTrieLayout(step.trie);
    treeSvg.setAttribute("width", String(layout.width));
    treeSvg.setAttribute("height", String(layout.height));
    treeSvg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);

    const pathSet = new Set(step.pathEdges || []);
    const newSet = new Set(step.newIds || []);
    const foundSet = new Set(step.foundIds || []);
    const delSet = new Set(step.deleteIds || []);

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
        if (foundSet.has(node.id)) classes.push("is-found");
        else if (delSet.has(node.id)) classes.push("is-delete");
        else if (step.currentId === node.id) classes.push("is-current");
        else if (newSet.has(node.id)) classes.push("is-new");
        else if (node.isEndOfWord) classes.push("is-waiting");

        const g = svgEl("g", {
            class: classes.join(" "),
            "data-id": node.id
        });

        const circle = svgEl("circle", {
            cx: node.x,
            cy: node.y,
            r: 19,
            class: "main-circle"
        });
        g.appendChild(circle);

        if (node.isEndOfWord) {
            const ring = svgEl("circle", {
                cx: node.x,
                cy: node.y,
                r: 23,
                class: "eow-ring"
            });
            g.appendChild(ring);
        }

        const label = svgEl("text", {
            x: node.x,
            y: node.y,
            class: "node-val"
        });
        label.textContent = node.id === "ROOT" ? "•" : node.ch;
        g.appendChild(label);

        if (node.id === "ROOT") {
            const rootTag = svgEl("text", {
                x: node.x,
                y: node.y - 25,
                class: "node-tag"
            });
            rootTag.textContent = "ROOT";
            g.appendChild(rootTag);
        } else if (node.isEndOfWord) {
            const wordTag = svgEl("text", {
                x: node.x,
                y: node.y + 31,
                class: "node-word"
            });
            wordTag.textContent = `★ ${node.prefix}`;
            g.appendChild(wordTag);
        }

        treeSvg.appendChild(g);
    });
}

function renderAuxStrip(step) {
    if (wordsBox) {
        wordsBox.innerHTML = "";
        const words = trieCollectWords(step.trie);
        if (words.length === 0) {
            const span = document.createElement("span");
            span.className = "tree-aux-empty";
            span.textContent = "No words stored.";
            wordsBox.appendChild(span);
        } else {
            const foundSet = new Set(step.foundIds || []);
            words.forEach(w => {
                const chip = document.createElement("span");
                chip.className = "array-value" + (foundSet.has(w) ? " changed" : "");
                chip.textContent = w;
                wordsBox.appendChild(chip);
            });
        }
    }

    if (matchesBox) {
        matchesBox.innerHTML = "";
        if (!step.matches || step.matches.length === 0) {
            const span = document.createElement("span");
            span.className = "tree-aux-empty";
            span.textContent = "–";
            matchesBox.appendChild(span);
        } else {
            step.matches.forEach(m => {
                const chip = document.createElement("span");
                chip.className = "array-value changed";
                chip.textContent = m;
                matchesBox.appendChild(chip);
            });
        }
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

    const lock = isPlaying;
    [
        wordInput, randomWordBtn, insertBtn, searchBtn, prefixBtn,
        deleteBtn, presetAnimalsBtn, presetCodeBtn, clearBtn,
        resetBtn, speedSelect
    ].forEach(ctrl => {
        if (ctrl) ctrl.disabled = lock;
    });
}

function renderStep(index) {
    if (index < 0 || index >= steps.length) return;

    currentStep = index;
    const step = steps[index];

    renderTrieSvg(step);
    renderAuxStrip(step);
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

    const words = trieCollectWords(step.trie);
    const nodes = trieNodeCount(step.trie);

    if (pointerInfo) {
        pointerInfo.textContent =
            `prefix = ${step.prefixVar} · words = ${words.length} · nodes = ${nodes}` +
            (step.returned !== null ? ` · returned ${step.returned}` : "");
    }

    if (treeBadge) {
        treeBadge.className = "stack-badge " + (
            words.length >= MAX_WORDS ? "is-full" : words.length === 0 ? "is-empty" : "is-ok"
        );
        treeBadge.textContent = words.length === 0
            ? "EMPTY (0 words)"
            : `${words.length} / ${MAX_WORDS} words · ${nodes} nodes`;
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

function readWordInput() {
    if (!wordInput) return null;
    const raw = wordInput.value.trim().toLowerCase();
    if (!/^[a-z]{1,7}$/.test(raw)) {
        if (window.AlgoLab && AlgoLab.showHint) {
            AlgoLab.showHint(`Enter 1 to ${MAX_WORD_LEN} lowercase letters (a–z only).`, true);
        }
        wordInput.focus();
        return null;
    }
    if (window.AlgoLab && AlgoLab.showHint) {
        AlgoLab.showHint(defaultHint(), false);
    }
    wordInput.value = raw;
    return raw;
}

function suggestNextWord() {
    const current = new Set(trieCollectWords(liveRoot));
    for (const w of WORD_SUGGESTIONS) {
        if (!current.has(w)) return w;
    }
    return "care";
}

function resetTimeline(words) {
    stopAnimation();
    initialWords = [...words];
    liveRoot = createTrieNode("", "");
    initialWords.slice(0, MAX_WORDS).forEach(w => trieInsertSilent(liveRoot, w));
    opLog = [];
    steps = [];
    lastOpStart = 0;

    const stored = trieCollectWords(liveRoot);

    addStep({
        line: 1,
        type: "ready",
        action: "Ready to Start",
        values: stored.length > 0
            ? `Stored words: [${stored.join(", ")}]`
            : "The Trie is empty (only root node exists).",
        why: "A Trie stores words character-by-character so words with common prefixes share the same upper path.",
        message: "Enter a word or prefix above and click Insert, Search, startsWith, or Delete.",
        tip: "Insert, Search, startsWith and Delete all run in O(L) time where L is the word length."
    });

    renderStep(0);
    if (window.AlgoLab && AlgoLab.showHint) {
        AlgoLab.showHint(defaultHint(), false);
    }
}


// ==========================================
// EVENT LISTENERS
// ==========================================

if (insertBtn) {
    insertBtn.addEventListener("click", () => {
        const w = readWordInput();
        if (w !== null) {
            runOperation(() => insertWordOperation(w));
            if (wordInput) wordInput.value = suggestNextWord();
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        const w = readWordInput();
        if (w !== null) runOperation(() => searchWordOperation(w));
    });
}

if (prefixBtn) {
    prefixBtn.addEventListener("click", () => {
        const w = readWordInput();
        if (w !== null) runOperation(() => startsWithOperation(w));
    });
}

if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
        const w = readWordInput();
        if (w !== null) runOperation(() => deleteWordOperation(w));
    });
}

if (randomWordBtn) {
    randomWordBtn.addEventListener("click", () => {
        if (!isPlaying && wordInput) {
            wordInput.value = WORD_SUGGESTIONS[Math.floor(Math.random() * WORD_SUGGESTIONS.length)];
        }
    });
}

if (wordInput) {
    wordInput.addEventListener("keydown", e => {
        if (e.key === "Enter" && insertBtn) insertBtn.click();
    });
}

if (presetAnimalsBtn) {
    presetAnimalsBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline(["cat", "car", "card", "care", "dog", "dot"]);
    });
}

if (presetCodeBtn) {
    presetCodeBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline(["try", "trie", "tree", "algo", "lab"]);
    });
}

if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline([]);
    });
}

if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline(initialWords);
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
resetTimeline(initialWords);
