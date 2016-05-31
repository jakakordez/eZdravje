
    function dt(d){
    	var patt = /(\d{4})-(\d{2})-(\d{2}).(\d{2}):(\d{2}):(\d{2})/i
    	var res = d.match(patt); 
    	return res[3]+"."+res[2]+"."+res[1]+" "+res[4]+":"+res[5]+":"+res[6];
    }
    function displayChart(data, values){
        // Parse the date / time
        var parseDate = d3.time.format("%d.%m.%Y %H:%M:%S").parse;
        data = data.map(function(m){return {date: parseDate(dt(m.time)), value: m.systolic, valueMax: values[0], valueMin: values[1], valueAvg: values[2]};});
        console.log(data);
        //var data = [{date: parseDate("24-Apr-07"), value: 93.24}, {date: parseDate("25-Apr-07"), value: 94.24}, {date: parseDate("26-Apr-08"), value: 95.24}, {date: parseDate("30-Apr-08"), value: 96.24}];
        
        // Set the dimensions of the canvas / graph
        var margin = {top: 30, right: 20, bottom: 30, left: 50},
            width = 600 - margin.left - margin.right,
            height = 270 - margin.top - margin.bottom;
    
        // Set the ranges
        var x = d3.time.scale().range([0, width]);
        var y = d3.scale.linear().range([height, 0]);
        
        // Define the axes
        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5);
        var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);
        
        // Define the line
        var valueline = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.value); });
            
        // Adds the svg canvas
        var svg = d3.select("#graph")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", 
                      "translate(" + margin.left + "," + margin.top + ")");
                      
        
            x.domain(d3.extent(data, function(d) { return d.date; }));
            y.domain([d3.min(data, function(d) { return d.value-1; }), d3.max(data, function(d) { return d.value+1; })]);
        
            // Add the valueline path.
            svg.append("path")
                .attr("class", "line")
                .attr("d", valueline(data));
        
            // Add the X Axis
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);
        
            // Add the Y Axis
            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);
    }
