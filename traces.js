class TraceContainer extends Collapsible {
    scopeDiv = document.createElement("div");

    constructor() {
        super();
        this.collapseBtn.innerHTML = "Traces";
        this.contentDiv.appendChild(this.scopeDiv);

        const addScopeBtn = document.createElement("button");
        addScopeBtn.innerHTML = "\u2795";
        addScopeBtn.addEventListener("click", this.addScope.bind(this));
        this.contentDiv.appendChild(addScopeBtn);
    }

    addAnnotation(point) {
        console.log(point)
        const trace = this.getTrace(point.name);
        const num = this.getUniqueAnnotationNum();
        trace.addAnnotation(num, point);
        const annotations = this.annotations;
        timingCtr.updateSelects(annotations);
        annotationCtr.update(annotations);
        return annotations;
    }

    removeAnnotation(annotation) {
        console.log("thereitisdude")
        console.log(annotation)
        const trace = this.getTrace(annotation.series);
        trace.removeAnnotation(annotation);
        const annotations = this.annotations;
        timingCtr.updateSelects(annotations);
        annotationCtr.update(annotations);
        return annotations;
    }

    addScope() {
        const scope = document.createElement("scope-elem");
        this.scopeDiv.appendChild(scope);
    }

    get traces() {
        const traces = [];
        for (let scope of this.scopeDiv.children) {
            for (let trace of scope.traceDiv.children) {
                traces.push(trace);
            }
        }
        return traces;
    }

    getTrace(name) {
        const traces = this.traces;
        for (let trace of traces) {
            if (trace.name == name) {
                return trace;
            }
        }
        return null;
    }

    get names() {
        const traces = this.traces;
        let names = [];
        for (let trace of traces) {
            names.push(trace.name);
        }
        return names;
    }

    getUniqueName(name) {
        const names = this.names;
        let newName = name;
        let inc = 2;
        let unique = false;
        while (names.includes(newName)) {
            newName = name + " (" + inc + ")";
            inc++;
        }
        return newName;
    }

    get annotations() {
        const annotations = [];
        const traces = this.traces;
        const timeArr = arange(this.start, this.stop, options.step);
        for (let trace of traces) {
            for (let data of trace.annotations) {
                const annotation = {
                    series: trace.name,
                    x: findClosestSorted(data.x + trace.offset, timeArr),
                    shortText: data.num,
                    text: data.y,
                }
                annotations.push(annotation);
            }
        }
        return annotations;
    }

    getUniqueAnnotationNum() {
        const annotations = this.annotations;
        const numbers = [];
        for (let ann of annotations) {
            numbers.push(Number(ann.shortText));
        }
        let i = 0;
        while (numbers.includes(i)) { i++; }
        return i;
    }

    get start() {
        const traces = this.traces;
        let start = 1000;
        for (let trace of traces) {
            const min = trace.offset;
            if (min < start) { start = min; }
        }
        return start;
    }

    get stop() {
        const traces = this.traces;
        let stop = 0;
        for (let trace of traces) {
            const max = trace.data.length * trace.step + trace.offset;
            if (max > stop) { stop = max; }
        }
        return stop;
    }
}

class Scope extends HTMLElement {
    traceDiv = document.createElement('div');
    offset = 0;

    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        const wrapper = document.createElement('div');
        wrapper.style.borderStyle = "solid";
        wrapper.style.borderWidth = "thin";
        wrapper.style.padding = "4px 0"

        const uploadFileBtn = document.createElement("input");
        uploadFileBtn.type = "file";
        uploadFileBtn.accept = ".csv";
        uploadFileBtn.addEventListener("change", this.loadCSV.bind(this), false);
        wrapper.appendChild(uploadFileBtn);

        const offsetInput = document.createElement("input");
        offsetInput.type = "number";
        offsetInput.placeholder = "Enter offset...";
        offsetInput.step = 1e-6;
        offsetInput.addEventListener('change', this.updateOffsets.bind(this), false);
        wrapper.appendChild(offsetInput);

        const rmvScopeBtn = document.createElement("button");
        rmvScopeBtn.innerHTML = "\u2716";
        rmvScopeBtn.addEventListener('click', this.delete.bind(this), false);
        wrapper.appendChild(rmvScopeBtn);

        wrapper.appendChild(this.traceDiv);

        shadow.appendChild(wrapper);
    }

    delete() {
        while (this.traceDiv.children.length > 0) {
            const trace = this.traceDiv.children.item(0);
            trace.data = null;
            stackGraphCtr.deleteGraph(trace.name);
            trace.remove();
        }
        this.remove();
        if (!options.stack) {
            mainGraphCtr.draw(traceCtr.traces, options.step);
        }
    }

    addTrace(trace) {
        trace.name = traces.getUniqueName(trace.name);
        trace.nameInput.value = trace.name;
        trace.offset = this.offset;
        this.traceDiv.appendChild(trace);
        const graph = stackGraphCtr.addGraph(trace.name);
        graph.style.order = String(stackGraphCtr.maxFlexOrder + 1);
    }

    updateOffsets(event) {
        this.offset = Number(event.target.value);
        const traces = this.traceDiv.children;
        for (let trace of traces) {
            trace.offset = this.offset;
        }
        activeGraphCtr.draw(traceCtr.traces, options.step);
    }

    loadCSV(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.addEventListener('load', event => {
            console.log("Loading CSV into array...");
            let csv = Papa.parse(event.target.result).data;
            const traces = [];
            console.log("Parsing CSV array...")
            parseOldTek(csv, traces);
            parseNewTek(csv, traces);
            if (!traces.length) {
                alert("Unidentified CSV format");
            }
            for (let trace of traces) {
                console.log("Adding trace...")
                this.addTrace(trace);
            }
            activeGraphCtr.draw(traceCtr.traces);
        });
        reader.readAsText(file);
    }
}

class Trace extends HTMLElement {
    name;
    data = [0];
    offset = 0;
    visibility = true;
    color = getRandomColor(0, 155);
    nameInput = document.createElement("input");
    info = document.createElement("span");
    annotations = [];

    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        const wrapper = document.createElement('div');

        this.nameInput.addEventListener("change", this.changeName.bind(this), false);
        wrapper.appendChild(this.nameInput);

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

        wrapper.appendChild(this.info);

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "\u2716";
        deleteBtn.addEventListener("click", this.delete.bind(this), false);
        wrapper.appendChild(deleteBtn);

        shadow.appendChild(wrapper);
    }

    delete() {
        this.data = null;
        const graph = stackGraphCtr.getGraph(this.name);
        graph.dygraph.destroy();
        graph.remove();
        this.remove();
        if (!options.stack) {
            mainGraphCtr.draw(traceCtr.traces, options.step);
        }
    }

    addAnnotation(number, point) {
        const data = {
            x: point.xval - this.offset,
            y: point.yval,
            num: number
        }
        this.annotations.push(data);
    }

    removeAnnotation(annotation) {
        for (let i = 0; i < this.annotations.length; i++) {
            if (this.annotations[i].num == annotation.shortText) {
                this.annotations.splice(i, 1);
            }
        }
    }

    changeName(event) {
        const newName = traceCtr.getUniqueName(event.target.value);
        if (options.stack) {
            stackGraphCtr.swapName(this.name, newName);
        }
        this.name = newName;
        activeGraphCtr.draw(this);
    }

    setColor(event) {
        this.color = event.target.value;
        activeGraphCtr.draw(this);
    }

    setVisibility(event) {
        this.visibility = event.target.checked;
        if (this.visibility) {
            console.log(true);
            activeGraphCtr.setVisibility(this.name, true);
        }
        else {
            console.log(false)
            activeGraphCtr.setVisibility(this.name, false);
        }
    }
}