function getRandomColor(min, max) {
    let r = Math.floor(Math.random() * (max - min) + min);
    let g = Math.floor(Math.random() * (max - min) + min);
    let b = Math.floor(Math.random() * (max - min) + min);
    let color = "#" + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    return color;
}

function merge(arrays) {
    let result = [];
    for (let i = 0; i < arrays[0].length; i++) {
        result.push([]);
        for (let arr of arrays) {
            result[i].push(arr[i]);
        }
    }
    return result;
}

function arange(start, stop, step) {
    let result = [];
    while (start < stop) {
        result.push(start);
        start += step;
    }
    console.log(result);
    return result;
}

function formatTime(time) {
    if (Math.abs(time) < 1e-9) {
        return (time * 1e12).toFixed(3) + "ps";
    }
    else if (Math.abs(time) < 1e-6) {
        return (time * 1e9).toFixed(3) + "ns";
    }
    else if (Math.abs(time) < 1e-3) {
        return (time * 1e6).toFixed(3) + "us";
    }
    else if (Math.abs(time) < 1) {
        return (time * 1e3).toFixed(3) + "ms";
    }
    return time.toFixed(2) + " s";
}

function scale(trace, start, stop, step) {
    console.log(start)
    console.log(stop)
    const result = [];
    const drawStart = trace.offset / step;
    const drawEnd = drawStart + trace.data.length * trace.step / step;
    for (let i = start/step; i < stop/step; i++) {
        if (i < drawStart || i >= drawEnd) {
            result.push(null);
        }
        else {
            const idx = Math.round((i - drawStart) * step / trace.step);
            result.push(trace.data[idx]);
        }
    }
    return result;
}

function findClosestSorted(ref, arr) {
    let lastDiff = Math.abs(ref - arr[0]);
    let errDecrease = true;

    for (let i = 1; i < arr.length; i++) {
        const diff = Math.abs(ref - arr[i]);
        if (diff > lastDiff) {
            return arr[i - 1];
        }
        lastDiff = diff;
    }
}

function collapse(event) {
    const content = event.target.nextElementSibling;
    event.target.classList.toggle("active");
    if (content.style.display === "block") {
        content.style.display = "none";
    }
    else {
        content.style.display = "block";
    }
}

const DYGRAPH_CSS = `
<style>
    /**
     * Default styles for the dygraphs charting library.
     */
    
    .dygraph-legend {
        position: absolute;
        font-size: 14px;
        z-index: 10;
        width: 250px;  /* labelsDivWidth */
        /*
        dygraphs determines these based on the presence of chart labels.
        It might make more sense to create a wrapper div around the chart proper.
        top: 0px;
        right: 2px;
        */
        background: white;
        line-height: normal;
        text-align: left;
        overflow: hidden;
    }
    
    /* styles for a solid line in the legend */
    .dygraph-legend-line {
        display: inline-block;
        position: relative;
        bottom: .5ex;
        padding-left: 1em;
        height: 1px;
        border-bottom-width: 2px;
        border-bottom-style: solid;
        /* border-bottom-color is set based on the series color */
    }
    
    /* styles for a dashed line in the legend, e.g. when strokePattern is set */
    .dygraph-legend-dash {
        display: inline-block;
        position: relative;
        bottom: .5ex;
        height: 1px;
        border-bottom-width: 2px;
        border-bottom-style: solid;
        /* border-bottom-color is set based on the series color */
        /* margin-right is set based on the stroke pattern */
        /* padding-left is set based on the stroke pattern */
    }
    
    .dygraph-roller {
        position: absolute;
        z-index: 10;
    }
    
    /* This class is shared by all annotations, including those with icons */
    .dygraph-annotation {
        position: absolute;
        z-index: 10;
        overflow: hidden;
    }
    
    /* This class only applies to annotations without icons */
    /* Old class name: .dygraphDefaultAnnotation */
    .dygraph-default-annotation {
        border: 1px solid black;
        background-color: white;
        text-align: center;
    }
    
    .dygraph-axis-label {
        /* position: absolute; */
        /* font-size: 14px; */
        z-index: 10;
        line-height: normal;
        overflow: hidden;
        color: black;  /* replaces old axisLabelColor option */
    }
    
    .dygraph-axis-label-x {
    }
    
    .dygraph-axis-label-y {
    }
    
    .dygraph-axis-label-y2 {
    }
    
    .dygraph-title {
        font-weight: bold;
        z-index: 10;
        text-align: center;
        /* font-size: based on titleHeight option */
    }
    
    .dygraph-xlabel {
        text-align: center;
        /* font-size: based on xLabelHeight option */
    }
    
    /* For y-axis label */
    .dygraph-label-rotate-left {
        text-align: center;
        /* See http://caniuse.com/#feat=transforms2d */
        transform: rotate(90deg);
        -webkit-transform: rotate(90deg);
        -moz-transform: rotate(90deg);
        -o-transform: rotate(90deg);
        -ms-transform: rotate(90deg);
    }
    
    /* For y2-axis label */
    .dygraph-label-rotate-right {
        text-align: center;
        /* See http://caniuse.com/#feat=transforms2d */
        transform: rotate(-90deg);
        -webkit-transform: rotate(-90deg);
        -moz-transform: rotate(-90deg);
        -o-transform: rotate(-90deg);
        -ms-transform: rotate(-90deg);
    }

</style>
`;

const COLLAPSE_CSS = `
<style>
    .collapsible {
        background-color: #777;
        color: white;
        cursor: pointer;
        padding: 2px;
        width: 100%;
        border: none;
        text-align: left;
        outline: none;
        font-size: 15px;
    }

    .active, .collapsible:hover {
        background-color: #555;
    }

    .content {
        padding: 0 18px;
        display: none;
        overflow: hidden;
        background-color: #f1f1f1;
    }
    .collapsible:after {
        content: "\\02795"; /* Unicode character for "plus" sign (+) */
        font-size: 13px;
        color: white;
        float: right;
        margin-left: 5px;
      }
      
      .active:after {
        content: "\\2796"; /* Unicode character for "minus" sign (-) */
      }
</style>
`;