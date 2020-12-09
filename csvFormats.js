/* 
    Create function to parse CSV arrays here. The first "if" line needs to 
    refer to a unique attribute of the format. If two different formats are
    checked for the same thing, problems might arise. See below for function
    structure. 
    Make sure to then add the function in trace.js->scope->loadCSV().
*/

function parseOldTek(csv, traces) {
    if (csv[0][0] != "Record Length") {
        return;
    }
    const step = Number(csv[1][1]);
    const nPoints = Number (csv[0][1]);
    const name = csv[4][0];
    const data = []

    for (let i = 0; i < nPoints; i++) {
        data.push(Number(csv[i][4]));
    }
    const trace = document.createElement("trace-elem");
    trace.data = data;
    trace.name = name;
    trace.step = step;
    trace.info.innerHTML = "" + formatTime(step * data.length) + " " + formatTime(step) + "/pt";
    traces.push(trace);
}

function parseNewTek(csv, traces) {
    if (csv[0][0] != "Model") {
        return;
    }
    const step = Number(csv[8][1]);
    const nPoints = Number(csv[9][1]);
    const nScopes = csv[19].length - 1;

    for (let i = 1; i < nScopes + 1; i++) {
        const name = csv[19][i];
        const data = [];
        for (let j = 21; j < nPoints; j++) {
            data.push(Number(csv[j][i]))
        }
        const trace = document.createElement("trace-elem");
        trace.data = data;
        trace.name = name;
        trace.step = step;
        trace.info.innerHTML = "" + formatTime(step * data.length) + " " + formatTime(step) + "/pt";
        traces.push(trace);
    }
}