
// Assumes you've included D3 version 4 somewhere above:


// Set up size
var mapWidth = 750;
var mapHeight = 750;

var mapDashboardHorzPadding = 20;

var pointA = {lat:0, long:0};
var pointB = {lat:0, long:0};

// Default radius values is 20
var radiusA = 20;
var radiusB = 20;

var speciesCommonNames = new Set();
var selectingPoints = false; 

function isTreeInCircle(selectionCircle, tree) {
	
}




// Set up projection that the map is using
var projection = d3.geoMercator()
    .center([-122.433701, 37.767683]) // San Francisco, roughly
    .scale(225000)
    .translate([mapWidth / 2, mapHeight / 2]);

// This is the mapping between <longitude, latitude> position to <x, y> pixel position on the map
// projection is a function and it has an inverse:
// projection([lon, lat]) returns [x, y]
// projection.invert([x, y]) returns [lon, lat]



// Add an SVG element to the DOM
var svg = d3.select('#mapDiv').append('svg')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr('id', 'sf-map');

var dashboardSvg = d3.select('#dashboardContainer').append('svg')
  .attr('width', 200 + mapDashboardHorzPadding)
  .attr('height', mapHeight)
  .attr('x', mapWidth + 10)
  .attr('y', -200)
  .attr('id', 'dashboard');

let plot = d3.select('#sf-map').append('g');


// Add SVG map at correct size, assuming map is saved in a subdirectory called `data`
svg.append('image')
  .attr('width', mapWidth)
  .attr('height', mapHeight- 100)
  .attr('xlink:href', 'data/sf-map.svg');


// Set up Dashboard elements
var dashboardData = [{name:"Select Points", selected:false}]

d3.csv('trees.csv', parseInputRow, loadData);


//37.72954822	-122.3926894

//console.log(projection("37.72954822",	"-122.3926894"))
function loadData(error, treeData){
	if(error) throw error;
	drawTreeMap(treeData);
    console.log(treeData);
    
    // Draw dashboard controls
    var selectPointsBtn = drawSelectPointsBtn(drawDashboard());
    
    d3.selectAll('#selectBtn').on("click", function(d){
        // Button clicked to change select points
        d3.select('#selectBtn').attr("fill", "orange");
        resetSelectedPoints();
    })
    drawSpeciesMenu(treeData);
    addInputCallbacks();
    
}

function drawTreeMap(treeData) {
	let circles = plot.selectAll('circle');
	let updatedCircles = circles.data(treeData, d=> d.id);
	let enterSelection = updatedCircles.enter();
	let newCircles = enterSelection.append('circle')
	.attr('r', 1)
	.attr('cx', function(d) {return projection([d.longitude, d.latitude])[0];}) 
	.attr('cy', function(d) {return projection([d.longitude, d.latitude])[1];})
	.style('fill', 'blue');
	let unselectedCircles = updatedCircles.exit();
	updatedCircles.exit().remove(); 
    
    d3.select("#sf-map").attr("onclick", "clicked(evt)");
}

function drawDashboard(){
    /*
    StackOverflow post that helped find how to append text to SVG element
    https://stackoverflow.com/questions/20644415/d3-appending-text-to-a-svg-rectangle
    */
    
    return elems = dashboardSvg.selectAll('g')
        .data(dashboardData)
        .enter()
        .append('g');
}

function drawSelectPointsBtn(elems){
    var buttonHeight = 25;

    elems.append('rect')
        .attr('id', 'selectBtn')
        .attr('width', 120)
        .attr('height', buttonHeight)
        .attr('fill', 'orange');
        
    return elems.append('text')
        .text("Select Points")
        .attr('id', 'selectBtn')
        .attr('x', 10)
        .attr('y', buttonHeight/2+5)
        .attr('width', 100)
        .attr('height', 100)
        .attr('font-family', "Arial")
        .attr('fill', 'white');
}

function parseInputRow (d) {
        //console.log(d)
        sn = parseSpeciesLabel(d.qSpecies); 
        speciesCommonNames.add(sn[1]); 
        return {
          id: +d.TreeID,
          species: d.qSpecies,
	      siteInfo: d.qSiteInfo,
          address: d.qAddress,
          diameterBH: d.DBH,
          plotSize: d.PlotSize,
	      latitude: +d.Latitude,
          longitude: +d.Longitude,
          geoCoord: [+d.Latitude, +d.Longitude],
          speciesNames: sn 
        };
      };

function addInputCallbacks(){
    /*
    Page that helped figure out how to get input values from
        input tag: 
        http://bl.ocks.org/d3noob/10632804
    */
    d3.select("#aRadius")
        .on('input', function() {
            onRadiusAChange(this.value);                
        });
    d3.select("#bRadius")
        .on('input', function() {
            onRadiusBChange(this.value);
        });
}

/* Finding coordinates where clicked, helped by StackOverflow 
https://stackoverflow.com/questions/29261304/how-to-get-the-click-coordinates-relative-to-svg-element-holding-the-onclick-lis*/
function clicked(evt){
    if(pointA.lat==0){
        var e = evt.target;
        var dim = e.getBoundingClientRect();
        var x = evt.clientX - dim.left;
        var y = evt.clientY - dim.top;

        plot.append("circle")
            .attr("id", "pointA")
            .attr("fill", "red")
            .attr('r', 3)
            .attr('cx', x) 
            .attr('cy', y);
        var coords = projection.invert([x, y]);
        pointA.lat = coords[1];
        pointA.lon = coords[0];

    } else if(pointB.lat == 0){
        var e = evt.target;
        var dim = e.getBoundingClientRect();
        var x = evt.clientX - dim.left;
        var y = evt.clientY - dim.top;

        plot.append("circle")
            .attr("id", "pointB")
            .attr("fill", "red")
            .attr('r', 3)
            .attr('cx', x) 
            .attr('cy', y);
        
        var coords = projection.invert([x, y]);
        pointB.lat = coords[1];
        pointB.lon = coords[0];
        
        // turn the button back to unselected because points are chosen
        saveSelectedPoints();
    } else {
        
    }
}  

/* Called when input changed for Radius A */
function onRadiusAChange(newRadius){
  radiusA = newRadius;
    if(pointA.lat !== 0){
        // we have an actual point
        var coords = projection([pointA.lon, pointA.lat]);
        
        var selectedRadi = d3.select('#radCircleA');
        if (selectedRadi.empty()){
            // Need to create new circle
            plot.append("circle")
                .attr("id", "radCircleA")
                .attr("stroke", "green")
                .attr("fill-opacity", 0.4)
                .attr("fill", "green")
                .attr('r', newRadius)
                .attr('cx', coords[0]) 
                .attr('cy', coords[1])
        } else{
            selectedRadi.attr('r', newRadius);
        }
    }
}

/* Called when input changed for Radius B */
function onRadiusBChange(newRadius){
     radiusB = newRadius;
    if(pointB.lat !== 0){
        // we have an actual point
        var coords = projection([pointB.lon, pointB.lat]);
        
        var selectedRadi = d3.select('#radCircleB');
        if (selectedRadi.empty()){
            // Need to create new circle
            plot.append("circle")
                .attr("id", "radCircleB")
                .attr("stroke", "green")
                .attr("fill-opacity", 0.4)
                .attr("fill", "green")
                .attr('r', newRadius)
                .attr('cx', coords[0]) 
                .attr('cy', coords[1])
        } else{
            selectedRadi.attr('r', newRadius);
        }
    }
}

function resetSelectedPoints(){
    pointA = {lat:0, lon:0};
    pointB = {lat:0, lon:0};
    d3.selectAll('#pointA').remove();
    d3.selectAll('#pointB').remove();
    d3.select('#radCircleA').remove();
    d3.select('#radCircleB').remove();
}

function saveSelectedPoints(){
    d3.select('#selectBtn').attr("fill", "steelblue");
    onRadiusAChange(document.getElementById('aRadius').value);
    onRadiusBChange(document.getElementById('bRadius').value);
}


function drawSpeciesMenu(treeData) { 
	menu = d3.select('body').append('select').attr("name", "SpeciesMenu"); 
	names = Array.from(speciesCommonNames); 
	names.sort(); 
	names.unshift("All") 
	for (name of names) { 
		menu.append('option').attr("value", name).text(name); 
	} 
	menu.on('change', function() { 
		let currSelection = d3.select("select").property('value'); 
		let currData; 
		if (currSelection === "All") { 
			currData = treeData; 
		} else { 
			currData = treeData.filter(d => d.speciesNames[1] === currSelection); 
		} 
		let circles = plot.selectAll('circle'); 
		let updatedCircles = circles.data(currData, d=> d.id); 
		let enterSelection = updatedCircles.enter(); 
		let newCircles = enterSelection.append('circle') 
			.attr('r', 2) 
			.attr('cx', function(d) {return projection([d.longitude, d.latitude])[0];})  
			.attr('cy', function(d) {return projection([d.longitude, d.latitude])[1];}) 
			.style('fill', 'blue'); 
		let unselectedCircles = updatedCircles.exit(); 
		updatedCircles.exit().remove();  
	}); 
 
}


//Notes for dropdown menu https://stackoverflow.com/questions/25207732/finding-the-user-selected-options-from-a-multiple-drop-down-menu-using-d3 
// https://stackoverflow.com/questions/24193593/d3-how-to-change-dataset-based-on-drop-down-box-selection 
 function parseSpeciesLabel(name) { 
	var splitNames = name.split("::"); 
	latinName = splitNames[0]; 
	commonName = splitNames[1]; 
	//console.log(splitNames); 
	if (latinName === "") { 
		latinName = "Unknown"; 
	} 
	if (commonName === "") { 
		commonName = "Unknown"; 
	} 
	return [latinName, commonName]; 
}