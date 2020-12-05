class OptionContainer extends Collapsible {
    step = 1e-6;
    stack = false;

    constructor() {
        super();
        this.collapseBtn.innerHTML = "Options";

        const stepInput = document.createElement("input");
        stepInput.type = "number";
        stepInput.value = this.step;
        stepInput.step = "any";
        stepInput.addEventListener("change", this.changeStep.bind(this));
        const stepLabel = document.createElement("span");
        stepLabel.innerHTML = " Step (s/pt):";
        this.contentDiv.appendChild(stepLabel);
        this.contentDiv.appendChild(stepInput);

        const stackInput = document.createElement("input");
        stackInput.type = "checkbox";
        stepInput.checked = "false";
        stackInput.addEventListener("change", this.changeStack.bind(this));
        const stackLabel = document.createElement("span");
        stackLabel.innerHTML = " Stack:";
        this.contentDiv.appendChild(stackLabel);
        this.contentDiv.appendChild(stackInput);
        console.log(this.contentDiv.innerHTML)
    }

    changeStep(event) {
        this.step = Number(event.target.value);
        activeGraphCtr.draw(traceCtr.traces);
    }

    changeStack(event) {
        this.stack = event.target.checked;
        if (this.stack) {
            activeGraphCtr = stackGraphCtr;
            mainGraphCtr.hide();
            stackGraphCtr.show();
        }
        else {
            activeGraphCtr = mainGraphCtr;
            stackGraphCtr.hide();
            mainGraphCtr.show();
        }
    }
}