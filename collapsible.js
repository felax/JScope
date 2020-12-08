class Collapsible extends HTMLElement {
    collapseBtn = document.createElement("button");
    contentDiv = document.createElement("div");
    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        shadow.innerHTML = `<link rel="stylesheet" href="collapsible.css">`;
        const wrapper = document.createElement('div');
        
        this.collapseBtn.className = "collapsible";
        this.collapseBtn.addEventListener("click", this.collapse);
        wrapper.appendChild(this.collapseBtn);

        this.contentDiv.className = "content";
        
        wrapper.appendChild(this.contentDiv);
        shadow.appendChild(wrapper);
    }

    collapse(event) {
        const content = event.target.nextElementSibling;
        event.target.classList.toggle("active");
        if (content.style.display === "block") {
            content.style.display = "none";
        }
        else {
            content.style.display = "block";
        }
    }
}