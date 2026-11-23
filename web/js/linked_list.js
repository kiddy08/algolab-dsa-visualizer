"use strict";

// ==========================================
// ELEMENTS
// ==========================================

const canvas = document.getElementById("canvas");
const canvasWrap = document.getElementById("canvasWrap");
const codeBox = document.getElementById("codeBox");
const spawnBox = document.getElementById("spawnBox");
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
const listBadge = document.getElementById("listBadge");
const returnBadge = document.getElementById("returnBadge");
const pointerInfo = document.getElementById("pointerInfo");
const historyBox = document.getElementById("historyBox");

const valueInput = document.getElementById("valueInput");
const indexInput = document.getElementById("indexInput");
const randomValueBtn = document.getElementById("randomValueBtn");
const randomListBtn = document.getElementById("randomListBtn");
const clearBtn = document.getElementById("clearBtn");
const autoToggle = document.getElementById("autoToggle");
const speedSelect = document.getElementById("speedSelect");

const startBtn = document.getElementById("startBtn");
const prevBtn = document.getElementById("prevBtn");
const stepBtn = document.getElementById("stepBtn");
const resetBtn = document.getElementById("resetBtn");

const opButtons = {
    insertBeg: document.getElementById("insertBegBtn"),
    insertEnd: document.getElementById("insertEndBtn"),
    insertAt: document.getElementById("insertAtBtn"),
    deleteBeg: document.getElementById("deleteBegBtn"),
    deleteEnd: document.getElementById("deleteEndBtn"),
    deleteAt: document.getElementById("deleteAtBtn"),
    search: document.getElementById("searchBtn")
};


// ==========================================
// SETTINGS AND STATE
// ==========================================

const NODE_W = 76;
const NODE_H = 86;
const GAP = 44;
const START_X = 104;
const TOP_Y = 66;
const HEAD_R = 22;
const MAX_NODES = 10;

const ARROW_COLORS = {
    next: "#6366f1",
    prev: "#0d9488",
    wrap: "#6366f1",
    head: "#7c3aed",
    hot: "#ec4899"
};

// This page shows one list type. The type comes from <body data-list-type="...">
let listType = LL_TYPES[document.body.dataset.listType]
    ? document.body.dataset.listType
    : "singly";

let liveList = [];
let initialNodes = [];
let addrCounter = 0;
let opLog = [];
let currentOp = "node";

let steps = [];
let currentStep = 0;
let lastOpStart = 0;
let timer = null;
let isPlaying = false;
let animationSpeed = 800;

let codeId = `${listType}:node`;
let C = LL_CODE[codeId];
let renderedCodeId = null;
let codeLineEls = [];

const DEFAULT_HINT =
    "Value 1 to 999. Index 0 is the first node. Insert at index 0 or at the end uses the same code as Insert Beg or Insert End.";

const WHY = {
    create: "The node must exist in memory before any pointer can refer to it.",
    link: "The new node first takes over the pointer of the node it will sit in front of.",
    linkPrev: "In a doubly linked list the new node also needs its prev pointer.",
    prev: "The old head must point back to the new node.",
    nextPrev: "The node after the new one must point back to it.",
    ptrNext: "Last, the earlier node points to the new node. This completes the link.",
    head: "HEAD must move so the list starts at the right node.",
    headNew: "The only node becomes the head.",
    headNull: "With no nodes left, head becomes null.",
    headPrev: "head.prev must always point to the last node in a doubly circular list.",
    chkNull: "An empty list needs special handling because there is no node to follow.",
    chkEmpty: "You cannot delete from or search an empty list.",
    chkOne: "A list with only one node needs special handling.",
    chk: "A pointer of a missing node must never be used.",
    selfNext: "In a circular list the last node points back to head, so a lone node points to itself.",
    selfPrev: "In a doubly circular list a lone node is its own previous node too.",
    tail: "The last node is needed to keep the circle closed.",
    tailNext: "The last node must point to the new first node.",
    ptr: "ptr is a helper pointer that walks along the list.",
    loop: "The loop condition decides when ptr has reached the right place.",
    move: "ptr moves to the next node.",
    wrap: "The last node must point back to head to close the circle.",
    cut: "Changing one pointer unlinks the node. Nothing points to it any more.",
    cutPrev: "The prev pointer of the next node must skip the deleted node too.",
    idx: "i counts the index of the node being checked.",
    cmp: "Each node is compared with the key we are looking for.",
    ret: "A match ends the search at once.",
    inc: "Move on to the next node and the next index.",
    miss: "Every node was checked and none matched.",
    __end: "The operation is complete. The list is consistent again."
};

function tipFor(op, type) {
    const info = LL_TYPES[type];

    const tips = {
        node: `Each node holds data and ${info.doubly ? "next and prev pointers" : "a next pointer"}${info.circular ? ". The list is circular, so there is no null at the end." : ". The last node points to null."}`,
        insertBeg: info.circular && !info.doubly
            ? "A singly circular list must find the tail first, so insert at the beginning is O(n)."
            : "Insert at the beginning is O(1): no node has to move.",
        insertEnd: info.circular && info.doubly
            ? "head.prev is the last node, so insert at the end is O(1)."
            : "Without a tail pointer we walk to the last node, so insert at the end is O(n).",
        insertAt: "We walk to the node before the position (O(n)). Linking the new node is O(1).",
        deleteBeg: info.circular && !info.doubly
            ? "A singly circular list must find the tail first, so delete at the beginning is O(n)."
            : "Delete at the beginning is O(1).",
        deleteEnd: info.circular && info.doubly
            ? "head.prev is the last node, so delete at the end is O(1)."
            : "We walk to the end of the list, so delete at the end is O(n).",
        deleteAt: "We walk to the position (O(n)). Unlinking the node is O(1).",
        search: "Linear search checks the nodes one by one, so it is O(n)."
    };

    return tips[op] || tips.node;
}

function chipType(step) {
    if (step.error) return "error";
    if (step.key === null) return "ready";

    const kinds = {
        create: "call",
        chk: "check", chkNull: "check", chkEmpty: "check", chkOne: "check",
        cmp: "check", loop: "check",
        ptr: "init", tail: "init", idx: "init",
        move: "shift", inc: "shift",
        ret: "read", miss: "read",
        __end: "done"
    };

    return kinds[step.key] || "grow";
}


// ==========================================
// HELPERS
// ==========================================

function typeInfo() {
    return LL_TYPES[listType];
}

function nextAddr() {
    const code = 0x1A + ((addrCounter * 0x11) % 0xE0);

    addrCounter += 1;

    return "0x" + code.toString(16).toUpperCase();
}

function makeNode(value) {
    return { addr: nextAddr(), value };
}

function begin(op) {
    currentOp = op;
    codeId = `${listType}:${op}`;
    C = LL_CODE[codeId];
}

function lines(keys) {
    return [].concat(keys).map(key => {
        if (!(key in C.keys)) {
            throw new Error(`Unknown code key "${key}" in ${codeId}`);
        }

        return C.keys[key];
    });
}

function addStep(data) {
    steps.push({
        codeId,
        op: currentOp,
        key: data.key ?? null,
        line: data.line ?? [],
        title: data.title,
        text: data.text,
        error: data.error ?? false,
        vars: data.vars ?? {},

        type: listType,
        nodes: liveList.map(node => ({ ...node })),
        head: data.head ?? (liveList.length > 0 ? 0 : -1),
        scan: data.scan ?? null,
        marks: data.marks ?? [],
        hotNext: data.hotNext ?? [],
        hotPrev: data.hotPrev ?? [],
        spawn: data.spawn ? { ...data.spawn } : null,
        result: data.result ?? null,
        returned: data.returned ?? null,
        history: [...opLog]
    });
}

function st(keys, data) {
    addStep({
        ...data,
        key: [].concat(keys)[0],
        line: lines(keys)
    });
}

function newCtx(value) {
    const temp = makeNode(value);

    const ctx = {
        temp,
        next: "null",
        prev: "null",
        status: "NODE CREATED"
    };

    ctx.sp = () => ({
        node: { ...temp },
        next: ctx.next,
        prev: ctx.prev,
        status: ctx.status,
        kind: "new"
    });

    return ctx;
}

function freed(node, status) {
    return { node: { ...node }, next: null, prev: null, status, kind: "free" };
}

function done(text, extra = {}) {
    st("__end", { title: "Done", text, ...extra });
}


// ==========================================
// INSERT OPERATIONS
// ==========================================

function opInsertBeg(value) {
    begin("insertBeg");

    const t = typeInfo();
    const n = liveList.length;
    const ctx = newCtx(value);
    const A = i => liveList[i].addr;
    const v = extra => ({ temp: value, ...extra });

    st("create", {
        title: "Allocate a new node",
        text: `new Node(${value}) is created on the heap at ${ctx.temp.addr}. Nothing points to it yet. O(1)`,
        vars: v(),
        spawn: ctx.sp()
    });

    if (!t.circular) {
        ctx.next = n > 0 ? A(0) : "null";
        ctx.status = "WAITING TO LINK…";

        st("link", {
            title: "temp.next = head",
            text: n > 0
                ? `The new node's next pointer takes the current head (${A(0)}).`
                : "The list is empty, so temp.next stays null.",
            vars: v({ head: n > 0 ? liveList[0].value : "null" }),
            spawn: ctx.sp()
        });

        if (t.doubly) {
            st("chk", {
                title: "if (head != null)",
                text: n > 0
                    ? "The list has nodes, so the old head needs its prev pointer updated."
                    : "The list is empty, so there is no old head to update.",
                vars: v(),
                spawn: ctx.sp()
            });

            if (n > 0) {
                st("prev", {
                    title: "head.prev = temp",
                    text: "The old head's prev pointer now points back to the new node.",
                    vars: v(),
                    hotPrev: [0],
                    spawn: ctx.sp()
                });
            }
        }

        liveList.unshift(ctx.temp);

        st("head", {
            title: "head = temp",
            text: "HEAD now points to the new node. Insert at the beginning takes O(1).",
            vars: v({ head: value }),
            marks: [{ index: 0, kind: "new" }],
            hotNext: [0],
            hotPrev: t.doubly && n > 0 ? [1] : []
        });
    } else {
        st("chkNull", {
            title: "if (head == null)",
            text: n === 0 ? "The list is empty." : "The list already has nodes.",
            vars: v(),
            spawn: ctx.sp()
        });

        if (n === 0) {
            ctx.next = "self";
            ctx.status = "WAITING TO LINK…";

            st("selfNext", {
                title: "temp.next = temp",
                text: "A single node in a circular list points to itself.",
                vars: v(),
                spawn: ctx.sp()
            });

            if (t.doubly) {
                ctx.prev = "self";

                st("selfPrev", {
                    title: "temp.prev = temp",
                    text: "Its prev pointer points to itself as well.",
                    vars: v(),
                    spawn: ctx.sp()
                });
            }

            liveList.unshift(ctx.temp);

            st("headNew", {
                title: "head = temp",
                text: "HEAD points to the only node.",
                vars: v({ head: value }),
                marks: [{ index: 0, kind: "new" }],
                hotNext: [0],
                hotPrev: t.doubly ? [0] : []
            });
        } else if (!t.doubly) {
            st("tail", {
                title: "Node tail = head",
                text: "To change the last node's pointer we must first find the last node. O(n)",
                vars: v({ tail: liveList[0].value }),
                scan: { index: 0, label: "tail" },
                spawn: ctx.sp()
            });

            for (let i = 1; i < n; i++) {
                st(["loop", "move"], {
                    title: "tail = tail.next",
                    text: `tail.next is not head yet, so tail moves on to ${A(i)}.`,
                    vars: v({ tail: liveList[i].value }),
                    scan: { index: i, label: "tail" },
                    spawn: ctx.sp()
                });
            }

            st("loop", {
                title: "tail.next == head",
                text: "tail.next points back to head, so tail is the last node. The loop stops.",
                vars: v({ tail: liveList[n - 1].value }),
                scan: { index: n - 1, label: "tail" },
                hotNext: [n - 1],
                spawn: ctx.sp()
            });

            ctx.next = A(0);
            ctx.status = "WAITING TO LINK…";

            st("link", {
                title: "temp.next = head",
                text: `The new node points to the old head (${A(0)}), so the circle stays closed.`,
                vars: v({ tail: liveList[n - 1].value }),
                scan: { index: n - 1, label: "tail" },
                spawn: ctx.sp()
            });

            st("tailNext", {
                title: "tail.next = temp",
                text: "The last node now points to the new node instead of the old head.",
                vars: v({ tail: liveList[n - 1].value }),
                scan: { index: n - 1, label: "tail" },
                hotNext: [n - 1],
                spawn: ctx.sp()
            });

            liveList.unshift(ctx.temp);

            st("head", {
                title: "head = temp",
                text: "HEAD moves to the new node. Because of the tail search this took O(n).",
                vars: v({ head: value }),
                marks: [{ index: 0, kind: "new" }],
                hotNext: [0, n]
            });
        } else {
            st("tail", {
                title: "Node tail = head.prev",
                text: "In a doubly circular list the last node is head.prev, so no loop is needed. O(1)",
                vars: v({ tail: liveList[n - 1].value }),
                scan: { index: n - 1, label: "tail" },
                hotPrev: [0],
                spawn: ctx.sp()
            });

            ctx.next = A(0);
            ctx.status = "WAITING TO LINK…";

            st("link", {
                title: "temp.next = head",
                text: `The new node points forward to the old head (${A(0)}).`,
                vars: v({ tail: liveList[n - 1].value }),
                scan: { index: n - 1, label: "tail" },
                spawn: ctx.sp()
            });

            ctx.prev = A(n - 1);

            st("linkPrev", {
                title: "temp.prev = tail",
                text: `The new node points back to the last node (${A(n - 1)}).`,
                vars: v({ tail: liveList[n - 1].value }),
                scan: { index: n - 1, label: "tail" },
                spawn: ctx.sp()
            });

            st("tailNext", {
                title: "tail.next = temp",
                text: "The last node now points forward to the new node.",
                vars: v({ tail: liveList[n - 1].value }),
                scan: { index: n - 1, label: "tail" },
                hotNext: [n - 1],
                spawn: ctx.sp()
            });

            st("headPrev", {
                title: "head.prev = temp",
                text: "The old head now points back to the new node.",
                vars: v({ tail: liveList[n - 1].value }),
                hotPrev: [0],
                spawn: ctx.sp()
            });

            liveList.unshift(ctx.temp);

            st("head", {
                title: "head = temp",
                text: "HEAD moves to the new node. The whole insert took O(1).",
                vars: v({ head: value }),
                marks: [{ index: 0, kind: "new" }],
                hotNext: [0, n],
                hotPrev: [0, 1]
            });
        }
    }

    done(`Inserted ${value} at the beginning. The list has ${liveList.length} node(s).`);
}

function opInsertEnd(value) {
    begin("insertEnd");

    const t = typeInfo();
    const n = liveList.length;
    const ctx = newCtx(value);
    const A = i => liveList[i].addr;
    const v = extra => ({ temp: value, ...extra });

    st("create", {
        title: "Allocate a new node",
        text: `new Node(${value}) is created on the heap at ${ctx.temp.addr}. Nothing points to it yet. O(1)`,
        vars: v(),
        spawn: ctx.sp()
    });

    st("chkNull", {
        title: "if (head == null)",
        text: n === 0
            ? "The list is empty, so the new node becomes the head."
            : "The list already has nodes, so we must find the last one.",
        vars: v(),
        spawn: ctx.sp()
    });

    if (n === 0) {
        ctx.status = "WAITING TO LINK…";

        if (t.circular) {
            ctx.next = "self";

            st("selfNext", {
                title: "temp.next = temp",
                text: "A single node in a circular list points to itself.",
                vars: v(),
                spawn: ctx.sp()
            });

            if (t.doubly) {
                ctx.prev = "self";

                st("selfPrev", {
                    title: "temp.prev = temp",
                    text: "Its prev pointer points to itself as well.",
                    vars: v(),
                    spawn: ctx.sp()
                });
            }
        }

        liveList.push(ctx.temp);

        st("headNew", {
            title: "head = temp",
            text: "HEAD points to the only node.",
            vars: v({ head: value }),
            marks: [{ index: 0, kind: "new" }],
            hotNext: t.circular ? [0] : [],
            hotPrev: t.circular && t.doubly ? [0] : []
        });

        done(`Inserted ${value}. The list has 1 node.`);
        return;
    }

    ctx.status = "WAITING TO LINK…";

    if (!t.circular || !t.doubly) {
        const label = "ptr";
        const stopText = t.circular
            ? "ptr.next points back to head, so ptr is the last node. The loop stops."
            : "ptr.next is null, so ptr is the last node. The loop stops.";

        st("ptr", {
            title: "Node ptr = head",
            text: "Start at the head and walk to the last node. O(n)",
            vars: v({ ptr: liveList[0].value }),
            scan: { index: 0, label },
            spawn: ctx.sp()
        });

        for (let i = 1; i < n; i++) {
            st(["loop", "move"], {
                title: "ptr = ptr.next",
                text: `ptr.next is not ${t.circular ? "head" : "null"}, so ptr moves on to ${A(i)}.`,
                vars: v({ ptr: liveList[i].value }),
                scan: { index: i, label },
                spawn: ctx.sp()
            });
        }

        st("loop", {
            title: t.circular ? "ptr.next == head" : "ptr.next == null",
            text: stopText,
            vars: v({ ptr: liveList[n - 1].value }),
            scan: { index: n - 1, label },
            hotNext: [n - 1],
            spawn: ctx.sp()
        });

        liveList.push(ctx.temp);

        st("link", {
            title: "ptr.next = temp",
            text: "The last node now points to the new node.",
            vars: v({ ptr: liveList[n - 1].value }),
            scan: { index: n - 1, label },
            marks: [{ index: n, kind: "new" }],
            hotNext: [n - 1]
        });

        if (t.doubly) {
            st("linkPrev", {
                title: "temp.prev = ptr",
                text: "The new node points back to the old last node.",
                vars: v({ ptr: liveList[n - 1].value }),
                scan: { index: n - 1, label },
                marks: [{ index: n, kind: "new" }],
                hotPrev: [n]
            });
        }

        if (t.circular) {
            st("wrap", {
                title: "temp.next = head",
                text: "The new last node points back to head, so the circle stays closed.",
                vars: v({ ptr: liveList[n - 1].value }),
                marks: [{ index: n, kind: "new" }],
                hotNext: [n]
            });
        }
    } else {
        st("tail", {
            title: "Node tail = head.prev",
            text: "In a doubly circular list the last node is head.prev, so no loop is needed. O(1)",
            vars: v({ tail: liveList[n - 1].value }),
            scan: { index: n - 1, label: "tail" },
            hotPrev: [0],
            spawn: ctx.sp()
        });

        liveList.push(ctx.temp);

        st("link", {
            title: "tail.next = temp",
            text: "The old last node now points forward to the new node.",
            vars: v({ tail: liveList[n - 1].value }),
            scan: { index: n - 1, label: "tail" },
            marks: [{ index: n, kind: "new" }],
            hotNext: [n - 1]
        });

        st("linkPrev", {
            title: "temp.prev = tail",
            text: "The new node points back to the old last node.",
            vars: v({ tail: liveList[n - 1].value }),
            marks: [{ index: n, kind: "new" }],
            hotPrev: [n]
        });

        st("wrap", {
            title: "temp.next = head",
            text: "The new last node points forward to head.",
            vars: v({ tail: liveList[n - 1].value }),
            marks: [{ index: n, kind: "new" }],
            hotNext: [n]
        });

        st("headPrev", {
            title: "head.prev = temp",
            text: "head.prev now points to the new last node.",
            vars: v({ tail: liveList[n - 1].value }),
            marks: [{ index: n, kind: "new" }],
            hotPrev: [0]
        });
    }

    done(`Inserted ${value} at the end. The list has ${liveList.length} node(s).`);
}

function opInsertAt(index, value) {
    begin("insertAt");

    const t = typeInfo();
    const n = liveList.length;
    const ctx = newCtx(value);
    const A = i => liveList[i].addr;
    const v = extra => ({ temp: value, ...extra });

    st("create", {
        title: "Allocate a new node",
        text: `new Node(${value}) is created on the heap at ${ctx.temp.addr}. Nothing points to it yet. O(1)`,
        vars: v(),
        spawn: ctx.sp()
    });

    ctx.status = "WAITING TO LINK…";

    st("ptr", {
        title: "Node ptr = head",
        text: `Start at the head and walk to index ${index - 1}, the node just before the target position.`,
        vars: v({ ptr: liveList[0].value, i: 0 }),
        scan: { index: 0, label: "ptr" },
        spawn: ctx.sp()
    });

    for (let i = 1; i <= index - 1; i++) {
        st(["loop", "move"], {
            title: "ptr = ptr.next",
            text: `i = ${i - 1} is less than index - 1, so ptr moves on to ${A(i)}.`,
            vars: v({ ptr: liveList[i].value, i }),
            scan: { index: i, label: "ptr" },
            spawn: ctx.sp()
        });
    }

    st("loop", {
        title: "Stop one node before the target",
        text: `i reached index - 1, so ptr stops at index ${index - 1}. Scanning to the target position takes O(n).`,
        vars: v({ ptr: liveList[index - 1].value, i: index - 1 }),
        scan: { index: index - 1, label: "ptr" },
        spawn: ctx.sp()
    });

    ctx.next = A(index);

    st("link", {
        title: "temp.next = ptr.next",
        text: `The new node points to the node that is currently at index ${index} (${A(index)}).`,
        vars: v({ ptr: liveList[index - 1].value }),
        scan: { index: index - 1, label: "ptr" },
        spawn: ctx.sp()
    });

    if (t.doubly) {
        ctx.prev = A(index - 1);

        st("linkPrev", {
            title: "temp.prev = ptr",
            text: `The new node points back to ptr (${A(index - 1)}).`,
            vars: v({ ptr: liveList[index - 1].value }),
            scan: { index: index - 1, label: "ptr" },
            spawn: ctx.sp()
        });

        st("nextPrev", {
            title: "ptr.next.prev = temp",
            text: "The node after ptr now points back to the new node.",
            vars: v({ ptr: liveList[index - 1].value }),
            scan: { index: index - 1, label: "ptr" },
            hotPrev: [index],
            spawn: ctx.sp()
        });
    }

    liveList.splice(index, 0, ctx.temp);

    st("ptrNext", {
        title: "ptr.next = temp",
        text: "ptr now points to the new node. The new node is linked into the list.",
        vars: v({ ptr: liveList[index - 1].value }),
        scan: { index: index - 1, label: "ptr" },
        marks: [{ index, kind: "new" }],
        hotNext: [index - 1, index],
        hotPrev: t.doubly ? [index, index + 1] : []
    });

    done(`Inserted ${value} at index ${index}. The list has ${liveList.length} node(s).`);
}


// ==========================================
// DELETE OPERATIONS
// ==========================================

function removeAt(index) {
    return liveList.splice(index, 1)[0];
}

function opDeleteBeg() {
    begin("deleteBeg");

    const t = typeInfo();
    const n = liveList.length;
    const A = i => liveList[i].addr;

    st("chkEmpty", {
        title: "if (head == null) return",
        text: n === 0
            ? "The list is empty. There is nothing to delete."
            : "The list has nodes, so we can delete the first one.",
        error: n === 0
    });

    if (n === 0) return;

    const first = liveList[0];

    if (t.circular) {
        st("chkOne", {
            title: "if (head.next == head)",
            text: n === 1
                ? "head points to itself, so this is the only node. The list becomes empty."
                : "There is more than one node, so the circle must be repaired.",
            marks: [{ index: 0, kind: "read" }]
        });

        if (n === 1) {
            st("headNull", {
                title: "head = null",
                text: "HEAD no longer points to anything. The node is unreachable.",
                marks: [{ index: 0, kind: "remove" }],
                head: -1
            });

            removeAt(0);

            done("The only node was deleted. The list is empty now.", {
                spawn: freed(first, "FREED (GC)"),
        returned: first.value
            });
            return;
        }

        if (!t.doubly) {
            st("tail", {
                title: "Node tail = head",
                text: "The last node must point to the new head, so we find it first. O(n)",
                vars: { tail: liveList[0].value },
                scan: { index: 0, label: "tail" }
            });

            for (let i = 1; i < n; i++) {
                st(["loop", "move"], {
                    title: "tail = tail.next",
                    text: `tail.next is not head yet, so tail moves on to ${A(i)}.`,
                    vars: { tail: liveList[i].value },
                    scan: { index: i, label: "tail" }
                });
            }

            st("loop", {
                title: "tail.next == head",
                text: "tail is the last node. The loop stops.",
                vars: { tail: liveList[n - 1].value },
                scan: { index: n - 1, label: "tail" },
                hotNext: [n - 1]
            });

            st("head", {
                title: "head = head.next",
                text: "HEAD moves to the second node. The old head is about to be dropped.",
                vars: { tail: liveList[n - 1].value },
                scan: { index: n - 1, label: "tail" },
                marks: [{ index: 0, kind: "remove" }],
                head: 1
            });

            removeAt(0);

            st("tailNext", {
                title: "tail.next = head",
                text: "The last node now points to the new head, so the circle is closed again.",
                vars: { tail: liveList[n - 2].value },
                scan: { index: n - 2, label: "tail" },
                hotNext: [n - 2],
                spawn: freed(first, "DETACHED")
            });
        } else {
            st("tail", {
                title: "Node tail = head.prev",
                text: "head.prev is the last node, so no loop is needed. O(1)",
                vars: { tail: liveList[n - 1].value },
                scan: { index: n - 1, label: "tail" },
                hotPrev: [0]
            });

            st("head", {
                title: "head = head.next",
                text: "HEAD moves to the second node. The old head is about to be dropped.",
                vars: { tail: liveList[n - 1].value },
                scan: { index: n - 1, label: "tail" },
                marks: [{ index: 0, kind: "remove" }],
                head: 1
            });

            removeAt(0);

            st("headPrev", {
                title: "head.prev = tail",
                text: "The new head points back to the last node.",
                vars: { tail: liveList[n - 2].value },
                scan: { index: n - 2, label: "tail" },
                hotPrev: [0],
                spawn: freed(first, "DETACHED")
            });

            st("tailNext", {
                title: "tail.next = head",
                text: "The last node points forward to the new head.",
                vars: { tail: liveList[n - 2].value },
                scan: { index: n - 2, label: "tail" },
                hotNext: [n - 2],
                spawn: freed(first, "DETACHED")
            });
        }

        done(`Deleted the first node (${first.value}). The list has ${liveList.length} node(s).`, {
            spawn: freed(first, "FREED (GC)"),
        returned: first.value
        });
        return;
    }

    st("head", {
        title: "head = head.next",
        text: "HEAD moves to the second node. The old head is no longer reachable. O(1)",
        marks: [{ index: 0, kind: "remove" }],
        head: n > 1 ? 1 : -1
    });

    removeAt(0);

    if (t.doubly) {
        st("chk", {
            title: "if (head != null)",
            text: liveList.length > 0
                ? "The list still has nodes, so the new head's prev must be cleared."
                : "The list is empty now, so there is nothing else to update.",
            spawn: freed(first, "DETACHED")
        });

        if (liveList.length > 0) {
            st("prev", {
                title: "head.prev = null",
                text: "The new head no longer points back to the deleted node.",
                hotPrev: [0],
                spawn: freed(first, "DETACHED")
            });
        }
    }

    done(`Deleted the first node (${first.value}). The list has ${liveList.length} node(s).`, {
        spawn: freed(first, "FREED (GC)"),
        returned: first.value
    });
}

function opDeleteEnd() {
    begin("deleteEnd");

    const t = typeInfo();
    const n = liveList.length;
    const A = i => liveList[i].addr;

    st("chkEmpty", {
        title: "if (head == null) return",
        text: n === 0
            ? "The list is empty. There is nothing to delete."
            : "The list has nodes, so we can delete the last one.",
        error: n === 0
    });

    if (n === 0) return;

    const last = liveList[n - 1];

    st("chkOne", {
        title: t.circular ? "if (head.next == head)" : "if (head.next == null)",
        text: n === 1
            ? "There is only one node, so deleting it empties the list."
            : "There is more than one node, so we must find the one before the last.",
        marks: [{ index: 0, kind: "read" }]
    });

    if (n === 1) {
        st("headNull", {
            title: "head = null",
            text: "HEAD no longer points to anything. The node is unreachable.",
            marks: [{ index: 0, kind: "remove" }],
            head: -1
        });

        removeAt(0);

        done("The only node was deleted. The list is empty now.", {
            spawn: freed(last, "FREED (GC)"),
        returned: last.value
        });
        return;
    }

    if (t.circular && t.doubly) {
        st("tail", {
            title: "Node tail = head.prev",
            text: "head.prev is the last node, so no loop is needed. O(1)",
            vars: { tail: last.value },
            scan: { index: n - 1, label: "tail" },
            hotPrev: [0]
        });

        st("cut", {
            title: "tail.prev.next = head",
            text: "The second last node now points forward to head, skipping the last node.",
            vars: { tail: last.value },
            scan: { index: n - 1, label: "tail" },
            marks: [{ index: n - 1, kind: "remove" }],
            hotNext: [n - 2]
        });

        removeAt(n - 1);

        st("headPrev", {
            title: "head.prev = tail.prev",
            text: "head.prev now points to the new last node.",
            hotPrev: [0],
            spawn: freed(last, "DETACHED")
        });
    } else if (t.doubly) {
        st("ptr", {
            title: "Node ptr = head",
            text: "Walk to the last node. O(n)",
            vars: { ptr: liveList[0].value },
            scan: { index: 0, label: "ptr" }
        });

        for (let i = 1; i < n; i++) {
            st(["loop", "move"], {
                title: "ptr = ptr.next",
                text: `ptr.next is not null, so ptr moves on to ${A(i)}.`,
                vars: { ptr: liveList[i].value },
                scan: { index: i, label: "ptr" }
            });
        }

        st("loop", {
            title: "ptr.next == null",
            text: "ptr.next is null, so ptr is the last node. The loop stops.",
            vars: { ptr: last.value },
            scan: { index: n - 1, label: "ptr" }
        });

        st("cut", {
            title: "ptr.prev.next = null",
            text: "The second last node's next pointer becomes null. The last node is cut off.",
            vars: { ptr: last.value },
            scan: { index: n - 1, label: "ptr" },
            marks: [{ index: n - 1, kind: "remove" }],
            hotNext: [n - 2]
        });

        removeAt(n - 1);
    } else {
        const stopTarget = t.circular ? "head" : "null";

        st("ptr", {
            title: "Node ptr = head",
            text: "Walk to the second last node, because we must change its pointer. O(n)",
            vars: { ptr: liveList[0].value },
            scan: { index: 0, label: "ptr" }
        });

        for (let i = 1; i <= n - 2; i++) {
            st(["loop", "move"], {
                title: "ptr = ptr.next",
                text: `ptr.next.next is not ${stopTarget}, so ptr moves on to ${A(i)}.`,
                vars: { ptr: liveList[i].value },
                scan: { index: i, label: "ptr" }
            });
        }

        st("loop", {
            title: `ptr.next.next == ${stopTarget}`,
            text: "ptr is the second last node. The loop stops.",
            vars: { ptr: liveList[n - 2].value },
            scan: { index: n - 2, label: "ptr" },
            hotNext: [n - 2]
        });

        st("cut", {
            title: t.circular ? "ptr.next = head" : "ptr.next = null",
            text: t.circular
                ? "The second last node now points back to head. The last node is cut off."
                : "The second last node's next pointer becomes null. The last node is cut off.",
            vars: { ptr: liveList[n - 2].value },
            scan: { index: n - 2, label: "ptr" },
            marks: [{ index: n - 1, kind: "remove" }],
            hotNext: [n - 2]
        });

        removeAt(n - 1);
    }

    done(`Deleted the last node (${last.value}). The list has ${liveList.length} node(s).`, {
        spawn: freed(last, "FREED (GC)"),
        returned: last.value
    });
}

function opDeleteAt(index) {
    begin("deleteAt");

    const t = typeInfo();
    const n = liveList.length;
    const A = i => liveList[i].addr;
    const target = liveList[index];

    if (!t.doubly) {
        st("ptr", {
            title: "Node ptr = head",
            text: `Walk to index ${index - 1}, the node just before the one we delete. O(n)`,
            vars: { ptr: liveList[0].value, i: 0 },
            scan: { index: 0, label: "ptr" }
        });

        for (let i = 1; i <= index - 1; i++) {
            st(["loop", "move"], {
                title: "ptr = ptr.next",
                text: `i = ${i - 1} is less than index - 1, so ptr moves on to ${A(i)}.`,
                vars: { ptr: liveList[i].value, i },
                scan: { index: i, label: "ptr" }
            });
        }

        st("loop", {
            title: "Stop one node before the target",
            text: `ptr stops at index ${index - 1}. The node to delete is ptr.next (index ${index}).`,
            vars: { ptr: liveList[index - 1].value, i: index - 1 },
            scan: { index: index - 1, label: "ptr" },
            marks: [{ index, kind: "read" }]
        });

        st("cut", {
            title: "ptr.next = ptr.next.next",
            text: "ptr skips the target node and points to the node after it.",
            vars: { ptr: liveList[index - 1].value },
            scan: { index: index - 1, label: "ptr" },
            marks: [{ index, kind: "remove" }],
            hotNext: [index - 1]
        });

        removeAt(index);
    } else {
        st("ptr", {
            title: "Node ptr = head",
            text: `Walk to index ${index}, the node we want to delete. O(n)`,
            vars: { ptr: liveList[0].value, i: 0 },
            scan: { index: 0, label: "ptr" }
        });

        for (let i = 1; i <= index; i++) {
            st(["loop", "move"], {
                title: "ptr = ptr.next",
                text: `i = ${i - 1} is less than index, so ptr moves on to ${A(i)}.`,
                vars: { ptr: liveList[i].value, i },
                scan: { index: i, label: "ptr" }
            });
        }

        st("loop", {
            title: "ptr is the target",
            text: `i reached index, so ptr is at index ${index}, the node to delete.`,
            vars: { ptr: target.value, i: index },
            scan: { index, label: "ptr" },
            marks: [{ index, kind: "remove" }]
        });

        st("cut", {
            title: "ptr.prev.next = ptr.next",
            text: "The node before ptr now points forward to the node after ptr.",
            vars: { ptr: target.value },
            scan: { index, label: "ptr" },
            marks: [{ index, kind: "remove" }],
            hotNext: [index - 1]
        });

        removeAt(index);

        st("cutPrev", {
            title: "ptr.next.prev = ptr.prev",
            text: "The node after ptr now points back to the node before ptr.",
            hotPrev: [index],
            spawn: freed(target, "DETACHED")
        });
    }

    done(`Deleted the node at index ${index} (${target.value}). The list has ${liveList.length} node(s).`, {
        spawn: freed(target, "FREED (GC)"),
        returned: target.value
    });
}


// ==========================================
// SEARCH
// ==========================================

function opSearch(key) {
    begin("search");

    const t = typeInfo();
    const n = liveList.length;
    const A = i => liveList[i].addr;

    if (t.circular) {
        st("chkEmpty", {
            title: "if (head == null) return -1",
            text: n === 0
                ? "The list is empty, so the answer is -1."
                : "The list has nodes, so we can search.",
            vars: { key }
        });

        if (n === 0) {
            st("miss", {
                title: "return -1",
                text: `${key} is not in the list.`,
                vars: { key },
                result: -1,
                returned: -1
            });
            return;
        }
    }

    st("ptr", {
        title: "Node ptr = head",
        text: n > 0
            ? "Start at the head and check every node one by one. O(n)"
            : "head is null, so there is nothing to check.",
        vars: { key, ptr: n > 0 ? liveList[0].value : "null" },
        scan: n > 0 ? { index: 0, label: "ptr" } : null
    });

    if (n === 0) {
        st("loop", {
            title: "while (ptr != null)",
            text: "ptr is null, so the loop does not run.",
            vars: { key, ptr: "null" }
        });

        st("miss", {
            title: "return -1",
            text: `${key} is not in the list.`,
            vars: { key },
            result: -1,
                returned: -1
        });
        return;
    }

    st("idx", {
        title: "int i = 0",
        text: "i counts the index of the node we are checking.",
        vars: { key, ptr: liveList[0].value, i: 0 },
        scan: { index: 0, label: "ptr" }
    });

    for (let i = 0; i < n; i++) {
        const same = liveList[i].value === key;

        st(t.circular ? "cmp" : ["loop", "cmp"], {
            title: `ptr.data == ${key} ?`,
            text: `${liveList[i].value} == ${key}  →  ${same}`,
            vars: { key, ptr: liveList[i].value, i },
            scan: { index: i, label: "ptr" }
        });

        if (same) {
            st("ret", {
                title: `return ${i}`,
                text: `Found ${key} at index ${i} (${A(i)}). The search stops. Worst case it would be O(n).`,
                vars: { key, ptr: liveList[i].value, i },
                scan: { index: i, label: "ptr" },
                marks: [{ index: i, kind: "found" }],
                result: i,
                returned: i
            });
            return;
        }

        const hasNext = i + 1 < n;
        const nextIndex = t.circular ? (i + 1) % n : i + 1;

        st(t.circular ? ["move", "inc", "loop"] : ["move", "inc"], {
            title: "ptr = ptr.next; i++",
            text: hasNext
                ? `Not a match, so ptr moves on to ${A(i + 1)}.`
                : t.circular
                    ? "Not a match. ptr is back at head, so the loop ends."
                    : "Not a match. ptr becomes null, the end of the list.",
            vars: {
                key,
                ptr: hasNext || t.circular ? liveList[nextIndex].value : "null",
                i: i + 1
            },
            scan: hasNext || t.circular ? { index: nextIndex, label: "ptr" } : null
        });
    }

    if (!t.circular) {
        st("loop", {
            title: "while (ptr != null)",
            text: "ptr is null, so the loop stops.",
            vars: { key, ptr: "null", i: n }
        });
    }

    st("miss", {
        title: "return -1",
        text: `${key} is not in the list.`,
        vars: { key },
        result: -1,
                returned: -1
    });
}


// ==========================================
// DRAWING THE LIST
// ==========================================

const SVG_NS = "http://www.w3.org/2000/svg";

function nodeX(index) {
    return START_X + index * (NODE_W + GAP);
}

function svgEl(tag, attributes = {}) {
    const element = document.createElementNS(SVG_NS, tag);

    Object.entries(attributes).forEach(([name, value]) => {
        element.setAttribute(name, value);
    });

    return element;
}

function htmlEl(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

function addMarkers(svg) {
    const defs = svgEl("defs");

    Object.entries(ARROW_COLORS).forEach(([name, color]) => {
        const marker = svgEl("marker", {
            id: `ll-arrow-${name}`,
            viewBox: "0 0 10 10",
            refX: "9",
            refY: "5",
            markerWidth: "7",
            markerHeight: "7",
            orient: "auto"
        });

        marker.appendChild(svgEl("path", { d: "M0,0 L10,5 L0,10 z", fill: color }));
        defs.appendChild(marker);
    });

    svg.appendChild(defs);
}

function drawArrow(svg, d, kind, hot, dashed = false) {
    const color = hot ? "hot" : kind;

    const path = svgEl("path", {
        d,
        fill: "none",
        stroke: ARROW_COLORS[color],
        "stroke-width": hot ? "3.5" : "2.2",
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
        "marker-end": `url(#ll-arrow-${color})`
    });

    if (dashed || kind === "wrap") path.setAttribute("stroke-dasharray", "6 4");

    path.setAttribute("class", `ll-arrow ll-${kind}${hot ? " is-hot" : ""}`);
    svg.appendChild(path);
}

function drawLabel(svg, x, y, text, anchor = "start") {
    const label = svgEl("text", {
        x,
        y,
        "text-anchor": anchor,
        class: "ll-null"
    });

    label.textContent = text;
    svg.appendChild(label);
}

function renderStage(step) {
    const info = LL_TYPES[step.type];
    const n = step.nodes.length;

    const width = Math.max(
        560,
        START_X + n * NODE_W + Math.max(0, n - 1) * GAP + 92
    );
    const height = TOP_Y + NODE_H + 78;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.innerHTML = "";

    const svg = svgEl("svg", { width, height, viewBox: `0 0 ${width} ${height}` });
    svg.setAttribute("class", "ll-svg");
    addMarkers(svg);
    canvas.appendChild(svg);

    const yNext = TOP_Y + NODE_H * (info.doubly ? 0.34 : 0.5);
    const yPrev = TOP_Y + NODE_H * 0.7;
    const hotNext = new Set(step.hotNext);
    const hotPrev = new Set(step.hotPrev);

    // ---- next arrows ----
    for (let i = 0; i < n; i++) {
        const hot = hotNext.has(i);
        const x = nodeX(i);

        if (i < n - 1) {
            drawArrow(svg, `M ${x + NODE_W} ${yNext} L ${nodeX(i + 1) - 3} ${yNext}`, "next", hot);
        } else if (info.circular) {
            const xs = x + NODE_W * 0.7;
            const xe = nodeX(0) + NODE_W * 0.3;
            const topY = TOP_Y - 44;

            drawArrow(
                svg,
                `M ${xs} ${TOP_Y} L ${xs} ${topY} L ${xe} ${topY} L ${xe} ${TOP_Y - 3}`,
                "wrap",
                hot
            );
        } else {
            drawArrow(svg, `M ${x + NODE_W} ${yNext} L ${x + NODE_W + GAP * 0.5} ${yNext}`, "next", hot);
            drawLabel(svg, x + NODE_W + GAP * 0.5 + 5, yNext + 4, "NULL");
        }
    }

    // ---- prev arrows ----
    if (info.doubly) {
        for (let i = 0; i < n; i++) {
            const hot = hotPrev.has(i);
            const x = nodeX(i);

            if (i > 0) {
                drawArrow(svg, `M ${x} ${yPrev} L ${nodeX(i - 1) + NODE_W + 3} ${yPrev}`, "prev", hot);
            } else if (info.circular) {
                const xs = x + NODE_W * 0.3;
                const xe = nodeX(n - 1) + NODE_W * 0.7;
                const bottomY = TOP_Y + NODE_H + 44;

                drawArrow(
                    svg,
                    `M ${xs} ${TOP_Y + NODE_H} L ${xs} ${bottomY} L ${xe} ${bottomY} L ${xe} ${TOP_Y + NODE_H + 3}`,
                    "prev",
                    hot,
                    true
                );
            } else {
                drawArrow(svg, `M ${x} ${yPrev} L ${x - 22} ${yPrev}`, "prev", hot);
                drawLabel(svg, x - 27, yPrev + 4, "NULL", "end");
            }
        }
    }

    // ---- HEAD ----
    const headCenterX = START_X - 66;
    const headIndex = step.head;

    if (n === 0 || headIndex < 0) {
        drawArrow(svg, `M ${headCenterX + HEAD_R} ${yNext} L ${START_X + 30} ${yNext}`, "head", false);
        drawLabel(svg, START_X + 38, yNext + 4, "NULL");
    } else if (headIndex === 0) {
        drawArrow(svg, `M ${headCenterX + HEAD_R} ${yNext} L ${nodeX(0) - 3} ${yNext}`, "head", false);
    } else {
        const topY = TOP_Y - 20;
        const tx = nodeX(headIndex) + NODE_W / 2;

        drawArrow(
            svg,
            `M ${headCenterX} ${yNext - HEAD_R} L ${headCenterX} ${topY} L ${tx} ${topY} L ${tx} ${TOP_Y - 3}`,
            "head",
            false
        );
    }

    const head = htmlEl("div", "ll-head");
    head.style.left = `${headCenterX - HEAD_R}px`;
    head.style.top = `${yNext - HEAD_R}px`;
    head.appendChild(htmlEl("span", "ll-head-icon", "⚓"));
    canvas.appendChild(head);

    const headLabel = htmlEl("div", "ll-head-label", "HEAD");
    headLabel.style.left = `${headCenterX - 28}px`;
    headLabel.style.top = `${yNext + HEAD_R + 4}px`;
    canvas.appendChild(headLabel);

    // ---- nodes ----
    step.nodes.forEach((node, i) => {
        const box = htmlEl("div", "ll-node");
        box.style.left = `${nodeX(i)}px`;
        box.style.top = `${TOP_Y}px`;

        const mark = step.marks.find(entry => entry.index === i);

        if (mark) box.classList.add(`is-${mark.kind}`);
        if (step.scan && step.scan.index === i) box.classList.add("is-scan");

        box.append(
            htmlEl("span", "ll-addr", node.addr),
            htmlEl("span", "ll-value", node.value),
            htmlEl("span", "ll-idx", `IDX ${i}`)
        );

        canvas.appendChild(box);
    });

    // ---- scanner label ----
    if (step.scan && step.scan.index < n) {
        const pill = htmlEl("div", "ll-scan", `${step.scan.label} ▾`);
        pill.style.left = `${nodeX(step.scan.index) + NODE_W / 2}px`;
        pill.style.top = `${TOP_Y - 24}px`;
        canvas.appendChild(pill);
    }

    // keep the interesting node in view
    let focus = null;

    if (step.scan) focus = step.scan.index;
    else if (step.marks.length > 0) focus = step.marks[0].index;
    else if (step.hotNext.length > 0) focus = step.hotNext[0];

    if (focus !== null && n > 0) {
        const wanted = nodeX(Math.min(focus, n - 1)) + NODE_W / 2 - canvasWrap.clientWidth / 2;

        canvasWrap.scrollLeft = Math.max(0, wanted);
    } else {
        canvasWrap.scrollLeft = 0;
    }
}


// ==========================================
// CODE, SPAWN ZONE, HISTORY
// ==========================================

function renderCode(step) {
    if (renderedCodeId !== step.codeId) {
        renderedCodeId = step.codeId;

        const code = LL_CODE[step.codeId];

        codeBox.innerHTML = "";
        codeLineEls = [];

        code.text.forEach((text, index) => {
            const line = htmlEl("span", "code-line");

            line.dataset.line = String(index + 1);
            line.textContent = `${String(index + 1).padStart(2, " ")}  ${text}`;

            codeBox.appendChild(line);
            codeLineEls.push(line);
        });
    }

    codeLineEls.forEach((line, index) => {
        line.classList.toggle("active", step.line.includes(index));
    });
}

function renderSpawn(step) {
    spawnBox.innerHTML = "";

    if (!step.spawn) {
        spawnBox.appendChild(
            htmlEl("p", "ll-spawn-empty", "No node is waiting. A new node appears here before it is linked, and a deleted node appears here before it is freed.")
        );
        return;
    }

    const info = LL_TYPES[step.type];
    const spawn = step.spawn;

    const card = htmlEl("div", `ll-spawn-card is-${spawn.kind}`);

    card.append(
        htmlEl("span", "ll-addr", spawn.node.addr),
        htmlEl("span", "ll-value", spawn.node.value)
    );

    const details = htmlEl("div", "ll-spawn-info");

    details.appendChild(htmlEl("span", `ll-spawn-status is-${spawn.kind}`, spawn.status));

    if (spawn.next !== null) {
        details.appendChild(htmlEl("span", "ll-spawn-ptr", `next → ${spawn.next}`));

        if (info.doubly) {
            details.appendChild(htmlEl("span", "ll-spawn-ptr", `prev → ${spawn.prev}`));
        }
    }

    spawnBox.append(card, details);
}

function renderHistory(history) {
    historyBox.innerHTML = "";

    if (history.length === 0) {
        historyBox.appendChild(htmlEl("p", "history-empty", "No operations yet."));
        return;
    }

    const recent = history.slice(-8);

    recent.forEach((entry, index) => {
        const chip = htmlEl("span", "array-value", entry);

        if (index === recent.length - 1) chip.classList.add("changed");

        historyBox.appendChild(chip);
    });
}


// ==========================================
// SHOW ONE STEP
// ==========================================

function renderStep(index) {
    if (index < 0 || index >= steps.length) return;

    currentStep = index;

    const step = steps[index];
    const n = step.nodes.length;

    renderStage(step);
    renderCode(step);
    renderSpawn(step);
    renderHistory(step.history);

    actionType.textContent = step.title;
    AlgoLab.setChip(document.getElementById("stepChip"), chipType(step));
    message.textContent = step.text;
    currentAction.classList.toggle("is-error", step.error);

    const vars = Object.entries(step.vars);

    valuesInvolved.textContent = vars.length > 0
        ? vars.map(([name, value]) => `${name} = ${value}`).join(",  ")
        : "No variables yet.";

    whyText.textContent = step.key !== null && WHY[step.key]
        ? WHY[step.key]
        : "Every operation changes pointers, not the position of nodes in memory.";

    tipText.textContent = tipFor(step.op, step.type);

    listBadge.className = "stack-badge " + (
        n === 0 ? "is-empty" : n >= MAX_NODES ? "is-full" : "is-ok"
    );

    listBadge.textContent =
        n === 0 ? "EMPTY LIST"
        : n >= MAX_NODES ? `FULL (${MAX_NODES} nodes)`
        : `${n} node${n === 1 ? "" : "s"}`;

    returnBadge.hidden = step.returned === null;
    returnBadge.textContent = step.returned === null
        ? ""
        : step.op === "search"
            ? (step.returned >= 0 ? `Found at index ${step.returned}` : "Not found")
            : `Returned: ${step.returned}`;

    if (n === 0) {
        pointerInfo.textContent = "head = null · size 0";
    } else {
        const first = step.nodes[Math.max(0, step.head)];
        const last = step.nodes[n - 1];

        pointerInfo.textContent =
            `head = ${first.addr} (${first.value}) · tail = ${last.addr} (${last.value}) · size ${n}`;
    }

    statusTag.textContent = index === 0 ? "Ready" : `Step ${index + 1} of ${steps.length}`;
    chartStep.textContent = step.title;
    chartCaption.textContent = step.text;
    stepCounter.textContent = `Step ${index + 1} of ${steps.length}`;
    AlgoLab.setProgress(stepCounter, index, steps.length);

    updateButtons();
}

function updateButtons() {
    const atEnd = currentStep >= steps.length - 1;

    startBtn.textContent = isPlaying ? "⏸ Pause" : "▶ Replay Operation";
    startBtn.disabled = steps.length <= 1;

    stepBtn.disabled = isPlaying || atEnd;
    prevBtn.disabled = isPlaying || currentStep <= 0;

    [
        ...Object.values(opButtons),
        valueInput, indexInput, randomValueBtn, randomListBtn,
        clearBtn, resetBtn, speedSelect
    ].forEach(control => {
        control.disabled = isPlaying;
    });
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
// RESET AND INPUTS
// ==========================================

function resetTimeline(nodes) {
    stopAnimation();

    initialNodes = nodes.map(node => ({ ...node }));
    liveList = nodes.map(node => ({ ...node }));
    steps = [];
    opLog = [];
    lastOpStart = 0;
    renderedCodeId = null;

    currentOp = "node";
    codeId = `${listType}:node`;
    C = LL_CODE[codeId];

    const info = typeInfo();

    addStep({
        line: [0],
        title: "Ready to Start",
        text: `${info.label}: choose an operation. Click Insert, Delete or Search.`,
        vars: { head: liveList.length > 0 ? liveList[0].value : "null" }
    });

    renderStep(0);
    AlgoLab.showHint(DEFAULT_HINT, false);
}

function randomValues() {
    const count = 4 + Math.floor(Math.random() * 3);
    const values = new Set();

    while (values.size < count) {
        values.add(Math.floor(Math.random() * 90) + 10);
    }

    return [...values];
}

function readValue() {
    const text = valueInput.value.trim();

    if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > 999) {
        AlgoLab.showHint("Enter a whole number between 1 and 999 for the node value.", true);
        valueInput.focus();
        return null;
    }

    return Number(text);
}

function readIndex(min, max, what) {
    const text = indexInput.value.trim();

    if (!/^\d+$/.test(text) || Number(text) < min || Number(text) > max) {
        AlgoLab.showHint(
            max < min
                ? "The list is empty. Insert a node first."
                : `Target index for ${what} must be between ${min} and ${max}.`,
            true
        );
        indexInput.focus();
        return null;
    }

    return Number(text);
}

function runOperation(label, build) {
    if (isPlaying) return;

    lastOpStart = steps.length;

    build();

    // remember the operation in the history (shown from the last step on)
    const last = steps[steps.length - 1];
    let entry = label;

    if (last.error) entry += " → empty list";
    else if (last.returned !== null) entry += ` → ${last.returned}`;

    opLog.push(entry);
    last.history = [...opLog];

    renderStep(lastOpStart);
    AlgoLab.showHint(DEFAULT_HINT, false);

    if (autoToggle.checked) {
        startAnimation();
    }
}

function canGrow() {
    if (liveList.length >= MAX_NODES) {
        AlgoLab.showHint(`The visualizer holds at most ${MAX_NODES} nodes. Delete one first.`, true);
        return false;
    }

    return true;
}


// ==========================================
// EVENTS
// ==========================================

opButtons.insertBeg.addEventListener("click", () => {
    const value = readValue();

    if (value !== null && canGrow()) {
        runOperation(`insertBeg(${value})`, () => opInsertBeg(value));
    }
});

opButtons.insertEnd.addEventListener("click", () => {
    const value = readValue();

    if (value !== null && canGrow()) {
        runOperation(`insertEnd(${value})`, () => opInsertEnd(value));
    }
});

opButtons.insertAt.addEventListener("click", () => {
    const value = readValue();

    if (value === null) return;

    const index = readIndex(0, liveList.length, "insert");

    if (index === null || !canGrow()) return;

    runOperation(`insertAt(${index}, ${value})`, () => {
        if (index === 0) opInsertBeg(value);
        else if (index === liveList.length) opInsertEnd(value);
        else opInsertAt(index, value);
    });
});

opButtons.deleteBeg.addEventListener("click", () => {
    runOperation("deleteBeg()", opDeleteBeg);
});

opButtons.deleteEnd.addEventListener("click", () => {
    runOperation("deleteEnd()", opDeleteEnd);
});

opButtons.deleteAt.addEventListener("click", () => {
    if (liveList.length === 0) {
        runOperation("deleteAt()", opDeleteBeg);
        return;
    }

    const index = readIndex(0, liveList.length - 1, "delete");

    if (index === null) return;

    runOperation(`deleteAt(${index})`, () => {
        if (index === 0) opDeleteBeg();
        else if (index === liveList.length - 1) opDeleteEnd();
        else opDeleteAt(index);
    });
});

opButtons.search.addEventListener("click", () => {
    const value = readValue();

    if (value !== null) {
        runOperation(`search(${value})`, () => opSearch(value));
    }
});

randomValueBtn.addEventListener("click", () => {
    valueInput.value = Math.floor(Math.random() * 90) + 10;
});

randomListBtn.addEventListener("click", () => {
    if (!isPlaying) resetTimeline(randomValues().map(makeNode));
});

clearBtn.addEventListener("click", () => {
    if (!isPlaying) resetTimeline([]);
});

resetBtn.addEventListener("click", () => {
    if (!isPlaying) resetTimeline(initialNodes);
});

[valueInput, indexInput].forEach(input => {
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") opButtons.insertEnd.click();
    });
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

speedSelect.addEventListener("change", () => {
    animationSpeed = Number(speedSelect.value);
});


// ==========================================
// INITIALIZE
// ==========================================

resetTimeline([42, 88, 15, 98, 17].map(makeNode));
