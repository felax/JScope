class TimingContainer extends Collapsible {
    timingDiv = document.createElement("div");

    constructor() {
        super();
        this.collapseBtn.innerHTML = "Timings";
        this.contentDiv.appendChild(this.timingDiv);

        const addTimingBtn = document.createElement("button");
        addTimingBtn.innerHTML = "\u2795";
        addTimingBtn.addEventListener("click", this.addTiming.bind(this));
        this.contentDiv.appendChild(addTimingBtn);
    }

    addTiming() {
        const timing = document.createElement("timing-elem");
        this.timingDiv.appendChild(timing);
    }

    updateSelects(annotations) {
        for (let timing of this.timingDiv.children) {
            timing.updateSelect(annotations);
        }
    }
}

class Timing extends HTMLElement {
    firstSelect = document.createElement("select");
    secondSelect = document.createElement("select");
    result = document.createElement("input");
    
    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        const wrapper = document.createElement('div');

        const nameInput = document.createElement("input");
        nameInput.placeholder = "Timing name...";
        wrapper.appendChild(nameInput);

        this.firstSelect.addEventListener("change", this.updateResult.bind(this), false);
        wrapper.appendChild(this.firstSelect);
        
        this.secondSelect.addEventListener("change", this.updateResult.bind(this), false);
        wrapper.appendChild(this.secondSelect);

        this.result.placeholder = "Select two points...";
        wrapper.appendChild(this.result);

        const rmvBtn = document.createElement("button");
        rmvBtn.innerHTML = "\u2716";
        rmvBtn.addEventListener("click", this.remove.bind(this), false);
        wrapper.appendChild(rmvBtn);

        this.updateSelect(traceCtr.annotations);

        shadow.appendChild(wrapper);
    }

    updateSelect(annotations) {
        let val1 = this.firstSelect.value;
        let val2 = this.secondSelect.value;

        while (this.firstSelect.options.length != 0) {
            this.firstSelect.remove(0);
            this.secondSelect.remove(0);
        }
        const annNames = [];
        for (let annotation of annotations) {
            annNames.push(annotation.shortText);
        }
        annNames.sort((a, b) => a - b);
        for (let name of annNames) {
            let opt1 = document.createElement("option");
            let opt2 = document.createElement("option");
            opt1.text = name;
            opt2.text = name;
            this.firstSelect.add(opt1);
            this.secondSelect.add(opt2);
        }
        this.firstSelect.value = val1;
        this.secondSelect.value = val2;
        this.updateResult();
    }

    updateResult() {
        if (!this.firstSelect.value || !this.secondSelect.value) {
            this.result.value = "";
            return;
        }
        let x1;
        let x2;
        const annotations = traceCtr.annotations;
        for (let anno of annotations) {
            if (anno.shortText == this.firstSelect.value) { x1 = anno.x; }
            if (anno.shortText == this.secondSelect.value) { x2 = anno.x;}
        }
        const diff = x2 - x1;
        const perErr = Math.round((options.step / diff) * 100);
        this.result.value = formatTime(diff) + " (\u00B1 " + perErr + "%)";
    }

    delete() {
        this.remove();
    }
}