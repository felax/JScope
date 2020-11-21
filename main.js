let timingParent = new TimingParent();
//let graphParent = new GraphParent();

document.getElementById("showOptions").addEventListener("click", function() {
    let div = document.getElementById("traceOptions");
    console.log(div.style.display);
    if (div.style.display == "block" || div.style == "") {
        div.style.display = "none";
    }
    else {
        div.style.display = "block";
    }
})

document.getElementById("showTimings").addEventListener("click", function() {
    let div = document.getElementById("timingOptions");
    console.log(div.style.display);
    if (div.style.display == "block" || div.style == "") {
        div.style.display = "none";
    }
    else {
        div.style.display = "block";
    }
})

customElements.define('trace-test', Trace);
customElements.define('scope-test', Scope);
customElements.define('graph-test', Graph);

const mainGraph = document.createElement("graph-test");
document.getElementById("left").appendChild(mainGraph);
mainGraph.graph.resize();

const stackSelect = document.getElementById("stackSelect");
document.getElementById("addScopeBtn").addEventListener("click", function(){
    const scope = document.createElement("scope-test");
    document.getElementById("scopeDiv").appendChild(scope);
});
document.getElementById("stackSelect").addEventListener("change", switchDisplayMode)
document.getElementById("stepInput").addEventListener("change", drawMainGraph)