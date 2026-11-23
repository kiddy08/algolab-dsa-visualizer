"use strict";

(function (global) {
    const Model = global.AlgoLabGraphModel || (typeof require === "function" ? require("./graph_model.js") : null);

    // ==========================================
    // REAL COMPILABLE JAVA CODE LISTINGS
    // ==========================================

    const JAVA_CODE = {
        bfs: {
            filename: "BreadthFirstSearch.java",
            difficulty: "Beginner",
            timeComplexity: "O(V + E)",
            spaceComplexity: "O(V)",
            lines: [
                "List<String> bfs(Map<String, List<String>> adj, String start) {",
                "    List<String> order = new ArrayList<>();",
                "    Set<String> visited = new HashSet<>();",
                "    Queue<String> queue = new LinkedList<>();",
                "    visited.add(start);",
                "    queue.offer(start);",
                "    while (!queue.isEmpty()) {",
                "        String curr = queue.poll();",
                "        order.add(curr);",
                "        for (String next : adj.get(curr)) {",
                "            if (!visited.contains(next)) {",
                "                visited.add(next);",
                "                queue.offer(next);",
                "            }",
                "        }",
                "    }",
                "    return order;",
                "}"
            ]
        },
        dfs: {
            filename: "DepthFirstSearch.java",
            difficulty: "Beginner",
            timeComplexity: "O(V + E)",
            spaceComplexity: "O(V)",
            lines: [
                "List<String> dfsIterative(Map<String, List<String>> adj, String start) {",
                "    List<String> order = new ArrayList<>();",
                "    Set<String> visited = new HashSet<>();",
                "    Deque<String> stack = new ArrayDeque<>();",
                "    stack.push(start);",
                "    while (!stack.isEmpty()) {",
                "        String curr = stack.pop();",
                "        if (!visited.contains(curr)) {",
                "            visited.add(curr);",
                "            order.add(curr);",
                "            for (String next : reverse(adj.get(curr))) {",
                "                if (!visited.contains(next))",
                "                    stack.push(next);",
                "            }",
                "        }",
                "    }",
                "    return order;",
                "}"
            ]
        },
        dfs_recursive: {
            filename: "DepthFirstSearchRecursive.java",
            difficulty: "Beginner",
            timeComplexity: "O(V + E)",
            spaceComplexity: "O(V)",
            lines: [
                "void dfs(String curr, Map<String, List<String>> adj, Set<String> visited, List<String> order) {",
                "    visited.add(curr);",
                "    order.add(curr);",
                "    for (String next : adj.get(curr)) {",
                "        if (!visited.contains(next)) {",
                "            dfs(next, adj, visited, order);",
                "        }",
                "    }",
                "    // backtrack to previous recursive call",
                "}"
            ]
        },
        dijkstra: {
            filename: "DijkstraShortestPath.java",
            difficulty: "Intermediate",
            timeComplexity: "O((V + E) log V)",
            spaceComplexity: "O(V)",
            lines: [
                "Map<String, Integer> dijkstra(Map<String, List<Edge>> adj, String src, String dest) {",
                "    Map<String, Integer> dist = initInfinity(adj.keySet());",
                "    Map<String, String> prev = new HashMap<>();",
                "    PriorityQueue<NodeDist> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a.dist));",
                "    dist.put(src, 0);",
                "    pq.offer(new NodeDist(src, 0));",
                "    while (!pq.isEmpty()) {",
                "        NodeDist top = pq.poll();",
                "        String u = top.node;",
                "        if (top.dist > dist.get(u)) continue;",
                "        if (u.equals(dest)) break;",
                "        for (Edge e : adj.get(u)) {",
                "            int newDist = dist.get(u) + e.weight;",
                "            if (newDist < dist.get(e.to)) {",
                "                dist.put(e.to, newDist);",
                "                prev.put(e.to, u);",
                "                pq.offer(new NodeDist(e.to, newDist));",
                "            }",
                "        }",
                "    }",
                "    return dist;",
                "}"
            ]
        },
        astar: {
            filename: "AStarSearch.java",
            difficulty: "Advanced",
            timeComplexity: "O((V + E) log V)",
            spaceComplexity: "O(V)",
            lines: [
                "List<String> aStar(Map<String, List<Edge>> adj, String start, String goal) {",
                "    Map<String, Double> gScore = initInfinity(adj.keySet());",
                "    Map<String, Double> fScore = initInfinity(adj.keySet());",
                "    Map<String, String> cameFrom = new HashMap<>();",
                "    PriorityQueue<NodeF> openSet = new PriorityQueue<>(Comparator.comparingDouble(a -> a.f));",
                "    gScore.put(start, 0.0);",
                "    fScore.put(start, heuristic(start, goal));",
                "    openSet.offer(new NodeF(start, fScore.get(start)));",
                "    while (!openSet.isEmpty()) {",
                "        String curr = openSet.poll().node;",
                "        if (curr.equals(goal)) return reconstructPath(cameFrom, goal);",
                "        for (Edge e : adj.get(curr)) {",
                "            double tentativeG = gScore.get(curr) + e.weight;",
                "            if (tentativeG < gScore.get(e.to)) {",
                "                cameFrom.put(e.to, curr);",
                "                gScore.put(e.to, tentativeG);",
                "                fScore.put(e.to, tentativeG + heuristic(e.to, goal));",
                "                openSet.offer(new NodeF(e.to, fScore.get(e.to)));",
                "            }",
                "        }",
                "    }",
                "    return Collections.emptyList(); // unreachable",
                "}"
            ]
        }
    };

    // Extensible Registry for Level 1, Level 2, and Level 3 architecture
    const ALGORITHM_REGISTRY = {
        bfs: { id: "bfs", name: "Breadth-First Search (BFS)", level: 1, requiresDestination: false, requiresNonNegative: false },
        dfs: { id: "dfs", name: "Depth-First Search (Iterative)", level: 1, requiresDestination: false, requiresNonNegative: false },
        dfs_recursive: { id: "dfs_recursive", name: "Depth-First Search (Recursive)", level: 1, requiresDestination: false, requiresNonNegative: false },
        dijkstra: { id: "dijkstra", name: "Dijkstra's Shortest Path", level: 2, requiresDestination: true, requiresNonNegative: true },
        astar: { id: "astar", name: "A* Search Algorithm", level: 2, requiresDestination: true, requiresNonNegative: true }
        // Level 3 extension hooks: bellman_ford, floyd_warshall, topological_sort, cycle_detection, kruskal, prim, scc
    };

    function reconstructPath(prevMap, start, dest) {
        if (!dest || start === dest) return start ? [start] : [];
        if (!prevMap[dest]) return [];
        const path = [];
        let curr = dest;
        const guard = new Set();
        while (curr && !guard.has(curr)) {
            guard.add(curr);
            path.unshift(curr);
            if (curr === start) return path;
            curr = prevMap[curr];
        }
        return [];
    }

    function pathEdgesFromNodes(graph, nodePath) {
        const edgeIds = [];
        for (let i = 0; i < nodePath.length - 1; i++) {
            const u = nodePath[i];
            const v = nodePath[i + 1];
            const match = graph.edges.find(e =>
                (e.from === u && e.to === v) || (!graph.directed && e.from === v && e.to === u)
            );
            if (match) edgeIds.push(match.id);
        }
        return edgeIds;
    }

    function computeHeuristic(graph, nodeId, goalId, heuristicMode) {
        if (heuristicMode === "zero" || !nodeId || !goalId || nodeId === goalId) return 0;
        const a = graph.nodes.find(n => n.id === nodeId);
        const b = graph.nodes.find(n => n.id === goalId);
        if (!a || !b) return 0;
        // Scaled Euclidean pixel distance (admissible for typical edge weights >= 1 when scaled conservatively)
        const distPx = Math.hypot(a.x - b.x, a.y - b.y);
        return Math.round((distPx / 85) * 10) / 10;
    }

    // ==========================================
    // STEP BUILDER HELPER
    // ==========================================

    function makeStepTracker(graph, algoId, source, dest) {
        const steps = [];
        const stats = {
            nodesVisited: 0,
            edgesExplored: 0,
            relaxations: 0,
            dsOps: 0,
            pathLength: "–",
            totalCost: "–",
            timeComplexity: JAVA_CODE[algoId].timeComplexity,
            spaceComplexity: JAVA_CODE[algoId].spaceComplexity
        };

        function pushStep(data) {
            steps.push({
                algoId,
                line: data.line || 1,
                type: data.type || "ready",
                action: data.action || "Step",
                what: data.what || data.message || "",
                why: data.why || "",
                selectedInfo: data.selectedInfo || "None",
                nextInfo: data.nextInfo || "",
                dsSummary: data.dsSummary || "",

                source,
                dest: dest || null,
                currentNode: data.currentNode ?? null,
                activeEdgeId: data.activeEdgeId ?? null,
                visitedNodes: data.visitedNodes ? [...data.visitedNodes] : [],
                frontierNodes: data.frontierNodes ? [...data.frontierNodes] : [],
                pathNodes: data.pathNodes ? [...data.pathNodes] : [],
                pathEdges: data.pathEdges ? [...data.pathEdges] : [],
                isError: Boolean(data.isError),

                dsKind: data.dsKind || "queue",
                queue: data.queue ? [...data.queue] : [],
                stack: data.stack ? [...data.stack] : [],
                visitedSet: data.visitedNodes ? [...data.visitedNodes] : [],
                distances: data.distances ? { ...data.distances } : null,
                prevMap: data.prevMap ? { ...data.prevMap } : null,
                pqItems: data.pqItems ? data.pqItems.map(x => ({ ...x })) : [],
                astarRows: data.astarRows ? data.astarRows.map(x => ({ ...x })) : [],
                closedSet: data.closedSet ? [...data.closedSet] : [],

                stats: { ...stats }
            });
        }

        return { steps, stats, pushStep };
    }

    // ==========================================
    // 1. BREADTH-FIRST SEARCH (BFS)
    // ==========================================

    function runBFS(graph, source) {
        const adj = Model.buildAdjacencyList(graph);
        const { steps, stats, pushStep } = makeStepTracker(graph, "bfs", source, null);

        if (!source || !adj.has(source)) {
            pushStep({
                line: 1,
                type: "error",
                isError: true,
                action: "Invalid Start Node",
                what: "Please select a valid starting node in the graph.",
                why: "BFS requires an existing vertex as its starting point.",
                selectedInfo: "start = null",
                nextInfo: "Add a node or pick a start node from the dropdown.",
                dsSummary: "Queue: [] · Visited: []"
            });
            return steps;
        }

        const visited = [];
        const visitedSet = new Set();
        const queue = [];

        visitedSet.add(source);
        visited.push(source);
        queue.push(source);
        stats.nodesVisited = 1;
        stats.dsOps = 1;

        pushStep({
            line: 5,
            type: "init",
            action: `Initialize BFS at ${source}`,
            what: `Mark ${source} as visited and enqueue ${source} into the FIFO queue.`,
            why: "BFS explores vertices in waves by distance from the start node, using a FIFO queue.",
            selectedInfo: `start = ${source}`,
            nextInfo: `Dequeue ${source} from the front of the queue.`,
            dsSummary: `Queue: [${queue.join(", ")}] · Visited: [${visited.join(", ")}]`,
            dsKind: "bfs",
            currentNode: source,
            visitedNodes: visited,
            frontierNodes: queue,
            queue
        });

        while (queue.length > 0) {
            const curr = queue.shift();
            stats.dsOps += 1;

            pushStep({
                line: 8,
                type: "pop",
                action: `Dequeue & Explore ${curr}`,
                what: `Popped ${curr} from the front of the queue and added it to traversal order.`,
                why: "The oldest unexpanded vertex in the queue is processed next to guarantee level-by-level traversal.",
                selectedInfo: `curr = ${curr}`,
                nextInfo: `Inspect all neighbors of ${curr}.`,
                dsSummary: `Queue: [${queue.join(", ") || "empty"}] · Visited: [${visited.join(", ")}]`,
                dsKind: "bfs",
                currentNode: curr,
                visitedNodes: visited,
                frontierNodes: queue,
                queue
            });

            const neighbors = adj.get(curr) || [];
            for (const edge of neighbors) {
                stats.edgesExplored += 1;
                const next = edge.to;
                const isNew = !visitedSet.has(next);

                if (isNew) {
                    visitedSet.add(next);
                    visited.push(next);
                    queue.push(next);
                    stats.nodesVisited += 1;
                    stats.dsOps += 1;
                }

                pushStep({
                    line: isNew ? 12 : 11,
                    type: isNew ? "push" : "check",
                    action: isNew ? `Discover & Enqueue ${next}` : `Neighbor ${next} Already Visited`,
                    what: isNew
                        ? `Edge ${curr} → ${next}: ${next} is unvisited, so mark visited and enqueue ${next}.`
                        : `Edge ${curr} → ${next}: ${next} is already in visited set, so skip it.`,
                    why: isNew
                        ? "Marking nodes visited when enqueuing prevents duplicate entries in the queue."
                        : "Skipping already-visited neighbors avoids infinite loops on cyclic graphs.",
                    selectedInfo: `edge ${curr} → ${next} (${isNew ? "new" : "already visited"})`,
                    nextInfo: queue.length > 0 ? `Continue checking neighbors or dequeue ${queue[0]}.` : "Queue will soon be empty.",
                    dsSummary: `Queue: [${queue.join(", ") || "empty"}] · Visited: [${visited.join(", ")}]`,
                    dsKind: "bfs",
                    currentNode: curr,
                    activeEdgeId: edge.edgeId,
                    visitedNodes: visited,
                    frontierNodes: queue,
                    queue
                });
            }
        }

        stats.pathLength = `${visited.length} nodes`;
        pushStep({
            line: 17,
            type: "done",
            action: "BFS Traversal Complete",
            what: `Queue is empty. Visited ${visited.length} reachable node(s): [${visited.join(" → ")}].`,
            why: "All vertices reachable from the starting node have been explored level by level.",
            selectedInfo: `Traversal Order: [${visited.join(", ")}]`,
            nextInfo: "Click Replay or choose another algorithm.",
            dsSummary: `Queue: [empty] · Visited (${visited.length}): [${visited.join(", ")}]`,
            dsKind: "bfs",
            visitedNodes: visited,
            pathNodes: visited,
            queue: []
        });

        return steps;
    }

    // ==========================================
    // 2A. DEPTH-FIRST SEARCH (ITERATIVE STACK)
    // ==========================================

    function runDFSIterative(graph, source) {
        const adj = Model.buildAdjacencyList(graph);
        const { steps, stats, pushStep } = makeStepTracker(graph, "dfs", source, null);

        if (!source || !adj.has(source)) {
            pushStep({
                line: 1,
                type: "error",
                isError: true,
                action: "Invalid Start Node",
                what: "Please select a valid starting node in the graph.",
                why: "DFS requires an existing vertex as its starting point.",
                selectedInfo: "start = null",
                nextInfo: "Select a valid start node.",
                dsSummary: "Stack: [] · Visited: []"
            });
            return steps;
        }

        const visited = [];
        const visitedSet = new Set();
        const stack = [source];
        stats.dsOps = 1;

        pushStep({
            line: 5,
            type: "init",
            action: `Push Start Node ${source}`,
            what: `Push ${source} onto the LIFO stack to begin iterative Depth-First Search.`,
            why: "A LIFO stack explores the most recently discovered branch deeply before backtracking.",
            selectedInfo: `start = ${source}`,
            nextInfo: `Pop ${source} from top of stack.`,
            dsSummary: `Stack: [${stack.join(", ")}] · Visited: []`,
            dsKind: "dfs",
            currentNode: source,
            frontierNodes: stack,
            stack
        });

        while (stack.length > 0) {
            const curr = stack.pop();
            stats.dsOps += 1;

            if (visitedSet.has(curr)) {
                pushStep({
                    line: 8,
                    type: "check",
                    action: `Pop ${curr} (Already Visited — Skip)`,
                    what: `${curr} was already visited earlier, so ignore this duplicate stack entry.`,
                    why: "Because a vertex can be pushed multiple times before being popped, we verify !visited.contains(curr).",
                    selectedInfo: `popped = ${curr} (already visited)`,
                    nextInfo: stack.length > 0 ? `Pop next item (${stack[stack.length - 1]}) from stack.` : "Stack is empty.",
                    dsSummary: `Stack: [${stack.join(", ") || "empty"}] · Visited: [${visited.join(", ")}]`,
                    dsKind: "dfs",
                    currentNode: curr,
                    visitedNodes: visited,
                    frontierNodes: stack,
                    stack
                });
                continue;
            }

            visitedSet.add(curr);
            visited.push(curr);
            stats.nodesVisited += 1;

            pushStep({
                line: 9,
                type: "pop",
                action: `Pop & Visit ${curr}`,
                what: `Popped ${curr} from the stack, marked it visited, and recorded it in traversal order.`,
                why: "The top of the stack represents the deepest unvisited vertex on the current path.",
                selectedInfo: `curr = ${curr}`,
                nextInfo: `Push unvisited neighbors of ${curr} onto stack.`,
                dsSummary: `Stack: [${stack.join(", ") || "empty"}] · Visited: [${visited.join(", ")}]`,
                dsKind: "dfs",
                currentNode: curr,
                visitedNodes: visited,
                frontierNodes: stack,
                stack
            });

            // Push in reverse alphabetical order so alphabetical neighbor is popped first
            const neighbors = [...(adj.get(curr) || [])].reverse();
            for (const edge of neighbors) {
                stats.edgesExplored += 1;
                const next = edge.to;
                const unvisited = !visitedSet.has(next);
                if (unvisited) {
                    stack.push(next);
                    stats.dsOps += 1;
                }

                pushStep({
                    line: unvisited ? 13 : 12,
                    type: unvisited ? "push" : "check",
                    action: unvisited ? `Push Neighbor ${next} to Stack` : `Skip Visited Neighbor ${next}`,
                    what: unvisited
                        ? `Neighbor ${next} is unvisited — push ${next} onto the stack.`
                        : `Neighbor ${next} is already visited — do not push.`,
                    why: unvisited
                        ? "Pushing neighbors onto the LIFO stack schedules them to be explored before shallower nodes."
                        : "Skipping visited nodes prevents cycles from looping endlessly.",
                    selectedInfo: `edge ${curr} → ${next}`,
                    nextInfo: stack.length > 0 ? `Top of stack is now ${stack[stack.length - 1]}.` : "Stack is empty.",
                    dsSummary: `Stack: [${stack.join(", ") || "empty"}] · Visited: [${visited.join(", ")}]`,
                    dsKind: "dfs",
                    currentNode: curr,
                    activeEdgeId: edge.edgeId,
                    visitedNodes: visited,
                    frontierNodes: stack,
                    stack
                });
            }
        }

        stats.pathLength = `${visited.length} nodes`;
        pushStep({
            line: 17,
            type: "done",
            action: "DFS Traversal Complete",
            what: `Stack is empty. Visited ${visited.length} reachable node(s): [${visited.join(" → ")}].`,
            why: "All reachable branches have been explored to their full depth.",
            selectedInfo: `Traversal Order: [${visited.join(", ")}]`,
            nextInfo: "Try Recursive DFS or Dijkstra's Shortest Path next.",
            dsSummary: `Stack: [empty] · Visited (${visited.length}): [${visited.join(", ")}]`,
            dsKind: "dfs",
            visitedNodes: visited,
            pathNodes: visited,
            stack: []
        });

        return steps;
    }

    // ==========================================
    // 2B. DEPTH-FIRST SEARCH (RECURSIVE CALL STACK)
    // ==========================================

    function runDFSRecursive(graph, source) {
        const adj = Model.buildAdjacencyList(graph);
        const { steps, stats, pushStep } = makeStepTracker(graph, "dfs_recursive", source, null);

        if (!source || !adj.has(source)) {
            pushStep({
                line: 1,
                type: "error",
                isError: true,
                action: "Invalid Start Node",
                what: "Please select a valid starting node.",
                why: "Recursive DFS starts from a valid root vertex.",
                selectedInfo: "start = null",
                nextInfo: "Select a valid start node.",
                dsSummary: "Call Stack: [] · Visited: []"
            });
            return steps;
        }

        const visited = [];
        const visitedSet = new Set();
        const callStack = [];

        function dfs(u, incomingEdgeId) {
            callStack.push(`dfs(${u})`);
            visitedSet.add(u);
            visited.push(u);
            stats.nodesVisited += 1;
            stats.dsOps += 1;

            pushStep({
                line: 2,
                type: "push",
                action: `Enter dfs(${u}) & Visit ${u}`,
                what: `Call dfs(${u}), mark ${u} visited, and append ${u} to traversal order.`,
                why: "Recursive DFS visits a vertex immediately upon entering its recursive call frame.",
                selectedInfo: `curr = ${u}`,
                nextInfo: `Explore unvisited neighbors of ${u}.`,
                dsSummary: `Call Stack: [${callStack.join(" → ")}] · Visited: [${visited.join(", ")}]`,
                dsKind: "dfs_rec",
                currentNode: u,
                activeEdgeId: incomingEdgeId,
                visitedNodes: visited,
                frontierNodes: callStack.map(s => s.slice(4, -1)),
                stack: callStack
            });

            const neighbors = adj.get(u) || [];
            for (const edge of neighbors) {
                stats.edgesExplored += 1;
                const v = edge.to;
                if (!visitedSet.has(v)) {
                    pushStep({
                        line: 6,
                        type: "recurse",
                        action: `Recurse from ${u} → dfs(${v})`,
                        what: `Neighbor ${v} is unvisited — invoke dfs(${v}).`,
                        why: "DFS dives immediately into the first unvisited neighbor before checking remaining neighbors.",
                        selectedInfo: `edge ${u} → ${v}`,
                        nextInfo: `Execute dfs(${v}).`,
                        dsSummary: `Call Stack: [${callStack.join(" → ")}] · Visited: [${visited.join(", ")}]`,
                        dsKind: "dfs_rec",
                        currentNode: u,
                        activeEdgeId: edge.edgeId,
                        visitedNodes: visited,
                        frontierNodes: callStack.map(s => s.slice(4, -1)),
                        stack: callStack
                    });
                    dfs(v, edge.edgeId);
                } else {
                    pushStep({
                        line: 5,
                        type: "check",
                        action: `Skip Visited Neighbor ${v}`,
                        what: `Neighbor ${v} is already visited, so skip recursive call.`,
                        why: "Prevents revisiting nodes or looping forever on cycles.",
                        selectedInfo: `edge ${u} → ${v} (already visited)`,
                        nextInfo: `Check remaining neighbors of ${u}.`,
                        dsSummary: `Call Stack: [${callStack.join(" → ")}] · Visited: [${visited.join(", ")}]`,
                        dsKind: "dfs_rec",
                        currentNode: u,
                        activeEdgeId: edge.edgeId,
                        visitedNodes: visited,
                        frontierNodes: callStack.map(s => s.slice(4, -1)),
                        stack: callStack
                    });
                }
            }

            callStack.pop();
            stats.dsOps += 1;

            pushStep({
                line: 9,
                type: "pop",
                action: `Backtrack from dfs(${u})`,
                what: `Finished all neighbors of ${u}. Pop dfs(${u}) from the call stack.`,
                why: callStack.length > 0
                    ? `Return control back to caller ${callStack[callStack.length - 1]}.`
                    : "Root call frame finished; traversal is complete.",
                selectedInfo: `backtrack from ${u}`,
                nextInfo: callStack.length > 0 ? `Resume ${callStack[callStack.length - 1]}.` : "Finish algorithm.",
                dsSummary: `Call Stack: [${callStack.join(" → ") || "empty"}] · Visited: [${visited.join(", ")}]`,
                dsKind: "dfs_rec",
                currentNode: callStack.length > 0 ? callStack[callStack.length - 1].slice(4, -1) : u,
                visitedNodes: visited,
                frontierNodes: callStack.map(s => s.slice(4, -1)),
                stack: callStack
            });
        }

        dfs(source, null);

        stats.pathLength = `${visited.length} nodes`;
        pushStep({
            line: 9,
            type: "done",
            action: "Recursive DFS Complete",
            what: `All recursive frames returned. Traversal order: [${visited.join(" → ")}].`,
            why: "Every vertex reachable from the root call has been visited and backtracked.",
            selectedInfo: `Traversal Order: [${visited.join(", ")}]`,
            nextInfo: "Done.",
            dsSummary: `Call Stack: [empty] · Visited (${visited.length}): [${visited.join(", ")}]`,
            dsKind: "dfs_rec",
            visitedNodes: visited,
            pathNodes: visited,
            stack: []
        });

        return steps;
    }

    // ==========================================
    // 3. DIJKSTRA'S SHORTEST PATH ALGORITHM
    // ==========================================

    function runDijkstra(graph, source, dest) {
        const adj = Model.buildAdjacencyList(graph);
        const { steps, stats, pushStep } = makeStepTracker(graph, "dijkstra", source, dest);

        if (!source || !adj.has(source)) {
            pushStep({
                line: 1,
                type: "error",
                isError: true,
                action: "Invalid Source Node",
                what: "Select a valid source node to run Dijkstra's algorithm.",
                why: "Dijkstra computes shortest paths starting from a valid source vertex.",
                selectedInfo: "src = null",
                nextInfo: "Choose a source node.",
                dsSummary: "PQ: []"
            });
            return steps;
        }

        const hasNegative = graph.edges.some(e => (graph.weighted ? e.weight : 1) < 0);
        if (hasNegative) {
            pushStep({
                line: 1,
                type: "error",
                isError: true,
                action: "Negative Edge Weight Detected",
                what: "Dijkstra's algorithm requires non-negative edge weights (>= 0).",
                why: "Negative weights break Dijkstra's greedy invariant (use Bellman-Ford for negative weights).",
                selectedInfo: "Invalid weight < 0",
                nextInfo: "Edit edge weights to be >= 0.",
                dsSummary: "Invalid input"
            });
            return steps;
        }

        const dist = {};
        const prev = {};
        const settled = [];
        const settledSet = new Set();

        graph.nodes.forEach(n => {
            dist[n.id] = Infinity;
            prev[n.id] = null;
        });
        dist[source] = 0;

        const pq = [{ node: source, dist: 0 }];
        stats.dsOps = 1;

        pushStep({
            line: 5,
            type: "init",
            action: `Initialize Distances (dist[${source}] = 0)`,
            what: `Set dist[${source}] = 0, all other distances = ∞, and insert (${source}, 0) into the Min-Priority Queue.`,
            why: "At the start, only the distance from source to itself is known to be 0.",
            selectedInfo: `src = ${source}, dest = ${dest || "all"}`,
            nextInfo: `Extract minimum distance node (${source}) from Priority Queue.`,
            dsSummary: `PQ: [(${source}: 0)]`,
            dsKind: "dijkstra",
            currentNode: source,
            frontierNodes: [source],
            distances: dist,
            prevMap: prev,
            pqItems: pq
        });

        while (pq.length > 0) {
            pq.sort((a, b) => a.dist - b.dist || a.node.localeCompare(b.node));
            const top = pq.shift();
            const u = top.node;
            stats.dsOps += 1;

            if (top.dist > dist[u]) {
                pushStep({
                    line: 10,
                    type: "check",
                    action: `Skip Outdated PQ Entry (${u}: ${top.dist})`,
                    what: `Polled (${u}, ${top.dist}), which is worse than best known dist[${u}] = ${dist[u]}.`,
                    why: "Because standard PriorityQueue lacks decrease-key, stale entries are skipped in O(1).",
                    selectedInfo: `stale (${u}: ${top.dist}) > dist[${u}] (${dist[u]})`,
                    nextInfo: "Poll next smallest entry from PQ.",
                    dsSummary: `PQ: [${pq.map(x => `${x.node}:${x.dist}`).join(", ") || "empty"}]`,
                    dsKind: "dijkstra",
                    currentNode: u,
                    visitedNodes: settled,
                    frontierNodes: pq.map(x => x.node),
                    distances: dist,
                    prevMap: prev,
                    pqItems: pq
                });
                continue;
            }

            if (!settledSet.has(u)) {
                settledSet.add(u);
                settled.push(u);
                stats.nodesVisited += 1;
            }

            pushStep({
                line: 8,
                type: "pop",
                action: `Settle Node ${u} (dist = ${dist[u]})`,
                what: `Polled ${u} with minimum tentative distance ${dist[u]}. Its shortest distance is now finalized.`,
                why: "With non-negative weights, no future path through other unvisited nodes can produce a smaller distance to u.",
                selectedInfo: `u = ${u}, dist[${u}] = ${dist[u]}`,
                nextInfo: dest && u === dest ? `Destination ${dest} reached!` : `Relax outgoing edges from ${u}.`,
                dsSummary: `PQ: [${pq.map(x => `${x.node}:${x.dist}`).join(", ") || "empty"}] · Settled: [${settled.join(", ")}]`,
                dsKind: "dijkstra",
                currentNode: u,
                visitedNodes: settled,
                frontierNodes: pq.map(x => x.node),
                distances: dist,
                prevMap: prev,
                pqItems: pq
            });

            if (dest && u === dest) {
                break;
            }

            const neighbors = adj.get(u) || [];
            for (const edge of neighbors) {
                stats.edgesExplored += 1;
                const v = edge.to;
                const newDist = dist[u] + edge.weight;
                const improved = newDist < dist[v];

                if (improved) {
                    dist[v] = newDist;
                    prev[v] = u;
                    pq.push({ node: v, dist: newDist });
                    stats.relaxations += 1;
                    stats.dsOps += 1;
                }

                pq.sort((a, b) => a.dist - b.dist || a.node.localeCompare(b.node));

                pushStep({
                    line: improved ? 15 : 14,
                    type: improved ? "push" : "check",
                    action: improved
                        ? `Relax Edge ${u} → ${v}: dist[${v}] = ${newDist}`
                        : `No Relaxation on ${u} → ${v} (${newDist} >= ${dist[v] === Infinity ? "∞" : dist[v]})`,
                    what: improved
                        ? `Found shorter path to ${v} via ${u}: ${dist[u]} + ${edge.weight} = ${newDist}. Updated prev[${v}] = ${u} and pushed (${v}: ${newDist}).`
                        : `Candidate distance ${newDist} does not improve current dist[${v}] = ${dist[v] === Infinity ? "∞" : dist[v]}.`,
                    why: improved
                        ? "Edge relaxation updates dist[v] whenever going through u yields a strictly smaller total cost."
                        : "Only strictly shorter paths trigger a distance update.",
                    selectedInfo: `edge ${u} → ${v} (weight ${edge.weight})`,
                    nextInfo: pq.length > 0 ? `Next min in PQ: (${pq[0].node}: ${pq[0].dist}).` : "PQ is empty.",
                    dsSummary: `PQ: [${pq.map(x => `${x.node}:${x.dist}`).join(", ") || "empty"}]`,
                    dsKind: "dijkstra",
                    currentNode: u,
                    activeEdgeId: edge.edgeId,
                    visitedNodes: settled,
                    frontierNodes: pq.map(x => x.node),
                    distances: dist,
                    prevMap: prev,
                    pqItems: pq
                });
            }
        }

        if (dest) {
            const path = reconstructPath(prev, source, dest);
            const reachable = path.length > 0 && dist[dest] !== Infinity;
            const pathEdgeIds = reachable ? pathEdgesFromNodes(graph, path) : [];
            stats.pathLength = reachable ? `${path.length - 1} edges (${path.length} nodes)` : "Unreachable";
            stats.totalCost = reachable ? String(dist[dest]) : "∞ (Unreachable)";

            pushStep({
                line: 21,
                type: reachable ? "done" : "error",
                isError: !reachable,
                action: reachable
                    ? `Shortest Path ${source} → ${dest}: Cost ${dist[dest]}`
                    : `Destination ${dest} Is Unreachable from ${source}`,
                what: reachable
                    ? `Shortest path: ${path.join(" → ")} with total cost ${dist[dest]}.`
                    : `No directed/undirected path exists from ${source} to ${dest} (dist[${dest}] = ∞).`,
                why: reachable
                    ? "Backtracking prev[] from destination to source reconstructs the optimal shortest path."
                    : "The graph is disconnected between source and destination.",
                selectedInfo: reachable ? `Path: ${path.join(" → ")} (cost = ${dist[dest]})` : `${dest} unreachable`,
                nextInfo: "Done.",
                dsSummary: reachable ? `Optimal Path: ${path.join(" → ")} · Cost: ${dist[dest]}` : "Unreachable",
                dsKind: "dijkstra",
                visitedNodes: settled,
                pathNodes: path,
                pathEdges: pathEdgeIds,
                distances: dist,
                prevMap: prev,
                pqItems: []
            });
        } else {
            stats.pathLength = `${settled.length} nodes settled`;
            stats.totalCost = "All shortest paths";
            pushStep({
                line: 21,
                type: "done",
                action: `Dijkstra Complete from ${source}`,
                what: `Computed shortest distances from ${source} to all reachable vertices.`,
                why: "Priority queue is empty; all reachable nodes have optimal distances.",
                selectedInfo: `Settled: [${settled.join(", ")}]`,
                nextInfo: "Done.",
                dsSummary: `Settled (${settled.length}): [${settled.join(", ")}]`,
                dsKind: "dijkstra",
                visitedNodes: settled,
                distances: dist,
                prevMap: prev,
                pqItems: []
            });
        }

        return steps;
    }

    // ==========================================
    // 4. A* SEARCH ALGORITHM
    // ==========================================

    function runAStar(graph, source, dest, heuristicMode = "euclidean") {
        const adj = Model.buildAdjacencyList(graph);
        const { steps, stats, pushStep } = makeStepTracker(graph, "astar", source, dest);

        if (!source || !dest || !adj.has(source) || !adj.has(dest)) {
            pushStep({
                line: 1,
                type: "error",
                isError: true,
                action: "Select Start and Goal Nodes",
                what: "A* Search requires both a valid Start node and a valid Goal node.",
                why: "The heuristic h(n) estimates remaining cost from node n to the Goal node.",
                selectedInfo: `start = ${source || "null"}, goal = ${dest || "null"}`,
                nextInfo: "Choose both Source and Destination nodes.",
                dsSummary: "Open Set: []"
            });
            return steps;
        }

        const hasNegative = graph.edges.some(e => (graph.weighted ? e.weight : 1) < 0);
        if (hasNegative) {
            pushStep({
                line: 1,
                type: "error",
                isError: true,
                action: "Negative Weight Not Supported",
                what: "A* Search requires non-negative edge weights (>= 0).",
                why: "Negative weights violate heuristic admissibility.",
                selectedInfo: "Invalid weight < 0",
                nextInfo: "Use non-negative weights.",
                dsSummary: "Invalid input"
            });
            return steps;
        }

        const gScore = {};
        const hScore = {};
        const fScore = {};
        const cameFrom = {};
        const closedSet = [];
        const closed = new Set();

        graph.nodes.forEach(n => {
            gScore[n.id] = Infinity;
            hScore[n.id] = computeHeuristic(graph, n.id, dest, heuristicMode);
            fScore[n.id] = Infinity;
            cameFrom[n.id] = null;
        });

        gScore[source] = 0;
        fScore[source] = hScore[source];

        const openSet = [{ node: source, g: 0, h: hScore[source], f: fScore[source] }];
        stats.dsOps = 1;

        function buildAStarTable() {
            return graph.nodes
                .slice()
                .sort((a, b) => a.id.localeCompare(b.id))
                .map(n => ({
                    node: n.id,
                    g: gScore[n.id],
                    h: hScore[n.id],
                    f: fScore[n.id],
                    status: closed.has(n.id) ? "Closed" : openSet.some(o => o.node === n.id) ? "Open" : "Unseen"
                }));
        }

        pushStep({
            line: 8,
            type: "init",
            action: `Initialize A* (${source} → ${dest})`,
            what: `Set g(${source}) = 0, h(${source}) = ${hScore[source]}, f(${source}) = g + h = ${fScore[source]}. Added ${source} to Open Set.`,
            why: `A* prioritizes nodes with lowest f(n) = g(n) + h(n) (${heuristicMode === "zero" ? "Zero heuristic (h=0)" : "Euclidean layout heuristic"}).`,
            selectedInfo: `start = ${source}, goal = ${dest}`,
            nextInfo: `Pop lowest f(n) node (${source}) from Open Set.`,
            dsSummary: `Open: [${source} (f=${fScore[source]})] · Closed: []`,
            dsKind: "astar",
            currentNode: source,
            frontierNodes: [source],
            astarRows: buildAStarTable(),
            closedSet
        });

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f || a.h - b.h || a.node.localeCompare(b.node));
            const currentEntry = openSet.shift();
            const curr = currentEntry.node;
            stats.dsOps += 1;

            if (closed.has(curr)) continue;
            closed.add(curr);
            closedSet.push(curr);
            stats.nodesVisited += 1;

            if (curr === dest) {
                const path = reconstructPath(cameFrom, source, dest);
                const pathEdgeIds = pathEdgesFromNodes(graph, path);
                stats.pathLength = `${path.length - 1} edges (${path.length} nodes)`;
                stats.totalCost = String(gScore[dest]);

                pushStep({
                    line: 11,
                    type: "done",
                    action: `Goal ${dest} Reached! Total Cost = ${gScore[dest]}`,
                    what: `Polled goal ${dest} with lowest f(${dest}) = ${fScore[dest]}. Reconstructed optimal path: ${path.join(" → ")}.`,
                    why: "When A* pops the goal node from the Open Set with an admissible heuristic, g(goal) is guaranteed optimal.",
                    selectedInfo: `Path: ${path.join(" → ")} (cost = ${gScore[dest]})`,
                    nextInfo: "Done.",
                    dsSummary: `Path: ${path.join(" → ")} · g(${dest}) = ${gScore[dest]}`,
                    dsKind: "astar",
                    currentNode: dest,
                    visitedNodes: closedSet,
                    pathNodes: path,
                    pathEdges: pathEdgeIds,
                    astarRows: buildAStarTable(),
                    closedSet
                });
                return steps;
            }

            pushStep({
                line: 10,
                type: "pop",
                action: `Expand ${curr} (f = ${fScore[curr]})`,
                what: `Popped ${curr} from Open Set (g=${gScore[curr]}, h=${hScore[curr]}, f=${fScore[curr]}) and moved it to Closed Set.`,
                why: "A* always expands the open vertex with the lowest estimated total cost f(n) = g(n) + h(n).",
                selectedInfo: `curr = ${curr} (g=${gScore[curr]}, h=${hScore[curr]}, f=${fScore[curr]})`,
                nextInfo: `Evaluate neighbors of ${curr}.`,
                dsSummary: `Open: [${openSet.map(x => `${x.node}(f=${x.f})`).join(", ") || "empty"}] · Closed: [${closedSet.join(", ")}]`,
                dsKind: "astar",
                currentNode: curr,
                visitedNodes: closedSet,
                frontierNodes: openSet.map(x => x.node),
                astarRows: buildAStarTable(),
                closedSet
            });

            const neighbors = adj.get(curr) || [];
            for (const edge of neighbors) {
                stats.edgesExplored += 1;
                const next = edge.to;
                if (closed.has(next)) {
                    pushStep({
                        line: 12,
                        type: "check",
                        action: `Neighbor ${next} in Closed Set — Skip`,
                        what: `${next} is already in the Closed Set, so skip edge ${curr} → ${next}.`,
                        why: "Closed nodes have already been expanded.",
                        selectedInfo: `edge ${curr} → ${next} (closed)`,
                        nextInfo: `Check next neighbor of ${curr}.`,
                        dsSummary: `Closed: [${closedSet.join(", ")}]`,
                        dsKind: "astar",
                        currentNode: curr,
                        activeEdgeId: edge.edgeId,
                        visitedNodes: closedSet,
                        frontierNodes: openSet.map(x => x.node),
                        astarRows: buildAStarTable(),
                        closedSet
                    });
                    continue;
                }

                const tentativeG = gScore[curr] + edge.weight;
                const improved = tentativeG < gScore[next];

                if (improved) {
                    cameFrom[next] = curr;
                    gScore[next] = tentativeG;
                    fScore[next] = Math.round((tentativeG + hScore[next]) * 10) / 10;
                    const existingOpen = openSet.find(o => o.node === next);
                    if (existingOpen) {
                        existingOpen.g = gScore[next];
                        existingOpen.f = fScore[next];
                    } else {
                        openSet.push({ node: next, g: gScore[next], h: hScore[next], f: fScore[next] });
                    }
                    stats.relaxations += 1;
                    stats.dsOps += 1;
                }

                openSet.sort((a, b) => a.f - b.f || a.h - b.h || a.node.localeCompare(b.node));

                pushStep({
                    line: improved ? 17 : 14,
                    type: improved ? "push" : "check",
                    action: improved
                        ? `Update ${next}: g=${gScore[next]}, h=${hScore[next]}, f=${fScore[next]}`
                        : `Keep ${next}: tentative g=${tentativeG} >= ${gScore[next] === Infinity ? "∞" : gScore[next]}`,
                    what: improved
                        ? `Via ${curr}, g(${next}) = ${gScore[curr]} + ${edge.weight} = ${gScore[next]}. f(${next}) = ${gScore[next]} + ${hScore[next]} = ${fScore[next]}.`
                        : `Path through ${curr} has g=${tentativeG}, which is not better than existing g(${next})=${gScore[next]}.`,
                    why: improved
                        ? "Lower g(n) reduces total estimated cost f(n) = g(n) + h(n), updating Open Set priority."
                        : "Existing path to neighbor is already cheaper.",
                    selectedInfo: `edge ${curr} → ${next} (w=${edge.weight})`,
                    nextInfo: openSet.length > 0 ? `Next lowest f in Open Set: ${openSet[0].node} (f=${openSet[0].f}).` : "Open Set empty.",
                    dsSummary: `Open: [${openSet.map(x => `${x.node}(f=${x.f})`).join(", ") || "empty"}]`,
                    dsKind: "astar",
                    currentNode: curr,
                    activeEdgeId: edge.edgeId,
                    visitedNodes: closedSet,
                    frontierNodes: openSet.map(x => x.node),
                    astarRows: buildAStarTable(),
                    closedSet
                });
            }
        }

        stats.pathLength = "Unreachable";
        stats.totalCost = "∞ (Unreachable)";

        pushStep({
            line: 22,
            type: "error",
            isError: true,
            action: `Goal ${dest} Is Unreachable from ${source}`,
            what: `Open Set became empty without reaching ${dest}.`,
            why: "There is no valid path connecting the start node to the goal node.",
            selectedInfo: `${dest} unreachable`,
            nextInfo: "Try a connected graph or choose a reachable goal.",
            dsSummary: `Open: [empty] · Closed: [${closedSet.join(", ")}]`,
            dsKind: "astar",
            visitedNodes: closedSet,
            astarRows: buildAStarTable(),
            closedSet
        });

        return steps;
    }

    function executeAlgorithm(algoId, graph, params = {}) {
        const source = params.source || (graph.nodes[0] ? graph.nodes[0].id : null);
        const dest = params.dest || (graph.nodes.length > 1 ? graph.nodes[graph.nodes.length - 1].id : source);
        const heuristicMode = params.heuristicMode || "euclidean";

        if (algoId === "bfs") return runBFS(graph, source);
        if (algoId === "dfs") return runDFSIterative(graph, source);
        if (algoId === "dfs_recursive") return runDFSRecursive(graph, source);
        if (algoId === "dijkstra") return runDijkstra(graph, source, dest);
        if (algoId === "astar") return runAStar(graph, source, dest, heuristicMode);
        return runBFS(graph, source);
    }

    const GraphAlgorithms = {
        JAVA_CODE,
        ALGORITHM_REGISTRY,
        reconstructPath,
        computeHeuristic,
        runBFS,
        runDFSIterative,
        runDFSRecursive,
        runDijkstra,
        runAStar,
        executeAlgorithm
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = GraphAlgorithms;
    }
    global.AlgoLabGraphAlgorithms = GraphAlgorithms;
})(typeof window !== "undefined" ? window : globalThis);
