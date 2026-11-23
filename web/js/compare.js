"use strict";

// ==========================================
// ALGORITHM COMPARISON STUDIO ENGINE
// ==========================================

const arrayInput = document.getElementById("arrayInput");
const applyArrayBtn = document.getElementById("applyArrayBtn");
const randomDatasetBtn = document.getElementById("randomDatasetBtn");
const startBothBtn = document.getElementById("startBothBtn");
const pauseBothBtn = document.getElementById("pauseBothBtn");
const stepBothBtn = document.getElementById("stepBothBtn");
const resetBothBtn = document.getElementById("resetBothBtn");

const algoASelect = document.getElementById("algoASelect");
const algoBSelect = document.getElementById("algoBSelect");
const speedSelect = document.getElementById("speedSelect");

const barsA = document.getElementById("barsA");
const barsB = document.getElementById("barsB");
const statusA = document.getElementById("statusA");
const statusB = document.getElementById("statusB");
const compA = document.getElementById("compA");
const swapsA = document.getElementById("swapsA");
const stepsA = document.getElementById("stepsA");
const timeA = document.getElementById("timeA");
const msgA = document.getElementById("msgA");

const compB = document.getElementById("compB");
const swapsB = document.getElementById("swapsB");
const stepsB = document.getElementById("stepsB");
const timeB = document.getElementById("timeB");
const msgB = document.getElementById("msgB");

const benchmarkSummaryText = document.getElementById("benchmarkSummaryText");

let originalArray = [50, 20, 70, 10, 90, 30, 80, 40, 60];
let runnerA = null;
let runnerB = null;
let timer = null;
let isPlaying = false;
let animationSpeed = 800;

// ==========================================
// SORTING STEP GENERATORS (Fair & Metric Tracking)
// ==========================================

function generateSteps(algoKey, inputArray) {
    const arr = [...inputArray];
    const steps = [];
    let comparisons = 0;
    let swaps = 0;

    function push(actArr, active, sorted, type, msg) {
        steps.push({
            array: [...actArr],
            active: [...active],
            sorted: [...sorted],
            type,
            comparisons,
            swaps,
            message: msg
        });
    }

    const n = arr.length;
    const sortedAll = Array.from({ length: n }, (_, i) => i);

    if (n <= 1) {
        push(arr, [], sortedAll, "done", "Array is already sorted (0 or 1 element).");
        return { steps, comparisons, swaps, execTimeMs: 0 };
    }

    const tStart = performance.now();

    if (algoKey === "bubble") {
        push(arr, [], [], "ready", "Starting Bubble Sort.");
        for (let i = 0; i < n - 1; i++) {
            let swapped = false;
            for (let j = 0; j < n - 1 - i; j++) {
                comparisons++;
                push(arr, [j, j + 1], [], "compare", `Compare arr[${j}]=${arr[j]} and arr[${j + 1}]=${arr[j + 1]}`);
                if (arr[j] > arr[j + 1]) {
                    swaps++;
                    const tmp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = tmp;
                    swapped = true;
                    push(arr, [j, j + 1], [], "swap", `Swap ${arr[j]} and ${arr[j + 1]}`);
                }
            }
            if (!swapped) break;
        }
        push(arr, [], sortedAll, "done", "Bubble Sort completed successfully.");
    } else if (algoKey === "selection") {
        push(arr, [], [], "ready", "Starting Selection Sort.");
        for (let i = 0; i < n - 1; i++) {
            let minIdx = i;
            for (let j = i + 1; j < n; j++) {
                comparisons++;
                push(arr, [minIdx, j], [], "compare", `Compare min (${arr[minIdx]}) with arr[${j}]=${arr[j]}`);
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            if (minIdx !== i) {
                swaps++;
                const tmp = arr[i];
                arr[i] = arr[minIdx];
                arr[minIdx] = tmp;
                push(arr, [i, minIdx], [], "swap", `Swap minimum into position ${i}`);
            }
        }
        push(arr, [], sortedAll, "done", "Selection Sort completed successfully.");
    } else if (algoKey === "insertion") {
        push(arr, [], [], "ready", "Starting Insertion Sort.");
        for (let i = 1; i < n; i++) {
            const key = arr[i];
            let j = i - 1;
            push(arr, [i], [], "compare", `Pick key = ${key} at index ${i}`);
            while (j >= 0) {
                comparisons++;
                push(arr, [j, j + 1], [], "compare", `Compare arr[${j}]=${arr[j]} with key ${key}`);
                if (arr[j] > key) {
                    swaps++;
                    arr[j + 1] = arr[j];
                    j--;
                    push(arr, [j + 1, j + 2], [], "swap", `Shift element right`);
                } else {
                    break;
                }
            }
            arr[j + 1] = key;
            swaps++;
            push(arr, [j + 1], [], "swap", `Insert key at index ${j + 1}`);
        }
        push(arr, [], sortedAll, "done", "Insertion Sort completed successfully.");
    } else if (algoKey === "merge") {
        push(arr, [], [], "ready", "Starting Merge Sort.");
        
        function mergeRec(subArr, startIdx) {
            if (subArr.length <= 1) return subArr;
            const mid = Math.floor(subArr.length / 2);
            const left = mergeRec(subArr.slice(0, mid), startIdx);
            const right = mergeRec(subArr.slice(mid), startIdx + mid);

            const merged = [];
            let i = 0, j = 0;
            while (i < left.length && j < right.length) {
                comparisons++;
                swaps++;
                if (left[i] <= right[j]) {
                    merged.push(left[i++]);
                } else {
                    merged.push(right[j++]);
                }
            }
            while (i < left.length) { swaps++; merged.push(left[i++]); }
            while (j < right.length) { swaps++; merged.push(right[j++]); }

            for (let k = 0; k < merged.length; k++) {
                arr[startIdx + k] = merged[k];
            }
            push(arr, [], [], "swap", `Merge sorted subarrays`);
            return merged;
        }

        mergeRec(arr, 0);
        push(arr, [], sortedAll, "done", "Merge Sort completed successfully.");
    } else if (algoKey === "quick") {
        push(arr, [], [], "ready", "Starting Quick Sort.");

        function quickSortRec(low, high) {
            if (low < high) {
                const pivot = arr[high];
                let i = low - 1;
                for (let j = low; j < high; j++) {
                    comparisons++;
                    push(arr, [j, high], [], "compare", `Compare arr[${j}]=${arr[j]} with pivot ${pivot}`);
                    if (arr[j] <= pivot) {
                        i++;
                        swaps++;
                        const tmp = arr[i];
                        arr[i] = arr[j];
                        arr[j] = tmp;
                        push(arr, [i, j], [], "swap", `Partition swap`);
                    }
                }
                swaps++;
                const tmp = arr[i + 1];
                arr[i + 1] = arr[high];
                arr[high] = tmp;
                push(arr, [i + 1, high], [], "swap", `Place pivot in final position`);
                const pi = i + 1;
                quickSortRec(low, pi - 1);
                quickSortRec(pi + 1, high);
            }
        }

        quickSortRec(0, n - 1);
        push(arr, [], sortedAll, "done", "Quick Sort completed successfully.");
    } else if (algoKey === "heap") {
        push(arr, [], [], "ready", "Starting Heap Sort.");

        function heapify(sz, idx) {
            let largest = idx;
            const l = 2 * idx + 1;
            const r = 2 * idx + 2;

            if (l < sz) {
                comparisons++;
                if (arr[l] > arr[largest]) largest = l;
            }
            if (r < sz) {
                comparisons++;
                if (arr[r] > arr[largest]) largest = r;
            }

            if (largest !== idx) {
                swaps++;
                const tmp = arr[idx];
                arr[idx] = arr[largest];
                arr[largest] = tmp;
                push(arr, [idx, largest], [], "swap", `Heapify sift down`);
                heapify(sz, largest);
            }
        }

        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
            heapify(n, i);
        }

        for (let i = n - 1; i > 0; i--) {
            swaps++;
            const tmp = arr[0];
            arr[0] = arr[i];
            arr[i] = tmp;
            push(arr, [0, i], [], "swap", `Extract root max to end`);
            heapify(i, 0);
        }

        push(arr, [], sortedAll, "done", "Heap Sort completed successfully.");
    }

    const tEnd = performance.now();
    const execTimeMs = Math.max(0.05, Math.round((tEnd - tStart) * 100) / 100);

    return { steps, comparisons, swaps, execTimeMs };
}

// ==========================================
// RUNNER CONTROLLER FOR EACH PANEL
// ==========================================

class AlgorithmRunner {
    constructor(algoKey, inputArray, barsEl, compEl, swapsEl, stepsEl, timeEl, msgEl, statusEl) {
        this.algoKey = algoKey;
        this.inputArray = [...inputArray];
        this.barsEl = barsEl;
        this.compEl = compEl;
        this.swapsEl = swapsEl;
        this.stepsEl = stepsEl;
        this.timeEl = timeEl;
        this.msgEl = msgEl;
        this.statusEl = statusEl;

        const res = generateSteps(algoKey, this.inputArray);
        this.steps = res.steps;
        this.comparisons = res.comparisons;
        this.swaps = res.swaps;
        this.execTimeMs = res.execTimeMs;
        this.currentIndex = 0;

        this.updateMetrics();
        this.render();
    }

    updateMetrics() {
        this.compEl.textContent = this.comparisons;
        this.swapsEl.textContent = this.swaps;
        this.stepsEl.textContent = `${this.currentIndex + 1} / ${this.steps.length}`;
        this.timeEl.textContent = `${this.execTimeMs.toFixed(2)} ms`;
    }

    render() {
        const step = this.steps[this.currentIndex] || this.steps[0];
        if (!step) return;

        this.barsEl.innerHTML = "";
        const maxVal = Math.max(...step.array.map(Math.abs), 1);

        step.array.forEach((val, idx) => {
            const bar = document.createElement("div");
            bar.className = "compare-bar";
            const h = Math.max(12, (Math.abs(val) / maxVal) * 150);
            bar.style.height = `${h}px`;
            bar.textContent = val;

            if (step.active.includes(idx)) {
                bar.classList.add(step.type === "swap" ? "swapping" : "comparing");
            } else if (step.type === "done" || step.sorted.includes(idx)) {
                bar.classList.add("sorted");
            }

            this.barsEl.appendChild(bar);
        });

        this.msgEl.textContent = step.message;
        this.statusEl.textContent = step.type === "done" ? "Finished" : "Running";
        this.stepsEl.textContent = `${this.currentIndex + 1} / ${this.steps.length}`;
    }

    stepForward() {
        if (this.currentIndex < this.steps.length - 1) {
            this.currentIndex++;
            this.render();
            return true;
        }
        return false;
    }

    reset() {
        this.currentIndex = 0;
        this.render();
    }
}

// ==========================================
// INITIALIZE & EVENT HANDLERS
// ==========================================

function initRunners() {
    const text = arrayInput.value.trim();
    const result = AlgoLab.parseArray(text, { min: 2, max: 15, minValue: 1, maxValue: 999 });
    if (result.error) {
        AlgoLab.showHint(result.error, true);
        arrayInput.focus();
        return false;
    }
    AlgoLab.showHint("", false);
    originalArray = result.values;

    runnerA = new AlgorithmRunner(
        algoASelect.value,
        originalArray,
        barsA, compA, swapsA, stepsA, timeA, msgA, statusA
    );
    runnerB = new AlgorithmRunner(
        algoBSelect.value,
        originalArray,
        barsB, compB, swapsB, stepsB, timeB, msgB, statusB
    );

    updateBenchmarkSummary();
    return true;
}

function updateBenchmarkSummary() {
    if (!runnerA || !runnerB) return;
    const aName = algoASelect.options[algoASelect.selectedIndex].text;
    const bName = algoBSelect.options[algoBSelect.selectedIndex].text;

    const sortedRef = [...originalArray].sort((a, b) => a - b).join(", ");
    const finalA = runnerA.steps[runnerA.steps.length - 1].array.join(", ");
    const finalB = runnerB.steps[runnerB.steps.length - 1].array.join(", ");

    const okA = finalA === sortedRef;
    const okB = finalB === sortedRef;

    benchmarkSummaryText.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 10px;">
            <div>
                <strong>${aName}:</strong><br>
                • Correctness: <span style="color: ${okA ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">${okA ? '✔ Sorted Correctly' : '✘ Error'}</span><br>
                • Comparisons: <code>${runnerA.comparisons}</code> | Swaps: <code>${runnerA.swaps}</code><br>
                • Total Steps: <code>${runnerA.steps.length}</code> | Time: <code>${runnerA.execTimeMs.toFixed(2)} ms</code>
            </div>
            <div>
                <strong>${bName}:</strong><br>
                • Correctness: <span style="color: ${okB ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">${okB ? '✔ Sorted Correctly' : '✘ Error'}</span><br>
                • Comparisons: <code>${runnerB.comparisons}</code> | Swaps: <code>${runnerB.swaps}</code><br>
                • Total Steps: <code>${runnerB.steps.length}</code> | Time: <code>${runnerB.execTimeMs.toFixed(2)} ms</code>
            </div>
        </div>
        <div style="font-size: 11.5px; color: var(--muted); border-top: 1px solid var(--border); padding-top: 6px;">
            *Note: Execution time is approximate and depends on browser scripting overhead and CPU architecture. Both algorithms received identical cloned copies of the input dataset.
        </div>
    `;
}

// Playback controls
function stopPlayback() {
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }
    isPlaying = false;
    startBothBtn.textContent = "▶ Run Both";
}

startBothBtn.addEventListener("click", () => {
    if (isPlaying) {
        stopPlayback();
        return;
    }
    if (!runnerA || !runnerB) {
        if (!initRunners()) return;
    }

    isPlaying = true;
    startBothBtn.textContent = "⏸ Pause";

    const delay = window.AlgoLab && AlgoLab.interval ? AlgoLab.interval(animationSpeed) : animationSpeed;

    timer = setInterval(() => {
        const movedA = runnerA.stepForward();
        const movedB = runnerB.stepForward();
        updateBenchmarkSummary();

        if (!movedA && !movedB) {
            stopPlayback();
        }
    }, delay);
});

pauseBothBtn.addEventListener("click", stopPlayback);

stepBothBtn.addEventListener("click", () => {
    if (isPlaying) return;
    if (!runnerA || !runnerB) {
        if (!initRunners()) return;
    }
    runnerA.stepForward();
    runnerB.stepForward();
    updateBenchmarkSummary();
});

resetBothBtn.addEventListener("click", () => {
    stopPlayback();
    if (runnerA) runnerA.reset();
    if (runnerB) runnerB.reset();
    updateBenchmarkSummary();
});

applyArrayBtn.addEventListener("click", () => {
    stopPlayback();
    initRunners();
});

randomDatasetBtn.addEventListener("click", () => {
    stopPlayback();
    const len = 7 + Math.floor(Math.random() * 4); // 7..10
    originalArray = Array.from({ length: len }, () => Math.floor(Math.random() * 90) + 10);
    arrayInput.value = originalArray.join(", ");
    initRunners();
});

algoASelect.addEventListener("change", () => {
    stopPlayback();
    if (runnerA) {
        runnerA = new AlgorithmRunner(
            algoASelect.value, originalArray,
            barsA, compA, swapsA, stepsA, timeA, msgA, statusA
        );
        updateBenchmarkSummary();
    }
});

algoBSelect.addEventListener("change", () => {
    stopPlayback();
    if (runnerB) {
        runnerB = new AlgorithmRunner(
            algoBSelect.value, originalArray,
            barsB, compB, swapsB, stepsB, timeB, msgB, statusB
        );
        updateBenchmarkSummary();
    }
});

speedSelect.addEventListener("change", () => {
    animationSpeed = Number(speedSelect.value);
});

arrayInput.addEventListener("keydown", e => {
    if (e.key === "Enter") applyArrayBtn.click();
});

// Initialize on load
initRunners();
