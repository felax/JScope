function getRandomColor(min, max) {
    let r = Math.floor(Math.random() * (max - min) + min);
    let g = Math.floor(Math.random() * (max - min) + min);
    let b = Math.floor(Math.random() * (max - min) + min);
    let color = "#" + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    return color;
}

function merge(arrays) {
    let result = [];
    for (let i = 0; i < arrays[0].length; i++) {
        result.push([]);
        for (let arr of arrays) {
            result[i].push(arr[i]);
        }
    }
    return result;
}

function arange(start, stop, step) {
    let result = [];
    while (start < stop) {
        result.push(start);
        start += step;
    }
    return result;
}

function formatTime(time) {
    if (Math.abs(time) < 1e-9) {
        return (time * 1e12).toFixed(3) + "ps";
    }
    else if (Math.abs(time) < 1e-6) {
        return (time * 1e9).toFixed(3) + "ns";
    }
    else if (Math.abs(time) < 1e-3) {
        return (time * 1e6).toFixed(3) + "us";
    }
    else if (Math.abs(time) < 1) {
        return (time * 1e3).toFixed(3) + "ms";
    }
    return time.toFixed(2) + " s";
}

function scale(trace, start, stop, step) {
    const result = [];
    const drawStart = trace.offset / step;
    const drawEnd = drawStart + trace.data.length * trace.step / step;
    for (let i = start/step; i < stop/step; i++) {
        if (i < drawStart || i >= drawEnd) {
            result.push(null);
        }
        else {
            const idx = Math.round((i - drawStart) * step / trace.step);
            result.push(trace.data[idx]);
        }
    }
    return result;
}

function findClosestSorted(ref, arr) {
    let lastDiff = Math.abs(ref - arr[0]);
    let errDecrease = true;

    for (let i = 1; i < arr.length; i++) {
        const diff = Math.abs(ref - arr[i]);
        if (diff > lastDiff) {
            return arr[i - 1];
        }
        lastDiff = diff;
    }
}
