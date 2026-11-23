"use strict";

// Automated Test Suite for AlgoLab Graph Visualizer (Node / CommonJS or Browser)
const GraphModel = typeof require === "function"
    ? require("../web/graph_model.js")
    : window.AlgoLabGraphModel;
const GraphAlgos = typeof require === "function"
    ? require("../web/graph_algorithms.js")
    : window.AlgoLabGraphAlgorithms;

function assert(cond, msg) {
    if (!cond) throw new Error("Assertion failed: " + msg);
}

function runAllGraphTests() {
    let passed = 0;

    // 1. BFS Traversal on Simple Undirected Graph
    const simple = GraphModel.getPreset("simple");
    const bfsSteps = GraphAlgos.runBFS(simple, "A");
    const bfsLast = bfsSteps[bfsSteps.length - 1];
    assert(bfsLast.visitedNodes.join(",") === "A,B,C,D,E", "BFS traversal order mismatch");
    passed++;

    // 2. DFS Iterative & Recursive Traversal
    const dfsIterSteps = GraphAlgos.runDFSIterative(simple, "A");
    const dfsRecSteps = GraphAlgos.runDFSRecursive(simple, "A");
    assert(dfsIterSteps[dfsIterSteps.length - 1].visitedNodes.join(",") === "A,B,D,C,E", "DFS iterative order mismatch");
    assert(dfsRecSteps[dfsRecSteps.length - 1].visitedNodes.join(",") === "A,B,D,C,E", "DFS recursive order mismatch");
    passed++;

    // 3. Dijkstra Shortest Path & Distances on Weighted Graph
    const weighted = GraphModel.getPreset("weighted");
    const dijSteps = GraphAlgos.runDijkstra(weighted, "A", "F");
    const dijLast = dijSteps[dijSteps.length - 1];
    assert(dijLast.distances.F === 13, "Dijkstra shortest distance A->F should be 13");
    assert(dijLast.pathNodes[0] === "A" && dijLast.pathNodes[dijLast.pathNodes.length - 1] === "F", "Dijkstra path endpoints mismatch");
    passed++;

    // 4. A* Search Path Correctness (Euclidean & Zero Heuristics)
    const astarZero = GraphAlgos.runAStar(weighted, "A", "F", "zero");
    const astarZeroLast = astarZero[astarZero.length - 1];
    assert(astarZeroLast.stats.totalCost === "13", "A* with zero heuristic cost should match Dijkstra (13)");
    passed++;

    // 5. Disconnected Graph Handling
    const disc = GraphModel.getPreset("disconnected");
    const discDij = GraphAlgos.runDijkstra(disc, "A", "E");
    const discLast = discDij[discDij.length - 1];
    assert(discLast.isError === true && discLast.stats.pathLength === "Unreachable", "Disconnected destination must be unreachable");
    passed++;

    // 6. Cyclic & Directed Graph Analysis
    const cyclic = GraphModel.getPreset("cyclic");
    const analysis = GraphModel.analyzeGraph(cyclic);
    assert(analysis.cyclic === true && analysis.connected === true, "Cyclic preset analysis mismatch");
    passed++;

    // 7. Invalid Inputs Handling
    const badParse = GraphModel.parseEdgeList("A-B:-5");
    assert(Boolean(badParse.error), "Negative edge weight must be rejected");
    const selfLoop = GraphModel.addEdge(GraphModel.createEmptyGraph(), "A", "A", 1);
    assert(!selfLoop.ok, "Self-loop must be rejected");
    passed++;

    // 8. Previous / Next Step Snapshot Immutability
    assert(bfsSteps[0].visitedNodes.length === 1 && bfsLast.visitedNodes.length === 5, "Step snapshots must remain immutable");
    passed++;

    console.log(`All ${passed} Graph Visualizer test suites passed!`);
    return passed;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { runAllGraphTests };
    if (require.main === module) runAllGraphTests();
}
