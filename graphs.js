// Contains the main graph and utility functions
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

// Contains all stack graphs and utility functions
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

    // Update graphs for all given traces
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

    // Return graph coresponding to given name
    getGraph(name) {
        for (let graph of this.graphs) {
            if (graph.name == name) {
                return graph;
            }
        }
        return null;
    }

    // Hide graph if not visible
    // Update graph when shown
    setVisibility(name, show) {
        const graph = this.getGraph(name);
        if (show) {
            graph.style.display = "block";
            graph.draw(traceCtr.getTrace(name), traceCtr.start, traceCtr.stop, options.step);
        }
        else {
            graph.style.display = "none";
        }
    }

    // Delete graph corresponding to given name
    deleteGraph(name) {
        const graph = this.getGraph(name);
        graph.dygraph.destroy();
        graph.remove();
    }

    // Add graph and assign name to it
    addGraph(name) {
        const graph = document.createElement("stack-graph");
        graph.name = name;
        this.wrapper.appendChild(graph);
        return graph;
    }

    // Hide
    hide() {
        this.wrapper.style.display = "none";
    }

    // Show and set visibility
    show() {
        this.wrapper.style.display = "flex";
        const traces = traceCtr.traces;
        for (let trace of traces) {
            this.setVisibility(trace.name, trace.visibility);
        }
    }

    // Swap graph name
    swapName(oldName, newName) {
        const graph = this.getGraph(oldName);
        graph.name = newName;
    }

    // Change height of all graphs
    setHeight(height) {
        const graphs = this.graphs;
        for (let graph of graphs) {
            graph.setHeight(height);
        }
    }

    // Return array of stack graphs
    get graphs() {
        return this.wrapper.children;
    }

    // Return flex order of the lowest graph
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

// Generic dygraph wrapper class
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

    // Add annotation to with trace container
    onPointClick(event, point) {
        const annotations = traceCtr.addAnnotation(point);
        this.dygraph.setAnnotations(annotations);
    }

    // Remove annotation with trace container
    onAnnotationClick(annotation, point, dygraph, event) {
        if (!event.ctrlKey) {
            return;
        }
        const annotations = traceCtr.removeAnnotation(annotation);
        this.dygraph.setAnnotations(annotations);
    }

    // Change div height and resize dygraph
    setHeight(height) {
        this.graphDiv.style.height = String(height) + "px";
        this.dygraph.resize();
    }

    // Normalize and draw given traces
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

// Single graph 
class MainGraph extends Graph {
    constructor() {
        super();
        this.dygraph.updateOptions({
            xlabel: "Time (s)",
            ylabel: "Voltage (V)"
        });
    }
}

// Stack graphs
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

    // Toggle button visibility
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

    // Find closest above graph and swap order
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
    
    // Find closest below graph and swap order
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

    // Return name from labels
    get name() {
        return this.dygraph.getLabels()[1];
    }

    // Set name with labels
    set name(name) {
        this.dygraph.updateOptions({
            labels: ["Time", name]
        });
    }
}