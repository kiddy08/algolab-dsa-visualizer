"use strict";

// ==========================================
// PURE AVL TREE LOGIC FUNCTIONS (Testable)
// ==========================================

const MAX_NODES = 15;

function createNode(key) {
    return { key: Number(key), height: 1, left: null, right: null };
}

function h(node) {
    return node ? node.height : 0;
}

function updateHeight(node) {
    if (node) {
        node.height = 1 + Math.max(h(node.left), h(node.right));
    }
}

function getBf(node) {
    return node ? h(node.left) - h(node.right) : 0;
}

function cloneTree(node) {
    if (!node) return null;
    const left = cloneTree(node.left);
    const right = cloneTree(node.right);
    const height = 1 + Math.max(left ? left.height : 0, right ? right.height : 0);
    return {
        key: node.key,
        height,
        bf: (left ? left.height : 0) - (right ? right.height : 0),
        left,
        right
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

function treeInorder(node, out = []) {
    if (!node) return out;
    treeInorder(node.left, out);
    out.push(node.key);
    treeInorder(node.right, out);
    return out;
}

function treeContains(node, key) {
    let curr = node;
    while (curr) {
        if (key === curr.key) return true;
        curr = key < curr.key ? curr.left : curr.right;
    }
    return false;
}

function rotateRightPure(z) {
    const y = z.left;
    const T3 = y.right;
    y.right = z;
    z.left = T3;
    updateHeight(z);
    updateHeight(y);
    return y;
}

function rotateLeftPure(z) {
    const y = z.right;
    const T2 = y.left;
    y.left = z;
    z.right = T2;
    updateHeight(z);
    updateHeight(y);
    return y;
}

function rebalancePure(node) {
    if (!node) return null;
    updateHeight(node);
    const b = getBf(node);
    if (b > 1 && getBf(node.left) >= 0) return rotateRightPure(node);
    if (b > 1 && getBf(node.left) < 0) {
        node.left = rotateLeftPure(node.left);
        return rotateRightPure(node);
    }
    if (b < -1 && getBf(node.right) <= 0) return rotateLeftPure(node);
    if (b < -1 && getBf(node.right) > 0) {
        node.right = rotateRightPure(node.right);
        return rotateLeftPure(node);
    }
    return node;
}

function avlInsertSilent(node, key) {
    if (!node) return createNode(key);
    if (key < node.key) node.left = avlInsertSilent(node.left, key);
    else if (key > node.key) node.right = avlInsertSilent(node.right, key);
    else return node;
    return rebalancePure(node);
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
        const lh = treeHeight(node.left);
        const rh = treeHeight(node.right);
        nodes.push({
            key: node.key,
            height: 1 + Math.max(lh, rh),
            bf: lh - rh,
            rank,
            depth,
            parentKey
        });
        walk(node.right, depth + 1, node.key);
    }

    walk(root, 0, null);

    const total = nodes.length;
    const hGap = Math.max(54, Math.min(78, Math.floor(600 / Math.max(1, total))));
    const vGap = 68;
    const width = Math.max(640, (total + 1) * hGap + 40);
    const height = Math.max(275, (maxDepth + 1) * vGap + 74);

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
const rotationInfoBox = document.getElementById("rotationInfoBox");
const inorderBox = document.getElementById("inorderBox");
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

const valueInput = document.getElementById("valueInput");
const randomValueBtn = document.getElementById("randomValueBtn");
const insertBtn = document.getElementById("insertBtn");
const searchBtn = document.getElementById("searchBtn");
const deleteBtn = document.getElementById("deleteBtn");
const llCaseBtn = document.getElementById("llCaseBtn");
const rrCaseBtn = document.getElementById("rrCaseBtn");
const lrCaseBtn = document.getElementById("lrCaseBtn");
const rlCaseBtn = document.getElementById("rlCaseBtn");
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
let initialValues = [30, 20, 40, 10, 25, 50];
let liveRoot = null;
let opLog = [];

// Top-level steps and currentStep for enhance.js compatibility
let steps = [];
let currentStep = 0;
let lastOpStart = 0;
let timer = null;
let isPlaying = false;

function defaultHint() {
    return `Enter a value from 1 to 999 (max ${MAX_NODES} nodes). Try LL, RR, LR or RL Demo buttons to watch rotations.`;
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
        tip: data.tip || "AVL balance factor bf = height(left) - height(right) must stay in {-1, 0, +1}.",

        tree: cloneTree(liveRoot),
        current: data.current ?? null,
        newKey: data.newKey ?? null,
        foundKey: data.foundKey ?? null,
        deleteKey: data.deleteKey ?? null,
        unbalancedKey: data.unbalancedKey ?? null,
        rotatedKeys: data.rotatedKeys ? [...data.rotatedKeys] : [],
        pathEdges: data.pathEdges ? [...data.pathEdges] : [],
        rotationText: data.rotationText || "All nodes balanced (bf in {-1, 0, +1}).",
        returned: data.returned ?? null,
        nodeVar: data.nodeVar ?? (data.current !== undefined && data.current !== null ? data.current : "null"),
        bfVar: data.bfVar ?? "0",
        rotVar: data.rotVar ?? "none",
        history: [...opLog]
    });
}


// ==========================================
// HELPER TO REPLACE A SUBTREE IN liveRoot BY KEY
// ==========================================

function replaceSubtree(root, targetKey, newSubtree) {
    if (!root) return null;
    if (root.key === targetKey) return newSubtree;
    if (targetKey < root.key) {
        root.left = replaceSubtree(root.left, targetKey, newSubtree);
    } else {
        root.right = replaceSubtree(root.right, targetKey, newSubtree);
    }
    updateHeight(root);
    return root;
}


// ==========================================
// REBALANCE WITH ROTATION STEPS
// ==========================================

function rebalanceWithSteps(node) {
    updateHeight(node);
    const b = getBf(node);

    addStep({
        line: 25,
        type: Math.abs(b) > 1 ? "error" : "check",
        action: Math.abs(b) > 1
            ? `Imbalance at Node ${node.key} (bf = ${b > 0 ? "+" + b : b})`
            : `Check Balance at Node ${node.key} (bf = ${b > 0 ? "+" + b : b})`,
        values: `node = ${node.key}, h(left) = ${h(node.left)}, h(right) = ${h(node.right)}, bf = ${b}`,
        why: Math.abs(b) > 1
            ? `|bf| = ${Math.abs(b)} > 1, so subtree rooted at ${node.key} violates the AVL property and must rotate.`
            : `bf = ${b} is within {-1, 0, +1}, so node ${node.key} is balanced.`,
        message: Math.abs(b) > 1
            ? `Node ${node.key} is unbalanced with bf = ${b > 0 ? "+" + b : b}!`
            : `Node ${node.key} is balanced (bf = ${b}).`,
        current: Math.abs(b) <= 1 ? node.key : null,
        unbalancedKey: Math.abs(b) > 1 ? node.key : null,
        rotationText: Math.abs(b) > 1
            ? `Imbalance detected at node ${node.key} (bf = ${b > 0 ? "+" + b : b})`
            : `Node ${node.key} balanced (bf = ${b})`,
        nodeVar: node.key,
        bfVar: b
    });

    // Case 1: LL -> single right rotation
    if (b > 1 && getBf(node.left) >= 0) {
        const zKey = node.key;
        const yKey = node.left.key;

        addStep({
            line: 26,
            type: "swap",
            action: `LL Case at ${zKey} → rotateRight(${zKey})`,
            values: `z = ${zKey} (bf = +${b}), y = ${yKey} (bf = ${getBf(node.left)})`,
            why: "Left subtree is taller and left child is left-heavy (or balanced): a single Right Rotation around z fixes it.",
            message: `LL Case: Rotate Right around ${zKey} so ${yKey} moves up.`,
            unbalancedKey: zKey,
            rotatedKeys: [yKey],
            pathEdges: [`${zKey}->${yKey}`],
            rotationText: `LL Case → rotateRight(${zKey})`,
            nodeVar: zKey,
            bfVar: b,
            rotVar: `LL: rotateRight(${zKey})`
        });

        const newSub = rotateRightPure(node);
        liveRoot = replaceSubtree(liveRoot, zKey, newSub);

        addStep({
            line: 13,
            type: "done",
            action: `Right Rotation Complete (${yKey} Is Subtree Root)`,
            values: `new root of subtree = ${yKey}, right child = ${zKey}`,
            why: `${yKey} became the parent of ${zKey}, and heights were updated in O(1).`,
            message: `Right rotation finished: ${yKey} is now above ${zKey} (bf = ${getBf(newSub)}).`,
            rotatedKeys: [yKey, zKey],
            pathEdges: [`${yKey}->${zKey}`],
            rotationText: `Completed LL Right Rotation (${yKey} over ${zKey})`,
            nodeVar: yKey,
            bfVar: getBf(newSub),
            rotVar: "LL Done"
        });

        return newSub;
    }

    // Case 2: LR -> left rotation on left child, then right rotation on node
    if (b > 1 && getBf(node.left) < 0) {
        const zKey = node.key;
        const yKey = node.left.key;
        const xKey = node.left.right.key;

        addStep({
            line: 28,
            type: "swap",
            action: `LR Case at ${zKey} (Step 1/2): rotateLeft(${yKey})`,
            values: `z = ${zKey} (bf = +${b}), left child y = ${yKey} (bf = ${getBf(node.left)}), inner child x = ${xKey}`,
            why: "LR Case has a zig-zag path (left then right). Step 1 rotates the left child y to the left to turn it into an LL line.",
            message: `LR Step 1: Rotate Left around left child ${yKey} so ${xKey} moves up.`,
            unbalancedKey: zKey,
            rotatedKeys: [yKey, xKey],
            pathEdges: [`${zKey}->${yKey}`, `${yKey}->${xKey}`],
            rotationText: `LR Case (1/2) → rotateLeft(${yKey})`,
            nodeVar: yKey,
            bfVar: b,
            rotVar: `LR(1/2): rotateLeft(${yKey})`
        });

        node.left = rotateLeftPure(node.left);
        updateHeight(node);

        addStep({
            line: 29,
            type: "swap",
            action: `LR Case at ${zKey} (Step 2/2): rotateRight(${zKey})`,
            values: `z = ${zKey}, new left child = ${node.left.key}`,
            why: "Now the nodes form a straight left-left line, so Step 2 rotates Right around z.",
            message: `LR Step 2: Rotate Right around ${zKey} so ${xKey} becomes the subtree root.`,
            unbalancedKey: zKey,
            rotatedKeys: [xKey, yKey],
            pathEdges: [`${zKey}->${xKey}`, `${xKey}->${yKey}`],
            rotationText: `LR Case (2/2) → rotateRight(${zKey})`,
            nodeVar: zKey,
            bfVar: getBf(node),
            rotVar: `LR(2/2): rotateRight(${zKey})`
        });

        const newSub = rotateRightPure(node);
        liveRoot = replaceSubtree(liveRoot, zKey, newSub);

        addStep({
            line: 13,
            type: "done",
            action: `LR Double Rotation Complete (${xKey} Is Subtree Root)`,
            values: `new subtree root = ${xKey}, left = ${yKey}, right = ${zKey}`,
            why: `${xKey} moved between ${yKey} and ${zKey}, restoring balance.`,
            message: `LR rotation finished: ${xKey} is now parent of ${yKey} and ${zKey}.`,
            rotatedKeys: [xKey, yKey, zKey],
            pathEdges: [`${xKey}->${yKey}`, `${xKey}->${zKey}`],
            rotationText: `Completed LR Double Rotation (${xKey} at top)`,
            nodeVar: xKey,
            bfVar: getBf(newSub),
            rotVar: "LR Done"
        });

        return newSub;
    }

    // Case 3: RR -> single left rotation
    if (b < -1 && getBf(node.right) <= 0) {
        const zKey = node.key;
        const yKey = node.right.key;

        addStep({
            line: 31,
            type: "swap",
            action: `RR Case at ${zKey} → rotateLeft(${zKey})`,
            values: `z = ${zKey} (bf = ${b}), y = ${yKey} (bf = ${getBf(node.right)})`,
            why: "Right subtree is taller and right child is right-heavy (or balanced): a single Left Rotation around z fixes it.",
            message: `RR Case: Rotate Left around ${zKey} so ${yKey} moves up.`,
            unbalancedKey: zKey,
            rotatedKeys: [yKey],
            pathEdges: [`${zKey}->${yKey}`],
            rotationText: `RR Case → rotateLeft(${zKey})`,
            nodeVar: zKey,
            bfVar: b,
            rotVar: `RR: rotateLeft(${zKey})`
        });

        const newSub = rotateLeftPure(node);
        liveRoot = replaceSubtree(liveRoot, zKey, newSub);

        addStep({
            line: 20,
            type: "done",
            action: `Left Rotation Complete (${yKey} Is Subtree Root)`,
            values: `new root of subtree = ${yKey}, left child = ${zKey}`,
            why: `${yKey} became the parent of ${zKey}, and heights were updated in O(1).`,
            message: `Left rotation finished: ${yKey} is now above ${zKey} (bf = ${getBf(newSub)}).`,
            rotatedKeys: [yKey, zKey],
            pathEdges: [`${yKey}->${zKey}`],
            rotationText: `Completed RR Left Rotation (${yKey} over ${zKey})`,
            nodeVar: yKey,
            bfVar: getBf(newSub),
            rotVar: "RR Done"
        });

        return newSub;
    }

    // Case 4: RL -> right rotation on right child, then left rotation on node
    if (b < -1 && getBf(node.right) > 0) {
        const zKey = node.key;
        const yKey = node.right.key;
        const xKey = node.right.left.key;

        addStep({
            line: 33,
            type: "swap",
            action: `RL Case at ${zKey} (Step 1/2): rotateRight(${yKey})`,
            values: `z = ${zKey} (bf = ${b}), right child y = ${yKey} (bf = +${getBf(node.right)}), inner child x = ${xKey}`,
            why: "RL Case has a zig-zag path (right then left). Step 1 rotates the right child y to the right to turn it into an RR line.",
            message: `RL Step 1: Rotate Right around right child ${yKey} so ${xKey} moves up.`,
            unbalancedKey: zKey,
            rotatedKeys: [yKey, xKey],
            pathEdges: [`${zKey}->${yKey}`, `${yKey}->${xKey}`],
            rotationText: `RL Case (1/2) → rotateRight(${yKey})`,
            nodeVar: yKey,
            bfVar: b,
            rotVar: `RL(1/2): rotateRight(${yKey})`
        });

        node.right = rotateRightPure(node.right);
        updateHeight(node);

        addStep({
            line: 34,
            type: "swap",
            action: `RL Case at ${zKey} (Step 2/2): rotateLeft(${zKey})`,
            values: `z = ${zKey}, new right child = ${node.right.key}`,
            why: "Now the nodes form a straight right-right line, so Step 2 rotates Left around z.",
            message: `RL Step 2: Rotate Left around ${zKey} so ${xKey} becomes the subtree root.`,
            unbalancedKey: zKey,
            rotatedKeys: [xKey, yKey],
            pathEdges: [`${zKey}->${xKey}`, `${xKey}->${yKey}`],
            rotationText: `RL Case (2/2) → rotateLeft(${zKey})`,
            nodeVar: zKey,
            bfVar: getBf(node),
            rotVar: `RL(2/2): rotateLeft(${zKey})`
        });

        const newSub = rotateLeftPure(node);
        liveRoot = replaceSubtree(liveRoot, zKey, newSub);

        addStep({
            line: 20,
            type: "done",
            action: `RL Double Rotation Complete (${xKey} Is Subtree Root)`,
            values: `new subtree root = ${xKey}, left = ${zKey}, right = ${yKey}`,
            why: `${xKey} moved between ${zKey} and ${yKey}, restoring balance.`,
            message: `RL rotation finished: ${xKey} is now parent of ${zKey} and ${yKey}.`,
            rotatedKeys: [xKey, zKey, yKey],
            pathEdges: [`${xKey}->${zKey}`, `${xKey}->${yKey}`],
            rotationText: `Completed RL Double Rotation (${xKey} at top)`,
            nodeVar: xKey,
            bfVar: getBf(newSub),
            rotVar: "RL Done"
        });

        return newSub;
    }

    return node;
}


// ==========================================
// AVL INSERT, SEARCH & DELETE OPERATIONS
// ==========================================

function insertOperation(key) {
    const count = treeCount(liveRoot);

    addStep({
        line: 39,
        type: "call",
        action: `Call insert(root, ${key})`,
        values: `key = ${key}, root = ${liveRoot ? liveRoot.key : "null"}`,
        why: "AVL insert first inserts key like a standard BST, then walks back up the ancestor path calling rebalance(n).",
        message: `Start inserting ${key} into the AVL Tree.`,
        current: liveRoot ? liveRoot.key : null
    });

    if (count >= MAX_NODES && !treeContains(liveRoot, key)) {
        opLog.push(`insert(${key}) → Full`);
        addStep({
            line: 39,
            type: "error",
            action: "Tree Limit Reached",
            values: `nodes = ${count} / ${MAX_NODES}`,
            why: `This visualizer caps the tree at ${MAX_NODES} nodes so the layout stays clear.`,
            message: `Cannot insert ${key}: maximum of ${MAX_NODES} nodes reached.`
        });
        return;
    }

    if (!liveRoot) {
        liveRoot = createNode(key);
        opLog.push(`insert(${key})`);
        addStep({
            line: 40,
            type: "done",
            action: `Created Root Node ${key}`,
            values: `key = ${key}, height = 1, bf = 0`,
            why: "Tree was empty, so new Node(key) becomes the root with height 1 and bf = 0.",
            message: `Inserted ${key} as root.`,
            newKey: key,
            returned: key,
            nodeVar: key,
            bfVar: 0
        });
        return;
    }

    const path = [];
    const edges = [];
    let curr = liveRoot;

    while (curr) {
        path.push(curr);

        if (key === curr.key) {
            opLog.push(`insert(${key}) → Duplicate`);
            addStep({
                line: 43,
                type: "done",
                action: "Duplicate Ignored",
                values: `key == node.key (${key})`,
                why: "AVL trees store unique keys; duplicates are ignored.",
                message: `${key} is already in the tree — duplicate ignored.`,
                current: curr.key,
                foundKey: curr.key,
                pathEdges: edges,
                returned: "duplicate ignored",
                nodeVar: curr.key,
                bfVar: getBf(curr)
            });
            return;
        }

        if (key < curr.key) {
            addStep({
                line: 41,
                type: "compare",
                action: `${key} < ${curr.key} so go left`,
                values: `key = ${key}, node = ${curr.key}`,
                why: "Smaller keys go into the left subtree.",
                message: `${key} < ${curr.key} so go left.`,
                current: curr.key,
                pathEdges: edges,
                nodeVar: curr.key,
                bfVar: getBf(curr)
            });
            if (curr.left) edges.push(`${curr.key}->${curr.left.key}`);
            curr = curr.left;
        } else {
            addStep({
                line: 42,
                type: "compare",
                action: `${key} > ${curr.key} so go right`,
                values: `key = ${key}, node = ${curr.key}`,
                why: "Larger keys go into the right subtree.",
                message: `${key} > ${curr.key} so go right.`,
                current: curr.key,
                pathEdges: edges,
                nodeVar: curr.key,
                bfVar: getBf(curr)
            });
            if (curr.right) edges.push(`${curr.key}->${curr.right.key}`);
            curr = curr.right;
        }
    }

    const parent = path[path.length - 1];
    const created = createNode(key);
    if (key < parent.key) parent.left = created;
    else parent.right = created;
    edges.push(`${parent.key}->${key}`);

    // Update heights along path before step-by-step unwind
    for (let i = path.length - 1; i >= 0; i--) {
        updateHeight(path[i]);
    }

    addStep({
        line: 40,
        type: "store",
        action: `Insert Leaf Node ${key}`,
        values: `parent = ${parent.key}, new leaf = ${key} (h = 1, bf = 0)`,
        why: "Reached null pointer and linked new Node(key). Now unwind recursion to update heights and check balance factors.",
        message: `Inserted ${key} under ${parent.key}. Now checking balance along ancestor path.`,
        newKey: key,
        pathEdges: edges,
        nodeVar: key,
        bfVar: 0
    });

    // Unwind ancestors from bottom to top and rebalance
    for (let i = path.length - 1; i >= 0; i--) {
        rebalanceWithSteps(path[i]);
    }

    opLog.push(`insert(${key})`);
    addStep({
        line: 44,
        type: "done",
        action: "insert() & Rebalance Finished",
        values: `root = ${liveRoot.key}, nodes = ${treeCount(liveRoot)}, height = ${treeHeight(liveRoot)}`,
        why: "All ancestors have bf in {-1, 0, +1}, so the AVL tree is balanced.",
        message: `${key} inserted and AVL balance verified.`,
        newKey: key,
        returned: key,
        nodeVar: liveRoot.key,
        bfVar: getBf(liveRoot)
    });
}

function searchOperation(key) {
    addStep({
        line: 39,
        type: "call",
        action: `Call search(root, ${key})`,
        values: `key = ${key}, root = ${liveRoot ? liveRoot.key : "null"}`,
        why: "Because an AVL tree is always balanced, search is guaranteed O(log n) even in the worst case.",
        message: `Start searching for ${key}.`,
        current: liveRoot ? liveRoot.key : null
    });

    if (!liveRoot) {
        opLog.push(`search(${key}) → Empty`);
        addStep({
            line: 40,
            type: "error",
            action: "Tree Is Empty",
            values: "root == null",
            why: "Cannot search an empty tree.",
            message: "Tree is empty! Insert nodes first.",
            returned: "not found"
        });
        return;
    }

    let curr = liveRoot;
    const edges = [];

    while (curr) {
        if (key === curr.key) {
            opLog.push(`search(${key}) → Found`);
            addStep({
                line: 40,
                type: "done",
                action: `Found ${key}!`,
                values: `node = ${curr.key}, bf = ${getBf(curr)}, height = ${curr.height}`,
                why: "node.key matches key.",
                message: `Found ${key} in the AVL tree!`,
                foundKey: curr.key,
                pathEdges: edges,
                returned: `found (${key})`,
                nodeVar: curr.key,
                bfVar: getBf(curr)
            });
            return;
        }

        if (key < curr.key) {
            addStep({
                line: 41,
                type: "compare",
                action: `${key} < ${curr.key} so go left`,
                values: `key = ${key}, node = ${curr.key}`,
                why: "Target is smaller than current node.",
                message: `${key} < ${curr.key} so go left.`,
                current: curr.key,
                pathEdges: edges,
                nodeVar: curr.key,
                bfVar: getBf(curr)
            });
            if (curr.left) edges.push(`${curr.key}->${curr.left.key}`);
            curr = curr.left;
        } else {
            addStep({
                line: 42,
                type: "compare",
                action: `${key} > ${curr.key} so go right`,
                values: `key = ${key}, node = ${curr.key}`,
                why: "Target is larger than current node.",
                message: `${key} > ${curr.key} so go right.`,
                current: curr.key,
                pathEdges: edges,
                nodeVar: curr.key,
                bfVar: getBf(curr)
            });
            if (curr.right) edges.push(`${curr.key}->${curr.right.key}`);
            curr = curr.right;
        }
    }

    opLog.push(`search(${key}) → Not Found`);
    addStep({
        line: 40,
        type: "error",
        action: `${key} Not Found`,
        values: `node == null, key = ${key}`,
        why: "Reached null pointer — key is not in the AVL tree.",
        message: `${key} was not found.`,
        pathEdges: edges,
        returned: "not found"
    });
}

function deleteOperation(key) {
    addStep({
        line: 47,
        type: "call",
        action: `Call delete(root, ${key})`,
        values: `key = ${key}, root = ${liveRoot ? liveRoot.key : "null"}`,
        why: "AVL delete removes the node like a BST, then rebalances every ancestor on the way back up to the root.",
        message: `Start deleting ${key} from the AVL Tree.`,
        current: liveRoot ? liveRoot.key : null
    });

    if (!liveRoot) {
        opLog.push(`delete(${key}) → Empty`);
        addStep({
            line: 48,
            type: "error",
            action: "Tree Is Empty",
            values: "root == null",
            why: "Cannot delete from an empty tree.",
            message: "Tree is empty!",
            returned: "not found"
        });
        return;
    }

    const path = [];
    const edges = [];
    let curr = liveRoot;

    while (curr && curr.key !== key) {
        path.push(curr);
        if (key < curr.key) {
            addStep({
                line: 49,
                type: "compare",
                action: `${key} < ${curr.key} so go left`,
                values: `key = ${key}, node = ${curr.key}`,
                why: "Search left subtree for node to delete.",
                message: `${key} < ${curr.key} so go left.`,
                current: curr.key,
                pathEdges: edges,
                nodeVar: curr.key,
                bfVar: getBf(curr)
            });
            if (curr.left) edges.push(`${curr.key}->${curr.left.key}`);
            curr = curr.left;
        } else {
            addStep({
                line: 50,
                type: "compare",
                action: `${key} > ${curr.key} so go right`,
                values: `key = ${key}, node = ${curr.key}`,
                why: "Search right subtree for node to delete.",
                message: `${key} > ${curr.key} so go right.`,
                current: curr.key,
                pathEdges: edges,
                nodeVar: curr.key,
                bfVar: getBf(curr)
            });
            if (curr.right) edges.push(`${curr.key}->${curr.right.key}`);
            curr = curr.right;
        }
    }

    if (!curr) {
        opLog.push(`delete(${key}) → Not Found`);
        addStep({
            line: 48,
            type: "error",
            action: `${key} Not Found`,
            values: `node == null, key = ${key}`,
            why: "Target key is not in the tree, so nothing is deleted.",
            message: `${key} not found in the AVL tree.`,
            pathEdges: edges,
            returned: "not found"
        });
        return;
    }

    addStep({
        line: 51,
        type: "check",
        action: `Found Node ${key} to Delete`,
        values: `node = ${curr.key}, left = ${curr.left ? curr.left.key : "null"}, right = ${curr.right ? curr.right.key : "null"}`,
        why: "Remove node using standard BST rules (0/1 child or 2 children with inorder successor), then rebalance ancestors.",
        message: `Deleting node ${key}.`,
        deleteKey: curr.key,
        pathEdges: edges,
        nodeVar: curr.key,
        bfVar: getBf(curr)
    });

    if (!curr.left || !curr.right) {
        const child = curr.left || curr.right;
        const parent = path.length > 0 ? path[path.length - 1] : null;
        if (!parent) liveRoot = child;
        else if (parent.left === curr) parent.left = child;
        else parent.right = child;
    } else {
        path.push(curr);
        let succParent = curr;
        let succ = curr.right;
        while (succ.left) {
            path.push(succ);
            succParent = succ;
            succ = succ.left;
        }
        const succKey = succ.key;
        if (succParent === curr) curr.right = succ.right;
        else succParent.left = succ.right;
        curr.key = succKey;

        addStep({
            line: 55,
            type: "store",
            action: `Replaced ${key} with Inorder Successor ${succKey}`,
            values: `node.key = ${succKey}`,
            why: "Inorder successor from right subtree replaces the deleted key.",
            message: `Copied inorder successor ${succKey} and removed old successor node.`,
            rotatedKeys: [succKey],
            nodeVar: succKey
        });
    }

    for (let i = path.length - 1; i >= 0; i--) {
        updateHeight(path[i]);
    }

    for (let i = path.length - 1; i >= 0; i--) {
        rebalanceWithSteps(path[i]);
    }

    opLog.push(`delete(${key})`);
    addStep({
        line: 58,
        type: "done",
        action: "delete() & Rebalance Finished",
        values: `deleted = ${key}, size = ${treeCount(liveRoot)}, height = ${treeHeight(liveRoot)}`,
        why: "All ancestors rebalanced after deletion.",
        message: `Deleted ${key} and restored AVL balance.`,
        returned: `deleted ${key}`,
        nodeVar: liveRoot ? liveRoot.key : "null",
        bfVar: liveRoot ? getBf(liveRoot) : 0
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
        emptyText.textContent = "AVL Tree is empty (root = null) — Insert a value or click LL / RR / LR / RL Demo";
        treeSvg.appendChild(emptyText);
        return;
    }

    const pathSet = new Set(step.pathEdges || []);
    const rotSet = new Set(step.rotatedKeys || []);

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
        const isUnb = step.unbalancedKey === node.key || Math.abs(node.bf) > 1;

        if (step.foundKey === node.key) classes.push("is-found");
        else if (step.deleteKey === node.key || isUnb) classes.push("is-unbalanced");
        else if (rotSet.has(node.key)) classes.push("is-rotated");
        else if (step.newKey === node.key) classes.push("is-new");
        else if (step.current === node.key) classes.push("is-current");

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

        const bfStr = node.bf > 0 ? `+${node.bf}` : `${node.bf}`;
        const bfText = svgEl("text", {
            x: node.x,
            y: node.y + 32,
            class: "node-bf" + (Math.abs(node.bf) > 1 ? " is-unbalanced" : "")
        });
        bfText.textContent = `bf=${bfStr} h=${node.height}`;

        g.appendChild(circle);
        g.appendChild(label);
        g.appendChild(bfText);

        if (node.depth === 0) {
            const rootTag = svgEl("text", {
                x: node.x,
                y: node.y - 27,
                class: "node-tag"
            });
            rootTag.textContent = "ROOT";
            g.appendChild(rootTag);
        }

        treeSvg.appendChild(g);
    });
}

function renderAuxStrip(step) {
    if (rotationInfoBox) {
        rotationInfoBox.innerHTML = "";
        const span = document.createElement("span");
        span.className = "array-value" + (step.type === "swap" ? " active-value" : step.type === "error" ? " changed" : "");
        span.textContent = step.rotationText || "All nodes balanced (bf in {-1, 0, +1}).";
        rotationInfoBox.appendChild(span);
    }

    if (inorderBox) {
        inorderBox.innerHTML = "";
        const keys = treeInorder(step.tree);
        if (keys.length === 0) {
            const empty = document.createElement("span");
            empty.className = "tree-aux-empty";
            empty.textContent = "–";
            inorderBox.appendChild(empty);
        } else {
            keys.forEach(k => {
                const chip = document.createElement("span");
                chip.className = "array-value" + (step.newKey === k || step.foundKey === k ? " changed" : "");
                chip.textContent = k;
                inorderBox.appendChild(chip);
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
        valueInput, randomValueBtn, insertBtn, searchBtn, deleteBtn,
        llCaseBtn, rrCaseBtn, lrCaseBtn, rlCaseBtn,
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
    const rootVal = step.tree ? step.tree.key : "null";

    if (pointerInfo) {
        pointerInfo.textContent =
            `root = ${rootVal} · nodes = ${count} · height = ${height}` +
            (step.returned !== null ? ` · returned ${step.returned}` : "");
    }

    if (treeBadge) {
        const unb = step.unbalancedKey !== null;
        treeBadge.className = "stack-badge " + (
            unb ? "is-full" : count === 0 ? "is-empty" : "is-ok"
        );
        treeBadge.textContent = count === 0
            ? "EMPTY (0 nodes)"
            : unb
                ? `Imbalance at ${step.unbalancedKey} · ${count} / ${MAX_NODES} nodes`
                : `Balanced · ${count} / ${MAX_NODES} nodes · height ${height}`;
    }

    if (returnBadge) {
        returnBadge.hidden = step.returned === null;
        returnBadge.textContent = step.returned === null ? "" : `Result: ${step.returned}`;
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
        if (!treeContains(liveRoot, candidate)) return candidate;
    }
    return 35;
}

function buildAvlFromValues(values) {
    let root = null;
    values.slice(0, MAX_NODES).forEach(v => {
        root = avlInsertSilent(root, Number(v));
    });
    return root;
}

function resetTimeline(values) {
    stopAnimation();
    initialValues = [...values];
    liveRoot = buildAvlFromValues(initialValues);
    opLog = [];
    steps = [];
    lastOpStart = 0;

    const inorder = treeInorder(liveRoot);

    addStep({
        line: 1,
        type: "ready",
        action: "Ready to Start",
        values: inorder.length > 0
            ? `Inorder keys: [${inorder.join(", ")}]`
            : "The AVL Tree is empty (root = null).",
        why: "An AVL Tree automatically performs single or double rotations whenever |bf| > 1 so height stays O(log n).",
        message: "Insert or Delete a value, or click LL, RR, LR or RL Demo above.",
        tip: "LL → rotateRight · RR → rotateLeft · LR → rotateLeft + rotateRight · RL → rotateRight + rotateLeft."
    });

    renderStep(0);
    if (window.AlgoLab && AlgoLab.showHint) {
        AlgoLab.showHint(defaultHint(), false);
    }
}

function runRotationDemo(baseKeys, triggerKey) {
    if (isPlaying) return;
    resetTimeline(baseKeys);
    if (valueInput) valueInput.value = triggerKey;
    runOperation(() => insertOperation(triggerKey));
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

if (insertBtn) {
    insertBtn.addEventListener("click", () => {
        const val = readNodeValue();
        if (val !== null) {
            runOperation(() => insertOperation(val));
            if (valueInput) valueInput.value = suggestNextValue();
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        const val = readNodeValue();
        if (val !== null) runOperation(() => searchOperation(val));
    });
}

if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
        const val = readNodeValue();
        if (val !== null) runOperation(() => deleteOperation(val));
    });
}

if (llCaseBtn) llCaseBtn.addEventListener("click", () => runRotationDemo([30, 20], 10));
if (rrCaseBtn) rrCaseBtn.addEventListener("click", () => runRotationDemo([10, 20], 30));
if (lrCaseBtn) lrCaseBtn.addEventListener("click", () => runRotationDemo([30, 10], 20));
if (rlCaseBtn) rlCaseBtn.addEventListener("click", () => runRotationDemo([10, 30], 20));

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
