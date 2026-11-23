const arrayContainer = document.getElementById("array-container");
const treeContainer = document.getElementById("merge-tree");
const codeContainer = document.getElementById("code-display");
const inputField = document.getElementById("array-input");
const randomButton = document.getElementById("random-btn");

const operationLabel = document.getElementById("operation-label");
const actionTitle = document.getElementById("action-title");
const explanation = document.getElementById("explanation");
const detailText = document.getElementById("detail-text");
const whyText = document.getElementById("why-text");
const currentArrayBox = document.getElementById("current-array");
const resultArrayBox = document.getElementById("result-array");
const stepCounter = document.getElementById("step-counter");

const prevButton = document.getElementById("prev-btn");
const nextButton = document.getElementById("next-btn");
const playButton = document.getElementById("play-btn");

const javaCode = [
    "void mergeSort(int[] arr, int left, int right) {",
    "    if (right - left <= 1) return;",
    "",
    "    int mid = left + (right - left) / 2;",
    "",
    "    mergeSort(arr, left, mid);",
    "    mergeSort(arr, mid, right);",
    "",
    "    merge(arr, left, mid, right);",
    "}",
    "",
    "void merge(int[] arr, int left, int mid, int right) {",
    "    int[] temp = new int[right - left];",
    "    int i = left, j = mid, k = 0;",
    "",
    "    while (i < mid && j < right) {",
    "        if (arr[i] <= arr[j])",
    "            temp[k++] = arr[i++];",
    "        else",
    "            temp[k++] = arr[j++];",
    "    }",
    "",
    "    while (i < mid) temp[k++] = arr[i++];",
    "    while (j < right) temp[k++] = arr[j++];",
    "",
    "    for (int x = 0; x < temp.length; x++)",
    "        arr[left + x] = temp[x];",
    "}"
];

let originalArray = [8, 3, 5, 1, 9, 2, 6, 4];
let steps = [];
let currentStep = 0;
let autoplayTimer = null;

function renderJavaCode(activeLines = []) {
    codeContainer.innerHTML = "";

    javaCode.forEach((line, index) => {
        const lineElement = document.createElement("span");
        lineElement.className = "code-line";

        if (activeLines.includes(index)) {
            lineElement.classList.add("active");
        }

        lineElement.textContent = `${String(index + 1).padStart(2, " ")}  ${line}`;
        codeContainer.appendChild(lineElement);
    });
}

function addStep(type, array, message, title, detail, why, result, activeLines, path) {
    steps.push({
        type,
        array: array.slice(),
        message,
        title,
        detail,
        why,
        result: result.slice(),
        activeLines,
        path
    });
}

function buildMergeSort(arr, left, right, path = "root") {
    const part = arr.slice(left, right);

    addStep(
        "split",
        part,
        `Current array: [${part.join(", ")}].`,
        "Divide Array",
        `We are working with ${part.length} element(s).`,
        "Merge Sort divides the array into smaller parts.",
        part,
        [0, 1],
        path
    );

    if (right - left <= 1) {
        addStep(
            "base",
            part,
            part.length ? `${part[0]} is a single element.` : "The array is empty.",
            "Base Case",
            "An array with zero or one element is already sorted.",
            "No further splitting is required.",
            part,
            [1],
            path
        );
        return;
    }

    const mid = left + Math.floor((right - left) / 2);

    addStep(
        "split",
        part,
        `Split [${part.join(", ")}] into [${arr.slice(left, mid).join(", ")}] and [${arr.slice(mid, right).join(", ")}].`,
        "Split Into Two",
        "Find the middle position and divide the array.",
        "Each half can be sorted independently.",
        part,
        [3, 5, 6],
        path
    );

    buildMergeSort(arr, left, mid, path + "L");
    buildMergeSort(arr, mid, right, path + "R");

    const leftPart = arr.slice(left, mid);
    const rightPart = arr.slice(mid, right);

    let i = 0;
    let j = 0;
    const merged = [];

    while (i < leftPart.length && j < rightPart.length) {
        if (leftPart[i] <= rightPart[j]) {
            merged.push(leftPart[i++]);
        } else {
            merged.push(rightPart[j++]);
        }
    }

    while (i < leftPart.length) merged.push(leftPart[i++]);
    while (j < rightPart.length) merged.push(rightPart[j++]);

    for (let k = 0; k < merged.length; k++) {
        arr[left + k] = merged[k];
    }

    addStep(
        "merge",
        merged,
        `Merge [${leftPart.join(", ")}] and [${rightPart.join(", ")}] into [${merged.join(", ")}].`,
        "Merge Sorted Parts",
        `Left: [${leftPart.join(", ")}] | Right: [${rightPart.join(", ")}].`,
        "Compare elements and select the smaller value first.",
        merged,
        [8, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        path
    );
}

function generateSteps() {
    steps = [];
    const workingArray = originalArray.slice();

    buildMergeSort(workingArray, 0, workingArray.length);

    addStep(
        "complete",
        workingArray,
        `Sorting completed: [${workingArray.join(", ")}].`,
        "Array Sorted!",
        "Every element is now in ascending order.",
        "The sorted subarrays were merged into one sorted array.",
        workingArray,
        [8, 23, 24, 25],
        "root"
    );

    currentStep = 0;
    render();
}

function renderArray(array, type) {
    arrayContainer.innerHTML = "";

    const maxValue = Math.max(...array.map(v => Math.abs(v)), 1);

    array.forEach(value => {
        const bar = document.createElement("div");
        bar.className = "bar";

        const percent = Math.max(8, (Math.abs(value) / maxValue) * 92);
        bar.style.height = `${percent}%`;
        bar.textContent = value;

        if (type === "split") {
            bar.classList.add("comparing");
        } else if (type === "merge") {
            bar.classList.add("swapping");
        } else if (type === "complete") {
            bar.classList.add("sorted");
        }

        arrayContainer.appendChild(bar);
    });
}

function createTreeNode(array, path, state) {
    const item = document.createElement("div");
    item.className = "tree-item";

    const node = document.createElement("div");
    node.className = "tree-node";

    const sorted = state.sortedMap[path];
    const values = sorted || array;

    values.forEach(value => {
        const cell = document.createElement("span");
        cell.className = "tree-cell";
        cell.textContent = value;
        node.appendChild(cell);
    });

    if (state.reached.has(path)) node.classList.add("is-seen");
    if (sorted) node.classList.add("is-done");

    if (path === state.activePath) {
        node.classList.add("is-current");
        if (state.type === "merge") node.classList.add("is-merging");
    }

    item.appendChild(node);

    if (array.length > 1) {
        const mid = Math.floor(array.length / 2);
        const children = document.createElement("div");
        children.className = "tree-children";

        children.appendChild(createTreeNode(array.slice(0, mid), path + "L", state));
        children.appendChild(createTreeNode(array.slice(mid), path + "R", state));

        item.appendChild(children);
    }

    return item;
}

function renderTree(step) {
    treeContainer.innerHTML = "";

    const state = {
        sortedMap: {},
        reached: new Set(),
        activePath: step.path,
        type: step.type
    };

    for (let i = 0; i <= currentStep; i++) {
        const s = steps[i];
        state.reached.add(s.path);

        if (s.type === "merge" || s.type === "base" || s.type === "complete") {
            state.sortedMap[s.path] = s.array;
        }
    }

    treeContainer.appendChild(createTreeNode(originalArray, "root", state));

    const current = treeContainer.querySelector(".is-current");
    if (current) {
        const nodeBox = current.getBoundingClientRect();
        const hostBox = treeContainer.getBoundingClientRect();

        treeContainer.scrollLeft +=
            (nodeBox.left + nodeBox.width / 2) -
            (hostBox.left + hostBox.width / 2);
    }
}

function renderMiniArray(container, array, changed = false) {
    container.innerHTML = "";

    array.forEach(value => {
        const item = document.createElement("span");
        item.className = "array-value";

        if (changed) item.classList.add("changed");

        item.textContent = value;
        container.appendChild(item);
    });
}

function render() {
    const step = steps[currentStep];
    if (!step) return;

    renderArray(step.array, step.type);
    renderJavaCode(step.activeLines);
    renderTree(step);

    operationLabel.textContent =
        step.type === "split" ? "Dividing" :
        step.type === "merge" ? "Merging" :
        step.type === "base" ? "Base case" :
        "Completed";

    actionTitle.textContent = step.title;
    explanation.textContent = step.message;
    detailText.textContent = step.detail;
    whyText.textContent = step.why;

    renderMiniArray(currentArrayBox, step.array);
    renderMiniArray(
        resultArrayBox,
        step.result,
        step.type === "merge" || step.type === "complete"
    );

    stepCounter.textContent =
        `Step ${currentStep + 1} / ${steps.length}`;

    prevButton.disabled = currentStep === 0;
    nextButton.disabled = currentStep === steps.length - 1;
}

function nextStep() {
    if (currentStep < steps.length - 1) {
        currentStep++;
        render();
    } else {
        stopAutoPlay();
    }
}

function previousStep() {
    if (currentStep > 0) {
        currentStep--;
        render();
    }
}

function startAutoPlay() {
    if (autoplayTimer !== null) return;

    playButton.textContent = "⏸ Pause";

    autoplayTimer = setInterval(() => {
        if (currentStep >= steps.length - 1) {
            stopAutoPlay();
            return;
        }

        nextStep();
    }, AlgoLab.interval(1200));
}

function stopAutoPlay() {
    if (autoplayTimer !== null) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
    }

    playButton.textContent = "▶ Auto Play";
}

function toggleAutoPlay() {
    if (autoplayTimer !== null) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

function resetVisualization() {
    stopAutoPlay();
    generateSteps();
}

function loadCustomArray() {
    const text = inputField.value.trim();

    const values = text.split(",")
        .map(value => value.trim())
        .filter(value => value !== "")
        .map(Number);

    if (
        values.length < 1 ||
        values.length > 16 ||
        values.some(value => !Number.isFinite(value))
    ) {
        AlgoLab.showHint(
            "Enter between 1 and 16 valid numbers separated by commas.",
            true
        );
        inputField.focus();
        return;
    }

    stopAutoPlay();
    originalArray = values;
    AlgoLab.showHint("Enter 1–16 numbers separated by commas.", false);
    generateSteps();
}

function generateRandomArray() {
    stopAutoPlay();

    originalArray = Array.from(
        { length: 8 },
        () => Math.floor(Math.random() * 90) + 10
    );

    inputField.value = originalArray.join(", ");
    AlgoLab.showHint("Enter 1–16 numbers separated by commas.", false);
    generateSteps();
}

document.getElementById("prev-btn")
    .addEventListener("click", previousStep);

document.getElementById("next-btn")
    .addEventListener("click", nextStep);

document.getElementById("play-btn")
    .addEventListener("click", toggleAutoPlay);

document.getElementById("reset-btn")
    .addEventListener("click", resetVisualization);

document.getElementById("load-btn")
    .addEventListener("click", loadCustomArray);

randomButton.addEventListener("click", generateRandomArray);

inputField.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        loadCustomArray();
    }
});

renderJavaCode();
generateSteps();