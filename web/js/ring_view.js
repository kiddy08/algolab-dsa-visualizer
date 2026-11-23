// Draws a circular array (used by the Circular Queue and Deque pages).
// Slots sit on a ring, index 0 at the top, going clockwise.
window.RingView = {
    render: function (container, options) {
        const o = options;
        const count = o.capacity;

        container.innerHTML = "";

        const ring = document.createElement("div");
        ring.className = "ring";

        const track = document.createElement("div");
        track.className = "ring-track";
        ring.appendChild(track);

        function place(element, index, radius) {
            const angle = (-90 + (index * 360) / count) * Math.PI / 180;

            element.style.left = (50 + radius * Math.cos(angle)) + "%";
            element.style.top = (50 + radius * Math.sin(angle)) + "%";
        }

        for (let index = 0; index < count; index++) {
            const slot = document.createElement("div");
            slot.className = "ring-slot";
            place(slot, index, 34);

            const box = document.createElement("div");
            box.className = "slot-box";

            const value = o.values[index];

            if (value !== null && value !== undefined) {
                box.textContent = value;
                box.classList.add("filled");

                if (index === o.topIndex) {
                    box.classList.add("is-top");
                }
            }

            if (o.mark && o.mark.index === index) {
                box.classList.add("mark-" + o.mark.kind);

                if (o.mark.kind === "pending") {
                    box.textContent = "?";
                }
            }

            const label = document.createElement("span");
            label.className = "slot-index";
            label.textContent = index;

            slot.append(box, label);
            ring.appendChild(slot);
        }

        if (o.front >= 0 && o.front < count) {
            const front = document.createElement("span");
            front.className = "ring-label front";
            front.textContent = "front";
            place(front, o.front, 19);
            ring.appendChild(front);
        }

        if (o.showRear && o.rear >= 0 && o.rear < count) {
            const rear = document.createElement("span");
            rear.className = "ring-label rear";
            rear.textContent = "rear";
            place(rear, o.rear, 48);
            ring.appendChild(rear);
        }

        const center = document.createElement("div");
        center.className = "ring-center";

        const big = document.createElement("strong");
        big.textContent = o.centerTop;

        const small = document.createElement("span");
        small.textContent = o.centerBottom;

        center.append(big, small);
        ring.appendChild(center);

        container.appendChild(ring);
    }
};
