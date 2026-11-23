"use strict";

(function (global) {
    const MAX_NODES = 16;
    const MAX_EDGES = 40;

    function createEmptyGraph(options = {}) {
        return {
            directed: Boolean(options.directed),
            weighted: Boolean(options.weighted),
            nodes: [], // [{ id: 'A', label: 'A', x: 120, y: 120 }]
            edges: []  // [{ id: 'A->B', from: 'A', to: 'B', weight: 1 }]
        };
    }

    function cloneGraph(graph) {
        return {
            directed: Boolean(graph.directed),
            weighted: Boolean(graph.weighted),
            nodes: graph.nodes.map(n => ({ id: n.id, label: n.label, x: n.x, y: n.y })),
            edges: graph.edges.map(e => ({ id: e.id, from: e.from, to: e.to, weight: e.weight }))
        };
    }

    function edgeKey(from, to, directed) {
        if (directed) return `${from}->${to}`;
        return from < to ? `${from}--${to}` : `${to}--${from}`;
    }

    function nextNodeId(graph) {
        const used = new Set(graph.nodes.map(n => n.id));
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let i = 0; i < alphabet.length; i++) {
            if (!used.has(alphabet[i])) return alphabet[i];
        }
        let num = 1;
        while (used.has("N" + num)) num++;
        return "N" + num;
    }

    function addNode(graph, opts = {}) {
        if (graph.nodes.length >= MAX_NODES) {
            return { ok: false, error: `Maximum ${MAX_NODES} nodes reached.` };
        }
        const id = (opts.id || nextNodeId(graph)).trim().toUpperCase();
        if (!/^[A-Z0-9]{1,4}$/.test(id)) {
            return { ok: false, error: "Node label must be 1–4 letters or digits (e.g. A, B, N1)." };
        }
        if (graph.nodes.some(n => n.id === id)) {
            return { ok: false, error: `Node "${id}" already exists.` };
        }
        const idx = graph.nodes.length;
        const angle = (idx * 2 * Math.PI) / 8 - Math.PI / 2;
        const x = Number.isFinite(opts.x) ? Math.round(opts.x) : Math.round(330 + 135 * Math.cos(angle));
        const y = Number.isFinite(opts.y) ? Math.round(opts.y) : Math.round(175 + 105 * Math.sin(angle));
        graph.nodes.push({ id, label: id, x, y });
        return { ok: true, id };
    }

    function removeNode(graph, nodeId) {
        const before = graph.nodes.length;
        graph.nodes = graph.nodes.filter(n => n.id !== nodeId);
        if (graph.nodes.length === before) {
            return { ok: false, error: `Node "${nodeId}" not found.` };
        }
        graph.edges = graph.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
        return { ok: true };
    }

    function renameNode(graph, oldId, newIdRaw) {
        const newId = String(newIdRaw || "").trim().toUpperCase();
        if (!/^[A-Z0-9]{1,4}$/.test(newId)) {
            return { ok: false, error: "Label must be 1–4 alphanumeric characters." };
        }
        if (oldId === newId) return { ok: true, id: newId };
        if (graph.nodes.some(n => n.id === newId)) {
            return { ok: false, error: `Node "${newId}" already exists.` };
        }
        const node = graph.nodes.find(n => n.id === oldId);
        if (!node) return { ok: false, error: `Node "${oldId}" not found.` };

        node.id = newId;
        node.label = newId;
        graph.edges.forEach(e => {
            if (e.from === oldId) e.from = newId;
            if (e.to === oldId) e.to = newId;
            e.id = edgeKey(e.from, e.to, graph.directed);
        });
        return { ok: true, id: newId };
    }

    function addEdge(graph, from, to, weight = 1) {
        if (from === to) {
            return { ok: false, error: "Self-loops are not allowed in simple graphs." };
        }
        if (!graph.nodes.some(n => n.id === from) || !graph.nodes.some(n => n.id === to)) {
            return { ok: false, error: `Both endpoints (${from}, ${to}) must exist.` };
        }
        const w = graph.weighted ? Number(weight) : 1;
        if (graph.weighted && (!Number.isFinite(w) || w < 0 || w > 999)) {
            return { ok: false, error: "Edge weight must be a non-negative number (0–999)." };
        }
        const key = edgeKey(from, to, graph.directed);
        const existing = graph.edges.find(e => edgeKey(e.from, e.to, graph.directed) === key);
        if (existing) {
            existing.weight = w;
            return { ok: true, updated: true, edge: existing };
        }
        if (graph.edges.length >= MAX_EDGES) {
            return { ok: false, error: `Maximum ${MAX_EDGES} edges reached.` };
        }
        const edge = { id: key, from, to, weight: w };
        graph.edges.push(edge);
        return { ok: true, edge };
    }

    function removeEdge(graph, edgeId) {
        const before = graph.edges.length;
        graph.edges = graph.edges.filter(e => e.id !== edgeId);
        if (graph.edges.length === before) {
            return { ok: false, error: "Edge not found." };
        }
        return { ok: true };
    }

    function setDirected(graph, directed) {
        const nextDir = Boolean(directed);
        if (graph.directed === nextDir) return { ok: true };
        graph.directed = nextDir;
        const deduped = [];
        const seen = new Set();
        graph.edges.forEach(e => {
            const k = edgeKey(e.from, e.to, nextDir);
            if (!seen.has(k)) {
                seen.add(k);
                deduped.push({ id: k, from: e.from, to: e.to, weight: e.weight });
            }
        });
        graph.edges = deduped;
        return { ok: true };
    }

    function setWeighted(graph, weighted) {
        const nextW = Boolean(weighted);
        graph.weighted = nextW;
        if (!nextW) {
            graph.edges.forEach(e => { e.weight = 1; });
        }
        return { ok: true };
    }

    // Build deterministic sorted adjacency list: Map<nodeId, Array<{ to, weight, edgeId }>>
    function buildAdjacencyList(graph) {
        const adj = new Map();
        const sortedNodes = [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id));
        sortedNodes.forEach(n => adj.set(n.id, []));

        graph.edges.forEach(e => {
            const w = graph.weighted ? e.weight : 1;
            if (adj.has(e.from) && adj.has(e.to)) {
                adj.get(e.from).push({ to: e.to, weight: w, edgeId: e.id });
                if (!graph.directed) {
                    adj.get(e.to).push({ to: e.from, weight: w, edgeId: e.id });
                }
            }
        });

        adj.forEach(list => {
            list.sort((a, b) => a.to.localeCompare(b.to));
        });

        return adj;
    }

    // Analyze structural properties: Connected vs Disconnected, Cyclic vs Acyclic
    function analyzeGraph(graph) {
        const n = graph.nodes.length;
        if (n === 0) {
            return { nodeCount: 0, edgeCount: 0, connected: true, cyclic: false, components: 0 };
        }

        // 1. Weak/undirected connectivity check
        const undirectedAdj = new Map();
        graph.nodes.forEach(node => undirectedAdj.set(node.id, []));
        graph.edges.forEach(e => {
            if (undirectedAdj.has(e.from) && undirectedAdj.has(e.to)) {
                undirectedAdj.get(e.from).push(e.to);
                undirectedAdj.get(e.to).push(e.from);
            }
        });

        const visited = new Set();
        let components = 0;
        graph.nodes.forEach(node => {
            if (!visited.has(node.id)) {
                components++;
                const q = [node.id];
                visited.add(node.id);
                while (q.length > 0) {
                    const curr = q.shift();
                    undirectedAdj.get(curr).forEach(nb => {
                        if (!visited.has(nb)) {
                            visited.add(nb);
                            q.push(nb);
                        }
                    });
                }
            }
        });

        // 2. Cycle detection (directed 3-color DFS vs undirected parent-tracking DFS)
        let cyclic = false;
        const adj = buildAdjacencyList(graph);

        if (graph.directed) {
            const color = new Map(); // 0=unvisited, 1=visiting, 2=done
            graph.nodes.forEach(node => color.set(node.id, 0));

            function dfsDir(u) {
                color.set(u, 1);
                for (const edge of adj.get(u)) {
                    const v = edge.to;
                    if (color.get(v) === 1) {
                        cyclic = true;
                        return;
                    }
                    if (color.get(v) === 0) {
                        dfsDir(v);
                        if (cyclic) return;
                    }
                }
                color.set(u, 2);
            }

            for (const node of graph.nodes) {
                if (color.get(node.id) === 0) {
                    dfsDir(node.id);
                    if (cyclic) break;
                }
            }
        } else {
            const seen = new Set();
            function dfsUndir(u, parent) {
                seen.add(u);
                for (const edge of adj.get(u)) {
                    const v = edge.to;
                    if (!seen.has(v)) {
                        dfsUndir(v, u);
                        if (cyclic) return;
                    } else if (v !== parent) {
                        cyclic = true;
                        return;
                    }
                }
            }
            for (const node of graph.nodes) {
                if (!seen.has(node.id)) {
                    dfsUndir(node.id, null);
                    if (cyclic) break;
                }
            }
        }

        return {
            nodeCount: n,
            edgeCount: graph.edges.length,
            connected: components === 1,
            cyclic,
            components
        };
    }

    // Format graph to edge-list text for manual editor
    function formatEdgeList(graph) {
        const lines = graph.edges.map(e => {
            const sep = graph.directed ? "->" : "-";
            return graph.weighted ? `${e.from}${sep}${e.to}:${e.weight}` : `${e.from}${sep}${e.to}`;
        });
        // Include isolated nodes so disconnected graphs round-trip accurately
        const connectedNodes = new Set();
        graph.edges.forEach(e => {
            connectedNodes.add(e.from);
            connectedNodes.add(e.to);
        });
        graph.nodes.forEach(n => {
            if (!connectedNodes.has(n.id)) {
                lines.push(n.id);
            }
        });
        return lines.join("\n");
    }

    // Parse manual edge list text (supports A-B, A->B, A-B:4, A->B:4, and isolated node A)
    function parseEdgeList(text, options = {}) {
        const raw = String(text || "").trim();
        if (!raw) {
            return { error: "Enter at least one edge (e.g. A-B) or node label." };
        }

        const lines = raw.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
        const nodeIds = [];
        const nodeSet = new Set();
        const edgeSpecs = [];
        let detectedDirected = Boolean(options.directed);
        let detectedWeighted = Boolean(options.weighted);

        function ensureNode(id) {
            if (!nodeSet.has(id)) {
                nodeSet.add(id);
                nodeIds.push(id);
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Single isolated node
            if (/^[A-Za-z0-9]{1,4}$/.test(line)) {
                ensureNode(line.toUpperCase());
                continue;
            }

            const match = /^([A-Za-z0-9]{1,4})\s*(->|--|-)\s*([A-Za-z0-9]{1,4})(?:\s*:\s*(-?\d+(?:\.\d+)?))?$/.exec(line);
            if (!match) {
                return { error: `Invalid syntax on item ${i + 1}: "${line}". Use A-B or A-B:4.` };
            }

            const from = match[1].toUpperCase();
            const arrow = match[2];
            const to = match[3].toUpperCase();
            const weightRaw = match[4];

            if (from === to) {
                return { error: `Self-loop "${from}-${to}" is not supported.` };
            }

            if (arrow === "->") detectedDirected = true;
            let weight = 1;
            if (weightRaw !== undefined) {
                detectedWeighted = true;
                weight = Number(weightRaw);
                if (!Number.isFinite(weight) || weight < 0 || weight > 999) {
                    return { error: `Invalid weight on "${line}". Use non-negative numbers (0–999).` };
                }
            }

            ensureNode(from);
            ensureNode(to);
            edgeSpecs.push({ from, to, weight });
        }

        if (nodeIds.length > MAX_NODES) {
            return { error: `Too many nodes (${nodeIds.length}). Maximum is ${MAX_NODES}.` };
        }
        if (edgeSpecs.length > MAX_EDGES) {
            return { error: `Too many edges (${edgeSpecs.length}). Maximum is ${MAX_EDGES}.` };
        }

        const graph = createEmptyGraph({ directed: detectedDirected, weighted: detectedWeighted });
        const count = nodeIds.length;
        const cx = 340;
        const cy = 185;
        const rx = count <= 4 ? 145 : 215;
        const ry = count <= 4 ? 100 : 128;

        nodeIds.forEach((id, idx) => {
            const angle = (idx * 2 * Math.PI) / Math.max(1, count) - Math.PI / 2;
            const x = count === 1 ? cx : Math.round(cx + rx * Math.cos(angle));
            const y = count === 1 ? cy : Math.round(cy + ry * Math.sin(angle));
            graph.nodes.push({ id, label: id, x, y });
        });

        edgeSpecs.forEach(spec => {
            addEdge(graph, spec.from, spec.to, spec.weight);
        });

        return { graph };
    }

    // Predefined Graph Presets
    const PRESETS = {
        simple: {
            label: "Simple Graph",
            directed: false,
            weighted: false,
            nodes: [
                { id: "A", label: "A", x: 160, y: 185 },
                { id: "B", label: "B", x: 300, y: 95 },
                { id: "C", label: "C", x: 300, y: 275 },
                { id: "D", label: "D", x: 460, y: 95 },
                { id: "E", label: "E", x: 460, y: 275 }
            ],
            edges: [
                { from: "A", to: "B", weight: 1 },
                { from: "A", to: "C", weight: 1 },
                { from: "B", to: "D", weight: 1 },
                { from: "C", to: "D", weight: 1 },
                { from: "D", to: "E", weight: 1 }
            ]
        },
        linear: {
            label: "Linear Graph",
            directed: false,
            weighted: false,
            nodes: [
                { id: "A", label: "A", x: 110, y: 185 },
                { id: "B", label: "B", x: 225, y: 185 },
                { id: "C", label: "C", x: 340, y: 185 },
                { id: "D", label: "D", x: 455, y: 185 },
                { id: "E", label: "E", x: 570, y: 185 }
            ],
            edges: [
                { from: "A", to: "B", weight: 1 },
                { from: "B", to: "C", weight: 1 },
                { from: "C", to: "D", weight: 1 },
                { from: "D", to: "E", weight: 1 }
            ]
        },
        star: {
            label: "Star Graph",
            directed: false,
            weighted: false,
            nodes: [
                { id: "A", label: "A", x: 340, y: 185 },
                { id: "B", label: "B", x: 340, y: 65 },
                { id: "C", label: "C", x: 485, y: 145 },
                { id: "D", label: "D", x: 445, y: 295 },
                { id: "E", label: "E", x: 235, y: 295 },
                { id: "F", label: "F", x: 195, y: 145 }
            ],
            edges: [
                { from: "A", to: "B", weight: 1 },
                { from: "A", to: "C", weight: 1 },
                { from: "A", to: "D", weight: 1 },
                { from: "A", to: "E", weight: 1 },
                { from: "A", to: "F", weight: 1 }
            ]
        },
        tree: {
            label: "Tree Graph",
            directed: true,
            weighted: false,
            nodes: [
                { id: "A", label: "A", x: 340, y: 65 },
                { id: "B", label: "B", x: 210, y: 165 },
                { id: "C", label: "C", x: 470, y: 165 },
                { id: "D", label: "D", x: 140, y: 275 },
                { id: "E", label: "E", x: 280, y: 275 },
                { id: "F", label: "F", x: 400, y: 275 },
                { id: "G", label: "G", x: 540, y: 275 }
            ],
            edges: [
                { from: "A", to: "B", weight: 1 },
                { from: "A", to: "C", weight: 1 },
                { from: "B", to: "D", weight: 1 },
                { from: "B", to: "E", weight: 1 },
                { from: "C", to: "F", weight: 1 },
                { from: "C", to: "G", weight: 1 }
            ]
        },
        cyclic: {
            label: "Cyclic Graph",
            directed: true,
            weighted: false,
            nodes: [
                { id: "A", label: "A", x: 340, y: 65 },
                { id: "B", label: "B", x: 495, y: 155 },
                { id: "C", label: "C", x: 435, y: 295 },
                { id: "D", label: "D", x: 245, y: 295 },
                { id: "E", label: "E", x: 185, y: 155 }
            ],
            edges: [
                { from: "A", to: "B", weight: 1 },
                { from: "B", to: "C", weight: 1 },
                { from: "C", to: "D", weight: 1 },
                { from: "D", to: "E", weight: 1 },
                { from: "E", to: "A", weight: 1 },
                { from: "B", to: "D", weight: 1 }
            ]
        },
        disconnected: {
            label: "Disconnected Graph",
            directed: false,
            weighted: false,
            nodes: [
                { id: "A", label: "A", x: 155, y: 110 },
                { id: "B", label: "B", x: 270, y: 110 },
                { id: "C", label: "C", x: 212, y: 240 },
                { id: "D", label: "D", x: 445, y: 115 },
                { id: "E", label: "E", x: 555, y: 240 }
            ],
            edges: [
                { from: "A", to: "B", weight: 1 },
                { from: "B", to: "C", weight: 1 },
                { from: "A", to: "C", weight: 1 },
                { from: "D", to: "E", weight: 1 }
            ]
        },
        weighted: {
            label: "Weighted Graph",
            directed: false,
            weighted: true,
            nodes: [
                { id: "A", label: "A", x: 130, y: 185 },
                { id: "B", label: "B", x: 270, y: 85 },
                { id: "C", label: "C", x: 270, y: 285 },
                { id: "D", label: "D", x: 430, y: 85 },
                { id: "E", label: "E", x: 430, y: 285 },
                { id: "F", label: "F", x: 565, y: 185 }
            ],
            edges: [
                { from: "A", to: "B", weight: 4 },
                { from: "A", to: "C", weight: 2 },
                { from: "B", to: "C", weight: 1 },
                { from: "B", to: "D", weight: 5 },
                { from: "C", to: "E", weight: 8 },
                { from: "D", to: "E", weight: 2 },
                { from: "D", to: "F", weight: 6 },
                { from: "E", to: "F", weight: 3 }
            ]
        },
        complex: {
            label: "Complex Graph",
            directed: true,
            weighted: true,
            nodes: [
                { id: "A", label: "A", x: 115, y: 185 },
                { id: "B", label: "B", x: 245, y: 80 },
                { id: "C", label: "C", x: 245, y: 290 },
                { id: "D", label: "D", x: 390, y: 185 },
                { id: "E", label: "E", x: 515, y: 80 },
                { id: "F", label: "F", x: 515, y: 290 },
                { id: "G", label: "G", x: 615, y: 185 }
            ],
            edges: [
                { from: "A", to: "B", weight: 3 },
                { from: "A", to: "C", weight: 5 },
                { from: "B", to: "D", weight: 2 },
                { from: "C", to: "D", weight: 1 },
                { from: "B", to: "E", weight: 6 },
                { from: "D", to: "E", weight: 3 },
                { from: "D", to: "F", weight: 4 },
                { from: "C", to: "F", weight: 7 },
                { from: "E", to: "G", weight: 2 },
                { from: "F", to: "G", weight: 1 }
            ]
        }
    };

    function getPreset(name) {
        const spec = PRESETS[name] || PRESETS.weighted;
        const g = createEmptyGraph({ directed: spec.directed, weighted: spec.weighted });
        spec.nodes.forEach(n => g.nodes.push({ id: n.id, label: n.label, x: n.x, y: n.y }));
        spec.edges.forEach(e => addEdge(g, e.from, e.to, e.weight));
        return g;
    }

    function generateRandomGraph(options = {}) {
        const directed = Boolean(options.directed);
        const weighted = Boolean(options.weighted);
        const count = options.nodeCount || (5 + Math.floor(Math.random() * 3)); // 5..7 nodes
        const g = createEmptyGraph({ directed, weighted });

        const cx = 340;
        const cy = 185;
        const rx = 205;
        const ry = 122;

        for (let i = 0; i < count; i++) {
            const id = String.fromCharCode(65 + i);
            const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
            const jitterX = Math.floor(Math.random() * 24) - 12;
            const jitterY = Math.floor(Math.random() * 20) - 10;
            g.nodes.push({
                id,
                label: id,
                x: Math.round(cx + rx * Math.cos(angle) + jitterX),
                y: Math.round(cy + ry * Math.sin(angle) + jitterY)
            });
        }

        // Build a spanning tree first so the random graph is cohesive
        for (let i = 1; i < count; i++) {
            const parent = Math.floor(Math.random() * i);
            const w = weighted ? (1 + Math.floor(Math.random() * 9)) : 1;
            addEdge(g, g.nodes[parent].id, g.nodes[i].id, w);
        }

        // Add a few extra cross edges
        const extra = 2 + Math.floor(Math.random() * 3);
        for (let k = 0; k < extra; k++) {
            const u = Math.floor(Math.random() * count);
            const v = Math.floor(Math.random() * count);
            if (u !== v) {
                const w = weighted ? (1 + Math.floor(Math.random() * 9)) : 1;
                addEdge(g, g.nodes[u].id, g.nodes[v].id, w);
            }
        }

        return g;
    }

    
    // Build adjacency matrix: Array of arrays (size n x n)
    function buildAdjacencyMatrix(graph) {
        const sortedNodes = [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id));
        const idToIndex = new Map();
        sortedNodes.forEach((n, idx) => idToIndex.set(n.id, idx));
        const n = sortedNodes.length;
        const matrix = Array.from({ length: n }, () => Array(n).fill(0));

        graph.edges.forEach(e => {
            const uIdx = idToIndex.get(e.from);
            const vIdx = idToIndex.get(e.to);
            const w = graph.weighted ? e.weight : 1;
            if (uIdx !== undefined && vIdx !== undefined) {
                matrix[uIdx][vIdx] = w;
                if (!graph.directed) {
                    matrix[vIdx][uIdx] = w;
                }
            }
        });

        return { nodes: sortedNodes.map(n => n.id), matrix };
    }

    const GraphModel = {
        MAX_NODES,
        MAX_EDGES,
        createEmptyGraph,
        cloneGraph,
        edgeKey,
        nextNodeId,
        addNode,
        removeNode,
        renameNode,
        addEdge,
        removeEdge,
        setDirected,
        setWeighted,
        buildAdjacencyList,
        buildAdjacencyMatrix,
        analyzeGraph,
        formatEdgeList,
        parseEdgeList,
        PRESETS,
        getPreset,
        generateRandomGraph
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = GraphModel;
    }
    global.AlgoLabGraphModel = GraphModel;
})(typeof window !== "undefined" ? window : globalThis);
