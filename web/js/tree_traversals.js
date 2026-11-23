"use strict";

// ==========================================
// PURE TREE & TRAVERSAL FUNCTIONS (Testable)
// ==========================================

const MAX_NODES = 15;

function createNode(key) {
    return { key: Number(key), left: null, right: null };
}

function cloneTree(node) {
    if (!node) return null;
    return {
        key: node.key,
        left: cloneTree(node.left),
        right: cloneTree(node.right)
    };
}

function treeCount(node) {
    if (!node) return 0;
    return 1 + treeCount(node.left) + treeCount(node.right);
}

function treeHeight(node) {
    if (!node) return 0;
    return 1 + Math.max(treeHeight(node.left), treeHeight(node.right));
}

function treeInsertSilent(root, key) {
    if (!root) return createNode(key);
    if (key < root.key) root.left = treeInsertSilent(root.left, key);
    else if (key > root.key) root.right = treeInsertSilent(root.right, key);
    return root;
}

function buildTreeFromValues(values) {
    let root = null;
    const seen = new Set();
    values.forEach(v => {
        const num = Number(v);
        if (Number.isFinite(num) && !seen.has(num) && seen.size < MAX_NODES) {
            seen.add(num);
            root = treeInsertSilent(root, num);
        }
    });
    return root;
}

function getInorder(node, out = []) {
    if (!node) return out;
    getInorder(node.left, out);
    out.push(node.key);
    getInorder(node.right, out);
    return out;
}

function getPreorder(node, out = []) {
    if (!node) return out;
    out.push(node.key);
    getPreorder(node.left, out);
    getPreorder(node.right, out);
    return out;
}

function getPostorder(node, out = []) {
    if (!node) return out;
    getPostorder(node.left, out);
    getPostorder(node.right, out);
    out.push(node.key);
    return out;
}

function getLevelOrder(node) {
    const out = [];
    if (!node) return out;
    const q = [node];
    while (q.length > 0) {
        const cur = q.shift();
        out.push(cur.key);
        if (cur.left) q.push(cur.left);
        if (cur.right) q.push(cur.right);
    }
    return out;
}

function computeLayout(root) {
    const nodes = [];
    const edges = [];
    if (!root) return { nodes, edges, width: 640, height: 280 };

    let order = 0;
    let maxDepth = 0;

    function walk(node, depth, parentKey) {
        if (!node) return;
        walk(node.left, depth + 1, node.key);
        const rank = order++;
        if (depth > maxDepth) maxDepth = depth;
        nodes.push({
            key: node.key,
            rank,
            depth,
            parentKey
        });
        walk(node.right, depth + 1, node.key);
    }

    walk(root, 0, null);

    const total = nodes.length;
    const hGap = Math.max(52, Math.min(76, Math.floor(600 / Math.max(1, total))));
    const vGap = 64;
    const width = Math.max(640, (total + 1) * hGap + 40);
    const height = Math.max(270, (maxDepth + 1) * vGap + 70);

    const startX = (width - (total - 1) * hGap) / 2;
    const posByKey = new Map();

    nodes.forEach(item => {
        item.x = Math.round(startX + item.rank * hGap);
        item.y = Math.round(42 + item.depth * vGap);
        posByKey.set(item.key, item);
    });

    nodes.forEach(item => {
        if (item.parentKey !== null && posByKey.has(item.parentKey)) {
            const parent = posByKey.get(item.parentKey);
            edges.push({
                from: parent.key,
                to: item.key,
                x1: parent.x,
                y1: parent.y,
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
const visitedBox = document.getElementById("visitedBox");
const structureBox = document.getElementById("structureBox");
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

const inorderBtn = document.getElementById("inorderBtn");
const preorderBtn = document.getElementById("preorderBtn");
const postorderBtn = document.getElementById("postorderBtn");
const levelorderBtn = document.getElementById("levelorderBtn");
const arrayInput = document.getElementById("arrayInput");
const applyArrayBtn = document.getElementById("applyArrayBtn");
const balancedPresetBtn = document.getElementById("balancedPresetBtn");
const skewedPresetBtn = document.getElementById("skewedPresetBtn");
const randomTreeBtn = document.getElementById("randomTreeBtn");
const clearBtn = document.getElementById("clearBtn");
const autoToggle = document.getElementById("autoToggle");
const speedSelect = document.getElementById("speedSelect");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");

const codeLines = document.querySelectorAll(".code-line");

let animationSpeed = 800;
let initialValues = [50, 30, 70, 20, 40, 60, 80];
let liveRoot = null;
let opLog = [];

// Top-level steps and currentStep for enhance.js compatibility
let steps = [];
let currentStep = 0;
let lastOpStart = 0;
let timer = null;
let isPlaying = false;

const DEFAULT_HINT = "Click any traversal button above, or enter 1–15 keys separated by commas and click Load Tree.";


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
        tip: data.tip || "Time: O(n) · Space: O(h) recursion stack or O(w) queue width.",

        tree: cloneTree(liveRoot),
        mode: data.mode || "none",
        current: data.current ?? null,
        justVisited: data.justVisited ?? null,
        visited: data.visited ? [...data.visited] : [],
        auxState: data.auxState ? [...data.auxState] : [],
        auxKind: data.auxKind || "Call Stack",
        pathEdges: data.pathEdges ? [...data.pathEdges] : [],
        returned: data.returned ?? null,
        nodeVar: data.nodeVar ?? (data.current !== undefined && data.current !== null ? data.current : "null"),
        history: [...opLog]
    });
}


// ==========================================
// TRAVERSAL STEP BUILDERS
// ==========================================

function buildInorderSteps() {
    addStep({
        line: 1,
        type: "call",
        mode: "inorder",
        action: "Call inorder(root)",
        values: `root = ${liveRoot ? liveRoot.key : "null"}`,
        why: "Inorder traversal visits Left subtree first, then the Root node, then the Right subtree (L → N → R).",
        message: "Start Inorder Traversal from the root.",
        tip: "On a Binary Search Tree, Inorder traversal always produces keys in sorted ascending order.",
        auxKind: "Call Stack"
    });

    if (!liveRoot) {
        opLog.push("inorder() → Empty");
        addStep({
            line: 2,
            type: "error",
            mode: "inorder",
            action: "Tree Is Empty",
            values: "node == null",
            why: "Base case: when node is null, return immediately.",
            message: "Tree is empty! Load a tree first.",
            auxKind: "Call Stack",
            returned: "[]"
        });
        return;
    }

    const visited = [];
    const stack = [];
    const activeEdges = [];

    function dfs(node, parentKey, dir) {
        if (!node) {
            addStep({
                line: 2,
                type: "check",
                mode: "inorder",
                action: `Reached null (${dir} of ${parentKey})`,
                values: `node = null, stack = [${stack.join(", ")}]`,
                why: "if (node == null) return; stops recursion and returns to the parent call on the stack.",
                message: `No ${dir} child at ${parentKey} — return to ${parentKey}.`,
                current: parentKey,
                visited,
                auxState: stack,
                auxKind: "Call Stack",
                pathEdges: activeEdges,
                nodeVar: "null"
            });
            return;
        }

        if (parentKey !== null) activeEdges.push(`${parentKey}->${node.key}`);
        stack.push(node.key);

        addStep({
            line: 3,
            type: "recurse",
            mode: "inorder",
            action: `Enter Node ${node.key} → Go Left`,
            values: `node = ${node.key}, stack = [${stack.join(", ")}]`,
            why: "Before visiting node.key, inorder must completely traverse its left subtree.",
            message: `Push ${node.key} to call stack and recurse left: inorder(${node.left ? node.left.key : "null"}).`,
            current: node.key,
            visited,
            auxState: stack,
            auxKind: "Call Stack",
            pathEdges: activeEdges,
            nodeVar: node.key
        });

        dfs(node.left, node.key, "left");

        visited.push(node.key);
        addStep({
            line: 4,
            type: "read",
            mode: "inorder",
            action: `Visit Node ${node.key}`,
            values: `visit(${node.key}) → visited = [${visited.join(", ")}]`,
            why: "Left subtree of this node is finished, so we now visit the node itself.",
            message: `Visit ${node.key} (#${visited.length} in order).`,
            current: node.key,
            justVisited: node.key,
            visited,
            auxState: stack,
            auxKind: "Call Stack",
            pathEdges: activeEdges,
            nodeVar: node.key
        });

        addStep({
            line: 5,
            type: "recurse",
            mode: "inorder",
            action: `From ${node.key} → Go Right`,
            values: `node = ${node.key}, right = ${node.right ? node.right.key : "null"}`,
            why: "After visiting the node, inorder recursively traverses its right subtree.",
            message: `Recurse right from ${node.key}: inorder(${node.right ? node.right.key : "null"}).`,
            current: node.key,
            visited,
            auxState: stack,
            auxKind: "Call Stack",
            pathEdges: activeEdges,
            nodeVar: node.key
        });

        dfs(node.right, node.key, "right");

        stack.pop();
        if (parentKey !== null) activeEdges.pop();
    }

    dfs(liveRoot, null, "root");

    opLog.push(`inorder → [${visited.join(", ")}]`);
    addStep({
        line: 6,
        type: "done",
        mode: "inorder",
        action: "Inorder Traversal Complete",
        values: `Result: [${visited.join(", ")}]`,
        why: "The call stack is empty and every node was visited in Left → Root → Right order.",
        message: `Inorder finished: [${visited.join(", ")}].`,
        visited,
        auxState: [],
        auxKind: "Call Stack",
        returned: `[${visited.join(", ")}]`
    });
}

function buildPreorderSteps() {
    addStep({
        line: 8,
        type: "call",
        mode: "preorder",
        action: "Call preorder(root)",
        values: `root = ${liveRoot ? liveRoot.key : "null"}`,
        why: "Preorder traversal visits the Root node first, then the Left subtree, then the Right subtree (N → L → R).",
        message: "Start Preorder Traversal from the root.",
        tip: "Preorder is useful for cloning or serializing a tree because parents are processed before children.",
        auxKind: "Call Stack"
    });

    if (!liveRoot) {
        opLog.push("preorder() → Empty");
        addStep({
            line: 9,
            type: "error",
            mode: "preorder",
            action: "Tree Is Empty",
            values: "node == null",
            why: "Base case: when node is null, return immediately.",
            message: "Tree is empty! Load a tree first.",
            auxKind: "Call Stack",
            returned: "[]"
        });
        return;
    }

    const visited = [];
    const stack = [];
    const activeEdges = [];

    function dfs(node, parentKey, dir) {
        if (!node) {
            addStep({
                line: 9,
                type: "check",
                mode: "preorder",
                action: `Reached null (${dir} of ${parentKey})`,
                values: `node = null, stack = [${stack.join(", ")}]`,
                why: "if (node == null) return; backtracks to the caller on the stack.",
                message: `No ${dir} child at ${parentKey} — backtrack.`,
                current: parentKey,
                visited,
                auxState: stack,
                auxKind: "Call Stack",
                pathEdges: activeEdges,
                nodeVar: "null"
            });
            return;
        }

        if (parentKey !== null) activeEdges.push(`${parentKey}->${node.key}`);
        stack.push(node.key);
        visited.push(node.key);

        addStep({
            line: 10,
            type: "read",
            mode: "preorder",
            action: `Visit Node ${node.key}`,
            values: `visit(${node.key}) → visited = [${visited.join(", ")}]`,
            why: "In Preorder, we visit the current node immediately upon arriving at it.",
            message: `Visit ${node.key} (#${visited.length} in order).`,
            current: node.key,
            justVisited: node.key,
            visited,
            auxState: stack,
            auxKind: "Call Stack",
            pathEdges: activeEdges,
            nodeVar: node.key
        });

        addStep({
            line: 11,
            type: "recurse",
            mode: "preorder",
            action: `From ${node.key} → Go Left`,
            values: `node = ${node.key}, left = ${node.left ? node.left.key : "null"}`,
            why: "After visiting the root, preorder traverses the left subtree.",
            message: `Recurse left: preorder(${node.left ? node.left.key : "null"}).`,
            current: node.key,
            visited,
            auxState: stack,
            auxKind: "Call Stack",
            pathEdges: activeEdges,
            nodeVar: node.key
        });

        dfs(node.left, node.key, "left");

        addStep({
            line: 12,
            type: "recurse",
            mode: "preorder",
            action: `From ${node.key} → Go Right`,
            values: `node = ${node.key}, right = ${node.right ? node.right.key : "null"}`,
            why: "Once the left subtree finishes, preorder traverses the right subtree.",
            message: `Recurse right: preorder(${node.right ? node.right.key : "null"}).`,
            current: node.key,
            visited,
            auxState: stack,
            auxKind: "Call Stack",
            pathEdges: activeEdges,
            nodeVar: node.key
        });

        dfs(node.right, node.key, "right");

        stack.pop();
        if (parentKey !== null) activeEdges.pop();
    }

    dfs(liveRoot, null, "root");

    opLog.push(`preorder → [${visited.join(", ")}]`);
    addStep({
        line: 13,
        type: "done",
        mode: "preorder",
        action: "Preorder Traversal Complete",
        values: `Result: [${visited.join(", ")}]`,
        why: "All nodes visited in Root → Left → Right order.",
        message: `Preorder finished: [${visited.join(", ")}].`,
        visited,
        auxState: [],
        auxKind: "Call Stack",
        returned: `[${visited.join(", ")}]`
    });
}

function buildPostorderSteps() {
    addStep({
        line: 15,
        type: "call",
        mode: "postorder",
        action: "Call postorder(root)",
        values: `root = ${liveRoot ? liveRoot.key : "null"}`,
        why: "Postorder traversal visits Left subtree, then Right subtree, and finally the Root node (L → R → N).",
        message: "Start Postorder Traversal from the root.",
        tip: "Postorder processes children before their parent — ideal for computing subtree sizes, heights, or freeing nodes.",
        auxKind: "Call Stack"
    });

    if (!liveRoot) {
        opLog.push("postorder() → Empty");
        addStep({
            line: 16,
            type: "error",
            mode: "postorder",
            action: "Tree Is Empty",
            values: "node == null",
            why: "Base case: when node is null, return immediately.",
            message: "Tree is empty! Load a tree first.",
            auxKind: "Call Stack",
            returned: "[]"
        });
        return;
    }

    const visited = [];
    const stack = [];
    const activeEdges = [];

    function dfs(node, parentKey, dir) {
        if (!node) {
            addStep({
                line: 16,
                type: "check",
                mode: "postorder",
                action: `Reached null (${dir} of ${parentKey})`,
                values: `node = null, stack = [${stack.join(", ")}]`,
                why: "if (node == null) return; returns control to the parent call.",
                message: `No ${dir} child at ${parentKey} — return.`,
                current: parentKey,
                visited,
                auxState: stack,
                auxKind: "Call Stack",
                pathEdges: activeEdges,
                nodeVar: "null"
            });
            return;
        }

        if (parentKey !== null) activeEdges.push(`${parentKey}->${node.key}`);
        stack.push(node.key);

        addStep({
            line: 17,
            type: "recurse",
            mode: "postorder",
            action: `Enter Node ${node.key} → Go Left`,
            values: `node = ${node.key}, stack = [${stack.join(", ")}]`,
            why: "Postorder explores the entire left subtree first.",
            message: `Push ${node.key} to call stack and recurse left.`,
            current: node.key,
            visited,
            auxState: stack,
            auxKind: "Call Stack",
            pathEdges: activeEdges,
            nodeVar: node.key
        });

        dfs(node.left, node.key, "left");

        addStep({
            line: 18,
            type: "recurse",
            mode: "postorder",
            action: `At ${node.key} → Go Right`,
            values: `node = ${node.key}, right = ${node.right ? node.right.key : "null"}`,
            why: "After the left subtree finishes, postorder explores the right subtree before visiting the node.",
            message: `Recurse right from ${node.key}.`,
            current: node.key,
            visited,
            auxState: stack,
            auxKind: "Call Stack",
            pathEdges: activeEdges,
            nodeVar: node.key
        });

        dfs(node.right, node.key, "right");

        visited.push(node.key);
        addStep({
            line: 19,
            type: "read",
            mode: "postorder",
            action: `Visit Node ${node.key}`,
            values: `visit(${node.key}) → visited = [${visited.join(", ")}]`,
            why: "Both left and right subtrees of this node are complete, so we now visit the node itself.",
            message: `Visit ${node.key} (#${visited.length} in order).`,
            current: node.key,
            justVisited: node.key,
            visited,
            auxState: stack,
            auxKind: "Call Stack",
            pathEdges: activeEdges,
            nodeVar: node.key
        });

        stack.pop();
        if (parentKey !== null) activeEdges.pop();
    }

    dfs(liveRoot, null, "root");

    opLog.push(`postorder → [${visited.join(", ")}]`);
    addStep({
        line: 20,
        type: "done",
        mode: "postorder",
        action: "Postorder Traversal Complete",
        values: `Result: [${visited.join(", ")}]`,
        why: "All nodes visited in Left → Right → Root order.",
        message: `Postorder finished: [${visited.join(", ")}].`,
        visited,
        auxState: [],
        auxKind: "Call Stack",
        returned: `[${visited.join(", ")}]`
    });
}

function buildLevelOrderSteps() {
    addStep({
        line: 22,
        type: "call",
        mode: "levelorder",
        action: "Call levelOrder(root)",
        values: `root = ${liveRoot ? liveRoot.key : "null"}`,
        why: "Level-order (Breadth-First Search) visits nodes level by level from top to bottom and left to right.",
        message: "Start Level-Order (BFS) Traversal.",
        tip: "BFS uses a FIFO Queue instead of recursion so nodes closer to the root are visited first.",
        auxKind: "Queue"
    });

    if (!liveRoot) {
        opLog.push("levelOrder() → Empty");
        addStep({
            line: 23,
            type: "error",
            mode: "levelorder",
            action: "Tree Is Empty",
            values: "root == null",
            why: "When root is null, return immediately.",
            message: "Tree is empty! Load a tree first.",
            auxKind: "Queue",
            returned: "[]"
        });
        return;
    }

    const queue = [liveRoot];
    const visited = [];

    addStep({
        line: 25,
        type: "push",
        mode: "levelorder",
        action: `Enqueue Root ${liveRoot.key}`,
        values: `queue = [${liveRoot.key}]`,
        why: "Seed the queue with the root node before starting the loop.",
        message: `Added root ${liveRoot.key} to the queue.`,
        current: liveRoot.key,
        visited,
        auxState: queue.map(n => n.key),
        auxKind: "Queue",
        nodeVar: liveRoot.key
    });

    while (queue.length > 0) {
        const curr = queue.shift();
        visited.push(curr.key);

        addStep({
            line: 28,
            type: "read",
            mode: "levelorder",
            action: `Dequeue & Visit ${curr.key}`,
            values: `curr = ${curr.key}, visited = [${visited.join(", ")}]`,
            why: "q.poll() removes the front node from the queue and visit(curr) records it.",
            message: `Dequeued and visited ${curr.key} (#${visited.length} in order).`,
            current: curr.key,
            justVisited: curr.key,
            visited,
            auxState: queue.map(n => n.key),
            auxKind: "Queue",
            nodeVar: curr.key
        });

        if (curr.left) {
            queue.push(curr.left);
            addStep({
                line: 29,
                type: "push",
                mode: "levelorder",
                action: `Enqueue Left Child ${curr.left.key}`,
                values: `curr.left = ${curr.left.key}, queue = [${queue.map(n => n.key).join(", ")}]`,
                why: "curr.left is not null, so it joins the back of the queue to be visited on the next level.",
                message: `Enqueued left child ${curr.left.key}.`,
                current: curr.key,
                visited,
                auxState: queue.map(n => n.key),
                auxKind: "Queue",
                pathEdges: [`${curr.key}->${curr.left.key}`],
                nodeVar: curr.key
            });
        }

        if (curr.right) {
            queue.push(curr.right);
            addStep({
                line: 30,
                type: "push",
                mode: "levelorder",
                action: `Enqueue Right Child ${curr.right.key}`,
                values: `curr.right = ${curr.right.key}, queue = [${queue.map(n => n.key).join(", ")}]`,
                why: "curr.right is not null, so it joins the back of the queue.",
                message: `Enqueued right child ${curr.right.key}.`,
                current: curr.key,
                visited,
                auxState: queue.map(n => n.key),
                auxKind: "Queue",
                pathEdges: [`${curr.key}->${curr.right.key}`],
                nodeVar: curr.key
            });
        }
    }

    opLog.push(`levelOrder → [${visited.join(", ")}]`);
    addStep({
        line: 32,
        type: "done",
        mode: "levelorder",
        action: "Level-Order Traversal Complete",
        values: `Result: [${visited.join(", ")}]`,
        why: "The queue is now empty and every level has been visited from top to bottom.",
        message: `Level-Order finished: [${visited.join(", ")}].`,
        visited,
        auxState: [],
        auxKind: "Queue",
        returned: `[${visited.join(", ")}]`
    });
}


// ==========================================
// SVG TREE RENDERER
// ==========================================

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
}

function renderTreeSvg(step) {
    if (!treeSvg) return;
    treeSvg.innerHTML = "";

    const layout = computeLayout(step.tree);
    treeSvg.setAttribute("width", String(layout.width));
    treeSvg.setAttribute("height", String(layout.height));
    treeSvg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);

    if (layout.nodes.length === 0) {
        const emptyText = svgEl("text", {
            x: layout.width / 2,
            y: layout.height / 2,
            class: "tree-empty-text"
        });
        emptyText.textContent = "Tree is empty — click Balanced, Skewed, or New Random Tree above";
        treeSvg.appendChild(emptyText);
        return;
    }

    const pathSet = new Set(step.pathEdges || []);
    const visitedOrderMap = new Map();
    (step.visited || []).forEach((k, idx) => visitedOrderMap.set(k, idx + 1));
    const waitingSet = new Set(step.auxState || []);

    // Draw edges
    layout.edges.forEach(edge => {
        const key = `${edge.from}->${edge.to}`;
        const bothVisited = visitedOrderMap.has(edge.from) && visitedOrderMap.has(edge.to);
        const cls = ["tree-edge"];
        if (pathSet.has(key)) cls.push("is-path");
        else if (bothVisited) cls.push("is-visited-edge");

        const line = svgEl("line", {
            x1: edge.x1,
            y1: edge.y1,
            x2: edge.x2,
            y2: edge.y2,
            class: cls.join(" ")
        });
        treeSvg.appendChild(line);
    });

    // Draw nodes
    layout.nodes.forEach(node => {
        const classes = ["tree-svg-node"];
        if (step.justVisited === node.key) classes.push("is-found");
        else if (step.current === node.key) classes.push("is-current");
        else if (visitedOrderMap.has(node.key)) classes.push("is-visited");
        else if (waitingSet.has(node.key)) classes.push("is-waiting");

        const g = svgEl("g", {
            class: classes.join(" "),
            "data-key": node.key
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
        label.textContent = node.key;

        g.appendChild(circle);
        g.appendChild(label);

        if (node.depth === 0) {
            const rootTag = svgEl("text", {
                x: node.x,
                y: node.y - 27,
                class: "node-tag"
            });
            rootTag.textContent = "ROOT";
            g.appendChild(rootTag);
        }

        // Visit order badge (#1, #2, ...)
        if (visitedOrderMap.has(node.key)) {
            const ord = visitedOrderMap.get(node.key);
            const badgeCircle = svgEl("circle", {
                cx: node.x + 16,
                cy: node.y - 16,
                r: 9,
                class: "order-badge"
            });
            const badgeText = svgEl("text", {
                x: node.x + 16,
                y: node.y - 16,
                class: "node-order"
            });
            badgeText.textContent = ord;
            g.appendChild(badgeCircle);
            g.appendChild(badgeText);
        }

        treeSvg.appendChild(g);
    });
}

function renderAuxStrip(step) {
    if (!visitedBox || !structureBox) return;

    visitedBox.innerHTML = "";
    if (!step.visited || step.visited.length === 0) {
        const span = document.createElement("span");
        span.className = "tree-aux-empty";
        span.textContent = "No nodes visited yet.";
        visitedBox.appendChild(span);
    } else {
        step.visited.forEach((val, idx) => {
            const chip = document.createElement("span");
            chip.className = "array-value" + (idx === step.visited.length - 1 ? " changed" : "");
            chip.textContent = `${idx + 1}: ${val}`;
            visitedBox.appendChild(chip);
        });
    }

    const labelEl = document.getElementById("structureLabel");
    if (labelEl) labelEl.textContent = `${step.auxKind || "Call Stack"}:`;

    structureBox.innerHTML = "";
    if (!step.auxState || step.auxState.length === 0) {
        const span = document.createElement("span");
        span.className = "tree-aux-empty";
        span.textContent = "empty";
        structureBox.appendChild(span);
    } else {
        step.auxState.forEach((val, idx) => {
            const chip = document.createElement("span");
            chip.className = "array-value" + (idx === step.auxState.length - 1 ? " active-value" : "");
            chip.textContent = val;
            structureBox.appendChild(chip);
        });
    }
}

function renderHistory(history) {
    if (!historyBox) return;
    historyBox.innerHTML = "";

    if (!history || history.length === 0) {
        const empty = document.createElement("p");
        empty.className = "history-empty";
        empty.textContent = "No traversals run yet.";
        historyBox.appendChild(empty);
        return;
    }

    const recent = history.slice(-8);
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
        inorderBtn, preorderBtn, postorderBtn, levelorderBtn,
        arrayInput, applyArrayBtn, balancedPresetBtn, skewedPresetBtn,
        randomTreeBtn, clearBtn, resetBtn, speedSelect
    ].forEach(ctrl => {
        if (ctrl) ctrl.disabled = lock;
    });
}

function renderStep(index) {
    if (index < 0 || index >= steps.length) return;

    currentStep = index;
    const step = steps[index];

    renderTreeSvg(step);
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

    const count = treeCount(step.tree);
    const height = treeHeight(step.tree);
    const visCount = step.visited ? step.visited.length : 0;

    if (pointerInfo) {
        pointerInfo.textContent =
            `mode = ${step.mode} · visited = ${visCount} / ${count} · height = ${height}`;
    }

    if (treeBadge) {
        treeBadge.className = "stack-badge " + (count === 0 ? "is-empty" : "is-ok");
        treeBadge.textContent = count === 0
            ? "EMPTY (0 nodes)"
            : `${count} nodes · height ${height}`;
    }

    if (returnBadge) {
        returnBadge.hidden = step.returned === null;
        returnBadge.textContent = step.returned === null ? "" : `Order: ${step.returned}`;
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

function resetTimeline(values) {
    stopAnimation();
    initialValues = [...values];
    liveRoot = buildTreeFromValues(initialValues);
    if (arrayInput) arrayInput.value = initialValues.join(", ");
    opLog = [];
    steps = [];
    lastOpStart = 0;

    const count = treeCount(liveRoot);

    addStep({
        line: 1,
        type: "ready",
        mode: "none",
        action: "Ready to Traverse",
        values: count > 0
            ? `Tree keys: [${initialValues.join(", ")}]`
            : "The tree is empty (root = null).",
        why: "Choose Inorder, Preorder, Postorder, or Level-order to see the exact order in which nodes are visited.",
        message: "Click a traversal button above to start.",
        tip: "DFS (Inorder, Preorder, Postorder) uses a Call Stack; BFS (Level-order) uses a Queue."
    });

    renderStep(0);
    if (window.AlgoLab && AlgoLab.showHint) {
        AlgoLab.showHint(DEFAULT_HINT, false);
    }
}

function loadCustomTree() {
    if (isPlaying || !arrayInput) return;
    const parsed = window.AlgoLab && AlgoLab.parseArray
        ? AlgoLab.parseArray(arrayInput.value, { min: 1, max: MAX_NODES, minValue: 1, maxValue: 999 })
        : { values: [50, 30, 70] };

    if (parsed.error) {
        if (window.AlgoLab && AlgoLab.showHint) AlgoLab.showHint(parsed.error, true);
        arrayInput.focus();
        return;
    }

    const unique = [...new Set(parsed.values)];
    resetTimeline(unique);
}

function randomTreeValues() {
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

if (inorderBtn) inorderBtn.addEventListener("click", () => runOperation(buildInorderSteps));
if (preorderBtn) preorderBtn.addEventListener("click", () => runOperation(buildPreorderSteps));
if (postorderBtn) postorderBtn.addEventListener("click", () => runOperation(buildPostorderSteps));
if (levelorderBtn) levelorderBtn.addEventListener("click", () => runOperation(buildLevelOrderSteps));

if (applyArrayBtn) applyArrayBtn.addEventListener("click", loadCustomTree);
if (arrayInput) {
    arrayInput.addEventListener("keydown", e => {
        if (e.key === "Enter") loadCustomTree();
    });
}

if (balancedPresetBtn) {
    balancedPresetBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline([50, 30, 70, 20, 40, 60, 80]);
    });
}

if (skewedPresetBtn) {
    skewedPresetBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline([15, 30, 45, 60, 75]);
    });
}

if (randomTreeBtn) {
    randomTreeBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline(randomTreeValues());
    });
}

if (clearBtn) {
    clearBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline([]);
    });
}

if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        if (!isPlaying) resetTimeline(initialValues);
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
resetTimeline(initialValues);
