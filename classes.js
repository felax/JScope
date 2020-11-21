class Scope extends HTMLElement{
    traceContainer;
    offsetInput;
    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        const wrapper = document.createElement('div');

        const uploadFileBtn = document.createElement("input");
        uploadFileBtn.type = "file";
        uploadFileBtn.accept = ".csv";
        uploadFileBtn.addEventListener("change", this.loadCSV.bind(this), false);
        wrapper.appendChild(uploadFileBtn);

        this.offsetInput = document.createElement("input");
        this.offsetInput.type = "number";
        this.offsetInput.value = 0;
        this.offsetInput.step = 1e-6;
        this.offsetInput.addEventListener('change', this.updateOffset.bind(this), false);
        wrapper.appendChild(this.offsetInput);

        const rmvScopeBtn = document.createElement("button");
        rmvScopeBtn.innerHTML = "X";
        rmvScopeBtn.addEventListener('click', this.delete.bind(this), false);
        wrapper.appendChild(rmvScopeBtn);

        this.traceContainer = document.createElement('div');
        wrapper.appendChild(this.traceContainer);

        shadow.appendChild(wrapper);
    }

    delete() {
        for (let child of this.traceContainer.children) {
            child.data = null;
            child.remove();
        }
        this.remove();
        drawMainGraph();
    }

    addTrace(name, step, data) {
        const traceElem = document.createElement("trace-test");
        traceElem.name = nameCheck(name);
        traceElem.nameInput.value = traceElem.name;
        traceElem.step = step;
        traceElem.data = data;
        traceElem.offset = this.offsetInput.value;
        this.traceContainer.appendChild(traceElem);
        drawMainGraph();
    }

    updateOffset(event) {
        for (let child of this.traceContainer.children) {
            child.offset = Number(event.target.value);
        }
        drawMainGraph();
    }

    loadCSV(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.addEventListener('load', event => {
            let csv = Papa.parse(event.target.result).data;
            if (csv[0][0] == "Record Length") {
                this.parseOldTek(csv);
            }
            else if (csv[0][0] == "Model") {
                this.parseNewTek(csv);
            }
            else {
                alert("Unidentified CSV format");
            }
        });
        reader.readAsText(file);
    }

    parseOldTek(csv) {
        const step = Number(csv[1][1]);
        const nPoints = Number (csv[0][1]);
        const name = csv[4][0];
        const data = []
    
        for (let i = 0; i < nPoints; i++) {
            data.push(Number(csv[i][4]));
        }
        this.addTrace(name, step, data);
    }

    parseNewTek(csv) {
        const step = Number(csv[8][1]);
        const nPoints = Number(csv[9][1]);
        const nScopes = csv[19].length - 1;

        for (let i = 1; i < nScopes + 1; i++) {
            const name = csv[19][i];
            const data = [];
            for (let j = 21; j < nPoints; j++) {
                data.push(Number(csv[j][i]))
            }
            this.addTrace(name, step, data);
        }
    }
}

class Trace extends HTMLElement {
    name;
    data = [0];
    offset = 0;
    visibility = true;
    color = getRandomColor();
    nameInput;

    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        const wrapper = document.createElement('div');

        const nameInput = document.createElement("input");
        this.nameInput = nameInput;
        nameInput.addEventListener("change", this.changeName.bind(this), false);
        wrapper.appendChild(nameInput);

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = this.color;
        colorInput.addEventListener("change", this.setColor.bind(this), false);
        wrapper.appendChild(colorInput);

        const showInput = document.createElement("input");
        showInput.type = "checkbox";
        showInput.checked = true;
        showInput.addEventListener("change", this.setVisibility.bind(this), false);
        wrapper.appendChild(showInput);

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "X";
        deleteBtn.addEventListener("click", this.delete.bind(this), false);
        wrapper.appendChild(deleteBtn);

        shadow.appendChild(wrapper);
    }


    delete() {
        this.data = null;
        this.remove();
        drawMainGraph();
    }

    changeName(event) {
        this.name = event.target.value;
        drawMainGraph();
    }

    setColor(event) {
        this.color = event.target.value;
        drawMainGraph();
    }

    setVisibility(event) {
        this.visibility = event.target.checked;
        drawMainGraph();
    }
}

class Graph extends HTMLElement {
    graph;
    wrapper = document.createElement("div");
    upBtn = document.createElement("button");
    downBtn = document.createElement("button");
    graphDiv;
    constructor() {
        super();

        const shadow = this.attachShadow({mode: 'open'});
        /*shadow.innerHTML = `
            <style>
                :host {
                    flex: 0 0 60px
                }
            </style>
        `*/

        this.wrapper.addEventListener("mouseover", this.showBtns.bind(this));
        this.wrapper.addEventListener("mouseout", this.showBtns.bind(this));
        this.wrapper.style.position = "relative";
        this.wrapper.style.display = "flex";
        this.wrapper.style.flexDirection = "row";

        const labelsDiv = document.createElement("div");
        labelsDiv.style.flex = "0 0 150px";
        labelsDiv.style.textAlign = "right";
        this.wrapper.appendChild(labelsDiv);

        const graphDiv = document.createElement("div");
        graphDiv.style.flex = "1 1 50%";
        graphDiv.style.position = "relative";
        graphDiv.style.height = "400px"
        graphDiv.style.width = "2px"
        this.wrapper.appendChild(graphDiv);
        
        const btnDiv = document.createElement("div");
        btnDiv.style.flex = "0 0 25px";
        btnDiv.style.display = "flex";
        btnDiv.style.flexDirection = "column"
        this.wrapper.appendChild(btnDiv);

        this.upBtn.className = "upBtn";
        this.upBtn.innerHTML = "&uarr;";
        this.upBtn.style.flex = "1 1"
        this.upBtn.addEventListener("click", this.shiftUp.bind(this), false);
        btnDiv.appendChild(this.upBtn);

        this.downBtn.className = "downBtn";
        this.downBtn.innerHTML = "&darr;";
        this.downBtn.style.flex = "1 1"
        this.downBtn.addEventListener("click", this.shiftDown.bind(this), false);
        btnDiv.appendChild(this.downBtn);

        shadow.appendChild(this.wrapper);
        this.graph = new Dygraph(graphDiv, [[0,0], [1,1]], 
            {
                legend: 'always',
                connectSeparatedPoints: 'true',
                labelsSeparateLines: true,
                axes: {
                    x: {
                        valueFormatter: function(num) {
                            return num.toExponential(3);
                        },
                    },
                    y: {}
                },
                labels: ["time", "none"],
                yRangePad: 6,
                strokeWidth: 2,
                labelsDiv: labelsDiv,
                //annotationClickHandler: timingParent.removeAnnotation,
                //pointClickCallback: this.onPointClick.bind(this)
            }
        );

    }

    showBtns(event) {
        if (event.type == "mouseover") {
            this.upBtn.style.display = "inline";
            this.downBtn.style.display = "inline";
        }
        else {
            this.upBtn.style.display = "none";
            this.downBtn.style.display = "none";
        }
    }

    onPointClick(event, point) {}

    shiftUp() {
        let minDiff = 1000;
        let currOrder = this.div.style.order;
        let targetTrace = this;
        for (let trace of graphParent.traces.values()) {
            let diff = currOrder - trace.displayDiv.style.order;
            if (diff < minDiff && diff > 0) {
                minDiff = diff;
                targetTrace = trace;
            }   
        }
        this.div.style.order = targetTrace.displayDiv.style.order;
        targetTrace.div.style.order = currOrder;
    }

    shiftDown() {
        let minDiff = 1000;
        let currOrder = this.displayDiv.style.order;
        let targetTrace = this;
        for (let trace of graphParent.traces.values()) {
            let diff = trace.displayDiv.style.order - currOrder;
            if (diff < minDiff && diff > 0) {
                minDiff = diff;
                targetTrace = trace;
            }   
        }
        this.displayDiv.style.order = targetTrace.displayDiv.style.order;
        targetTrace.displayDiv.style.order = currOrder;
    }

    update() {
        let time = arange(0, graphParent.getMaxTime(), graphParent.step);
        let data = this.buildData(time);
        let graphData = merge([time, data]);
        this.graph.updateOptions({ 
            'file': graphData,
            'labels': ["Time", this.name],
            'colors': [this.color],
            'visibility': [this.visibility]
        })
    }
}

class TimingParent {
    constructor() {
        this.annotations = new Map();
        this.timings = new Map();
        this.addTimingBtn = document.getElementById("addTimingBtn");

        this.addTimingBtn.addEventListener("click", this.addTiming.bind(this), false);
    }

    getFreeNum() {
        let num = 0;
        while (this.annotations.has(String(num))) {
            num++;
        }
        return num;
    }

    addAnnotation(point, dygraph) {
        let annotations = dygraph.annotations();
        let annotation = {
            series: point.name,
            x: String(point.xval),
            shortText: String(this.getFreeNum())
        }
        this.annotations.set(annotation.shortText, annotation);
        annotations.push(annotation);
        dygraph.setAnnotations(annotations);
        for (let timing of this.timings.values()) {
            timing.updateSelect();
            timing.updateResult();
        }
    }

    removeAnnotation(annotation, point, dygraph, event) {
        if (!event.ctrlKey) {
            return;
        }
        let annotations = dygraph.annotations();
        timingParent.annotations.delete(annotation.shortText);
        for (let i = 0; i< annotations.length; i++) {
            if (annotations[i].shortText == annotation.shortText) {
                annotations.splice(i, 1);
            }
        }
        dygraph.setAnnotations(annotations);
        for (let timing of timingParent.timings.values()) {
            timing.updateSelect();
            timing.updateResult();
        }
    }

    getAnnotations(serie = false) {
        let result = [];
        if (serie) {
            for (let ann of this.annotations.values()) {
                if (ann.serie = serie) {
                    result.push(ann);
                }
            }
        }
        else {
            result = Array.from(this.annotations.values());
        }
        return result;
    }

    addTiming() {
        let timing = new Timing();
        timing.name = duplicateCheck(this.timings, "t")
        timing.nameInput.value = timing.name;
        this.timings.set(timing.name, timing);
    }
}

class Timing {
    constructor() {
        this.firstSelect = document.createElement("select");
        this.secondSelect = document.createElement("select");
        this.nameInput = document.createElement("input");
        this.div = document.createElement("div");
        this.result = document.createElement("input");
        this.rmvBtn = document.createElement("button");
        this.rmvBtn.innerHTML = "X";
        this.result.value = "N/A";

        this.firstSelect.addEventListener("change", this.updateResult.bind(this), false);
        this.secondSelect.addEventListener("change", this.updateResult.bind(this), false);
        this.rmvBtn.addEventListener("click", this.remove.bind(this), false);
        this.nameInput.addEventListener("click", this.changeName.bind(this), false);

        let parentDiv = document.getElementById("timingDiv")
        this.div.appendChild(this.nameInput);
        this.div.appendChild(this.firstSelect);
        this.div.appendChild(this.secondSelect);
        this.div.appendChild(this.result);
        this.div.appendChild(this.rmvBtn);
        parentDiv.appendChild(this.div);

        this.updateSelect();
    }

    updateSelect() {
        let val1 = this.firstSelect.value;
        let val2 = this.secondSelect.value;

        while (this.firstSelect.options.length != 0) {
            this.firstSelect.remove(0);
            this.secondSelect.remove(0);
        }
        for (let annotation of timingParent.annotations.values()) {
            let opt1 = document.createElement("option");
            let opt2 = document.createElement("option");
            opt1.text = annotation.shortText;
            opt2.text = annotation.shortText;
            this.firstSelect.add(opt1);
            this.secondSelect.add(opt2);
        }
        this.firstSelect.value = val1;
        this.secondSelect.value = val2;
    }

    updateResult() {
        if (!this.firstSelect.value || !this.secondSelect.value) {
            return;
        }
        let ann1 = timingParent.annotations.get(this.firstSelect.value);
        let ann2 = timingParent.annotations.get(this.secondSelect.value);
        let diff = ann2.x - ann1.x;
        let err = Math.max(
            graphParent.traces.get(ann1.series).scope.step,
            graphParent.traces.get(ann1.series).scope.step,
            graphParent.step);
        let perErr = err / diff * 100;
        this.result.value = formatTime(ann2.x - ann1.x) + " (\u00B1" + perErr.toFixed(2) + " %)";
    }

    changeName() {
        let newName = this.nameInput.value;
        timingParent.timings.set(newName, timingParent.timings.get(this.name));
        timingParent.timings.delete(this.name);
        this.name = newName;
    }

    remove() {
        timingParent.timings.delete(this.name);
        this.div.remove();
    }
}

function getRandomColor() {
    let min = 0;
    let max = 155;
    let r = Math.floor(Math.random() * (max - min) + min);
    let g = Math.floor(Math.random() * (max - min) + min);
    let b = Math.floor(Math.random() * (max - min) + min);
    let color = "#" + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    return color;
}

function merge(arrays) {
    //check length to-do
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
        return (time * 1e12).toFixed(3) + " ps";
    }
    else if (Math.abs(time) < 1e-6) {
        return (time * 1e9).toFixed(3) + " ns";
    }
    else if (Math.abs(time) < 1e-3) {
        return (time * 1e6).toFixed(3) + " us";
    }
    else if (Math.abs(time) < 1) {
        return (time * 1e3).toFixed(3) + " ms";
    }
    return time.toFixed(2) + " s";
}

function nameCheck(name) {
    let newName = name;
    let inc = 2;
    let unique = false;
    const traceNames = getTraceNames();
    while (traceNames.includes(newName)) {
        newName = name + " (" + inc + ")";
        inc++;
    }
    return newName;
}

function getTraces() {
    let traces = [];
    const root = document.getElementById("scopeDiv");
    for (let scope of root.children) {
        for (let trace of scope.traceContainer.children) {
            traces.push(trace);
        }
    }
    return traces;
}

function getTraceNames() {
    let traceNames = [];
    traces = getTraces();
    for (let trace of traces) {
        traceNames.push(trace.name);
    }
    return traceNames;
}

function getMaxTime(traces) {
    let maxTime = 0;
    for (let trace of traces) {
        const time = trace.data.length * trace.step + trace.offset;
        if (time > maxTime) {
            maxTime = time;
        }
    }
    return maxTime;
}

function scale(trace, step, maxTime) {
    res = [];
    const ratio = step / trace.step;
    const length = maxTime / step;
    const drawStart = trace.offset / step;
    const drawEnd = drawStart + trace.data.length / ratio
    for (let i = 0; i < length; i++) {
        if (i < drawStart || i >= drawEnd) {
            res.push(null);
        }
        else {
            const idx = Math.round((i - drawStart) * ratio);
            res.push(trace.data[idx]);
        }
    }
    return res;
}

function drawMainGraph() {
    const traces = getTraces();
    const maxTime = getMaxTime(traces);
    const step = Number(document.getElementById("stepInput").value);
    const dataArrays = [];
    const time = arange(0, maxTime, step);
    dataArrays.push(time);
    const colors = [];
    const visibility = [];
    const labels = ["Time"];
    for (let trace of traces) {
        const scaled = scale(trace, step, maxTime)
        dataArrays.push(scaled);
        colors.push(trace.color);
        visibility.push(trace.visibility);
        labels.push(trace.name);
    }
    const data = merge(dataArrays);
    mainGraph.graph.updateOptions({
        file: data,
        labels: labels,
        colors: colors,
        visibility: visibility
    });
}

function switchDisplayMode(event) {
    const stack = event.target.checked;
    if (stack) {
        mainGraph.graph.updateOptions({
            file: [],
            labels: [],
            colors: [],
            visibility: []
        });
        mainGraph.remove();
        traces = getTraces();
    }
    else {
        document.getElementById("left").appendChild(mainGraph);
        drawMainGraph();
    }

}