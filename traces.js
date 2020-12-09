// Contains UI elements and stores data related to traces
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

    // Find trace and bind an annotation to it
    // point: {x, y, xval, yval, name, idx, canvasx, canvasy}
    addAnnotation(point) {
        const trace = this.getTrace(point.name);
        const num = this.getUniqueAnnotationNum();
        trace.addAnnotation(num, point);
        const annotations = this.annotations;
        timingCtr.updateSelects(annotations);
        annotationCtr.update(annotations);
        return annotations;
    }

    // Find trace of the annotation and remove it
    // annotation: {series, x, shortText, text, xval, div}
    removeAnnotation(annotation) {
        console.log(annotation)
        const trace = this.getTrace(annotation.series);
        trace.removeAnnotation(annotation);
        const annotations = this.annotations;
        timingCtr.updateSelects(annotations);
        annotationCtr.update(annotations);
        return annotations;
    }
    
    // Create and add a new scope
    addScope() {
        const scope = document.createElement("scope-elem");
        this.scopeDiv.appendChild(scope);
    }

    // Return an array containing all traces
    get traces() {
        const traces = [];
        for (let scope of this.scopeDiv.children) {
            for (let trace of scope.traceDiv.children) {
                traces.push(trace);
            }
        }
        return traces;
    }

    // Get trace with a given name
    getTrace(name) {
        const traces = this.traces;
        for (let trace of traces) {
            if (trace.name == name) {
                return trace;
            }
        }
        return null;
    }

    // Return name array
    get names() {
        const traces = this.traces;
        let names = [];
        for (let trace of traces) {
            names.push(trace.name);
        }
        return names;
    }

    // Add number after name if it is not unique
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

    // Return all annotations for all traces in dygraph format
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

    // Get the lowest number not used for annotations
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

    // Get lowest x value for all traces
    get start() {
        const traces = this.traces;
        let start = 1000;
        for (let trace of traces) {
            const min = trace.offset;
            if (min < start) { start = min; }
        }
        return start;
    }

    // Get highest x value for all traces
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

// Scope which conatains traces. 
// The scope is used to apply an offset to multiple traces
class Scope extends HTMLElement {
    traceDiv = document.createElement('div');
    offset = 0;

    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        const wrapper = document.createElement('div');
        wrapper.style.borderStyle = "solid";
        wrapper.style.borderWidth = "thin";
        wrapper.style.padding = "4px 0";

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

    // Remove all traces then the scope. Update graph is relevant.
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

    // Add the given trace to the scope and create an associated stack graph
    addTrace(trace) {
        trace.name = traces.getUniqueName(trace.name);
        trace.nameInput.value = trace.name;
        trace.offset = this.offset;
        this.traceDiv.appendChild(trace);
        const graph = stackGraphCtr.addGraph(trace.name);
        graph.style.order = String(stackGraphCtr.maxFlexOrder + 1);
    }

    // Update offsets of all traces in the scope
    updateOffsets(event) {
        this.offset = Number(event.target.value);
        const traces = this.traceDiv.children;
        for (let trace of traces) {
            trace.offset = this.offset;
        }
        activeGraphCtr.draw(traceCtr.traces, options.step);
    }

    // Get file from input button and parse it into an array
    // Detect CSV format using that array and create a trace object
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

// Trace element which represents a "Channel measure" taken with an oscilloscope
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

    // Delete trace and nul it's data
    delete() {
        this.data = null;
        stackGraphCtr.deleteGraph(this.name);
        this.remove();
        if (!options.stack) {
            mainGraphCtr.draw(traceCtr.traces, options.step);
        }
    }

    // Add annotation not reliant on offset
    addAnnotation(number, point) {
        const data = {
            x: point.xval - this.offset,
            y: point.yval,
            num: number
        }
        this.annotations.push(data);
    }

    // Find and remove annotation
    removeAnnotation(annotation) {
        for (let i = 0; i < this.annotations.length; i++) {
            if (this.annotations[i].num == annotation.shortText) {
                this.annotations.splice(i, 1);
            }
        }
    }

    // Make sure the new name is unique and update stack graph name
    changeName(event) {
        const newName = traceCtr.getUniqueName(event.target.value);
        stackGraphCtr.swapName(this.name, newName);
        this.name = newName;
        this.nameInput.value = newName;
        activeGraphCtr.draw(this);
    }

    // Update color with redraw
    setColor(event) {
        this.color = event.target.value;
        activeGraphCtr.draw(this);
    }

    // Update visibility with redraw
    setVisibility(event) {
        this.visibility = event.target.checked;
        activeGraphCtr.setVisibility(this.name, this.visibility);
    }
}