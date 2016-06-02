
    function dt(d){
    	var patt = /(\d{4})-(\d{2})-(\d{2}).(\d{2}):(\d{2}):(\d{2})/i
    	var res = d.match(patt); 
    	return res[3]+"."+res[2]+"."+res[1]+" "+res[4]+":"+res[5]+":"+res[6];
    }
    function displayChart(userData, values){
        // Parse the date / time
        var parseDate = d3.time.format("%d.%m.%Y %H:%M:%S").parse;
        
        console.log(values);
        var maximum = values[2];
        var minimum = values[1];
        
        var data = {user: [], avg: [], min: [], max: []};
        for(var i = 0; i < userData.length; i++){
            var parsedDate = parseDate(dt(userData[i].time));
            if(userData[i].systolic > maximum) maximum = userData[i].systolic;
            if(userData[i].systolic < minimum) minimum = userData[i].systolic;
            data.user.push({date: parsedDate, value: userData[i].systolic});
            data.avg.push({date: parsedDate, value: values[0]});
            data.min.push({date: parsedDate, value: values[1]});
            data.max.push({date: parsedDate, value: values[2]});
        }

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
                      
            x.domain(d3.extent(data.user, function(d) { return d.date; }));
            y.domain([minimum-1, maximum+1]);

            // Add the valueline path.
            svg.append("path")
                .attr("class", "line")
                .attr("d", valueline(data.user));
            svg.append("path")
                .attr("class", "line avg")
                .attr("d", valueline(data.avg));
            svg.append("path")
                .attr("class", "line limit")
                .attr("d", valueline(data.min));
            svg.append("path")
                .attr("class", "line limit")
                .attr("d", valueline(data.max));
        
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
