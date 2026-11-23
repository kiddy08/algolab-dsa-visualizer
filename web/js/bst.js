"use strict";

// ==========================================
// PURE BST LOGIC FUNCTIONS (Testable)
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

function treeInorder(node, out = []) {
    if (!node) return out;
    treeInorder(node.left, out);
    out.push(node.key);
    treeInorder(node.right, out);
    return out;
}

function treePreorder(node, out = []) {
    if (!node) return out;
    out.push(node.key);
    treePreorder(node.left, out);
    treePreorder(node.right, out);
    return out;
}

function treePostorder(node, out = []) {
    if (!node) return out;
    treePostorder(node.left, out);
    treePostorder(node.right, out);
    out.push(node.key);
    return out;
}

function treeLevelOrder(node) {
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

function treeContains(node, key) {
    let curr = node;
    while (curr) {
        if (key === curr.key) return true;
        curr = key < curr.key ? curr.left : curr.right;
    }
    return false;
}

function treeInsertSilent(root, key) {
    if (!root) return createNode(key);
    if (key < root.key) root.left = treeInsertSilent(root.left, key);
    else if (key > root.key) root.right = treeInsertSilent(root.right, key);
    return root;
}

// Compute SVG layout using inorder rank for X and depth for Y
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
const treeCanvasWrap = document.getElementById("treeCanvasWrap");
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

const valueInput = document.getElementById("valueInput");
const randomValueBtn = document.getElementById("randomValueBtn");
const insertBtn = document.getElementById("insertBtn");
const searchBtn = document.getElementById("searchBtn");
const deleteBtn = document.getElementById("deleteBtn");
const minBtn = document.getElementById("minBtn");
const maxBtn = document.getElementById("maxBtn");
const inorderBtn = document.getElementById("inorderBtn");
const preorderBtn = document.getElementById("preorderBtn");
const postorderBtn = document.getElementById("postorderBtn");
const levelorderBtn = document.getElementById("levelorderBtn");
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

// Top-level steps and currentStep so enhance.js works automatically
let steps = [];
let currentStep = 0;
let lastOpStart = 0;
let timer = null;
let isPlaying = false;

function defaultHint() {
    return `Enter a value from 1 to 999 (max ${MAX_NODES} nodes). Duplicates are ignored.`;
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
        tip: data.tip || "Average: O(log n) · Worst (skewed tree): O(n).",

        tree: cloneTree(liveRoot),
        current: data.current ?? null,
        newKey: data.newKey ?? null,
        foundKey: data.foundKey ?? null,
        deleteKey: data.deleteKey ?? null,
        successorKey: data.successorKey ?? null,
        pathEdges: data.pathEdges ? [...data.pathEdges] : [],
        visited: data.visited ? [...data.visited] : [],
        auxState: data.auxState ? [...data.auxState] : [],
        auxKind: data.auxKind || "Stack",
        returned: data.returned ?? null,
        nodeVar: data.nodeVar ?? (data.current !== undefined && data.current !== null ? data.current : "null"),
        keyVar: data.keyVar ?? null,
        history: [...opLog]
    });
}


// ==========================================
// BST OPERATIONS (Step-by-Step Builders)
// ==========================================

function insertOperation(key) {
    const count = treeCount(liveRoot);

    addStep({
        line: 7,
        type: "call",
        action: `Call insert(root, ${key})`,
        values: `key = ${key}, root = ${liveRoot ? liveRoot.key : "null"}`,
        why: "insert walks down the tree from the root to find the empty spot where key belongs.",
        message: `Start inserting ${key} into the BST.`,
        tip: "Average insert is O(log n); worst case on a skewed tree is O(n).",
        current: liveRoot ? liveRoot.key : null,
        keyVar: key
    });

    if (count >= MAX_NODES && !treeContains(liveRoot, key)) {
        addStep({
            line: 7,
            type: "error",
            action: "Tree Limit Reached",
            values: `nodes = ${count} / ${MAX_NODES}`,
            why: `This visualizer caps the tree at ${MAX_NODES} nodes so the layout stays readable.`,
            message: `Cannot insert ${key}: maximum of ${MAX_NODES} nodes reached.`,
            tip: "Delete a node or click Clear / New Random Tree first.",
            keyVar: key
        });
        opLog.push(`insert(${key}) → Full`);
        return;
    }

    if (!liveRoot) {
        liveRoot = createNode(key);
        opLog.push(`insert(${key})`);
        addStep({
            line: 8,
            type: "store",
            action: "Create Root Node",
            values: `node == null → new Node(${key})`,
            why: "The tree is empty, so the new node becomes the root.",
            message: `Inserted ${key} as the root node.`,
            tip: "Base case of recursive insert: null is replaced by new Node(key).",
            newKey: key,
            returned: key,
            nodeVar: key,
            keyVar: key
        });
        return;
    }

    let curr = liveRoot;
    let parent = null;
    let goLeft = false;
    const edges = [];

    while (curr) {
        addStep({
            line: 8,
            type: "check",
            action: `At Node ${curr.key}`,
            values: `node = ${curr.key}, key = ${key}`,
            why: "node is not null, so compare key with node.key to choose left or right.",
            message: `Inspect node ${curr.key}.`,
            current: curr.key,
            pathEdges: edges,
            nodeVar: curr.key,
            keyVar: key
        });

        if (key === curr.key) {
            opLog.push(`insert(${key}) → Duplicate`);
            addStep({
                line: 13,
                type: "done",
                action: "Duplicate Ignored",
                values: `key = ${key} == node.key (${curr.key})`,
                why: "A standard BST stores distinct keys. When key == node.key, the tree is unchanged.",
                message: `${key} is already in the tree — duplicates ignored.`,
                tip: "Duplicates are ignored so every key in the BST remains unique.",
                current: curr.key,
                foundKey: curr.key,
                pathEdges: edges,
                returned: "duplicate ignored",
                nodeVar: curr.key,
                keyVar: key
            });
            return;
        }

        if (key < curr.key) {
            addStep({
                line: 9,
                type: "compare",
                action: `${key} < ${curr.key} so go left`,
                values: `key (${key}) < node.key (${curr.key})`,
                why: "Smaller keys belong in the left subtree.",
                message: `${key} < ${curr.key} so go left.`,
                current: curr.key,
                pathEdges: edges,
                nodeVar: curr.key,
                keyVar: key
            });

            parent = curr;
            goLeft = true;
            if (curr.left) {
                edges.push(`${curr.key}->${curr.left.key}`);
            }
            curr = curr.left;
        } else {
            addStep({
                line: 11,
                type: "compare",
                action: `${key} > ${curr.key} so go right`,
                values: `key (${key}) > node.key (${curr.key})`,
                why: "Larger keys belong in the right subtree.",
                message: `${key} > ${curr.key} so go right.`,
                current: curr.key,
                pathEdges: edges,
                nodeVar: curr.key,
                keyVar: key
            });

            parent = curr;
            goLeft = false;
            if (curr.right) {
                edges.push(`${curr.key}->${curr.right.key}`);
            }
            curr = curr.right;
        }
    }

    const created = createNode(key);
    if (goLeft) parent.left = created;
    else parent.right = created;
    edges.push(`${parent.key}->${key}`);

    opLog.push(`insert(${key})`);

    addStep({
        line: 8,
        type: "store",
        action: `Insert Node ${key}`,
        values: `parent = ${parent.key} (${goLeft ? "left" : "right"} child = ${key})`,
        why: "We reached a null child pointer, so new Node(key) is linked here.",
        message: `Created node ${key} as the ${goLeft ? "left" : "right"} child of ${parent.key}.`,
        newKey: key,
        pathEdges: edges,
        returned: key,
        nodeVar: key,
        keyVar: key
    });

    addStep({
        line: 13,
        type: "done",
        action: "insert() Finished",
        values: `root = ${liveRoot.key}, size = ${treeCount(liveRoot)}, height = ${treeHeight(liveRoot)}`,
        why: "Recursive calls return up the path and keep existing ancestor links intact.",
        message: `${key} inserted. Tree now has ${treeCount(liveRoot)} node(s).`,
        newKey: key,
        pathEdges: edges,
        returned: key,
        nodeVar: liveRoot.key,
        keyVar: key
    });
}

function searchOperation(key) {
    addStep({
        line: 16,
        type: "call",
        action: `Call search(root, ${key})`,
        values: `key = ${key}, root = ${liveRoot ? liveRoot.key : "null"}`,
        why: "search compares key with each node starting at root and halves the search space at each level.",
        message: `Start searching for ${key}.`,
        current: liveRoot ? liveRoot.key : null,
        keyVar: key
    });

    if (!liveRoot) {
        opLog.push(`search(${key}) → Empty`);
        addStep({
            line: 17,
            type: "error",
            action: "Tree Is Empty",
            values: `node = null, key = ${key}`,
            why: "Cannot find any key when root is null.",
            message: `Tree is empty! ${key} not found.`,
            tip: "Insert some values first before searching.",
            returned: "not found",
            nodeVar: "null",
            keyVar: key
        });
        return;
    }

    let curr = liveRoot;
    const edges = [];
    const visited = [];

    while (curr) {
        visited.push(curr.key);

        if (curr.key === key) {
            opLog.push(`search(${key}) → Found`);
            addStep({
                line: 17,
                type: "done",
                action: `Found ${key}!`,
                values: `node.key == key (${key})`,
                why: "node.key matches key, so search returns this node immediately.",
                message: `Found ${key} in the tree!`,
                current: curr.key,
                foundKey: curr.key,
                pathEdges: edges,
                visited,
                returned: `found (${key})`,
                nodeVar: curr.key,
                keyVar: key
            });
            return;
        }

        if (key < curr.key) {
            addStep({
                line: 19,
                type: "compare",
                action: `${key} < ${curr.key} so go left`,
                values: `key = ${key}, node = ${curr.key}`,
                why: "Because key < node.key, the target can only be in the left subtree.",
                message: `${key} < ${curr.key} so go left.`,
                current: curr.key,
                pathEdges: edges,
                visited,
                nodeVar: curr.key,
                keyVar: key
            });
            if (curr.left) edges.push(`${curr.key}->${curr.left.key}`);
            curr = curr.left;
        } else {
            addStep({
                line: 21,
                type: "compare",
                action: `${key} > ${curr.key} so go right`,
                values: `key = ${key}, node = ${curr.key}`,
                why: "Because key > node.key, the target can only be in the right subtree.",
                message: `${key} > ${curr.key} so go right.`,
                current: curr.key,
                pathEdges: edges,
                visited,
                nodeVar: curr.key,
                keyVar: key
            });
            if (curr.right) edges.push(`${curr.key}->${curr.right.key}`);
            curr = curr.right;
        }
    }

    opLog.push(`search(${key}) → Not Found`);
    addStep({
        line: 17,
        type: "error",
        action: `${key} Not Found`,
        values: `node == null, key = ${key}`,
        why: "We reached a null pointer where key should have been, so key is not in the BST.",
        message: `Reached null — ${key} is not in the tree.`,
        pathEdges: edges,
        visited,
        returned: "not found",
        nodeVar: "null",
        keyVar: key
    });
}

function deleteOperation(key) {
    addStep({
        line: 24,
        type: "call",
        action: `Call delete(root, ${key})`,
        values: `key = ${key}, root = ${liveRoot ? liveRoot.key : "null"}`,
        why: "delete locates the target node, then removes it based on whether it has 0, 1, or 2 children.",
        message: `Start deleting ${key} from the BST.`,
        current: liveRoot ? liveRoot.key : null,
        keyVar: key
    });

    if (!liveRoot) {
        opLog.push(`delete(${key}) → Empty`);
        addStep({
            line: 25,
            type: "error",
            action: "Tree Is Empty",
            values: "root == null",
            why: "An empty tree has no nodes to delete.",
            message: `Cannot delete ${key}: the tree is empty.`,
            returned: "not found",
            nodeVar: "null",
            keyVar: key
        });
        return;
    }

    let curr = liveRoot;
    let parent = null;
    let isLeft = false;
    const edges = [];

    while (curr && curr.key !== key) {
        if (key < curr.key) {
            addStep({
                line: 26,
                type: "compare",
                action: `${key} < ${curr.key} so go left`,
                values: `key = ${key}, node = ${curr.key}`,
                why: "Target key is smaller than current node, so search left subtree.",
                message: `${key} < ${curr.key} so go left.`,
                current: curr.key,
                pathEdges: edges,
                nodeVar: curr.key,
                keyVar: key
            });
            if (curr.left) edges.push(`${curr.key}->${curr.left.key}`);
            parent = curr;
            isLeft = true;
            curr = curr.left;
        } else {
            addStep({
                line: 28,
                type: "compare",
                action: `${key} > ${curr.key} so go right`,
                values: `key = ${key}, node = ${curr.key}`,
                why: "Target key is larger than current node, so search right subtree.",
                message: `${key} > ${curr.key} so go right.`,
                current: curr.key,
                pathEdges: edges,
                nodeVar: curr.key,
                keyVar: key
            });
            if (curr.right) edges.push(`${curr.key}->${curr.right.key}`);
            parent = curr;
            isLeft = false;
            curr = curr.right;
        }
    }

    if (!curr) {
        opLog.push(`delete(${key}) → Not Found`);
        addStep({
            line: 25,
            type: "error",
            action: `${key} Not Found`,
            values: `node == null, key = ${key}`,
            why: "The search reached null without finding key, so nothing is deleted.",
            message: `${key} is not in the BST.`,
            pathEdges: edges,
            returned: "not found",
            nodeVar: "null",
            keyVar: key
        });
        return;
    }

    addStep({
        line: 30,
        type: "check",
        action: `Target Node ${key} Found`,
        values: `node = ${curr.key}, left = ${curr.left ? curr.left.key : "null"}, right = ${curr.right ? curr.right.key : "null"}`,
        why: "We found the node to delete. Now check how many children it has.",
        message: `Found node ${key}. Checking its children.`,
        deleteKey: curr.key,
        pathEdges: edges,
        nodeVar: curr.key,
        keyVar: key
    });

    // Case 1: Leaf node (no children)
    if (!curr.left && !curr.right) {
        addStep({
            line: 31,
            type: "shrink",
            action: "Case 1: Delete Leaf Node",
            values: `node = ${curr.key} (left = null, right = null)`,
            why: "A leaf node has no children, so we simply unlink it by returning null to its parent.",
            message: `${curr.key} is a leaf node — remove it directly.`,
            deleteKey: curr.key,
            pathEdges: edges,
            nodeVar: curr.key,
            keyVar: key
        });

        if (!parent) liveRoot = null;
        else if (isLeft) parent.left = null;
        else parent.right = null;

        opLog.push(`delete(${key})`);
        addStep({
            line: 37,
            type: "done",
            action: "delete() Finished",
            values: `deleted = ${key}, size = ${treeCount(liveRoot)}`,
            why: "Leaf node removed and parent link updated.",
            message: `Deleted leaf node ${key}.`,
            returned: `deleted ${key}`,
            nodeVar: liveRoot ? liveRoot.key : "null",
            keyVar: key
        });
        return;
    }

    // Case 2: One child
    if (!curr.left || !curr.right) {
        const child = curr.left || curr.right;
        const line = !curr.left ? 31 : 32;

        addStep({
            line,
            type: "shrink",
            action: "Case 2: Node Has One Child",
            values: `node = ${curr.key}, replacement child = ${child.key}`,
            why: "When a node has only one child, that child moves up to take its place.",
            message: `Replace ${curr.key} with its only child ${child.key}.`,
            deleteKey: curr.key,
            newKey: child.key,
            pathEdges: edges,
            nodeVar: curr.key,
            keyVar: key
        });

        if (!parent) liveRoot = child;
        else if (isLeft) parent.left = child;
        else parent.right = child;

        opLog.push(`delete(${key})`);
        addStep({
            line: 37,
            type: "done",
            action: "delete() Finished",
            values: `deleted = ${key}, child ${child.key} linked up`,
            why: "The single child subtree is now connected directly to the parent.",
            message: `Deleted ${key}; ${child.key} took its place.`,
            newKey: child.key,
            returned: `deleted ${key}`,
            nodeVar: child.key,
            keyVar: key
        });
        return;
    }

    // Case 3: Two children -> find inorder successor (min of right subtree)
    let succParent = curr;
    let succ = curr.right;
    const succEdges = [...edges, `${curr.key}->${succ.key}`];

    addStep({
        line: 33,
        type: "call",
        action: "Case 3: Two Children — Find Inorder Successor",
        values: `node = ${curr.key}, start at right child ${succ.key}`,
        why: "A node with two children is replaced by its inorder successor (the smallest key in its right subtree).",
        message: `Enter right subtree at ${succ.key} and walk left to find the minimum.`,
        deleteKey: curr.key,
        current: succ.key,
        pathEdges: succEdges,
        nodeVar: succ.key,
        keyVar: key
    });

    while (succ.left) {
        succEdges.push(`${succ.key}->${succ.left.key}`);
        succParent = succ;
        succ = succ.left;

        addStep({
            line: 41,
            type: "compare",
            action: `Move Left to ${succ.key}`,
            values: `succ = ${succ.key}`,
            why: "findMin keeps following left pointers until node.left is null.",
            message: `Walk left to ${succ.key}.`,
            deleteKey: curr.key,
            current: succ.key,
            pathEdges: succEdges,
            nodeVar: succ.key,
            keyVar: key
        });
    }

    const succKey = succ.key;

    addStep({
        line: 33,
        type: "read",
        action: `Inorder Successor Is ${succKey}`,
        values: `succ = ${succKey} (smallest in right subtree)`,
        why: "succ.left is null, so succ is the smallest key greater than the deleted node.",
        message: `Found inorder successor ${succKey}.`,
        deleteKey: curr.key,
        successorKey: succKey,
        pathEdges: succEdges,
        nodeVar: succKey,
        keyVar: key
    });

    // Unlink successor and copy its key into curr
    if (succParent === curr) {
        curr.right = succ.right;
    } else {
        succParent.left = succ.right;
    }
    curr.key = succKey;

    addStep({
        line: 34,
        type: "store",
        action: `Copy Successor ${succKey} & Remove Old Successor`,
        values: `node.key = ${succKey}, delete(${succKey}) from right subtree`,
        why: "We copy succ.key into the target node and unlink the duplicate successor node from the right subtree.",
        message: `Copied ${succKey} into the node and removed the old successor node.`,
        successorKey: succKey,
        returned: `deleted ${key}`,
        nodeVar: succKey,
        keyVar: key
    });

    opLog.push(`delete(${key})`);

    addStep({
        line: 37,
        type: "done",
        action: "delete() Finished",
        values: `deleted = ${key}, replaced by ${succKey}`,
        why: "BST ordering still holds: everything on the left is smaller than the successor and everything on the right is larger.",
        message: `Deleted ${key} (replaced by inorder successor ${succKey}).`,
        newKey: succKey,
        returned: `deleted ${key}`,
        nodeVar: succKey,
        keyVar: key
    });
}

function minMaxOperation(isMin) {
    const label = isMin ? "findMin" : "findMax";
    const dir = isMin ? "left" : "right";

    addStep({
        line: 40,
        type: "call",
        action: `Call ${label}(root)`,
        values: `root = ${liveRoot ? liveRoot.key : "null"}`,
        why: `The ${isMin ? "minimum" : "maximum"} key in a BST is always at the ${dir}most node.`,
        message: `Start searching for the ${isMin ? "minimum" : "maximum"} value.`,
        current: liveRoot ? liveRoot.key : null
    });

    if (!liveRoot) {
        opLog.push(`${label}() → Empty`);
        addStep({
            line: 40,
            type: "error",
            action: "Tree Is Empty",
            values: "root == null",
            why: "An empty tree has no minimum or maximum.",
            message: "Tree is empty! Insert nodes first.",
            returned: "empty"
        });
        return;
    }

    let curr = liveRoot;
    const edges = [];

    while (curr[dir]) {
        const next = curr[dir];
        edges.push(`${curr.key}->${next.key}`);
        addStep({
            line: 41,
            type: "compare",
            action: `Go ${dir} from ${curr.key} to ${next.key}`,
            values: `node = ${curr.key}, node.${dir} = ${next.key}`,
            why: `node.${dir} is not null, so keep moving ${dir}.`,
            message: `Move ${dir} to ${next.key}.`,
            current: curr.key,
            pathEdges: edges,
            nodeVar: curr.key
        });
        curr = next;
    }

    opLog.push(`${label}() → ${curr.key}`);
    addStep({
        line: 42,
        type: "done",
        action: `${isMin ? "Minimum" : "Maximum"} Is ${curr.key}`,
        values: `node.${dir} == null → return ${curr.key}`,
        why: `There is no further ${dir} child, so ${curr.key} is the ${isMin ? "smallest" : "largest"} key.`,
        message: `${isMin ? "Minimum" : "Maximum"} value in the BST is ${curr.key}.`,
        foundKey: curr.key,
        pathEdges: edges,
        returned: curr.key,
        nodeVar: curr.key
    });
}

function traversalOperation(kind) {
    const names = {
        inorder: "Inorder (Left, Root, Right)",
        preorder: "Preorder (Root, Left, Right)",
        postorder: "Postorder (Left, Right, Root)",
        levelorder: "Level-Order (BFS Queue)"
    };

    const auxKind = kind === "levelorder" ? "Queue" : "Call Stack";

    addStep({
        line: 45,
        type: "call",
        action: `Start ${names[kind]}`,
        values: `root = ${liveRoot ? liveRoot.key : "null"}`,
        why: kind === "inorder"
            ? "Inorder traversal on a BST visits keys in sorted ascending order."
            : kind === "preorder"
            ? "Preorder visits each root before its subtrees."
            : kind === "postorder"
            ? "Postorder visits both subtrees before their root."
            : "Level-order uses a FIFO queue to visit nodes level by level from top to bottom.",
        message: `Begin ${names[kind]}.`,
        tip: "Every traversal visits all n nodes in O(n) time.",
        auxKind
    });

    if (!liveRoot) {
        opLog.push(`${kind}() → Empty`);
        addStep({
            line: 46,
            type: "error",
            action: "Tree Is Empty",
            values: "root == null",
            why: "There are no nodes to traverse in an empty tree.",
            message: "Tree is empty! Nothing to traverse.",
            auxKind,
            returned: "[]"
        });
        return;
    }

    const visited = [];

    if (kind === "levelorder") {
        const queue = [liveRoot];
        while (queue.length > 0) {
            const node = queue.shift();
            visited.push(node.key);
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);

            addStep({
                line: 47,
                type: "read",
                action: `Visit Node ${node.key}`,
                values: `visited = [${visited.join(", ")}]`,
                why: "Dequeue the front node, record it, and enqueue its non-null children.",
                message: `Visited ${node.key}. Queue: [${queue.map(n => n.key).join(", ") || "empty"}].`,
                current: node.key,
                visited: [...visited],
                auxState: queue.map(n => n.key),
                auxKind: "Queue",
                nodeVar: node.key
            });
        }
    } else {
        const stack = [];
        function dfs(node) {
            if (!node) return;
            stack.push(node.key);

            if (kind === "preorder") {
                visited.push(node.key);
                addStep({
                    line: 47,
                    type: "read",
                    action: `Visit Node ${node.key}`,
                    values: `visited = [${visited.join(", ")}]`,
                    why: "Preorder visits the current node before recursing left and right.",
                    message: `Visited ${node.key}.`,
                    current: node.key,
                    visited: [...visited],
                    auxState: [...stack],
                    auxKind: "Call Stack",
                    nodeVar: node.key
                });
            }

            dfs(node.left);

            if (kind === "inorder") {
                visited.push(node.key);
                addStep({
                    line: 47,
                    type: "read",
                    action: `Visit Node ${node.key}`,
                    values: `visited = [${visited.join(", ")}]`,
                    why: "Inorder visits the node after its left subtree and before its right subtree.",
                    message: `Visited ${node.key}.`,
                    current: node.key,
                    visited: [...visited],
                    auxState: [...stack],
                    auxKind: "Call Stack",
                    nodeVar: node.key
                });
            }

            dfs(node.right);

            if (kind === "postorder") {
                visited.push(node.key);
                addStep({
                    line: 47,
                    type: "read",
                    action: `Visit Node ${node.key}`,
                    values: `visited = [${visited.join(", ")}]`,
                    why: "Postorder visits the node after both left and right subtrees have finished.",
                    message: `Visited ${node.key}.`,
                    current: node.key,
                    visited: [...visited],
                    auxState: [...stack],
                    auxKind: "Call Stack",
                    nodeVar: node.key
                });
            }

            stack.pop();
        }
        dfs(liveRoot);
    }

    opLog.push(`${kind}() → [${visited.join(", ")}]`);
    addStep({
        line: 48,
        type: "done",
        action: `${names[kind]} Complete`,
        values: `Order: [${visited.join(", ")}]`,
        why: "All nodes have been visited once.",
        message: `Finished traversal: [${visited.join(", ")}].`,
        visited: [...visited],
        auxState: [],
        auxKind,
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
        emptyText.textContent = "Tree is empty (root = null) — Insert a value above";
        treeSvg.appendChild(emptyText);
        return;
    }

    const pathSet = new Set(step.pathEdges || []);
    const visitedSet = new Set(step.visited || []);

    // Draw edges first
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
        if (step.foundKey === node.key) classes.push("is-found");
        else if (step.deleteKey === node.key) classes.push("is-delete");
        else if (step.successorKey === node.key) classes.push("is-successor");
        else if (step.newKey === node.key) classes.push("is-new");
        else if (step.current === node.key) classes.push("is-current");
        else if (visitedSet.has(node.key)) classes.push("is-visited");

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

        treeSvg.appendChild(g);
    });
}

function renderAuxStrip(step) {
    if (!visitedBox || !structureBox) return;

    visitedBox.innerHTML = "";
    if (!step.visited || step.visited.length === 0) {
        const span = document.createElement("span");
        span.className = "tree-aux-empty";
        span.textContent = "–";
        visitedBox.appendChild(span);
    } else {
        step.visited.forEach((val, idx) => {
            const chip = document.createElement("span");
            chip.className = "array-value" + (idx === step.visited.length - 1 ? " changed" : "");
            chip.textContent = val;
            visitedBox.appendChild(chip);
        });
    }

    const labelEl = document.getElementById("structureLabel");
    if (labelEl) labelEl.textContent = `${step.auxKind || "Stack"}:`;

    structureBox.innerHTML = "";
    if (!step.auxState || step.auxState.length === 0) {
        const span = document.createElement("span");
        span.className = "tree-aux-empty";
        span.textContent = "empty";
        structureBox.appendChild(span);
    } else {
        step.auxState.forEach(val => {
            const chip = document.createElement("span");
            chip.className = "array-value";
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
        minBtn, maxBtn, inorderBtn, preorderBtn, postorderBtn,
        levelorderBtn, randomTreeBtn, clearBtn, resetBtn, speedSelect
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
        treeBadge.className = "stack-badge " + (
            count >= MAX_NODES ? "is-full" : count === 0 ? "is-empty" : "is-ok"
        );
        treeBadge.textContent = count === 0
            ? "EMPTY (0 nodes)"
            : `${count} / ${MAX_NODES} nodes · height ${height}`;
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
        if (!treeContains(liveRoot, candidate)) return candidate;
    }
    return 55;
}

function buildTreeFromValues(values) {
    let root = null;
    values.slice(0, MAX_NODES).forEach(v => {
        root = treeInsertSilent(root, v);
    });
    return root;
}

function resetTimeline(values) {
    stopAnimation();
    initialValues = [...values];
    liveRoot = buildTreeFromValues(initialValues);
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
            : "The BST is empty (root = null).",
        why: "In a Binary Search Tree, left child keys are smaller and right child keys are larger than the parent.",
        message: "Choose a value and click Insert, Search, Delete, or a Traversal.",
        tip: "Average time is O(log n). Inorder traversal always yields keys in sorted order."
    });

    renderStep(0);
    if (window.AlgoLab && AlgoLab.showHint) {
        AlgoLab.showHint(defaultHint(), false);
    }
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

if (minBtn) minBtn.addEventListener("click", () => runOperation(() => minMaxOperation(true)));
if (maxBtn) maxBtn.addEventListener("click", () => runOperation(() => minMaxOperation(false)));

if (inorderBtn) inorderBtn.addEventListener("click", () => runOperation(() => traversalOperation("inorder")));
if (preorderBtn) preorderBtn.addEventListener("click", () => runOperation(() => traversalOperation("preorder")));
if (postorderBtn) postorderBtn.addEventListener("click", () => runOperation(() => traversalOperation("postorder")));
if (levelorderBtn) levelorderBtn.addEventListener("click", () => runOperation(() => traversalOperation("levelorder")));

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
