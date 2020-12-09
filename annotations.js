class AnnotationContainer extends Collapsible {
    table = document.createElement("table");

    constructor() {
        super();
        this.collapseBtn.innerHTML = "Annotations";

        const header = this.table.createTHead();
        const row = header.insertRow();
        const num = document.createElement("th");
        row.appendChild(num);
        const series = document.createElement("th");
        row.appendChild(series);
        const time = document.createElement("th");
        row.appendChild(time);
        const val = document.createElement("th");
        row.appendChild(val);
        num.innerHTML = "#";
        series.innerHTML = "Series";
        time.innerHTML = "Time";
        val.innerHTML = "Voltage";
        this.table.createTBody();

        this.contentDiv.appendChild(this.table);
    }

    // Delete current table body and re-create it with given values
    update(annotations) {
        annotations.sort((a, b) => (a.shortText > b.shortText) ? 1 : -1);
        this.table.removeChild(this.table.getElementsByTagName("tbody")[0]);
        const body = this.table.createTBody();

        for (let ann of annotations) {
            const row = body.insertRow();
            const num = row.insertCell();
            const series = row.insertCell();
            const time = row.insertCell();
            const val = row.insertCell();
            num.innerHTML = ann.shortText;
            series.innerHTML = ann.series;
            time.innerHTML = formatTime(Number(ann.x));
            val.innerHTML = Number(ann.text).toFixed(3);
        }
    }
}