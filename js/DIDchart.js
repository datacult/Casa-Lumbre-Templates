function didchart(data, start_date, control_city, variance_type) {

    // Define the div for the tooltip
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    // margins for SVG
    const margin = {
        left: 40,
        right: 40,
        top: 40,
        bottom: 80
    }

    // responsive width & height
    const svgWidth = 1200
    const svgHeight = svgWidth / 2.5

    // helper calculated variables for inner width & height
    const height = svgHeight - margin.top - margin.bottom
    const width = svgWidth - margin.left - margin.right

    // add SVG

    d3.select("svg").remove();

    const svg = d3.select('#didchart')
        .append('svg')
        .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
        .append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    const cities = data.map(d => d.city)

    const control_index = cities.indexOf(control_city)
    const experiment_index = control_index == 0 ? 1 : 0

    //keys to use as dates
    let keys = Object.keys(data[0])
    const keys_to_exclude = ["city"]
    let dates = keys.filter(d => keys_to_exclude.indexOf(d) == -1)

    // const dates = ['Generosity', 'Learning', 'Attention', 'Emotion', 'Risk Tolerance', 'Decision Making', 'Effort', 'Fairness', 'Focus']
    let groups = Array.from(new Set(data.map(d => d.group)))
    groups = groups.sort((a, b) => a > b ? 1 : -1)

    // load data

    ////////////////////////////////////
    ////////////// globals /////////////
    ////////////////////////////////////

    const fade = 0.1

    ////////////////////////////////////
    //////////data wrangling////////////
    ////////////////////////////////////

    const dates_before_start = dates.filter(d => new Date(d) < start_date)

    let variance = 0
    if (variance_type == 'maximum') {
        variance = d3.max(dates_before_start.map(d => Math.abs(data[control_index][d] - data[experiment_index][d])))
    } else {
        variance = d3.mean(dates_before_start.map(d => Math.abs(data[control_index][d] - data[experiment_index][d])))
    }

    let wrangled = data.map((d, i) => {
        return {
            name: d.city,
            values: dates.map(m => { return { name: d.city, date: m, value: +d[m], max: +d[m] + variance, min: +d[m] - variance } })
        }

    })

    let normalized = data.map((d, i) => {

        if (d.city == control_city) {
            return {
                name: d.city,
                values: dates.map(m => { return { name: d.city, date: m, value: 0, max: + variance, min: -variance } })
            }
        } else {
            return {
                name: d.city,
                values: dates.map(m => { return { name: d.city, date: m, value: +d[m] - data[control_index][m], max: + variance, min: -variance } })
            }
        }

    })

    console.log(wrangled)


    wrangled.forEach(d => {
        d.values.sort(function (a, b) {
            return dates.indexOf(a.date) - dates.indexOf(b.date);
        });
    })

    normalized.forEach(d => {
        d.values.sort(function (a, b) {
            return dates.indexOf(a.date) - dates.indexOf(b.date);
        });
    })

    let selected_data = wrangled

    d3.select("#normalize").on("change", update)

    ////////////////////////////////////
    //////////////scales////////////////
    ////////////////////////////////////

    // time scale for X axis
    const x = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(dates.map(d => new Date(d))))


    let max = d3.max(wrangled.map(d => {
        return d3.max(d.values, x => x.max)
    }))

    let min = d3.min(wrangled.map(d => {
        return d3.min(d.values, x => x.min)
    }))

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([min, max])

    // colour scales for all lines and legend
    const color = d3.scaleOrdinal()
        .domain(cities)
        .range(['#8B0000', '#68750e'])

    ////////////////////////////////////
    ///////////////axis/////////////////
    ////////////////////////////////////

    // X Axis 
    const xAxis = d3.axisBottom(x)

    // X gridline
    let x_grid = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", 'grid')
        .attr("id", "x-axis")
        .call(xAxis.tickSizeInner(-height))
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    // Y Axis
    const yAxis = d3.axisLeft(y)

    // Y gridline
    let y_grid = svg.append("g")
        .attr("class", 'grid')
        .attr("id", "y-axis")
        .call(yAxis.tickSize(-width))

    ////////////////////////////////////
    ////////// lines & area ////////////
    ////////////////////////////////////

    const area = d3.area()
        .x(d => x(new Date(d.date)))
        .y0(d => y(d.min))
        .y1(d => y(d.max))
        .curve(d3.curveMonotoneX)

    const band = svg.append("g")
        .selectAll("path")
        .data([0])
        .join("path")
        .attr("fill", color(control_city))
        .attr("fill-opacity", 0.2)
        .attr("stroke", color(control_city))
        .attr("stroke-opacity", 0.3)
        .attr("stroke-dasharray", 3)
        .attr("mix-blend-mode", "color-dodge")
        .attr("d", area(wrangled[control_index].values))

    // line generator
    const line = d3.line()
        .x(d => x(new Date(d.date)))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX)

    const stroke = svg.append("g")
        .selectAll(".stroke-path")
        .data(selected_data)
        .join("path")
        .attr("d", d => line(d.values))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("class", "stroke-path");

    const start_line = svg.append("g")
        .selectAll(".start-line")
        .data([''])
        .join("line")
        .attr("x1", d => x(start_date))
        .attr("x2", d => x(start_date))
        .attr("y1", d => 0)
        .attr("y2", d => height)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-dasharray", 3)
        .attr("class", "start-line");


    const path = svg.append("g")
        .selectAll("path")
        .data(selected_data)
        .join("path")
        .attr("d", d => line(d.values))
        .attr("fill", "none")
        .attr("stroke", d => color(d.name))
        .attr("stroke-width", 3)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round");

    const points = svg.append("g")
        .selectAll("circle")
        .data(selected_data.map(d => d.values).flat())
        .join("circle")
        .attr("fill", d => color(d.name))
        .attr('cx', d => x(new Date(d.date)))
        .attr('cy', d => y(d.value))
        .attr('r', d => 5)
        .attr('stroke', 'white')
        .attr('stroke-width', 1)

        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`City: ${d.name}<br>Score: ${d.value}`)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");

            path.attr('opacity', x => x.name == d.name ? 1 : fade)
            points.attr('opacity', x => x.name == d.name ? 1 : fade)
            stroke.attr('opacity', x => x.name == d.name ? 1 : fade)

        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);

            path.attr('opacity', 1)
            points.attr('opacity', 1)
            stroke.attr('opacity', 1)

        })

    function update() {

        if (d3.select("#normalize").property("checked")) {
            console.log('checked')
            selected_data = normalized

            let range = d3.extent(selected_data[experiment_index].values.map(d => d.value))

            y.domain(range)
            yAxis.scale(y)
            y_grid.call(yAxis.tickSize(-width))

            band
                .data([0])
                .attr("d", d => area(normalized[control_index].values))

        } else {
            console.log('unchecked')
            selected_data = wrangled

            y.domain([min, max])
            yAxis.scale(y)
            y_grid.call(yAxis.tickSize(-width))

            band
                .data([0])
                .attr("d", d => area(wrangled[control_index].values))

        }


        stroke
            .data(selected_data)
            .attr("d", d => line(d.values))

        path
            .data(selected_data)
            .attr("d", d => line(d.values))

        points
            .data(selected_data.map(d => d.values).flat())
            .attr('cx', d => x(new Date(d.date)))
            .attr('cy', d => y(d.value))
    }


}
