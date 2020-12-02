class GraphContainer extends HTMLElement {
    graphDiv = document.createElement("div");
    step = 1e-6;
    stack = false;

    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        const wrapper = document.createElement("div");

        const optionDiv = document.createElement("div");
        optionDiv.style.display = "flex";
        optionDiv.style.justifyContent = "center";
        optionDiv.style.gap = "10px";
        wrapper.appendChild(optionDiv);

        const stepInput = document.createElement("input");
        stepInput.type = "number";
        stepInput.value = this.step;
        stepInput.step = "any";
        stepInput.addEventListener("change", this.updateStep.bind(this));
        const stepLabel = document.createElement("span");
        stepLabel.innerHTML = "Step (s/pt): ";
        optionDiv.appendChild(stepLabel);
        optionDiv.appendChild(stepInput);

        const stackInput = document.createElement("input");
        stackInput.type = "checkbox";
        stepInput.checked = "false";
        stackInput.addEventListener("change", this.updateStack.bind(this));
        const stackLabel = document.createElement("span");
        stackLabel.innerHTML = "Stack: ";
        optionDiv.appendChild(stackLabel);
        optionDiv.appendChild(stackInput);

        this.graphDiv.style.display = "flex";
        this.graphDiv.style.flexDirection = "column";
        wrapper.appendChild(this.graphDiv);

        shadow.appendChild(wrapper);
    }

    updateStep(event) {
        this.step = Number(event.target.value);
        const annotations = this.getAnnotations();
        const bounds = traceCtr.getStartEnd();
        let time = arange(bounds.start, bounds.end, this.step)
        if (this.stack) {
            const traces = traceCtr.getTraces();
            for (let trace of traces) {
                trace.graphElem.draw([trace]);
            }
        }
        else {
            mainGraph.draw(traceCtr.getTraces());
        }
        for (let ann of annotations) {
            ann.x = String(findClosestSorted(ann.realX, time));
        }
        this.setAnnotations(annotations);
        timingCtr.updateSelects();
    }

    updateStack(event) {
        this.stack = event.target.checked;
        const annotations = this.getAnnotations(!this.stack);
        const traces = traceCtr.getTraces();
        if (event.target.checked) {
            mainGraph.clear();
            mainGraph.remove();
            for (let trace of traces) {
                this.graphDiv.appendChild(trace.graphElem);
                trace.graphElem.graph.resize();
                trace.graphElem.draw([trace]);
                if (!trace.visibility) {
                    trace.graphElem.style.display = "none";
                }
            }
        }
        else {
            for (let trace of traces) {
                trace.graphElem.clear();
                trace.graphElem.remove();
            }
            this.graphDiv.appendChild(mainGraph);
            mainGraph.graph.resize();
            mainGraph.draw(traceCtr.getTraces());
        }
        this.setAnnotations(annotations);
    }

    getAnnotations(stack = this.stack) {
        let annotations = [];
        if (stack) {
            for (let graphElem of this.graphDiv.children) {
                for (let ann of graphElem.graph.annotations()) {
                    annotations.push(ann);
                }
            }
        }
        else {
            annotations = mainGraph.graph.annotations();
        }
        console.log(annotations)
        return annotations;
    }
    
    setAnnotations(annotations) {
        if (this.stack) {
            for (let graphElem of this.graphDiv.children) {
                const traceName = graphElem.graph.getLabels()[1];
                const traceAnn = [];
                for (let ann of annotations) {
                    if (ann.series == traceName) {
                        traceAnn.push(ann);
                    }
                }
                graphElem.graph.setAnnotations(traceAnn);
            }
        }
        else {
            mainGraph.graph.setAnnotations(annotations);
        }
        annoCtr.update();
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

        shadow.innerHTML = DYGRAPH_CSS;

        this.wrapper.style.position = "relative";
        this.wrapper.style.display = "flex";
        this.wrapper.style.flexDirection = "row";

        const labelsDiv = document.createElement("div");
        labelsDiv.style.flex = "0 0 150px";
        labelsDiv.style.textAlign = "right";
        this.wrapper.appendChild(labelsDiv);

        this.graphDiv = document.createElement("div");
        this.graphDiv.style.flex = "1 1 50%";
        this.graphDiv.style.position = "relative";
        this.graphDiv.style.height = "400px"
        this.graphDiv.style.width = "2px"
        this.wrapper.appendChild(this.graphDiv);

        shadow.appendChild(this.wrapper);
        this.graph = new Dygraph(this.graphDiv, [[0,0], [1,1]], 
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
                annotationClickHandler: this.onAnnotationClick.bind(this),
                pointClickCallback: this.onPointClick.bind(this),
            }
        );
    }

    onPointClick(event, point) {
        const numbers = [];
        for (let ann of graphCtr.getAnnotations()) {
            numbers.push(Number(ann.shortText));
        }
        let i = 0;
        while (numbers.includes(i)) { i++; }
        let annotations = this.graph.annotations();
        let annotation = {
            series: point.name,
            x: String(point.xval),
            shortText: String(i),
            realX: point.xval
        }
        annotations.push(annotation);
        this.graph.setAnnotations(annotations);
        timingCtr.updateSelects();
        annoCtr.update();
    }

    onAnnotationClick(annotation, point, dygraph, event) {
        if (!event.ctrlKey) {
            return;
        }
        let annotations = this.graph.annotations();
        for (let i = 0; i < annotations.length; i++) {
            if (annotations[i].shortText == annotation.shortText) {
                annotations.splice(i, 1);
                break;
            }
        }
        this.graph.setAnnotations(annotations);
        timingCtr.updateSelects();
        annoCtr.update();
    }

    draw(traces) {
        const bounds = traceCtr.getStartEnd();
        const dataArrays = [];
        const time = arange(bounds.start, bounds.end, graphCtr.step);
        dataArrays.push(time);
        const colors = [];
        const visibility = [];
        const labels = ["Time"];
        for (let trace of traces) {
            const scaled = scale(trace, bounds.start, bounds.end, graphCtr.step)
            dataArrays.push(scaled);
            colors.push(trace.color);
            visibility.push(trace.visibility);
            labels.push(trace.name);
        }
        const data = merge(dataArrays);
        this.graph.updateOptions({
            file: data,
            labels: labels,
            colors: colors,
            visibility: visibility
        });
    }

    clear() {
        this.graph.updateOptions({
            file: [],
            labels: [],
            colors: [],
            visibility: []
        });
        this.graph.setAnnotations([]);
    }
}

class MainGraph extends Graph {
    constructor() {
        super();
        this.graph.updateOptions({
            xlabel: "Time (s)",
            ylabel: "Voltage (V)"
        });
    }
}

class StackGraph extends Graph {
    constructor() {
        super();
        this.wrapper.addEventListener("mouseover", this.showBtns.bind(this));
        this.wrapper.addEventListener("mouseout", this.showBtns.bind(this));
        this.graph.updateOptions({
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
        this.wrapper.appendChild(btnDiv);
        
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
        const graphs = graphCtr.graphDiv.children;
        for (let graph of graphs) {
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
}