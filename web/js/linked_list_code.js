"use strict";

// ==========================================
// JAVA CODE FOR EVERY OPERATION AND LIST TYPE
// A line that starts with "@key|" can be highlighted by that key.
// ==========================================

const LL_TYPES = {
    singly: { label: "Singly Linked List", doubly: false, circular: false },
    doubly: { label: "Doubly Linked List", doubly: true, circular: false },
    circular: { label: "Circular Linked List", doubly: false, circular: true },
    dcircular: { label: "Doubly Circular Linked List", doubly: true, circular: true }
};

const LL_CODE = {};

function parseCode(lines) {
    const text = [];
    const keys = {};

    lines.forEach((raw, index) => {
        const match = /^@(\w+)\|(.*)$/.exec(raw);

        if (match) {
            keys[match[1]] = index;
            text.push(match[2]);
        } else {
            text.push(raw);
        }
    });

    keys.__end = text.length - 1;

    return { text, keys };
}

function define(types, op, lines) {
    types.forEach(type => {
        LL_CODE[`${type}:${op}`] = parseCode(lines);
    });
}

const ALL = ["singly", "doubly", "circular", "dcircular"];

// ---------- the Node class ----------

define(["singly"], "node", [
    "class Node {",
    "    int data;",
    "    Node next;",
    "    Node(int data) { this.data = data; }",
    "}",
    "",
    "Node head = null;"
]);

define(["doubly"], "node", [
    "class Node {",
    "    int data;",
    "    Node next, prev;",
    "    Node(int data) { this.data = data; }",
    "}",
    "",
    "Node head = null;"
]);

define(["circular"], "node", [
    "class Node {",
    "    int data;",
    "    Node next;      // the last node points back to head",
    "    Node(int data) { this.data = data; }",
    "}",
    "",
    "Node head = null;"
]);

define(["dcircular"], "node", [
    "class Node {",
    "    int data;",
    "    Node next, prev;   // head.prev is the last node",
    "    Node(int data) { this.data = data; }",
    "}",
    "",
    "Node head = null;"
]);

// ---------- insertBeg ----------

define(["singly"], "insertBeg", [
    "void insertBeg(int val) {",
    "@create|    Node temp = new Node(val);",
    "@link|    temp.next = head;",
    "@head|    head = temp;",
    "}"
]);

define(["doubly"], "insertBeg", [
    "void insertBeg(int val) {",
    "@create|    Node temp = new Node(val);",
    "@link|    temp.next = head;",
    "@chk|    if (head != null)",
    "@prev|        head.prev = temp;",
    "@head|    head = temp;",
    "}"
]);

define(["circular"], "insertBeg", [
    "void insertBeg(int val) {",
    "@create|    Node temp = new Node(val);",
    "@chkNull|    if (head == null) {",
    "@selfNext|        temp.next = temp;",
    "@headNew|        head = temp;",
    "        return;",
    "    }",
    "@tail|    Node tail = head;",
    "@loop|    while (tail.next != head)",
    "@move|        tail = tail.next;",
    "@link|    temp.next = head;",
    "@tailNext|    tail.next = temp;",
    "@head|    head = temp;",
    "}"
]);

define(["dcircular"], "insertBeg", [
    "void insertBeg(int val) {",
    "@create|    Node temp = new Node(val);",
    "@chkNull|    if (head == null) {",
    "@selfNext|        temp.next = temp;",
    "@selfPrev|        temp.prev = temp;",
    "@headNew|        head = temp;",
    "        return;",
    "    }",
    "@tail|    Node tail = head.prev;",
    "@link|    temp.next = head;",
    "@linkPrev|    temp.prev = tail;",
    "@tailNext|    tail.next = temp;",
    "@headPrev|    head.prev = temp;",
    "@head|    head = temp;",
    "}"
]);

// ---------- insertEnd ----------

define(["singly"], "insertEnd", [
    "void insertEnd(int val) {",
    "@create|    Node temp = new Node(val);",
    "@chkNull|    if (head == null) {",
    "@headNew|        head = temp;",
    "        return;",
    "    }",
    "@ptr|    Node ptr = head;",
    "@loop|    while (ptr.next != null)",
    "@move|        ptr = ptr.next;",
    "@link|    ptr.next = temp;",
    "}"
]);

define(["doubly"], "insertEnd", [
    "void insertEnd(int val) {",
    "@create|    Node temp = new Node(val);",
    "@chkNull|    if (head == null) {",
    "@headNew|        head = temp;",
    "        return;",
    "    }",
    "@ptr|    Node ptr = head;",
    "@loop|    while (ptr.next != null)",
    "@move|        ptr = ptr.next;",
    "@link|    ptr.next = temp;",
    "@linkPrev|    temp.prev = ptr;",
    "}"
]);

define(["circular"], "insertEnd", [
    "void insertEnd(int val) {",
    "@create|    Node temp = new Node(val);",
    "@chkNull|    if (head == null) {",
    "@selfNext|        temp.next = temp;",
    "@headNew|        head = temp;",
    "        return;",
    "    }",
    "@ptr|    Node ptr = head;",
    "@loop|    while (ptr.next != head)",
    "@move|        ptr = ptr.next;",
    "@link|    ptr.next = temp;",
    "@wrap|    temp.next = head;",
    "}"
]);

define(["dcircular"], "insertEnd", [
    "void insertEnd(int val) {",
    "@create|    Node temp = new Node(val);",
    "@chkNull|    if (head == null) {",
    "@selfNext|        temp.next = temp;",
    "@selfPrev|        temp.prev = temp;",
    "@headNew|        head = temp;",
    "        return;",
    "    }",
    "@tail|    Node tail = head.prev;",
    "@link|    tail.next = temp;",
    "@linkPrev|    temp.prev = tail;",
    "@wrap|    temp.next = head;",
    "@headPrev|    head.prev = temp;",
    "}"
]);

// ---------- insertAt (a position between two nodes) ----------

define(["singly", "circular"], "insertAt", [
    "void insertAt(int index, int val) {",
    "@create|    Node temp = new Node(val);",
    "@ptr|    Node ptr = head;",
    "@loop|    for (int i = 0; i < index - 1; i++)",
    "@move|        ptr = ptr.next;",
    "@link|    temp.next = ptr.next;",
    "@ptrNext|    ptr.next = temp;",
    "}"
]);

define(["doubly", "dcircular"], "insertAt", [
    "void insertAt(int index, int val) {",
    "@create|    Node temp = new Node(val);",
    "@ptr|    Node ptr = head;",
    "@loop|    for (int i = 0; i < index - 1; i++)",
    "@move|        ptr = ptr.next;",
    "@link|    temp.next = ptr.next;",
    "@linkPrev|    temp.prev = ptr;",
    "@nextPrev|    ptr.next.prev = temp;",
    "@ptrNext|    ptr.next = temp;",
    "}"
]);

// ---------- deleteBeg ----------

define(["singly"], "deleteBeg", [
    "void deleteBeg() {",
    "@chkEmpty|    if (head == null) return;",
    "@head|    head = head.next;",
    "}"
]);

define(["doubly"], "deleteBeg", [
    "void deleteBeg() {",
    "@chkEmpty|    if (head == null) return;",
    "@head|    head = head.next;",
    "@chk|    if (head != null)",
    "@prev|        head.prev = null;",
    "}"
]);

define(["circular"], "deleteBeg", [
    "void deleteBeg() {",
    "@chkEmpty|    if (head == null) return;",
    "@chkOne|    if (head.next == head) {",
    "@headNull|        head = null;",
    "        return;",
    "    }",
    "@tail|    Node tail = head;",
    "@loop|    while (tail.next != head)",
    "@move|        tail = tail.next;",
    "@head|    head = head.next;",
    "@tailNext|    tail.next = head;",
    "}"
]);

define(["dcircular"], "deleteBeg", [
    "void deleteBeg() {",
    "@chkEmpty|    if (head == null) return;",
    "@chkOne|    if (head.next == head) {",
    "@headNull|        head = null;",
    "        return;",
    "    }",
    "@tail|    Node tail = head.prev;",
    "@head|    head = head.next;",
    "@headPrev|    head.prev = tail;",
    "@tailNext|    tail.next = head;",
    "}"
]);

// ---------- deleteEnd ----------

define(["singly"], "deleteEnd", [
    "void deleteEnd() {",
    "@chkEmpty|    if (head == null) return;",
    "@chkOne|    if (head.next == null) {",
    "@headNull|        head = null;",
    "        return;",
    "    }",
    "@ptr|    Node ptr = head;",
    "@loop|    while (ptr.next.next != null)",
    "@move|        ptr = ptr.next;",
    "@cut|    ptr.next = null;",
    "}"
]);

define(["doubly"], "deleteEnd", [
    "void deleteEnd() {",
    "@chkEmpty|    if (head == null) return;",
    "@chkOne|    if (head.next == null) {",
    "@headNull|        head = null;",
    "        return;",
    "    }",
    "@ptr|    Node ptr = head;",
    "@loop|    while (ptr.next != null)",
    "@move|        ptr = ptr.next;",
    "@cut|    ptr.prev.next = null;",
    "}"
]);

define(["circular"], "deleteEnd", [
    "void deleteEnd() {",
    "@chkEmpty|    if (head == null) return;",
    "@chkOne|    if (head.next == head) {",
    "@headNull|        head = null;",
    "        return;",
    "    }",
    "@ptr|    Node ptr = head;",
    "@loop|    while (ptr.next.next != head)",
    "@move|        ptr = ptr.next;",
    "@cut|    ptr.next = head;",
    "}"
]);

define(["dcircular"], "deleteEnd", [
    "void deleteEnd() {",
    "@chkEmpty|    if (head == null) return;",
    "@chkOne|    if (head.next == head) {",
    "@headNull|        head = null;",
    "        return;",
    "    }",
    "@tail|    Node tail = head.prev;",
    "@cut|    tail.prev.next = head;",
    "@headPrev|    head.prev = tail.prev;",
    "}"
]);

// ---------- deleteAt (a node between two nodes) ----------

define(["singly", "circular"], "deleteAt", [
    "void deleteAt(int index) {",
    "@ptr|    Node ptr = head;",
    "@loop|    for (int i = 0; i < index - 1; i++)",
    "@move|        ptr = ptr.next;",
    "@cut|    ptr.next = ptr.next.next;",
    "}"
]);

define(["doubly", "dcircular"], "deleteAt", [
    "void deleteAt(int index) {",
    "@ptr|    Node ptr = head;",
    "@loop|    for (int i = 0; i < index; i++)",
    "@move|        ptr = ptr.next;",
    "@cut|    ptr.prev.next = ptr.next;",
    "@cutPrev|    ptr.next.prev = ptr.prev;",
    "}"
]);

// ---------- search ----------

define(["singly", "doubly"], "search", [
    "int search(int key) {",
    "@ptr|    Node ptr = head;",
    "@idx|    int i = 0;",
    "@loop|    while (ptr != null) {",
    "@cmp|        if (ptr.data == key)",
    "@ret|            return i;",
    "@move|        ptr = ptr.next;",
    "@inc|        i++;",
    "    }",
    "@miss|    return -1;",
    "}"
]);

define(["circular", "dcircular"], "search", [
    "int search(int key) {",
    "@chkEmpty|    if (head == null) return -1;",
    "@ptr|    Node ptr = head;",
    "@idx|    int i = 0;",
    "    do {",
    "@cmp|        if (ptr.data == key)",
    "@ret|            return i;",
    "@move|        ptr = ptr.next;",
    "@inc|        i++;",
    "@loop|    } while (ptr != head);",
    "@miss|    return -1;",
    "}"
]);

// every combination must exist
["insertBeg", "insertEnd", "insertAt", "deleteBeg", "deleteEnd", "deleteAt", "search", "node"].forEach(op => {
    ALL.forEach(type => {
        if (!LL_CODE[`${type}:${op}`]) {
            throw new Error(`Missing code for ${type}:${op}`);
        }
    });
});
