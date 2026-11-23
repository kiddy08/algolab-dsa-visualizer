# AlgoLab – Interactive DSA Learning Platform

Interactive, step-by-step visualizations of **27 Data Structures and Algorithms** across **24 visualizer pages** and **6 structured categories**. Every visualizer pairs **real, compilable Java code** with a **synchronized visual canvas** and **plain-English step explanations**.

## Categories & Visualizers (24 Visualizer Pages · 27 Algorithm Entries)

| Category | Algorithm / Data Structure | Visualizer Page | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **01 · Sorting** | 1. Bubble Sort | `web/bubble_sort.html` | O(n²) | O(1) |
| **01 · Sorting** | 2. Selection Sort | `web/selection_sort.html` | O(n²) | O(1) |
| **01 · Sorting** | 3. Insertion Sort | `web/insertion_sort.html` | O(n²) | O(1) |
| **01 · Sorting** | 4. Merge Sort | `web/merge_sort.html` | O(n log n) | O(n) |
| **01 · Sorting** | 5. Quick Sort | `web/quick_sort.html` | O(n log n) avg, O(n²) worst | O(log n) |
| **01 · Sorting** | 6. Heap Sort | `web/heap_sort.html` | O(n log n) | O(1) |
| **02 · Searching** | 7. Linear Search | `web/linear_search.html` | O(n) | O(1) |
| **02 · Searching** | 8. Binary Search | `web/binary_search.html` | O(log n) | O(1) |
| **03 · Stack & Queue** | 9. Stack (LIFO) | `web/stack.html` | O(1) | O(n) |
| **03 · Stack & Queue** | 10. Simple Queue (FIFO) | `web/queue.html` | O(1) | O(n) |
| **03 · Stack & Queue** | 11. Circular Queue | `web/circular_queue.html` | O(1) | O(n) |
| **03 · Stack & Queue** | 12. Priority Queue | `web/priority_queue.html` | O(n) enqueue/dequeue, O(1) peek | O(n) |
| **03 · Stack & Queue** | 13. Double-Ended Queue (Deque) | `web/deque.html` | O(1) | O(n) |
| **03 · Stack & Queue** | 14. Balanced Brackets | `web/balanced_brackets.html` | O(n) | O(n) |
| **04 · Linked Lists** | 15. Singly Linked List | `web/linked_list.html` | O(1) head, O(n) tail/search | O(n) |
| **04 · Linked Lists** | 16. Doubly Linked List | `web/doubly_linked_list.html` | O(1) head, O(n) tail/index | O(n) |
| **04 · Linked Lists** | 17. Circular Linked List | `web/circular_linked_list.html` | O(n) | O(n) |
| **04 · Linked Lists** | 18. Doubly Circular Linked List | `web/doubly_circular_linked_list.html` | O(1) ends, O(n) index/search | O(n) |
| **05 · Trees** | 19. Binary Search Tree (BST) | `web/bst.html` | O(log n) avg, O(n) worst | O(n) |
| **05 · Trees** | 20. Tree Traversals (DFS & BFS) | `web/tree_traversals.html` | O(n) | O(h) / O(w) |
| **05 · Trees** | 21. Min / Max Binary Heap | `web/heap.html` | O(log n) insert/extract, O(n) build | O(n) |
| **05 · Trees** | 22. AVL Tree (Self-Balancing) | `web/avl_tree.html` | O(log n) guaranteed | O(n) |
| **05 · Trees** | 23. Trie (Prefix Tree) | `web/trie.html` | O(L) per word/prefix | O(ALPHABET · N) |
| **06 · Graphs** | 24. Breadth-First Search (BFS) | `web/graph.html?algo=bfs` | O(V + E) | O(V) |
| **06 · Graphs** | 25. Depth-First Search (DFS) | `web/graph.html?algo=dfs` | O(V + E) | O(V) |
| **06 · Graphs** | 26. Dijkstra's Shortest Path | `web/graph.html?algo=dijkstra` | O((V + E) log V) | O(V) |
| **06 · Graphs** | 27. A* Search Algorithm | `web/graph.html?algo=astar` | O((V + E) log V) | O(V) |

## Interactive Learning Tools (Available on Every Visualizer Page)

| Tool | Description |
| :--- | :--- |
| **📋 Copy** | Copies the complete, compilable Java implementation to the clipboard |
| **? Help** | Opens a modal explaining page panels, controls, and algorithm glossary terms |
| **⌨️ Keyboard** | `→` Next Step, `←` Previous Step, `Space` Play/Pause, `R` Reset, `?` Help |
| **🎚️ Speed Slider** | Adjusts animation playback speed (`Slow` / `Normal` / `Fast`) |
| **📊 Step Progress** | Live step counter (`Step X of Y`) with a visual progress bar |
| **🔍 Variable Watch** | Displays live loop indices, pointers, balance factors, and return values |
| **🧠 Quiz Mode** | Prompts learners to predict the next step before advancing |
| **🌓 Dark / Light Mode** | Persistent theme toggle synchronized across the homepage and all visualizers |
| **🔗 Share Link** | Copies a URL preloaded with the current custom array or expression |

## Project Structure

```text
algolab-dsa-visualizer/
├── README.md
├── java/
│   └── BubbleSort.java              # Reference standalone Java implementation
├── tests/
│   ├── dsa_suite_tests.py           # Comprehensive automated test suite across all 6 categories
│   └── graph_tests.js               # Unit test suite for Graph model & algorithms
└── web/
    ├── index.html                   # Redesigned homepage (Categories, Roadmap, Search & Filters)
    ├── home.css                     # Homepage design system (Dark & Light themes)
    ├── home.js                      # Homepage search, combined filtering & theme controller
    ├── style.css                    # Shared three-panel workspace & component styles
    ├── common.js                    # Shared code auto-scroll, array parser & speed helpers
    ├── enhance.css                  # Shared learning tools styles (Modals, Watch, Quiz, Dark Mode)
    ├── enhance.js                   # Shared learning tools controller
    ├── linked_list.css              # Styles for all 4 Linked List visualizers
    ├── linked_list_code.js          # Java code listings for all 4 Linked List types
    ├── linked_list.js               # Animation engine for Singly, Doubly, Circular & Doubly Circular lists
    ├── ring_view.js                 # Circular array renderer for Circular Queue & Deque
    ├── tree.css                     # Styles for BST, Tree Traversals, Heap, AVL Tree & Trie
    ├── graph.css                    # Styles for interactive SVG Graph Studio
    ├── graph_model.js               # Pure graph data model, adjacency lists, parser & presets
    ├── graph_algorithms.js          # BFS, DFS (Iterative/Recursive), Dijkstra & A* step engines
    ├── graph_renderer.js            # Interactive SVG graph renderer (zoom, pan, drag, arrowheads)
    └── <visualizer>.html / .js      # 24 interactive visualizer pages and controllers
```

## Running the Project & Automated Tests

1. **Browser**: Open `web/index.html` directly in any modern browser (no build step or server required).
2. **Automated Tests**:
   - Python full-suite verification: `python3 tests/dsa_suite_tests.py`
   - Node.js graph unit tests: `node tests/graph_tests.js`
