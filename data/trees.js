
// Assumes you've included D3 version 4 somewhere above:


// Set up size
var mapWidth = 750;
var mapHeight = 750;

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
var svg = d3.select('body').append('svg')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr('id', 'sf-map');

let plot = d3.select('#sf-map').append('g')

// Add SVG map at correct size, assuming map is saved in a subdirectory called `data`
svg.append('image')
  .attr('width', mapWidth)
  .attr('height', mapHeight)
  .attr('xlink:href', 'data/sf-map.svg');


d3.csv('trees.csv', parseInputRow, loadData);


//37.72954822	-122.3926894

//console.log(projection("37.72954822",	"-122.3926894"))
function loadData(error, treeData){
	if(error) throw error;
	drawTreeMap(treeData);
	console.log(treeData)

}

function drawTreeMap(treeData) {
	let circles = plot.selectAll('circle');
	let updatedCircles = circles.data(treeData, d=> d.id);
	let enterSelection = updatedCircles.enter();
	let newCircles = enterSelection.append('circle')
	.attr('r', 2)
	.attr('cx', function(d) {return projection([d.longitude, d.latitude])[0];}) 
	.attr('cy', function(d) {return projection([d.longitude, d.latitude])[1];})
	.style('fill', 'blue');
	let unselectedCircles = updateCircles.exit();
	updatedCircles.exit().remove(); 




}



function parseInputRow (d) {
        //console.log(d)
        return {
          id: +d.TreeID,
          species: d.qSpecies,
	      siteInfo: d.qSiteInfo,
          address: d.qAddress,
          diameterBH: d.DBH,
          plotSize: d.PlotSize,
	      latitude: +d.Latitude,
          longitude: +d.Longitude,
          geoCoord: [+d.Latitude, +d.Longitude]
        };
      }
