"use strict";

(function (global) {
    const SVG_NS = "http://www.w3.org/2000/svg";

    function el(tag, attrs = {}) {
        const node = document.createElementNS(SVG_NS, tag);
        Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
        return node;
    }

    function createGraphRenderer(svgElement, options = {}) {
        const state = {
            zoom: 1,
            panX: 0,
            panY: 0,
            draggingNodeId: null,
            panning: false,
            panStartX: 0,
            panStartY: 0,
            selectedNodeId: null,
            selectedEdgeId: null,
            pendingEdgeFrom: null
        };

        const callbacks = {
            onCanvasClick: options.onCanvasClick || (() => {}),
            onNodeClick: options.onNodeClick || (() => {}),
            onNodeDrag: options.onNodeDrag || (() => {}),
            onEdgeClick: options.onEdgeClick || (() => {})
        };

        function screenToSvg(clientX, clientY) {
            const rect = svgElement.getBoundingClientRect();
            const vb = svgElement.viewBox.baseVal;
            const scaleX = (vb && vb.width ? vb.width : 680) / Math.max(1, rect.width);
            const scaleY = (vb && vb.height ? vb.height : 370) / Math.max(1, rect.height);
            const rawX = (clientX - rect.left) * scaleX;
            const rawY = (clientY - rect.top) * scaleY;
            return {
                x: Math.round((rawX - state.panX) / state.zoom),
                y: Math.round((rawY - state.panY) / state.zoom)
            };
        }

        function setZoom(nextZoom) {
            state.zoom = Math.max(0.55, Math.min(2.1, Number(nextZoom) || 1));
        }

        function resetView() {
            state.zoom = 1;
            state.panX = 0;
            state.panY = 0;
        }

        function bindEvents() {
            svgElement.addEventListener("wheel", event => {
                event.preventDefault();
                const delta = event.deltaY < 0 ? 0.1 : -0.1;
                setZoom(state.zoom + delta);
                if (options.onViewChange) options.onViewChange();
            }, { passive: false });

            svgElement.addEventListener("pointerdown", event => {
                const target = event.target instanceof Element ? event.target : null;
                const nodeGroup = target ? target.closest(".graph-node-group") : null;
                const edgeGroup = target ? target.closest(".graph-edge-group") : null;

                if (nodeGroup) {
                    const nodeId = nodeGroup.getAttribute("data-node-id");
                    state.draggingNodeId = nodeId;
                    state.dragMoved = false;
                    svgElement.setPointerCapture(event.pointerId);
                    return;
                }

                if (edgeGroup) {
                    const edgeId = edgeGroup.getAttribute("data-edge-id");
                    callbacks.onEdgeClick(edgeId);
                    return;
                }

                // Background click/pan
                state.panning = true;
                state.panMoved = false;
                state.panStartX = event.clientX - state.panX;
                state.panStartY = event.clientY - state.panY;
                svgElement.setPointerCapture(event.pointerId);
            });

            svgElement.addEventListener("pointermove", event => {
                if (state.draggingNodeId) {
                    state.dragMoved = true;
                    const pt = screenToSvg(event.clientX, event.clientY);
                    const clampedX = Math.max(32, Math.min(648, pt.x));
                    const clampedY = Math.max(32, Math.min(338, pt.y));
                    callbacks.onNodeDrag(state.draggingNodeId, clampedX, clampedY);
                    return;
                }

                if (state.panning) {
                    const dx = event.clientX - state.panStartX;
                    const dy = event.clientY - state.panStartY;
                    if (Math.hypot(dx - state.panX, dy - state.panY) > 3) {
                        state.panMoved = true;
                        state.panX = dx;
                        state.panY = dy;
                        if (options.onViewChange) options.onViewChange();
                    }
                }
            });

            svgElement.addEventListener("pointerup", event => {
                if (state.draggingNodeId) {
                    const id = state.draggingNodeId;
                    const moved = state.dragMoved;
                    state.draggingNodeId = null;
                    if (!moved) {
                        callbacks.onNodeClick(id);
                    }
                    return;
                }

                if (state.panning) {
                    const moved = state.panMoved;
                    state.panning = false;
                    if (!moved) {
                        const pt = screenToSvg(event.clientX, event.clientY);
                        callbacks.onCanvasClick(pt.x, pt.y);
                    }
                }
            });
        }

        function ensureMarkers(svg) {
            const defs = el("defs");
            const colors = {
                default: "#94a3b8",
                active: "#eab308",
                path: "#22c55e",
                selected: "#6366f1"
            };
            Object.entries(colors).forEach(([name, fill]) => {
                const marker = el("marker", {
                    id: `g-arrow-${name}`,
                    viewBox: "0 0 10 10",
                    refX: "9",
                    refY: "5",
                    markerWidth: "6.5",
                    markerHeight: "6.5",
                    orient: "auto-start-reverse"
                });
                marker.appendChild(el("path", { d: "M 0 1 L 10 5 L 0 9 z", fill }));
                defs.appendChild(marker);
            });
            svg.appendChild(defs);
        }

        function render(graph, step, uiState = {}) {
            svgElement.innerHTML = "";
            ensureMarkers(svgElement);

            const viewport = el("g", {
                transform: `translate(${state.panX}, ${state.panY}) scale(${state.zoom})`
            });

            if (!graph || graph.nodes.length === 0) {
                const emptyText = el("text", {
                    x: 340,
                    y: 185,
                    class: "graph-empty-label"
                });
                emptyText.textContent = "Canvas is empty — click anywhere to add nodes or pick a Graph Preset";
                viewport.appendChild(emptyText);
                svgElement.appendChild(viewport);
                return;
            }

            const nodeMap = new Map();
            graph.nodes.forEach(n => nodeMap.set(n.id, n));

            const visitedSet = new Set(step && step.visitedNodes ? step.visitedNodes : []);
            const frontierSet = new Set(step && step.frontierNodes ? step.frontierNodes : []);
            const pathNodeSet = new Set(step && step.pathNodes ? step.pathNodes : []);
            const pathEdgeSet = new Set(step && step.pathEdges ? step.pathEdges : []);
            const currentNode = step ? step.currentNode : null;
            const activeEdgeId = step ? step.activeEdgeId : null;
            const sourceId = uiState.sourceId || (step ? step.source : null);
            const destId = uiState.destId || (step ? step.dest : null);

            // Detect bidirectional directed edges to curve them slightly
            const pairSet = new Set(graph.edges.map(e => `${e.from}->${e.to}`));

            // 1. Render Edges
            graph.edges.forEach(edge => {
                const u = nodeMap.get(edge.from);
                const v = nodeMap.get(edge.to);
                if (!u || !v) return;

                const isPath = pathEdgeSet.has(edge.id);
                const isActive = activeEdgeId === edge.id;
                const isSelected = uiState.selectedEdgeId === edge.id;

                const edgeClasses = ["graph-edge-group"];
                if (isPath) edgeClasses.push("is-path");
                else if (isActive) edgeClasses.push("is-active");
                else if (isSelected) edgeClasses.push("is-selected");

                const g = el("g", {
                    class: edgeClasses.join(" "),
                    "data-edge-id": edge.id
                });

                const dx = v.x - u.x;
                const dy = v.y - u.y;
                const len = Math.max(1, Math.hypot(dx, dy));
                const ux = dx / len;
                const uy = dy / len;
                const r = 22;

                const hasReverse = graph.directed && pairSet.has(`${edge.to}->${edge.from}`);
                let d = "";
                let midX = (u.x + v.x) / 2;
                let midY = (u.y + v.y) / 2;

                if (hasReverse) {
                    const nx = -uy;
                    const ny = ux;
                    const offset = 22;
                    const ctrlX = midX + nx * offset;
                    const ctrlY = midY + ny * offset;
                    const sx = u.x + ux * r + nx * 6;
                    const sy = u.y + uy * r + ny * 6;
                    const ex = v.x - ux * (r + 2) + nx * 6;
                    const ey = v.y - uy * (r + 2) + ny * 6;
                    d = `M ${sx} ${sy} Q ${ctrlX} ${ctrlY} ${ex} ${ey}`;
                    midX = 0.25 * sx + 0.5 * ctrlX + 0.25 * ex;
                    midY = 0.25 * sy + 0.5 * ctrlY + 0.25 * ey;
                } else {
                    const sx = u.x + ux * r;
                    const sy = u.y + uy * r;
                    const ex = v.x - ux * (graph.directed ? r + 2 : r);
                    const ey = v.y - uy * (graph.directed ? r + 2 : r);
                    d = `M ${sx} ${sy} L ${ex} ${ey}`;
                }

                const markerKind = isPath ? "path" : isActive ? "active" : isSelected ? "selected" : "default";

                // Invisible thick hit target for easy clicking
                const hitPath = el("path", {
                    d,
                    class: "graph-edge-hit"
                });
                g.appendChild(hitPath);

                const pathEl = el("path", {
                    d,
                    class: "graph-edge-line"
                });
                if (graph.directed) {
                    pathEl.setAttribute("marker-end", `url(#g-arrow-${markerKind})`);
                }
                g.appendChild(pathEl);

                // Weight badge
                if (graph.weighted) {
                    const pill = el("rect", {
                        x: midX - 13,
                        y: midY - 10,
                        width: 26,
                        height: 19,
                        rx: 6,
                        class: "graph-weight-pill"
                    });
                    const wText = el("text", {
                        x: midX,
                        y: midY,
                        class: "graph-weight-text"
                    });
                    wText.textContent = edge.weight;
                    g.appendChild(pill);
                    g.appendChild(wText);
                }

                viewport.appendChild(g);
            });

            // 2. Render Nodes
            graph.nodes.forEach(node => {
                const classes = ["graph-node-group"];
                const isUnreachable = step && ((step.distances && step.distances[node.id] === Infinity) || (step.algoId === 'astar' && step.astarRows && step.astarRows.find(r => r.node === node.id)?.g === Infinity && step.type === 'error'));
                if (step && step.isError && currentNode === node.id) {
                    classes.push("is-error");
                } else if (pathNodeSet.has(node.id)) {
                    classes.push("is-path");
                } else if (currentNode === node.id) {
                    classes.push("is-current");
                } else if (isUnreachable) {
                    classes.push("is-unreachable");
                } else if (visitedSet.has(node.id)) {
                    classes.push("is-visited");
                } else if (frontierSet.has(node.id)) {
                    classes.push("is-frontier");
                }

                if (uiState.selectedNodeId === node.id || uiState.pendingEdgeFrom === node.id) {
                    classes.push("is-selected");
                }

                const g = el("g", {
                    class: classes.join(" "),
                    "data-node-id": node.id
                });

                const circle = el("circle", {
                    cx: node.x,
                    cy: node.y,
                    r: 21,
                    class: "graph-node-circle"
                });
                g.appendChild(circle);

                const label = el("text", {
                    x: node.x,
                    y: node.y,
                    class: "graph-node-label"
                });
                label.textContent = node.label;
                g.appendChild(label);

                // Source / Destination role tags
                const tags = [];
                if (node.id === sourceId) tags.push("SRC");
                if (node.id === destId) tags.push("DEST");
                if (tags.length > 0) {
                    const tagEl = el("text", {
                        x: node.x,
                        y: node.y - 27,
                        class: "graph-role-tag"
                    });
                    tagEl.textContent = tags.join("/");
                    g.appendChild(tagEl);
                }

                // Live distance badge below node during Dijkstra / A*
                if (step && step.distances && step.distances[node.id] !== undefined) {
                    const dVal = step.distances[node.id];
                    const distTag = el("text", {
                        x: node.x,
                        y: node.y + 32,
                        class: "graph-dist-tag"
                    });
                    distTag.textContent = `d=${dVal === Infinity ? "∞" : dVal}`;
                    g.appendChild(distTag);
                } else if (step && step.astarRows && step.astarRows.length > 0) {
                    const row = step.astarRows.find(r => r.node === node.id);
                    if (row && row.g !== Infinity) {
                        const fTag = el("text", {
                            x: node.x,
                            y: node.y + 32,
                            class: "graph-dist-tag"
                        });
                        fTag.textContent = `f=${row.f}`;
                        g.appendChild(fTag);
                    }
                }

                viewport.appendChild(g);
            });

            svgElement.appendChild(viewport);
        }

        bindEvents();

        return {
            render,
            setZoom,
            resetView,
            getZoom: () => state.zoom
        };
    }

    const GraphRenderer = { createGraphRenderer };
    if (typeof module !== "undefined" && module.exports) {
        module.exports = GraphRenderer;
    }
    global.AlgoLabGraphRenderer = GraphRenderer;
})(typeof window !== "undefined" ? window : globalThis);
