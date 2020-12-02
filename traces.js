class TraceContainer extends HTMLElement {
    scopeDiv = document.createElement("div");

    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = COLLAPSE_CSS;
        const wrapper = document.createElement('div');

        const collapseBtn = document.createElement("button");
        collapseBtn.innerHTML = "Traces";
        collapseBtn.className = "collapsible";
        collapseBtn.addEventListener("click", collapse);
        wrapper.appendChild(collapseBtn);

        const content = document.createElement("div");
        content.className = "content";
        
        content.appendChild(this.scopeDiv);

        const addScopeBtn = document.createElement("button");
        addScopeBtn.innerHTML = "\u2795";
        addScopeBtn.addEventListener("click", this.addScope.bind(this));
        content.appendChild(addScopeBtn);

        wrapper.appendChild(content);
        shadow.appendChild(wrapper);
    }

    addScope() {
        const scope = document.createElement("scope-elem");
        this.scopeDiv.appendChild(scope);
    }

    getTraces() {
        const traces = [];
        for (let scope of this.scopeDiv.children) {
            for (let trace of scope.traceDiv.children) {
                traces.push(trace);
            }
        }
        return traces;
    }

    getTrace(name) {
        const traces = this.getTraces();
        for (let trace of traces) {
            if (trace.name == name) {
                return trace;
            }
        }
        return null;
    }

    getNames() {
        const traces = this.getTraces();
        let names = [];
        for (let trace of traces) {
            names.push(trace.name);
        }
        return names;
    }

    getUniqueName(name) {
        const names = this.getNames();
        let newName = name;
        let inc = 2;
        let unique = false;
        while (names.includes(newName)) {
            newName = name + " (" + inc + ")";
            inc++;
        }
        return newName;
    }

    getStartEnd() {
        const traces = this.getTraces();
        let maxTime = 0;
        let minTime = 1000;
        for (let trace of traces) {
            const endTime = trace.data.length * trace.step + trace.offset;
            const startTime = trace.offset;
            if (endTime > maxTime) { maxTime = endTime; }
            if (startTime < minTime) { minTime = startTime; }
        }
        //console.log(maxTime)
        return {start: minTime, end: maxTime};
    }

    getLowestOrder() {
        let max = 0;
        const traces = this.getTraces();
        for (let trace of traces) {
            const order = Number(trace.graphElem.style.order);
            if (order > max) {
                max = order;
            }
        }
        return max;
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
            trace.graphElem.graph.destroy();
            trace.graphElem.remove();
            trace.remove();
        }
        this.remove();
        if (!graphCtr.stack) {
            mainGraph.draw(traceCtr.getTraces());
        }
    }

    addTrace(trace) {
        trace.graphElem.style.order = String(traceCtr.getLowestOrder() + 1);
        trace.name = traces.getUniqueName(trace.name);
        trace.nameInput.value = trace.name;
        trace.offset = this.offset;
        this.traceDiv.appendChild(trace);
        if (graphCtr.stack) {
            graphCtr.graphDiv.appendChild(trace.graphElem);
            trace.graphElem.graph.resize();
        }
    }

    updateOffsets(event) {
        this.offset = Number(event.target.value);
        const traces = this.traceDiv.children;
        for (let trace of traces) {
            trace.offset = this.offset;
        }
        for (let trace of traces) {
            if (graphCtr.stack) {
                trace.graphElem.draw([trace]);
            }
        }
        if (!graphCtr.stack) {
            mainGraph.draw(traceCtr.getTraces());
        };
    }

    loadCSV(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.addEventListener('load', event => {
            let csv = Papa.parse(event.target.result).data;
            const traces = [];
            parseOldTek(csv, traces);
            parseNewTek(csv, traces);
            if (!traces.length) {
                alert("Unidentified CSV format");
            }
            for (let trace of traces) {
                this.addTrace(trace);
                if (graphCtr.stack) {
                    trace.graphElem.draw([trace]);
                }
            }
            if (!graphCtr.stack) {
                mainGraph.draw(traceCtr.getTraces());
            }
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
    graphElem = document.createElement("stack-graph");
    info = document.createElement("span");

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

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "\u2716";
        deleteBtn.addEventListener("click", this.delete.bind(this), false);
        wrapper.appendChild(deleteBtn);

        wrapper.appendChild(this.info);

        shadow.appendChild(wrapper);
    }

    delete() {
        this.data = null;
        this.graphElem.graph.destroy();
        this.graphElem.remove();
        this.remove();
        if (!graphCtr.stack.checked) {
            mainGraph.draw(traceCtr.getTraces());
        }
    }

    changeName(event) {
        this.name = traceCtr.getUniqueName(event.target.value);
        this.nameInput.value = this.name;
        if (graphCtr.stack.checked) {
            this.graphElem.draw([this])
        }
        else {
            mainGraph.draw(traceCtr.getTraces());
        }
    }

    setColor(event) {
        this.color = event.target.value;
        if (graphCtr.stack.checked) {
            this.graphElem.draw([this])
        }
        else {
            mainGraph.draw(traceCtr.getTraces());
        }
    }

    setVisibility(event) {
        this.visibility = event.target.checked;
        if (graphCtr.stack) {
            if (this.visibility) {
                this.graphElem.style.display = "block";
                this.graphElem.draw([this]);
            }
            else {
                this.graphElem.style.display = "none";
            }
        }
        else {
            mainGraph.draw(traceCtr.getTraces());
        }
    }
}