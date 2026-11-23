"use strict";

// ==========================================
// GRAPH VISUALIZER CONTROLLER (AlgoLab)
// ==========================================

const Model = window.AlgoLabGraphModel;
const Algos = window.AlgoLabGraphAlgorithms;
const RendererMod = window.AlgoLabGraphRenderer;

// DOM References
const graphSvg = document.getElementById("graphSvg");
const javaCodeContainer = document.getElementById("javaCodeContainer");
const codeFileName = document.getElementById("codeFileName");
const difficultyBadge = document.getElementById("difficultyBadge");
const timeBadge = document.getElementById("timeBadge");
const spaceBadge = document.getElementById("spaceBadge");

const algoSelect = document.getElementById("algoSelect");
const presetSelect = document.getElementById("presetSelect");
const sourceSelect = document.getElementById("sourceSelect");
const destSelect = document.getElementById("destSelect");
const destField = document.getElementById("destField");
const heuristicField = document.getElementById("heuristicField");
const heuristicSelect = document.getElementById("heuristicSelect");
const runAlgoBtn = document.getElementById("runAlgoBtn");

const directedToggle = document.getElementById("directedToggle");
const weightedToggle = document.getElementById("weightedToggle");
const connectModeBtn = document.getElementById("connectModeBtn");
const weightField = document.getElementById("weightField");
const edgeWeightInput = document.getElementById("edgeWeightInput");
const renameNodeBtn = document.getElementById("renameNodeBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");

const edgeEditorBtn = document.getElementById("edgeEditorBtn");
const edgeEditorDrawer = document.getElementById("edgeEditorDrawer");
const closeEditorBtn = document.getElementById("closeEditorBtn");
const edgeListTextarea = document.getElementById("edgeListTextarea");
const editorErrorText = document.getElementById("editorErrorText");
const applyEdgeListBtn = document.getElementById("applyEdgeListBtn");

const challengeBtn = document.getElementById("challengeBtn");
const randomGraphBtn = document.getElementById("randomGraphBtn");
const clearGraphBtn = document.getElementById("clearGraphBtn");
const autoToggle = document.getElementById("autoToggle");
const speedSelect = document.getElementById("speedSelect");

const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const resetViewBtn = document.getElementById("resetViewBtn");

const statusTag = document.getElementById("status");
const chartStep = document.getElementById("chartStep");
const graphPropsBadge = document.getElementById("graphPropsBadge");
const returnBadge = document.getElementById("returnBadge");
const dsPrimaryLabel = document.getElementById("dsPrimaryLabel");
const dsPrimaryBox = document.getElementById("dsPrimaryBox");
const dsSecondaryLabel = document.getElementById("dsSecondaryLabel");
const dsSecondaryBox = document.getElementById("dsSecondaryBox");
const dsTableWrap = document.getElementById("dsTableWrap");
const chartCaption = document.getElementById("chartCaption");
const pointerInfo = document.getElementById("pointerInfo");

const currentAction = document.getElementById("currentAction");
const stepChip = document.getElementById("stepChip");
const actionType = document.getElementById("actionType");
const message = document.getElementById("message");
const whyText = document.getElementById("whyText");
const selectedEdgeText = document.getElementById("selectedEdgeText");
const nextStepText = document.getElementById("nextStepText");
const dsStateText = document.getElementById("dsStateText");
const statsGrid = document.getElementById("statsGrid");
const stepCounter = document.getElementById("stepCounter");

const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

// Application State
let graph = Model.getPreset("weighted");
let baselineGraph = Model.cloneGraph(graph);
let currentAlgo = "bfs";
let connectMode = false;
let pendingEdgeFrom = null;
let selectedNodeId = null;
let selectedEdgeId = null;

// Top-level steps and currentStep for enhance.js integration
let steps = [];
let currentStep = 0;
let timer = null;
let isPlaying = false;
let animationSpeed = 800;
let rafPending = false;

// ==========================================
// SAFE JAVA SYNTAX HIGHLIGHTER (DOM-based, no innerHTML injection)
// ==========================================

const JAVA_KEYWORDS = new Set([
    "void", "int", "double", "boolean", "for", "while", "if", "else",
    "return", "new", "continue", "break", "class", "public", "private"
]);

const JAVA_TYPES = new Set([
    "List", "ArrayList", "Set", "HashSet", "Queue", "LinkedList",
    "Deque", "ArrayDeque", "Map", "HashMap", "PriorityQueue",
    "String", "Edge", "NodeDist", "NodeF", "Comparator", "Collections"
]);

function renderJavaCode(algoId) {
    const spec = Algos.JAVA_CODE[algoId] || Algos.JAVA_CODE.bfs;
    if (codeFileName) codeFileName.textContent = spec.filename;
    if (difficultyBadge) difficultyBadge.innerHTML = `Difficulty: <strong>${spec.difficulty}</strong>`;
    if (timeBadge) timeBadge.innerHTML = `Time: <strong>${spec.timeComplexity}</strong>`;
    if (spaceBadge) spaceBadge.innerHTML = `Space: <strong>${spec.spaceComplexity}</strong>`;

    javaCodeContainer.innerHTML = "";

    spec.lines.forEach((rawLine, idx) => {
        const lineSpan = document.createElement("span");
        lineSpan.className = "code-line";
        lineSpan.dataset.line = String(idx + 1);

        const commentIdx = rawLine.indexOf("//");
        const codePart = commentIdx >= 0 ? rawLine.slice(0, commentIdx) : rawLine;
        const commentPart = commentIdx >= 0 ? rawLine.slice(commentIdx) : "";

        // Tokenize codePart safely
        const tokens = codePart.split(/(\b[A-Za-z_][A-Za-z0-9_]*\b|\b\d+(?:\.\d+)?\b|"[^"]*")/g);
        tokens.forEach(tok => {
            if (!tok) return;
            if (JAVA_KEYWORDS.has(tok)) {
                const s = document.createElement("span");
                s.className = "tok-kw";
                s.textContent = tok;
                lineSpan.appendChild(s);
            } else if (JAVA_TYPES.has(tok)) {
                const s = document.createElement("span");
                s.className = "tok-type";
                s.textContent = tok;
                lineSpan.appendChild(s);
            } else if (/^\d+(?:\.\d+)?$/.test(tok)) {
                const s = document.createElement("span");
                s.className = "tok-num";
                s.textContent = tok;
                lineSpan.appendChild(s);
            } else if (tok.startsWith('"') && tok.endsWith('"')) {
                const s = document.createElement("span");
                s.className = "tok-str";
                s.textContent = tok;
                lineSpan.appendChild(s);
            } else {
                lineSpan.appendChild(document.createTextNode(tok));
            }
        });

        if (commentPart) {
            const cSpan = document.createElement("span");
            cSpan.className = "tok-com";
            cSpan.textContent = commentPart;
            lineSpan.appendChild(cSpan);
        }

        javaCodeContainer.appendChild(lineSpan);
    });
}

function highlightCodeLine(lineNumber) {
    const lines = javaCodeContainer.querySelectorAll(".code-line");
    lines.forEach((el, idx) => {
        const num = Number(el.dataset.line || idx + 1);
        el.classList.toggle("active", num === lineNumber);
    });
}

// ==========================================
// SVG RENDERER INSTANCE
// ==========================================

function scheduleRender() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
        rafPending = false;
        const step = steps[currentStep] || null;
        svgRenderer.render(graph, step, {
            sourceId: sourceSelect ? sourceSelect.value : null,
            destId: destSelect ? destSelect.value : null,
            selectedNodeId,
            selectedEdgeId,
            pendingEdgeFrom
        });
    });
}


// Undo History Stack
let undoStack = [];
const MAX_UNDO = 15;

function pushUndoSnapshot() {
    undoStack.push(Model.cloneGraph(graph));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
}

const undoBtn = document.createElement("button");
undoBtn.className = "btn ghost";
undoBtn.id = "undoGraphBtn";
undoBtn.title = "Undo last graph modification";
undoBtn.textContent = "Undo";
if (clearGraphBtn && clearGraphBtn.parentNode) {
    clearGraphBtn.parentNode.insertBefore(undoBtn, clearGraphBtn);
}

undoBtn.addEventListener("click", () => {
    if (isPlaying || undoStack.length === 0) return;
    graph = undoStack.pop();
    baselineGraph = Model.cloneGraph(graph);
    selectedNodeId = null;
    selectedEdgeId = null;
    pendingEdgeFrom = null;
    onGraphMutated();
    showHint("Undid last graph change.", false);
});


const svgRenderer = RendererMod.createGraphRenderer(graphSvg, {
    onViewChange: scheduleRender,
    onCanvasClick: (x, y) => {
        if (isPlaying) return;
        selectedNodeId = null;
        selectedEdgeId = null;
        pendingEdgeFrom = null;
        updateConnectButtonUI();

        pushUndoSnapshot();
        const res = Model.addNode(graph, { x, y });
        if (!res.ok) {
            showHint(res.error, true);
            return;
        }
        showHint("", false);
        onGraphMutated();
    },
    onNodeClick: nodeId => {
        if (isPlaying) return;
        if (connectMode) {
            if (!pendingEdgeFrom) {
                pendingEdgeFrom = nodeId;
                selectedNodeId = nodeId;
                selectedEdgeId = null;
                showHint(`Selected "${nodeId}". Now click a second node to connect.`, false);
                scheduleRender();
            } else if (pendingEdgeFrom === nodeId) {
                pendingEdgeFrom = null;
                showHint("Cancelled edge connection.", false);
                scheduleRender();
            } else {
                const w = Number(edgeWeightInput ? edgeWeightInput.value : 1);
                pushUndoSnapshot();
                const res = Model.addEdge(graph, pendingEdgeFrom, nodeId, w);
                pendingEdgeFrom = null;
                if (!res.ok) {
                    showHint(res.error, true);
                    scheduleRender();
                    return;
                }
                showHint("", false);
                onGraphMutated();
            }
            return;
        }

        selectedNodeId = selectedNodeId === nodeId ? null : nodeId;
        selectedEdgeId = null;
        scheduleRender();
    },
    onNodeDrag: (nodeId, x, y) => {
        if (isPlaying) return;
        const node = graph.nodes.find(n => n.id === nodeId);
        if (node) {
            node.x = x;
            node.y = y;
            scheduleRender();
        }
    },
    onEdgeClick: edgeId => {
        if (isPlaying) return;
        selectedEdgeId = selectedEdgeId === edgeId ? null : edgeId;
        selectedNodeId = null;
        pendingEdgeFrom = null;
        scheduleRender();
    }
});

// ==========================================
// UI SYNC & GRAPH PROPERTIES
// ==========================================

function showHint(text, isError) {
    if (window.AlgoLab && AlgoLab.showHint) {
        AlgoLab.showHint(text, isError);
    }
}

function updateConnectButtonUI() {
    if (!connectModeBtn) return;
    connectModeBtn.classList.toggle("primary", connectMode);
    connectModeBtn.classList.toggle("ghost", !connectMode);
    connectModeBtn.textContent = connectMode ? "Connecting..." : "Connect Nodes";
}

function syncNodeSelectors() {
    const prevSrc = sourceSelect.value;
    const prevDest = destSelect.value;

    sourceSelect.innerHTML = "";
    destSelect.innerHTML = "";

    graph.nodes.forEach(n => {
        const opt1 = document.createElement("option");
        opt1.value = n.id;
        opt1.textContent = n.label;
        sourceSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = n.id;
        opt2.textContent = n.label;
        destSelect.appendChild(opt2);
    });

    if (graph.nodes.some(n => n.id === prevSrc)) {
        sourceSelect.value = prevSrc;
    } else if (graph.nodes.length > 0) {
        sourceSelect.value = graph.nodes[0].id;
    }

    if (graph.nodes.some(n => n.id === prevDest)) {
        destSelect.value = prevDest;
    } else if (graph.nodes.length > 1) {
        destSelect.value = graph.nodes[graph.nodes.length - 1].id;
    } else if (graph.nodes.length === 1) {
        destSelect.value = graph.nodes[0].id;
    }
}

function updateGraphPropsBadge() {
    const info = Model.analyzeGraph(graph);
    const dirLabel = graph.directed ? "Directed" : "Undirected";
    const wLabel = graph.weighted ? "Weighted" : "Unweighted";
    const connLabel = info.nodeCount === 0 ? "Empty" : info.connected ? "Connected" : `Disconnected (${info.components})`;
    const cycLabel = info.cyclic ? "Cyclic" : "Acyclic";
    graphPropsBadge.textContent = `${info.nodeCount} nodes · ${info.edgeCount} edges · ${dirLabel} · ${wLabel} · ${connLabel} · ${cycLabel}`;

    directedToggle.checked = graph.directed;
    weightedToggle.checked = graph.weighted;
    weightField.hidden = !graph.weighted;
}

function syncAlgorithmControls() {
    const algoSpec = Algos.ALGORITHM_REGISTRY[currentAlgo] || Algos.ALGORITHM_REGISTRY.bfs;
    destField.hidden = !algoSpec.requiresDestination;
    heuristicField.hidden = currentAlgo !== "astar";
    renderJavaCode(currentAlgo);
}

function onGraphMutated() {
    syncNodeSelectors();
    updateGraphPropsBadge();
    if (edgeListTextarea && !edgeEditorDrawer.hidden) {
        edgeListTextarea.value = Model.formatEdgeList(graph);
    }
    buildAlgorithmSteps();
}

// ==========================================
// DATA STRUCTURE & STATISTICS RENDERING
// ==========================================

function renderChips(container, items, emptyText, highlightLast = false) {
    container.innerHTML = "";
    if (!items || items.length === 0) {
        const span = document.createElement("span");
        span.className = "tree-aux-empty";
        span.textContent = emptyText;
        container.appendChild(span);
        return;
    }
    items.forEach((item, idx) => {
        const chip = document.createElement("span");
        chip.className = "array-value" + (highlightLast && idx === items.length - 1 ? " changed" : "");
        chip.textContent = item;
        container.appendChild(chip);
    });
}

function renderDataStructures(step) {
    dsTableWrap.innerHTML = "";

    if (!step) {
        dsPrimaryLabel.textContent = "Queue:";
        renderChips(dsPrimaryBox, [], "empty");
        dsSecondaryLabel.textContent = "Visited Set:";
        renderChips(dsSecondaryBox, [], "empty");
        return;
    }

    if (step.dsKind === "bfs") {
        dsPrimaryLabel.textContent = "Queue:";
        renderChips(dsPrimaryBox, step.queue, "empty");
        dsSecondaryLabel.textContent = "Visited Set:";
        renderChips(dsSecondaryBox, step.visitedSet, "empty", true);
    } else if (step.dsKind === "dfs") {
        dsPrimaryLabel.textContent = "Stack:";
        renderChips(dsPrimaryBox, step.stack, "empty", true);
        dsSecondaryLabel.textContent = "Visited Set:";
        renderChips(dsSecondaryBox, step.visitedSet, "empty", true);
    } else if (step.dsKind === "dfs_rec") {
        dsPrimaryLabel.textContent = "Call Stack:";
        renderChips(dsPrimaryBox, step.stack, "empty", true);
        dsSecondaryLabel.textContent = "Visited Set:";
        renderChips(dsSecondaryBox, step.visitedSet, "empty", true);
    } else if (step.dsKind === "dijkstra") {
        dsPrimaryLabel.textContent = "Priority Queue:";
        const pqLabels = step.pqItems.map(x => `${x.node}:${x.dist}`);
        renderChips(dsPrimaryBox, pqLabels, "empty");
        dsSecondaryLabel.textContent = "Settled Set:";
        renderChips(dsSecondaryBox, step.visitedSet, "empty", true);

        if (step.distances) {
            const keys = Object.keys(step.distances).sort();
            const table = document.createElement("table");
            table.className = "graph-mini-table";
            const trHead = document.createElement("tr");
            const th0 = document.createElement("th");
            th0.textContent = "Node";
            trHead.appendChild(th0);
            keys.forEach(k => {
                const th = document.createElement("th");
                th.textContent = k;
                trHead.appendChild(th);
            });
            table.appendChild(trHead);

            const trDist = document.createElement("tr");
            const tdD0 = document.createElement("td");
            tdD0.textContent = "dist[]";
            trDist.appendChild(tdD0);
            keys.forEach(k => {
                const td = document.createElement("td");
                const v = step.distances[k];
                td.textContent = v === Infinity ? "∞" : String(v);
                trDist.appendChild(td);
            });
            table.appendChild(trDist);

            if (step.prevMap) {
                const trPrev = document.createElement("tr");
                const tdP0 = document.createElement("td");
                tdP0.textContent = "prev[]";
                trPrev.appendChild(tdP0);
                keys.forEach(k => {
                    const td = document.createElement("td");
                    td.textContent = step.prevMap[k] || "–";
                    trPrev.appendChild(td);
                });
                table.appendChild(trPrev);
            }

            dsTableWrap.appendChild(table);
        }
    } else if (step.dsKind === "astar") {
        dsPrimaryLabel.textContent = "Closed Set:";
        renderChips(dsPrimaryBox, step.closedSet, "empty", true);
        dsSecondaryLabel.textContent = "Open Set:";
        const openNodes = step.astarRows.filter(r => r.status === "Open").map(r => `${r.node}(f=${r.f})`);
        renderChips(dsSecondaryBox, openNodes, "empty");

        if (step.astarRows && step.astarRows.length > 0) {
            const table = document.createElement("table");
            table.className = "graph-mini-table";
            const trHead = document.createElement("tr");
            ["Node", "g(n)", "h(n)", "f(n)", "State"].forEach(h => {
                const th = document.createElement("th");
                th.textContent = h;
                trHead.appendChild(th);
            });
            table.appendChild(trHead);

            step.astarRows.forEach(r => {
                const tr = document.createElement("tr");
                [
                    r.node,
                    r.g === Infinity ? "∞" : String(r.g),
                    String(r.h),
                    r.f === Infinity ? "∞" : String(r.f),
                    r.status
                ].forEach(val => {
                    const td = document.createElement("td");
                    td.textContent = val;
                    tr.appendChild(td);
                });
                table.appendChild(tr);
            });
            dsTableWrap.appendChild(table);
        }
    }
}

function renderStatsGrid(step) {
    if (!statsGrid) return;
    statsGrid.innerHTML = "";
    const s = (step && step.stats) || {
        nodesVisited: 0,
        edgesExplored: 0,
        relaxations: 0,
        dsOps: 0,
        pathLength: "–",
        totalCost: "–",
        timeComplexity: Algos.JAVA_CODE[currentAlgo].timeComplexity,
        spaceComplexity: Algos.JAVA_CODE[currentAlgo].spaceComplexity
    };

    const rows = [
        ["Nodes visited", s.nodesVisited],
        ["Edges explored", s.edgesExplored],
        ["Relaxations", s.relaxations],
        ["DS operations", s.dsOps],
        ["Path length", s.pathLength],
        ["Total cost", s.totalCost],
        ["Theoretical Time", s.timeComplexity],
        ["Theoretical Space", s.spaceComplexity]
    ];

    rows.forEach(([label, val]) => {
        const pill = document.createElement("div");
        pill.className = "graph-stat-pill";
        const sp = document.createElement("span");
        sp.textContent = label;
        const st = document.createElement("strong");
        st.textContent = String(val);
        pill.append(sp, st);
        statsGrid.appendChild(pill);
    });
}

// ==========================================
// STEP EXECUTION & TIMELINE SYNC
// ==========================================

function buildAlgorithmSteps() {
    stopAnimation();
    const source = sourceSelect ? sourceSelect.value : null;
    const dest = destSelect ? destSelect.value : null;
    const heuristicMode = heuristicSelect ? heuristicSelect.value : "euclidean";

    steps = Algos.executeAlgorithm(currentAlgo, graph, {
        source,
        dest,
        heuristicMode
    });
    currentStep = 0;
    renderStep(0);
}

function renderStep(index) {
    if (!steps || steps.length === 0) return;
    if (index < 0 || index >= steps.length) return;

    currentStep = index;
    const step = steps[index];

    highlightCodeLine(step.line);
    renderDataStructures(step);
    renderStatsGrid(step);

    if (actionType) actionType.textContent = step.action;
    if (window.AlgoLab && AlgoLab.setChip) {
        AlgoLab.setChip(stepChip, step.type);
    }
    if (message) message.textContent = step.what;
    if (whyText) whyText.textContent = step.why;
    if (selectedEdgeText) selectedEdgeText.textContent = `Selected: ${step.selectedInfo}`;
    if (nextStepText) nextStepText.textContent = `Next: ${step.nextInfo}`;
    if (dsStateText) dsStateText.textContent = step.dsSummary;
    if (currentAction) currentAction.classList.toggle("is-error", step.isError);

    if (returnBadge) {
        const showResult = step.type === "done" || step.isError;
        returnBadge.hidden = !showResult;
        returnBadge.textContent = showResult ? step.action : "";
    }

    if (statusTag) statusTag.textContent = `Step ${index + 1} of ${steps.length}`;
    if (chartStep) chartStep.textContent = step.action;
    if (chartCaption) chartCaption.textContent = step.what;
    if (pointerInfo) {
        pointerInfo.textContent = `start = ${step.source || "–"}${step.dest ? ` · goal = ${step.dest}` : ""} · visited = ${step.visitedNodes.length}`;
    }
    if (stepCounter) {
        stepCounter.textContent = `Step ${index + 1} of ${steps.length}`;
        if (window.AlgoLab && AlgoLab.setProgress) {
            AlgoLab.setProgress(stepCounter, index, steps.length);
        }
    }

    updateButtons();
    scheduleRender();
}

function updateButtons() {
    const atEnd = currentStep >= steps.length - 1;
    if (startBtn) {
        startBtn.textContent = isPlaying ? "⏸ Pause" : "▶ Replay";
        startBtn.disabled = steps.length <= 1;
    }
    if (stepBtn) stepBtn.disabled = isPlaying || atEnd;
    if (prevBtn) prevBtn.disabled = isPlaying || currentStep <= 0;

    const lock = isPlaying;
    [
        algoSelect, presetSelect, sourceSelect, destSelect, heuristicSelect,
        runAlgoBtn, directedToggle, weightedToggle, connectModeBtn,
        edgeWeightInput, renameNodeBtn, deleteSelectedBtn, edgeEditorBtn,
        challengeBtn, randomGraphBtn, clearGraphBtn, resetBtn, speedSelect
    ].forEach(ctrl => {
        if (ctrl) ctrl.disabled = lock;
    });
}

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

// ==========================================
// INTERACTIVE CHALLENGES MODAL
// ==========================================

function openChallengeModal() {
    const challenges = [
        {
            title: "Challenge 1: Shortest Path in Weighted Graph",
            prompt: "On the Weighted Graph preset (A to F), what is the shortest path cost using Dijkstra's Algorithm?",
            options: ["13 (A → C → B → D → E → F)", "15 (A → B → D → F)", "16 (A → B → C → E → F)"],
            correctIdx: 0,
            explanation: "A→C (2) + C→B (1) + B→D (5) + D→E (2) + E→F (3) = 13, which beats A→B→D→F (15)."
        },
        {
            title: "Challenge 2: BFS vs DFS Traversal Order",
            prompt: "In Breadth-First Search (BFS), which data structure guarantees nodes are visited level by level?",
            options: ["FIFO Queue", "LIFO Stack", "Max-Heap"],
            correctIdx: 0,
            explanation: "A First-In, First-Out (FIFO) Queue processes all neighbors at distance d before any node at distance d + 1."
        },
        {
            title: "Challenge 3: A* Search Evaluation Function",
            prompt: "How does A* Search choose the next vertex to expand from the Open Set?",
            options: ["Lowest f(n) = g(n) + h(n)", "Lowest heuristic h(n) only", "Highest edge weight"],
            correctIdx: 0,
            explanation: "A* combines actual cost from start g(n) and estimated cost to goal h(n) via f(n) = g(n) + h(n)."
        }
    ];

    const item = challenges[Math.floor(Math.random() * challenges.length)];
    const overlay = document.createElement("div");
    overlay.className = "enh-overlay";
    const card = document.createElement("div");
    card.className = "enh-modal";

    const head = document.createElement("div");
    head.className = "enh-modal-head";
    const h3 = document.createElement("h3");
    h3.textContent = item.title;
    const closeBtn = document.createElement("button");
    closeBtn.className = "enh-modal-close";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => overlay.remove());
    head.append(h3, closeBtn);

    const body = document.createElement("div");
    body.className = "enh-modal-body";
    const p = document.createElement("p");
    p.className = "enh-lead";
    p.textContent = item.prompt;
    body.appendChild(p);

    const opts = document.createElement("div");
    opts.className = "enh-options";
    const feedback = document.createElement("div");
    feedback.className = "enh-feedback";
    feedback.hidden = true;

    item.options.forEach((optText, idx) => {
        const btn = document.createElement("button");
        btn.className = "enh-option";
        btn.textContent = optText;
        btn.addEventListener("click", () => {
            opts.querySelectorAll(".enh-option").forEach((b, bIdx) => {
                b.disabled = true;
                if (bIdx === item.correctIdx) b.classList.add("is-right");
                else if (bIdx === idx) b.classList.add("is-wrong");
            });
            feedback.hidden = false;
            feedback.textContent = (idx === item.correctIdx ? "✔ Correct! " : "✘ Not quite. ") + item.explanation;
        });
        opts.appendChild(btn);
    });

    body.append(opts, feedback);
    card.append(head, body);
    overlay.appendChild(card);
    overlay.addEventListener("click", e => {
        if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
}

// ==========================================
// EVENT BINDINGS
// ==========================================

algoSelect.addEventListener("change", () => {
    if (isPlaying) return;
    currentAlgo = algoSelect.value;
    syncAlgorithmControls();
    buildAlgorithmSteps();
});

presetSelect.addEventListener("change", () => {
    if (isPlaying) return;
    graph = Model.getPreset(presetSelect.value);
    baselineGraph = Model.cloneGraph(graph);
    selectedNodeId = null;
    selectedEdgeId = null;
    pendingEdgeFrom = null;
    svgRenderer.resetView();
    onGraphMutated();
});

sourceSelect.addEventListener("change", () => {
    if (!isPlaying) buildAlgorithmSteps();
});

destSelect.addEventListener("change", () => {
    if (!isPlaying) buildAlgorithmSteps();
});

heuristicSelect.addEventListener("change", () => {
    if (!isPlaying) buildAlgorithmSteps();
});

runAlgoBtn.addEventListener("click", () => {
    if (isPlaying) return;
    buildAlgorithmSteps();
    if (autoToggle && autoToggle.checked) {
        startAnimation();
    }
});

directedToggle.addEventListener("change", () => {
    if (isPlaying) return;
    Model.setDirected(graph, directedToggle.checked);
    onGraphMutated();
});

weightedToggle.addEventListener("change", () => {
    if (isPlaying) return;
    Model.setWeighted(graph, weightedToggle.checked);
    onGraphMutated();
});

connectModeBtn.addEventListener("click", () => {
    if (isPlaying) return;
    connectMode = !connectMode;
    pendingEdgeFrom = null;
    updateConnectButtonUI();
    showHint(connectMode ? "Connect Mode ON: click source node, then target node." : "", false);
    scheduleRender();
});

renameNodeBtn.addEventListener("click", () => {
    if (isPlaying) return;
    if (!selectedNodeId) {
        showHint("Click a node on the canvas first to select it for renaming.", true);
        return;
    }
    const nextLabel = window.prompt(`Rename node "${selectedNodeId}" to (1–4 letters/digits):`, selectedNodeId);
    if (nextLabel === null) return;
    pushUndoSnapshot();
    const res = Model.renameNode(graph, selectedNodeId, nextLabel);
    if (!res.ok) {
        showHint(res.error, true);
        return;
    }
    selectedNodeId = res.id;
    showHint("", false);
    onGraphMutated();
});

deleteSelectedBtn.addEventListener("click", () => {
    if (isPlaying) return;
    if (selectedNodeId) {
        pushUndoSnapshot();
        Model.removeNode(graph, selectedNodeId);
        selectedNodeId = null;
        showHint("", false);
        onGraphMutated();
    } else if (selectedEdgeId) {
        pushUndoSnapshot();
        Model.removeEdge(graph, selectedEdgeId);
        selectedEdgeId = null;
        showHint("", false);
        onGraphMutated();
    } else {
        showHint("Click a node or edge on the canvas first to select it.", true);
    }
});

edgeEditorBtn.addEventListener("click", () => {
    edgeEditorDrawer.hidden = !edgeEditorDrawer.hidden;
    if (!edgeEditorDrawer.hidden) {
        edgeListTextarea.value = Model.formatEdgeList(graph);
        editorErrorText.textContent = "";
    }
});

closeEditorBtn.addEventListener("click", () => {
    edgeEditorDrawer.hidden = true;
});

applyEdgeListBtn.addEventListener("click", () => {
    if (isPlaying) return;
    const parsed = Model.parseEdgeList(edgeListTextarea.value, {
        directed: graph.directed,
        weighted: graph.weighted
    });
    if (parsed.error) {
        editorErrorText.textContent = parsed.error;
        return;
    }
    editorErrorText.textContent = "";
    graph = parsed.graph;
    baselineGraph = Model.cloneGraph(graph);
    selectedNodeId = null;
    selectedEdgeId = null;
    pendingEdgeFrom = null;
    edgeEditorDrawer.hidden = true;
    onGraphMutated();
});

challengeBtn.addEventListener("click", openChallengeModal);

randomGraphBtn.addEventListener("click", () => {
    if (isPlaying) return;
    graph = Model.generateRandomGraph({
        directed: graph.directed,
        weighted: graph.weighted
    });
    baselineGraph = Model.cloneGraph(graph);
    selectedNodeId = null;
    selectedEdgeId = null;
    pendingEdgeFrom = null;
    svgRenderer.resetView();
    onGraphMutated();
});

clearGraphBtn.addEventListener("click", () => {
    if (isPlaying) return;
    pushUndoSnapshot();
    graph = Model.createEmptyGraph({
        directed: graph.directed,
        weighted: graph.weighted
    });
    selectedNodeId = null;
    selectedEdgeId = null;
    pendingEdgeFrom = null;
    onGraphMutated();
});

zoomInBtn.addEventListener("click", () => {
    svgRenderer.setZoom(svgRenderer.getZoom() + 0.15);
    scheduleRender();
});

zoomOutBtn.addEventListener("click", () => {
    svgRenderer.setZoom(svgRenderer.getZoom() - 0.15);
    scheduleRender();
});

resetViewBtn.addEventListener("click", () => {
    svgRenderer.resetView();
    scheduleRender();
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

resetBtn.addEventListener("click", () => {
    if (isPlaying) return;
    graph = Model.cloneGraph(baselineGraph);
    selectedNodeId = null;
    selectedEdgeId = null;
    pendingEdgeFrom = null;
    onGraphMutated();
});

// Mobile Panel Tabs
const mobileTabs = document.getElementById("mobileTabs");
if (mobileTabs) {
    const panels = {
        code: document.getElementById("codePanel"),
        viz: document.getElementById("vizPanel"),
        learn: document.getElementById("learnPanel")
    };
    mobileTabs.addEventListener("click", e => {
        const btn = e.target.closest(".graph-tab-btn");
        if (!btn) return;
        const targetKey = btn.dataset.panel;
        mobileTabs.querySelectorAll(".graph-tab-btn").forEach(b => {
            b.classList.toggle("is-active", b === btn);
        });
        Object.entries(panels).forEach(([k, p]) => {
            if (p) p.dataset.mobileHidden = k !== targetKey ? "true" : "false";
        });
    });
}

// ==========================================

// Adjacency Matrix & List Modal Wiring
const viewMatrixBtn = document.getElementById("viewMatrixBtn");
const matrixModal = document.getElementById("matrixModal");
const closeMatrixModalBtn = document.getElementById("closeMatrixModalBtn");
const matrixTableContainer = document.getElementById("matrixTableContainer");
const adjacencyListContainer = document.getElementById("adjacencyListContainer");

function renderMatrixModal() {
    const { nodes, matrix } = Model.buildAdjacencyMatrix(graph);
    
    // 1. Build Adjacency Matrix Table
    matrixTableContainer.innerHTML = "";
    if (nodes.length === 0) {
        matrixTableContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--muted);">Graph is empty.</div>';
    } else {
        const table = document.createElement("table");
        table.className = "matrix-table";
        const trH = document.createElement("tr");
        const th0 = document.createElement("th");
        th0.textContent = "v \ v";
        trH.appendChild(th0);
        nodes.forEach(id => {
            const th = document.createElement("th");
            th.textContent = id;
            trH.appendChild(th);
        });
        table.appendChild(trH);

        nodes.forEach((uId, i) => {
            const tr = document.createElement("tr");
            const tdN = document.createElement("td");
            tdN.style.fontWeight = "bold";
            tdN.style.background = "#eef2ff";
            tdN.textContent = uId;
            tr.appendChild(tdN);

            nodes.forEach((vId, j) => {
                const td = document.createElement("td");
                const w = matrix[i][j];
                td.textContent = w;
                if (w > 0) {
                    td.style.fontWeight = "bold";
                    td.style.color = "var(--primary)";
                } else {
                    td.style.color = "var(--muted)";
                }
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
        matrixTableContainer.appendChild(table);
    }

    // 2. Build Adjacency List view
    adjacencyListContainer.innerHTML = "";
    const adj = Model.buildAdjacencyList(graph);
    if (adj.size === 0) {
        adjacencyListContainer.textContent = "No nodes in graph.";
    } else {
        const lines = [];
        adj.forEach((list, u) => {
            const targets = list.map(e => graph.weighted ? `${e.to}(w=${e.weight})` : e.to).join(", ");
            lines.push(`${u} → [ ${targets} ]`);
        });
        adjacencyListContainer.innerHTML = lines.join("<br>");
    }
}

if (viewMatrixBtn && matrixModal) {
    viewMatrixBtn.addEventListener("click", () => {
        renderMatrixModal();
        matrixModal.hidden = false;
    });
}
if (closeMatrixModalBtn && matrixModal) {
    closeMatrixModalBtn.addEventListener("click", () => {
        matrixModal.hidden = true;
    });
    matrixModal.addEventListener("click", e => {
        if (e.target === matrixModal) matrixModal.hidden = true;
    });
}


// INITIALIZE (Supports ?algo=bfs|dfs|dijkstra|astar from Homepage)
// ==========================================

(function initFromQuery() {
    try {
        const params = new URLSearchParams(window.location.search);
        const requestedAlgo = params.get("algo");
        if (requestedAlgo && Algos.ALGORITHM_REGISTRY[requestedAlgo]) {
            currentAlgo = requestedAlgo;
            if (algoSelect) algoSelect.value = requestedAlgo;
        }
        const requestedPreset = params.get("preset");
        if (requestedPreset && Model.PRESETS[requestedPreset]) {
            graph = Model.getPreset(requestedPreset);
            baselineGraph = Model.cloneGraph(graph);
            if (presetSelect) presetSelect.value = requestedPreset;
        }
    } catch (e) {
        // default stays
    }
})();

syncAlgorithmControls();
syncNodeSelectors();
updateGraphPropsBadge();
buildAlgorithmSteps();
