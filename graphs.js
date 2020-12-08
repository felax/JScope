class MainGraphContainer extends HTMLElement {
    wrapper = document.createElement("div");
    graph = document.createElement("main-graph");

    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        this.wrapper.style.paddingTop = "20px";
        this.wrapper.appendChild(this.graph);
        shadow.appendChild(this.wrapper);
    }

    draw() {
        this.graph.dygraph.setAnnotations(traceCtr.annotations, true);
        this.graph.draw(traceCtr.traces, traceCtr.start, traceCtr.stop, options.step);
    }

    hide() {
        this.wrapper.style.display = "none";
    }

    show() {
        this.wrapper.style.display = "block";
        this.draw();
    }
    
    setVisibility() {
        this.draw();
    }
}

class StackGraphContainer extends HTMLElement {
    wrapper = document.createElement("div");

    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        this.wrapper.style.display = "none";
        this.wrapper.style.flexDirection = "column"
        this.wrapper.style.paddingTop = "20px";
        shadow.appendChild(this.wrapper);
    }

    draw(traces) {
        const annotations = traceCtr.annotations;
        if (!Array.isArray(traces)) { traces = [traces]; }
        for (let trace of traces) {
            const graph = this.getGraph(trace.name);
            if (graph) {
                graph.dygraph.setAnnotations(annotations, true);
                graph.draw(trace, traceCtr.start, traceCtr.stop, options.step);
            }
        }
    }

    getGraph(name) {
        for (let graph of this.graphs) {
            if (graph.name == name) {
                return graph;
            }
        }
        return null;
    }

    setVisibility(name, show) {
        const graph = this.getGraph(name);
        if (show) {
            graph.style.display = "block";
            graph.draw(traceCtr.getTrace(name), traceCtr.start, traceCtr.stop, options.step);
            graph.dygraph.resize();
        }
        else {
            graph.style.display = "none";
        }
    }

    deleteGraph(name) {
        const graph = this.getGraph(name);
        graph.dygraph.destroy();
        graph.remove();
    }

    addGraph(name) {
        const graph = document.createElement("stack-graph");
        graph.name = name;
        this.wrapper.appendChild(graph);
        return graph;
    }

    hide() {
        this.wrapper.style.display = "none";
    }

    show() {
        this.wrapper.style.display = "flex";
        const traces = traceCtr.traces;
        for (let trace of traces) {
            this.setVisibility(trace.name, trace.visibility);
        }
    }

    swapName(oldName, newName) {
        const graph = this.getGraph(oldName);
        graph.name = newName;
    }

    setHeight(height) {
        const graphs = this.graphs;
        for (let graph of graphs) {
            graph.setHeight(height);
        }
    }

    get graphs() {
        return this.wrapper.children;
    }

    get maxFlexOrder() {
        let max = 0;
        for (let graph of this.graphs) {
            const order = Number(graph.style.order);
            if (order > max) {
                max = order;
            }
        }
        return max;
    }
}

class Graph extends HTMLElement {
    dygraph;
    graphDiv;
    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = `<link rel="stylesheet" href="graphs.css">`;

        const wrapper = document.createElement("div");
        wrapper.className = "wrapper";

        const labelsDiv = document.createElement("div");
        labelsDiv.className = "labelsDiv";
        wrapper.appendChild(labelsDiv);

        this.graphDiv = document.createElement("div");
        this.graphDiv.className = "graphDiv";
        wrapper.appendChild(this.graphDiv);

        shadow.appendChild(wrapper);
        this.dygraph = new Dygraph(this.graphDiv, [[0,0], [1,1]], 
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
                },
                labels: ["time", "none"],
                strokeWidth: 2,
                labelsDiv: labelsDiv,
                yRangePad: 6,
                annotationClickHandler: this.onAnnotationClick.bind(this),
                pointClickCallback: this.onPointClick.bind(this),
            }
        );
    }

    onPointClick(event, point) {
        const annotations = traceCtr.addAnnotation(point);
        this.dygraph.setAnnotations(annotations);
    }

    onAnnotationClick(annotation, point, dygraph, event) {
        if (!event.ctrlKey) {
            return;
        }
        const annotations = traceCtr.removeAnnotation(annotation);
        this.dygraph.setAnnotations(annotations);
    }

    setHeight(height) {
        this.graphDiv.style.height = String(height) + "px";
        this.dygraph.resize();
    }

    draw(traces, start, stop, step) {
        console.log("Drawing graph...")
        const dataArrays = [];
        const time = arange(start, stop, step);
        dataArrays.push(time);
        const colors = [];
        const visibility = [];
        const labels = ["Time"];
        if (!Array.isArray(traces)) { traces = [traces]; }
        for (let trace of traces) {
            dataArrays.push(scale(trace, start, stop, step));
            colors.push(trace.color);
            visibility.push(trace.visibility);
            labels.push(trace.name);
        }
        const data = merge(dataArrays);
        this.dygraph.updateOptions({
            file: data,
            labels: labels,
            colors: colors,
            visibility: visibility
        });
        this.dygraph.resize();
    }
}

class MainGraph extends Graph {
    constructor() {
        super();
        this.dygraph.updateOptions({
            xlabel: "Time (s)",
            ylabel: "Voltage (V)"
        });
    }
}

class StackGraph extends Graph {
    upBtn = document.createElement("button");
    downBtn = document.createElement("button");
    constructor() {
        super();
        const wrapper = this.shadowRoot.querySelector("div");
        wrapper.addEventListener("mouseover", this.showBtns.bind(this));
        wrapper.addEventListener("mouseout", this.showBtns.bind(this));
        this.dygraph.updateOptions({
            axes: {
                x: { drawAxis: false },
                y: { drawAxis: false }
            },
        });
        this.graphDiv.style.height = options.stackHeight + "px";

        const btnDiv = document.createElement("div");
        btnDiv.className = "btnDiv";
        wrapper.appendChild(btnDiv);
        
        this.upBtn.innerHTML = "↑";
        this.upBtn.className = "button";
        this.upBtn.addEventListener("click", this.shiftUp.bind(this), false);
        btnDiv.appendChild(this.upBtn);

        this.downBtn.innerHTML = "↓";
        this.downBtn.className = "button";
        this.downBtn.addEventListener("click", this.shiftDown.bind(this), false);
        btnDiv.appendChild(this.downBtn);
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

    shiftUp(event) {
        let target = this;
        let maxDiff = -1000;
        for (let graph of stackGraphCtr.graphs) {
            const diff = graph.style.order - this.style.order;
            const visible = !(graph.style.display == "none");
            if (diff < 0 && diff > maxDiff && visible) {
                maxDiff = diff;
                target = graph;
            }   
        }
        const old = this.style.order;
        this.style.order = target.style.order;
        target.style.order = old;
    }

    shiftDown(event) {
        let target = this;
        let maxDiff = 1000;
        for (let graph of stackGraphCtr.graphs) {
            const diff = graph.style.order - this.style.order;
            const visible = !(graph.style.display == "none");
            if (diff > 0 && diff < maxDiff && visible) {
                maxDiff = diff;
                target = graph;
            }
        }
        const old = this.style.order;
        this.style.order = target.style.order;
        target.style.order = old;
    }

    get name() {
        return this.dygraph.getLabels()[1];
    }

    set name(name) {
        this.dygraph.updateOptions({
            labels: ["Time", name]
        });
    }
}