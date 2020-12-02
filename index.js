customElements.define('trace-elem', Trace);
customElements.define('scope-elem', Scope);
customElements.define('main-graph', MainGraph);
customElements.define('stack-graph', StackGraph);
customElements.define('timing-elem', Timing);
customElements.define('timing-container', TimingContainer);
customElements.define('graph-container', GraphContainer);
customElements.define('trace-container', TraceContainer);
customElements.define('annotation-container', AnnotationContainer);

const timingCtr = document.getElementById("timings");
const graphCtr = document.getElementById("graphs");
const traceCtr = document.getElementById("traces");
const annoCtr = document.getElementById("annotations");

const mainGraph = document.createElement("main-graph");

graphCtr.graphDiv.appendChild(mainGraph);
mainGraph.graph.resize();
mainGraph.graph.updateOptions({
    file: [
        [0,1],
        [1,2],
        [10,3],
        [11,4],
    ],
    labels: ["x", "y"]
});
