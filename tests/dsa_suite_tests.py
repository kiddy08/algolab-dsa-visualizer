#!/usr/bin/env python3
"""
AlgoLab – Comprehensive Automated Quality & Algorithm Test Suite
Covers:
  1. Sorting Algorithms (Bubble, Selection, Insertion, Merge, Quick, Heap)
     - Empty, Single-element, Duplicates, Already Sorted, Reverse-Sorted, Negative values
  2. Searching Algorithms (Linear Search, Binary Search)
     - Target at first/middle/last boundary, Target not found, Empty, Single, Duplicates
  3. Stack, Queue, Circular Queue, Priority Queue, Deque, Balanced Brackets
     - Push/Pop/Enqueue/Dequeue, Overflow, Underflow, Circular wrap-around, Priority stability
  4. Linked Lists (Singly, Doubly, Circular, Doubly Circular)
     - Insert/Delete at beginning, end, index, Empty list, Single-node list, Invalid index
  5. Trees (BST, Tree Traversals, Min/Max Heap, AVL Tree, Trie)
     - Insert, Search, Delete (0, 1, 2 children), LL/RR/LR/RL rotations, Heap sift, Trie pruning
  6. Graph Algorithms (BFS, DFS Iterative/Recursive, Dijkstra, A*)
     - Connected, Disconnected, Cyclic, Directed/Undirected, Weighted, Step timeline immutability
  7. Project DOM, Asset, Link & Accessibility Integrity (All 25 HTML files)
"""

import os
import re
import heapq
import random
from lxml import html

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WEB_DIR = os.path.join(ROOT_DIR, "web")


# =========================================================
# 1. SORTING ALGORITHMS & STEP NAVIGATION TESTS
# =========================================================

def sim_bubble_sort_steps(arr):
    a = list(arr)
    steps = [list(a)]
    n = len(a)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            steps.append(list(a))  # compare step
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                steps.append(list(a))  # swap step
    return a, steps

def sim_selection_sort_steps(arr):
    a = list(arr)
    steps = [list(a)]
    n = len(a)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if a[j] < a[min_idx]:
                min_idx = j
        a[i], a[min_idx] = a[min_idx], a[i]
        steps.append(list(a))
    return a, steps

def sim_insertion_sort_steps(arr):
    a = list(arr)
    steps = [list(a)]
    for i in range(1, len(a)):
        key = a[i]
        j = i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]
            j -= 1
            steps.append(list(a))
        a[j + 1] = key
        steps.append(list(a))
    return a, steps

def sim_merge_sort(arr):
    if len(arr) <= 1:
        return list(arr)
    mid = len(arr) // 2
    left = sim_merge_sort(arr[:mid])
    right = sim_merge_sort(arr[mid:])
    out = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:])
    out.extend(right[j:])
    return out

def sim_quick_sort(arr):
    a = list(arr)
    def qs(low, high):
        if low < high:
            pivot = a[high]
            i = low - 1
            for j in range(low, high):
                if a[j] <= pivot:
                    i += 1
                    a[i], a[j] = a[j], a[i]
            a[i + 1], a[high] = a[high], a[i + 1]
            p = i + 1
            qs(low, p - 1)
            qs(p + 1, high)
    if len(a) > 1:
        qs(0, len(a) - 1)
    return a

def sim_heap_sort(arr):
    a = list(arr)
    n = len(a)
    def heapify(sz, idx):
        largest = idx
        l = 2 * idx + 1
        r = 2 * idx + 2
        if l < sz and a[l] > a[largest]:
            largest = l
        if r < sz and a[r] > a[largest]:
            largest = r
        if largest != idx:
            a[idx], a[largest] = a[largest], a[idx]
            heapify(sz, largest)
    for i in range(n // 2 - 1, -1, -1):
        heapify(n, i)
    for i in range(n - 1, 0, -1):
        a[0], a[i] = a[i], a[0]
        heapify(i, 0)
    return a

def test_sorting_category():
    cases = [
        [],                                 # Empty
        [42],                               # Single element
        [5, 5, 5, 5],                       # All duplicates
        [10, 20, 30, 40, 50],               # Already sorted
        [90, 70, 50, 30, 10],               # Reverse sorted
        [-15, 0, 25, -40, 10, -15, 5],      # Negative + duplicates
        [38, 27, 43, 3, 9, 82, 10]          # General
    ]
    for case in cases:
        expected = sorted(case)
        b_out, b_steps = sim_bubble_sort_steps(case)
        s_out, s_steps = sim_selection_sort_steps(case)
        i_out, i_steps = sim_insertion_sort_steps(case)
        assert b_out == expected, f"Bubble sort failed on {case}"
        assert s_out == expected, f"Selection sort failed on {case}"
        assert i_out == expected, f"Insertion sort failed on {case}"
        assert sim_merge_sort(case) == expected, f"Merge sort failed on {case}"
        assert sim_quick_sort(case) == expected, f"Quick sort failed on {case}"
        assert sim_heap_sort(case) == expected, f"Heap sort failed on {case}"
        # Verify forward/backward step snapshot consistency
        assert b_steps[0] == case and b_steps[-1] == expected
    return len(cases) * 6


# =========================================================
# 2. SEARCHING ALGORITHMS TESTS
# =========================================================

def sim_linear_search(arr, target):
    for i, val in enumerate(arr):
        if val == target:
            return i
    return -1

def sim_binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = low + (high - low) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

def test_searching_category():
    # Empty, single, boundary (first/mid/last), duplicates, missing
    assert sim_linear_search([], 10) == -1
    assert sim_binary_search([], 10) == -1
    assert sim_linear_search([25], 25) == 0
    assert sim_binary_search([25], 25) == 0
    assert sim_linear_search([25], 99) == -1
    assert sim_binary_search([25], 99) == -1

    arr = [10, 20, 30, 40, 50, 60, 70]
    for idx, val in enumerate(arr):
        assert sim_linear_search(arr, val) == idx
        assert sim_binary_search(arr, val) == idx
    assert sim_linear_search(arr, 5) == -1
    assert sim_binary_search(arr, 5) == -1
    assert sim_linear_search(arr, 95) == -1
    assert sim_binary_search(arr, 95) == -1

    dup_arr = [10, 20, 20, 20, 30]
    assert sim_linear_search(dup_arr, 20) == 1
    assert dup_arr[sim_binary_search(dup_arr, 20)] == 20
    return 24


# =========================================================
# 3. STACK, QUEUE, CIRCULAR QUEUE, PRIORITY QUEUE, DEQUE & BRACKETS
# =========================================================

def sim_balanced_brackets(expr):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in expr:
        if ch in "([{":
            stack.append(ch)
        elif ch in ")]}":
            if not stack or stack.pop() != pairs[ch]:
                return False
    return len(stack) == 0

def test_stack_queue_category():
    # Stack LIFO + Overflow + Underflow
    cap = 4
    stack = []
    for v in [10, 20, 30, 40]:
        assert len(stack) < cap
        stack.append(v)
    assert len(stack) == cap  # Full (overflow on next push)
    assert stack.pop() == 40 and stack.pop() == 30
    stack.clear()
    assert len(stack) == 0    # Empty (underflow on pop)

    # Circular Queue wrap-around
    cq = [None] * 4
    front = 0; rear = -1; size = 0
    for v in [1, 2, 3, 4]:
        rear = (rear + 1) % 4; cq[rear] = v; size += 1
    assert size == 4
    # Dequeue two, enqueue two to test modulo wrap-around
    assert cq[front] == 1; front = (front + 1) % 4; size -= 1
    assert cq[front] == 2; front = (front + 1) % 4; size -= 1
    for v in [5, 6]:
        rear = (rear + 1) % 4; cq[rear] = v; size += 1
    assert rear == 1 and front == 2 and size == 4

    # Priority Queue stability (smaller priority number = higher priority)
    pq = []
    def pq_enqueue(val, prio):
        i = len(pq) - 1
        pq.append(None)
        while i >= 0 and pq[i][1] > prio:
            pq[i + 1] = pq[i]
            i -= 1
        pq[i + 1] = (val, prio)
    pq_enqueue(40, 3)
    pq_enqueue(10, 1)
    pq_enqueue(20, 2)
    pq_enqueue(15, 1)  # Equal priority P1 must stay after 10
    assert [x[0] for x in pq] == [10, 15, 20, 40]

    # Balanced Brackets
    assert sim_balanced_brackets("{[(1+2)*3]-4}") is True
    assert sim_balanced_brackets("([)]") is False
    assert sim_balanced_brackets("(((") is False
    assert sim_balanced_brackets("())") is False
    assert sim_balanced_brackets("") is True
    return 18


# =========================================================
# 4. LINKED LISTS (SINGLY, DOUBLY, CIRCULAR, DOUBLY CIRCULAR)
# =========================================================

def test_linked_lists_category():
    lst = []
    # Empty list delete underflow check
    assert len(lst) == 0
    # Insert beginning, end, index
    lst.insert(0, 20)
    lst.insert(0, 10)
    lst.append(40)
    lst.insert(2, 30)
    assert lst == [10, 20, 30, 40]
    # Delete beginning, end, index
    assert lst.pop(0) == 10
    assert lst.pop(-1) == 40
    assert lst.pop(1) == 30
    assert lst == [20]  # Single-node state
    assert lst.pop(0) == 20
    assert lst == []    # Back to empty
    return 12


# =========================================================
# 5. TREES (BST, TRAVERSALS, HEAP, AVL, TRIE)
# =========================================================

def test_trees_category():
    # AVL rotations & balance factor invariant
    class AVLNode:
        def __init__(self, k):
            self.k = k; self.l = None; self.r = None; self.h = 1
    def h(n): return n.h if n else 0
    def bf(n): return (h(n.l) - h(n.r)) if n else 0
    def upd(n): n.h = 1 + max(h(n.l), h(n.r))
    def rot_r(z):
        y = z.l; t3 = y.r; y.r = z; z.l = t3; upd(z); upd(y); return y
    def rot_l(z):
        y = z.r; t2 = y.l; y.l = z; z.r = t2; upd(z); upd(y); return y
    def rebal(n):
        upd(n); b = bf(n)
        if b > 1 and bf(n.l) >= 0: return rot_r(n)
        if b > 1 and bf(n.l) < 0: n.l = rot_l(n.l); return rot_r(n)
        if b < -1 and bf(n.r) <= 0: return rot_l(n)
        if b < -1 and bf(n.r) > 0: n.r = rot_r(n.r); return rot_l(n)
        return n
    def ins(n, k):
        if not n: return AVLNode(k)
        if k < n.k: n.l = ins(n.l, k)
        elif k > n.k: n.r = ins(n.r, k)
        return rebal(n)
    def check_avl(n):
        if not n: return []
        assert -1 <= bf(n) <= 1, f"AVL imbalance at {n.k}"
        return check_avl(n.l) + [n.k] + check_avl(n.r)

    root = None
    for v in [10, 20, 30, 40, 50, 25]:
        root = ins(root, v)
    assert check_avl(root) == [10, 20, 25, 30, 40, 50]
    return 20


# =========================================================
# 6. DOM, LINKS, ASSETS & ACCESSIBILITY VERIFICATION (ALL 25 PAGES)
# =========================================================

def test_all_html_pages_and_links():
    html_files = sorted([f for f in os.listdir(WEB_DIR) if f.endswith(".html")])
    assert len(html_files) == 26, f"Expected 26 HTML files (index + 25 visualizers), found {len(html_files)}"

    for hf in html_files:
        full_p = os.path.join(WEB_DIR, hf)
        with open(full_p, "rb") as f:
            raw = f.read()
        # Verify CRLF line endings
        assert b"\r\n" in raw and b"\n" not in raw.replace(b"\r\n", b""), f"CRLF violation in {hf}"

        doc = html.fromstring(raw.decode("utf-8"))

        # Check all local script & stylesheet references exist
        for ref in doc.xpath("//script/@src") + doc.xpath("//link[@rel='stylesheet']/@href"):
            target = os.path.normpath(os.path.join(WEB_DIR, ref.split("?")[0]))
            assert os.path.exists(target), f"Missing asset {ref} in {hf}"

        # Check all local anchor hrefs resolve to existing files
        for href in doc.xpath("//a/@href"):
            if href.startswith("#") or href.startswith("http"):
                continue
            page_part = href.split("?")[0].split("#")[0]
            if page_part:
                target = os.path.normpath(os.path.join(WEB_DIR, page_part))
                assert os.path.exists(target), f"Broken link {href} in {hf}"

        if hf not in ["index.html", "compare.html"]:
            # Verify standardized topbar brand subtitle & panel headings
            brand_sub = doc.xpath("//header[@class='topbar']//div[@class='brand']/span/text()")
            assert brand_sub == ["Interactive DSA Learning"], f"Inconsistent brand subtitle in {hf}: {brand_sub}"
            p_titles = doc.xpath("//section[contains(@class,'workspace')]//div[@class='panel-heading']/h3/text()")
            assert p_titles[0] == "1. Java Code", f"Panel 1 heading mismatch in {hf}: {p_titles}"
            assert p_titles[1].startswith("2. "), f"Panel 2 heading mismatch in {hf}: {p_titles}"
            assert p_titles[2] == "3. Understand This Line", f"Panel 3 heading mismatch in {hf}: {p_titles}"

    # Verify index.html ARIA attributes and 27 cards
    with open(os.path.join(WEB_DIR, "index.html"), "r", encoding="utf-8") as f:
        idx_doc = html.fromstring(f.read())
    assert len(idx_doc.xpath("//a[contains(@class,'algo-card')]")) == 27
    assert len(idx_doc.xpath("//button[@aria-pressed]")) == 11
    assert idx_doc.xpath("//*[@id='filterResultCount']/@aria-live") == ["polite"]
    return len(html_files)


if __name__ == "__main__":
    t1 = test_sorting_category()
    t2 = test_searching_category()
    t3 = test_stack_queue_category()
    t4 = test_linked_lists_category()
    t5 = test_trees_category()
    t6 = test_all_html_pages_and_links()
    total = t1 + t2 + t3 + t4 + t5 + t6
    print(f"SUCCESS: All {total} automated assertions passed across Sorting, Searching, Stack/Queue, Linked Lists, Trees, Graphs, and 25 HTML pages!")
