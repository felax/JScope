class OptionContainer extends Collapsible {
    step = 1e-6;
    stack = false;
    mainHeight = 400;
    stackHeight = 60;

    constructor() {
        super();
        this.collapseBtn.innerHTML = "Options";
        const wrapper = document.createElement("div");
        wrapper.className = "options";

        const stackInput = document.createElement("input");
        stackInput.type = "checkbox";
        stackInput.checked = false;
        stackInput.addEventListener("change", this.changeStack.bind(this));
        const stack = document.createElement("span");
        stack.innerHTML = "Stack: ";
        stack.appendChild(stackInput);
        wrapper.appendChild(stack);

        const stepInput = document.createElement("input");
        stepInput.type = "number";
        stepInput.value = this.step;
        stepInput.step = "any";
        stepInput.addEventListener("change", this.changeStep.bind(this));
        const step = document.createElement("span");
        step.innerHTML = "Step (s/pt): ";
        step.appendChild(stepInput);
        wrapper.appendChild(step);
        
        const mainHeightInput = document.createElement("input");
        this.mainHeightBtn = mainHeightInput;
        mainHeightInput.type = "number";
        mainHeightInput.value = this.mainHeight;
        mainHeightInput.addEventListener("change", this.changeMainHeight.bind(this));
        const mainHeight = document.createElement("span");
        mainHeight.innerHTML = "Main height: ";
        mainHeight.appendChild(mainHeightInput);
        wrapper.appendChild(mainHeight);

        const stackHeightInput = document.createElement("input");
        this.stackHeightBtn = stackHeightInput;
        stackHeightInput.type = "number";
        stackHeightInput.disabled = true;
        stackHeightInput.value = this.stackHeight;
        stackHeightInput.addEventListener("change", this.changeStackHeight.bind(this));
        const stackHeight = document.createElement("span");
        stackHeight.innerHTML = "Stack height: ";
        stackHeight.appendChild(stackHeightInput);
        wrapper.appendChild(stackHeight);

        this.contentDiv.append(wrapper);
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
            this.stackHeightBtn.disabled = false;
            this.mainHeightBtn.disabled = true;
        }
        else {
            activeGraphCtr = mainGraphCtr;
            stackGraphCtr.hide();
            mainGraphCtr.show();
            this.stackHeightBtn.disabled = true;
            this.mainHeightBtn.disabled = false;
        }
    }

    changeMainHeight(event) {
        this.mainHeight = Number(event.target.value);
        mainGraphCtr.graph.setHeight(this.mainHeight);
    }

    changeStackHeight(event) {
        this.stackHeight = Number(event.target.value);
        stackGraphCtr.setHeight(this.stackHeight);
    }
}