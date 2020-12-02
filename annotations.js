class AnnotationContainer extends HTMLElement {
    table = document.createElement("table");

    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = `
            <link rel="stylesheet" href="collapsible.css">
            <link rel="stylesheet" href="table.css">
        `;
        const wrapper = document.createElement('div');
        
        const collapseBtn = document.createElement("button");
        collapseBtn.innerHTML = "Timings";
        collapseBtn.className = "collapsible";
        collapseBtn.addEventListener("click", collapse);
        wrapper.appendChild(collapseBtn);

        const content = document.createElement("div");
        content.className = "content";
        
        const header = this.table.createTHead();
        const row = header.insertRow();
        const num = row.insertCell();
        const series = row.insertCell();
        const time = row.insertCell();
        const val = row.insertCell();
        num.innerHTML = "#";
        series.innerHTML = "Series";
        time.innerHTML = "Time";
        val.innerHTML = "Voltage";
        content.appendChild(this.table);
        
        wrapper.appendChild(content);
        shadow.appendChild(wrapper);
    }

    update() {
        console.log("POGGERS")
        while (this.table.rows.length > 1) {
            this.table.deleteRow(-1);
        }
        const annotations = graphCtr.getAnnotations();
        for (let ann of annotations) {
            const row = this.table.insertRow();
            const num = row.insertCell();
            const series = row.insertCell();
            const time = row.insertCell();
            const val = row.insertCell();
            num.innerHTML = ann.shortText;
            series.innerHTML = ann.series;
            time.innerHTML = formatTime(Number(ann.x));
            val.innerHTML = "N/A";
        }
    }
}