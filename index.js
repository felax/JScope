customElements.define('option-container', OptionContainer);
customElements.define('trace-elem', Trace);
customElements.define('scope-elem', Scope);
customElements.define('main-graph', MainGraph);
customElements.define('stack-graph', StackGraph);
customElements.define('timing-elem', Timing);
customElements.define('timing-container', TimingContainer);
customElements.define('main-graph-container', MainGraphContainer);
customElements.define('stack-graph-container', StackGraphContainer);
customElements.define('trace-container', TraceContainer);
customElements.define('annotation-container', AnnotationContainer);

const options = document.getElementById("options");
const timingCtr = document.getElementById("timings");
const mainGraphCtr = document.getElementById("main");
const stackGraphCtr = document.getElementById("stack");
const traceCtr = document.getElementById("traces");
const annotationCtr = document.getElementById("annotations");

let activeGraphCtr = mainGraphCtr;