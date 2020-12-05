class MainGraphContainer extends HTMLElement {
    wrapper = document.createElement("div");
    graph = document.createElement("main-graph");

    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        this.wrapper.style.paddingTop = "20px";
        this.wrapper.appendChild(this.graph);
        this.graph.dygraph.updateOptions({
            file: [
                [0,1],
                [1,2],
                [10,3],
                [11,4],
            ],
            labels: ["x", "y"]
        });
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
        this.graph.dygraph.resize();
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
        graph.dygraph.updateOptions({
            labels: ["time", name],
        })
        this.wrapper.appendChild(graph);
        return graph;
    }

    hide() {
        this.wrapper.style.display = "none";
    }

    show() {
        this.wrapper.style.display = "flex";
        const traces = traceCtr.traces;
        this.draw(traces);
        for (let graph of this.graphs) {
            graph.dygraph.resize();
        }
        for (let trace of traces) {
            this.setVisibility(trace.name, trace.visibility);
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

        shadow.innerHTML = `<link rel="stylesheet" href="dygraph.css">`;

        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "row";

        const labelsDiv = document.createElement("div");
        labelsDiv.style.flex = "0 0 200px";
        labelsDiv.style.textAlign = "right";
        this.wrapper.appendChild(labelsDiv);

        this.graphDiv = document.createElement("div");
        this.graphDiv.style.flex = "1 1 50%";
        this.graphDiv.style.position = "relative";
        this.graphDiv.style.height = "400px"
        this.graphDiv.style.width = "2px"
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

    draw(traces, start, stop, step) {
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
        this.graphDiv.style.height = "60px";

        const btnDiv = document.createElement("div");
        btnDiv.style.flex = "0 0 25px";
        btnDiv.style.display = "flex";
        btnDiv.style.flexDirection = "column"
        wrapper.appendChild(btnDiv);
        
        this.upBtn.innerHTML = "↑";
        this.upBtn.style.flex = "1 1";
        this.upBtn.style.display = "none";
        this.upBtn.addEventListener("click", this.shift.bind(this), false);
        btnDiv.appendChild(this.upBtn);

        this.downBtn.innerHTML = "↓";
        this.downBtn.style.flex = "1 1";
        this.downBtn.style.display = "none";
        this.downBtn.addEventListener("click", this.shift.bind(this), false);
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

    shift(event) {
        let above = this;
        let below = this;
        let aboveDiff = -1000;
        let belowDiff = 1000;
        for (let graph of this.graphs) {
            const diff = graph.style.order - this.style.order;
            if (diff > 0 && diff < belowDiff) {
                belowDiff = diff;
                below = graph;
            }
            else if (diff < 0 && diff > aboveDiff) {
                aboveDiff = diff;
                above = graph;
            }   
        }
        if (event.target.innerHTML == "↑") {
            const old = this.style.order;
            this.style.order = above.style.order;
            above.style.order = old;
        }
        else if (event.target.innerHTML == "↓") {
            const old = this.style.order;
            this.style.order = below.style.order;
            below.style.order = old;
        }
    }

    get name() {
        return this.dygraph.getLabels()[1];
    }
}