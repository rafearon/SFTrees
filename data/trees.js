
// Assumes you've included D3 version 4 somewhere above:


// Set up size
var mapWidth = 750;
var mapHeight = 750;

var mapDashboardHorzPadding = 20;

/* Keeps track of user-selected centers for radius circles */
var pointA = {lat:0, lon:0};
var pointB = {lat:0, lon:0};

// Default radius values is 20
var radiusA = 20;
var radiusB = 20;

/* Set that contains all common names for all tree types in data set*/
var speciesCommonNames = new Set();
var selectingPoints = false; 

var TREE_DOT_RADIUS = 2;
var SELECT_BTN_TEXT_ON = "Selecting Points of Interest";
var SELECT_BTN_TEXT_OFF = "Select Points of Interest";

var speciesFilter = 'All';
var currData;
var TREE_DATA_STORE;
/* array of tree names displayed */
var treeNameDataDisplayed;
/* set of tree names displayed */
var commonNamesDisplayedSet;



var aText = "Point A Radius: "
var bText = "Point B Radius: "

function isTreeInCircle(selectionCircle, radius, d) {
	circle = projection([selectionCircle.lon, selectionCircle.lat]);
	tree = projection([d.lon, d.lat]);
	distance = Math.sqrt(Math.pow(circle[0] - tree[0], 2) + Math.pow(circle[1] - tree[1], 2));
	if (distance > radius) {
		return false
	}
	return true
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
  .attr('height', mapHeight)
  .attr('xlink:href', 'data/sf-map.svg');


// Set up Dashboard elements
var dashboardData = [{name:"Select Points", selected:false}]

d3.csv('trees.csv', parseInputRow, loadData);


//37.72954822	-122.3926894

//console.log(projection("37.72954822",	"-122.3926894"))
function loadData(error, treeData){
	if(error) throw error;
	TREE_DATA_STORE = treeData;
	drawTreeMap(TREE_DATA_STORE);
    console.log(TREE_DATA_STORE);
    
    // Draw dashboard controls
    var selectPointsBtn = drawSelectPointsBtn(drawDashboard());
    
    d3.selectAll('#selectBtnGroup').on("click", function(d){
        // Button clicked to change select points
        d3.select('#selectBtnRect').attr("fill", "orange");
        d3.select("#selectBtn").text(SELECT_BTN_TEXT_ON);
        resetSelectedPoints();
    })
    //drawSpeciesMenu(treeData);
    addInputCallbacks();
    d3.select("#sf-map").attr("onclick", "clicked(evt)");
    treeNameDataDisplayed = Array.from(speciesCommonNames).sort();
    commonNamesDisplayedSet = new Set(treeNameDataDisplayed);
    displayAllTreeNames();
}


function drawTreeMap(treeData) {
	let circles = plot.selectAll('.TreeDot');
	let updatedCircles = circles.data(treeData, d=> d.id);
	let enterSelection = updatedCircles.enter();
	let newCircles = enterSelection.append('circle')
	.attr('r', TREE_DOT_RADIUS)
	.attr('cx', function(d) {return projection([d.lon, d.lat])[0];}) 
	.attr('cy', function(d) {return projection([d.lon, d.lat])[1];})
	.style('fill', 'green')
    .attr('class', 'TreeDot');
	let unselectedCircles = updatedCircles.exit();
	updatedCircles.exit().remove(); 
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
    var buttonHeight = 40;
    var selectButtonSvg = d3.select('#selectButtonDiv').append('svg')
                .attr('width', 300)
              .attr('height', 100);
    
    var elems = selectButtonSvg.selectAll('g')
        .data(dashboardData)
        .enter()
        .append('g')
        .attr('id', 'selectBtnGroup');

    elems.append('rect')
        .attr('id', 'selectBtnRect')
        .attr('width', 250)
        .attr('height', buttonHeight)
        .attr('fill', 'orange');
        
    return elems.append('text')
        .text(SELECT_BTN_TEXT_ON)
        .attr('id', 'selectBtn')
        .attr("class", "normText")
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
        speciesCommonNames.add(sn[1].trim()); 
        return {
          id: +d.TreeID,
          species: d.qSpecies,
	      siteInfo: d.qSiteInfo,
          address: d.qAddress,
          diameterBH: d.DBH,
          plotSize: d.PlotSize,
	      lat: +d.Latitude,
          lon: +d.Longitude,
          geoCoord: [+d.Latitude, +d.Longitude],
          speciesNames: sn 
        };
      }

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


function onSpeciesMenuInputChange(){
        var input, filter, ul, li, a, i;
    input = document.getElementById("searchInput");
    filterSpeciesMenu(input.value);
}

/* Filters tree names that appear in the dropdown based on what
    is searched 
    StackOverflow Help to make list scrollable:
        https://stackoverflow.com/questions/21998679/css-how-to-make-scrollable-list
    W-3 Tutorial on Filtering list:
        https://www.w3schools.com/howto/howto_js_filter_lists.asp
        
    StackOverflow Help to add/remove list items:
        https://stackoverflow.com/questions/36884886/how-to-add-an-list-item-to-an-existing-list-of-items-in-d3
    */
function filterSpeciesMenu(inputText){
    console.log("filterSpeciesMenu");

    var filter = inputText.toUpperCase();
    
    /* this is ALL tree names, but treeNameDataDisplayed is 
                what's currently displayed*/
    var treeNameData = Array.from(speciesCommonNames);
    
    // we want to edit treeNameDisplayed and filter it to have just names
    // we want, then have d3 append and remove elems based on that.
    
    treeNameDataDisplayed = treeNameData.filter(function(treeName){
        /* only returns names that have the input's value as substring */
       return treeName.toUpperCase().indexOf(filter) > -1; 
    });
    
    /* Checks if the name is in the list of tree names displayed */
    commonNamesDisplayedSet = new Set(treeNameDataDisplayed);
    
    updateSpeciesMenu(treeNameDataDisplayed);
    /* update ui with new tree name data */
    filterChange(TREE_DATA_STORE);
}

/* Displays all the tree names in the menu */
function displayAllTreeNames(){
    var treeList = d3.select("#treeNameList")
        .selectAll('li')
        .data(treeNameDataDisplayed);
        // enter
    treeList.enter()
        .append('li')
        .attr('class', 'treeNameItem')
        .text(function(d){return d})
        .on("click", treeNameClicked);
}

/* Updates treeName data */
function updateSpeciesMenu(newTreeNameData){
    var treeList = d3.select("#treeNameList")
        .selectAll('li')
        .data(newTreeNameData);
    
    // enter
    treeList.enter()
        .append('li')
        .attr('class', 'treeNameItem')
        .text(function(d){return d})
        .on("click", treeNameClicked);
    
    // update
    treeList.text(function(d){return d});
    
    // exit
    treeList.exit().remove();
}

/* Called when a treeName list item is clicked */
function treeNameClicked(treeName){
    console.log(treeName);
    document.getElementById("searchInput").value = treeName;
    filterSpeciesMenu(treeName);
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
            .attr("fill", "blue")
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
            .attr("fill", "blue")
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
  updateRadiusText(radiusA, "PointAText", aText);

    if(pointA.lat !== 0){
        // we have an actual point
        var coords = projection([pointA.lon, pointA.lat]);
        
        var selectedRadi = d3.select('#radCircleA');
        if (selectedRadi.empty()){
            // Need to create new circle
            plot.append("circle")
                .attr("id", "radCircleA")
                .attr("stroke", "blue")
                .attr("fill-opacity", 0.01)
                .attr("fill", "blue")
                .attr('r', newRadius)
                .attr('cx', coords[0]) 
                .attr('cy', coords[1])
        } else{
            selectedRadi.attr('r', newRadius);
        }
     filterChange(TREE_DATA_STORE);
    }
}



function updateRadiusText(radius, pointID, startText) {
	 console.log("triggered");
	 label = document.getElementById(pointID);
     origin = [0,0];
     edge = [radius, 0];

     oCoord = projection.invert(origin);
     eCoord = projection.invert(edge);
     distanceInKM = getDistanceFromLatLonInKm(oCoord[0], oCoord[1], eCoord[0], eCoord[1]);

     label.innerText = startText + distanceInKM.toFixed(2) + " KM";
}



/* Called when input changed for Radius B */
function onRadiusBChange(newRadius){
     radiusB = newRadius;
     updateRadiusText(radiusB, "PointBText", bText);
    if(pointB.lat !== 0){
        // we have an actual point
        var coords = projection([pointB.lon, pointB.lat]);
        
        var selectedRadi = d3.select('#radCircleB');
        if (selectedRadi.empty()){
            // Need to create new circle
            plot.append("circle")
                .attr("id", "radCircleB")
                .attr("stroke", "blue")
                .attr("fill-opacity", 0.01)
                .attr("fill", "blue")
                .attr('r', newRadius)
                .attr('cx', coords[0]) 
                .attr('cy', coords[1])
        } else{
            selectedRadi.attr('r', newRadius);
        }
    filterChange(TREE_DATA_STORE);
    }
}

function resetSelectedPoints(){
    pointA = {lat:0, lon:0};
    pointB = {lat:0, lon:0};
    d3.selectAll('#pointA').remove();
    d3.selectAll('#pointB').remove();
    d3.select('#radCircleA').remove();
    d3.select('#radCircleB').remove();
    filterChange(TREE_DATA_STORE);
}

function saveSelectedPoints(){
    d3.select('#selectBtn').text(SELECT_BTN_TEXT_OFF);
    d3.select('#selectBtnRect').attr("fill", "steelblue");
    onRadiusAChange(document.getElementById('aRadius').value);
    onRadiusBChange(document.getElementById('bRadius').value);
}


function csvFilter(d) {
	pointAMissing = pointA.lat == 0 && pointA.lon == 0;
	pointBMissing = pointB.lat == 0 && pointB.lon == 0;
    
	noCircle = pointAMissing || pointBMissing;
	isInCircle = noCircle || isTreeInCircle(pointA, radiusA, d) && isTreeInCircle(pointB, radiusB, d);
	
    name = d.speciesNames[1];
    isCorrectSpecies = false;
	if (commonNamesDisplayedSet.has(name)) {
		isCorrectSpecies = true;
	}
	return isCorrectSpecies && isInCircle;
}



function filterChange(treeData) {
	currData = treeData.filter(csvFilter);
	drawTreeMap(currData);
}


//Notes for dropdown menu https://stackoverflow.com/questions/25207732/finding-the-user-selected-options-from-a-multiple-drop-down-menu-using-d3 
// https://stackoverflow.com/questions/24193593/d3-how-to-change-dataset-based-on-drop-down-box-selection 
 function parseSpeciesLabel(name) { 
	var splitNames = name.split("::"); 
	latinName = splitNames[0]; 
	commonName = splitNames[1].trim(); 
	//console.log(splitNames); 
	if (latinName === "") { 
		latinName = "Unknown"; 
	} 
	if (commonName === "") { 
		commonName = "Unknown"; 
	} 
	return [latinName, commonName]; 
}



//NOTE: taken from https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}