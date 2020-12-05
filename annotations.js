class AnnotationContainer extends Collapsible {
    table = document.createElement("table");

    constructor() {
        super();
        this.collapseBtn.innerHTML = "Annotations";

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
        this.contentDiv.appendChild(this.table);
    }

    update(annotations) {
        while (this.table.rows.length > 1) {
            this.table.deleteRow(-1);
        }
        for (let ann of annotations) {
            const row = this.table.insertRow();
            const num = row.insertCell();
            const series = row.insertCell();
            const time = row.insertCell();
            const val = row.insertCell();
            num.innerHTML = ann.shortText;
            series.innerHTML = ann.series;
            time.innerHTML = formatTime(Number(ann.x));
            val.innerHTML = ann.text;
        }
    }
}