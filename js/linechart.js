function linechart(data, update = false, selector = '#linechart') {

    if (data.length > 0) {

        // Define the div for the tooltip
        var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // margins for SVG
        const margin = {
            left: 40,
            right: 40,
            top: 10,
            bottom: 150
        }

        let values_extent = d3.extent(data.map(d => Object.values(d).pop()))

        // responsive width & height
        const svgWidth = 1200 //parseInt(d3.select(selector).style('width'), 10)
        const svgHeight = svgWidth / 2

        // helper calculated variables for inner width & height
        const height = svgHeight - margin.top - margin.bottom
        const width = svgWidth - margin.left - margin.right

        // add SVG

        d3.select("svg").remove();

        const svg = d3.select(selector)
            .append('svg')
            .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
            .append('g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        //keys to use as metrics
        let keys = Object.keys(data[0])
        const keys_to_exclude = ["city", "group"]
        const metrics = keys.filter(d => keys_to_exclude.indexOf(d) == -1)

        // const metrics = ['Generosity', 'Learning', 'Attention', 'Emotion', 'Risk Tolerance', 'Decision Making', 'Effort', 'Fairness', 'Focus']
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

        let summary = groups.map(d => {
            return metrics.map(j => {
                return {
                    group: d,
                    metric: j,
                    value: d3.mean(data.filter(x => x.group == d).map(x => x[j]))
                }
            })
        })

        let wrangled = data.map((d, i) => {
            return {
                name: d.city,
                group: d.group,
                values: metrics.map(m => { return { name: d.city, metric: m, value: d[m], group: d.group } })
            }

        })

        console.log(wrangled)
        console.log(summary)

        //keys to use as metrics
        let dates = metrics

        wrangled.forEach(d => {
            d.values.sort(function (a, b) {
                return dates.indexOf(a.metric) - dates.indexOf(b.metric);
            });
        })

        ////////////////////////////////////
        //////////////scales////////////////
        ////////////////////////////////////

        // time scale for X axis
        const x = d3.scaleTime()
            .range([0, width])
            .domain(d3.extent(dates.map(d => new Date(d))))

        let values = wrangled.map(d => d.values.map(x => parseFloat(x.value))).flat()

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain(d3.extent(values))

        //band scale
        const legend = d3.scaleBand()
            .range([0, width])
            .domain(groups)

        // colour scales for all lines and legend
        const color = d3.scaleOrdinal()
            .domain(groups)
            .range(d3.schemeTableau10)

        ////////////////////////////////////
        ///////////////axis/////////////////
        ////////////////////////////////////

        // X Axis 
        const xAxis = d3.axisBottom(x)

        // X gridline
        svg.append("g")
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
        svg.append("g")
            .attr("class", 'grid')
            .attr("id", "y-axis")
            .call(yAxis.tickSize(-width))

        ////////////////////////////////////
        ////////// lines ///////////////////
        ////////////////////////////////////

        // line generator
        const line = d3.line()
            .x(d => x(new Date(d.metric)))
            .y(d => y(d.value))
            .curve(d3.curveMonotoneX)


        const path = svg.append("g")
            .selectAll("path")
            .data(wrangled)
            .join("path")
            .attr("d", d => line(d.values))
            .attr("fill", "none")
            .attr("stroke", d => color(d.group))
            .attr("stroke-width", 1.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round");


        // let pointsAvg;

        let pointsAvg = svg.append("g")
            .selectAll("circle")
            .data(summary.flat())
            .join("circle")
            .attr('stroke-width', 2)
            .attr('stroke', 'white')
            .attr("fill", d => color(d.group))
            .attr('cx', d => x(new Date(d.metric)))
            .attr('cy', d => y(d.value))
            .attr('r', d => 8)
            .on("mouseover", function (event, d) {

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`Group ${d.group}<br>Average ${d.metric}: ${d.value}`)
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");

                path.attr('opacity', x => x.group == d.group ? 1 : fade)
                points.attr('opacity', x => x.group == d.group ? 1 : fade)
                pointsAvg.attr('opacity', x => x.group == d.group ? 1 : fade)

            })
            .on("mouseout", function () {

                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                path.attr('opacity', 1)
                points.attr('opacity', 1)
                pointsAvg.attr('opacity', 1)
            })

        const points = svg.append("g")
            .selectAll("circle")
            .data(wrangled.map(d => d.values).flat())
            .join("circle")
            .attr("fill", d => color(d.group))
            .attr('cx', d => x(new Date(d.metric)))
            .attr('cy', d => y(d.value))
            .attr('r', d => 3)
            .on("mouseover", function (event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`City: ${d.name}<br>Score: ${d.value}`)
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");

                path.attr('opacity', x => x.name == d.name ? 1 : fade)
                points.attr('opacity', x => x.name == d.name ? 1 : fade)
                pointsAvg.attr('opacity', x => x.group == d.group ? 1 : fade)

            })
            .on("mouseout", function () {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);

                path.attr('opacity', 1)
                points.attr('opacity', 1)
                pointsAvg.attr('opacity', 1)

            })
    }

}
