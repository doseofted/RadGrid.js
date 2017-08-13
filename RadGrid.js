//"use strict";
/*
RadGrid: The Aesthetic Simulator?
--------------------------------------------------------------------------------
A grid that distorts because it can. The purpose of this little web toy is so
that I can gain programming experience (especially with animation and multitouch
input), learn to manage large amounts of code, use comments in a way that others
can easily understand (but later decided not to share), and make a cool thing
for my website with the goal of using only browser APIs.

Copyright (c) 2016 Ted Klingenberg

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

//NOTE: Use Closure compiler, turn off strict mode, and turn off .devMode before publishing
//RANDOM THOUGHT: Could this grid be used as basis of simple real-time image distortion? No. Probably not.

//use a constructor to add properties to RadGrid
var RadGrid = function (parameter) {
	//the constructor has one argument which is an object that holds properties
	//example usage with all possible properties will be at bottom of this file
	//test to see if the object of parameters were given
	if (typeof parameter !== "object") {
		parameter = {};
	}
	//test if user supplied a canvas element, if not then create one
	if (parameter.canvas !== undefined && parameter.canvas.nodeName == "CANVAS") {
		//set the RadGrid canvas to the given element
		this.canvas = parameter.canvas;
	} else if (document.getElementById(parameter.canvas) !== null) {
		this.canvas = document.getElementById(parameter.canvas);
	} else {
		//if element is not found, create a new canvas and append to body
		this.canvas = document.createElement("canvas");
		document.body.appendChild(this.canvas);
	}
	//if canvas is a direct child of body, then set to the width and height of window
	//otherwise set to parent's width and height
	if (this.canvas.parentNode.nodeName == "BODY") {
		//if canvas's parent is body, set to window size and remove default margins of page
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		document.body.style.margin = "0";
	} else {
		//if canvas's parent is any element except body, fill that element by using the same width and height of parent
		//NOTE: if parent element changes width or height, resizeCanvas must be called
		//console.log(window.getComputedStyle(this.canvas.parentNode).getPropertyValue("width"));
		this.canvas.width = window.getComputedStyle(this.canvas.parentNode).getPropertyValue("width").replace("px", "");
		this.canvas.height = window.getComputedStyle(this.canvas.parentNode).getPropertyValue("height").replace("px", "");
		this.canvas.parentNode.style.padding = "0";
		this.canvas.parentNode.style.margin = "0";
	}
	//write CSS that will let canvas appear in container without being distorted
	//NOTE: If canvas does not appear, another element has higher z-index.
	//fix by using this.canvas.style.zIndex = 9999;
	this.canvas.style.width = "100%";
	this.canvas.style.height = "100%";
	this.canvas.style.position = "absolute";
	this.canvas.style.top = 0;
	this.canvas.style.left = 0;
	this.canvas.style.zIndex = 1;
	this.canvas.style.cursor = "move";
	this.cursorStateAsClass = true; //can be used if you want browser-specific cursors
	this.canvas.className = "grab";
	//initialize use of canvas
	this.draw = this.canvas.getContext("2d");
	//NOTE: bind methods that are called through other methods' parameters (will also allow me to remove event listeners)
	//bind animation loop and resizeCanvas function
	this.animateLoopBound = this.animateLoop.bind(this);
	this.resizeCanvasBound = this.resizeCanvas.bind(this);
	//add listener to resizeCanvas bound function
	window.addEventListener("resize", this.resizeCanvasBound);
	//bind and attach event listeners for capturing input
	this.interactionCaptureBound = this.interactionCapture.bind(this);
	this.canvas.addEventListener("mousedown", this.interactionCaptureBound);
	this.canvas.addEventListener("touchstart", this.interactionCaptureBound);
	//bind and attach event listeners for changing input position
	this.interactionChangeBound = this.interactionChange.bind(this);
	this.canvas.addEventListener("mousemove", this.interactionChangeBound);
	this.canvas.addEventListener("touchmove", this.interactionChangeBound);
	//bind and attach event listeners for input release
	this.interactionReleaseBound = this.interactionRelease.bind(this);
	this.canvas.addEventListener("mouseup", this.interactionReleaseBound);
	this.canvas.addEventListener("touchend", this.interactionReleaseBound);
	//use a loop for adding simple values to properties, values below are default unless user specifices them
	var propertiesAndValues = [
		["gridSize", 24],               //set distance between each vertex
		["radius", 8],                  //set radius for pulling points
		["numberOfPoints", 24],         //set amount of points to pull
		["speed", 64],                  //set speed (lower is faster, higher is slower)
		["backgroundColor", "#f68cff"], //set background color
		["noBackground", false],        //set background transparency
		["animateBackgroundHue", false],//set whether background should change colors
		["hueLowestValue", 80],         //- set limits on how dark background should become when animated
		["hueHighestValue", 208],       //- set limits on how light background should become when animated
		["hueSpeed", 2],                //- set how much to increment colors on each animation call
		["gridColor", "#fff"],          //set grid color
		["gridThickness", 1],           //set thickness of lines between verticies
		["useCirclesInstead", false],   //draw circles instead of a grid
		["text", "Cool."],              //set text
		["fontFamily", "Arial"],        //set font family
		["makeItalic", true],           //set whether or not font should be italicized
		["makeBold", true],             //set whether or not font should be bold
		["textColor", "#ffffff"],       //set color of text
		["shadowColor", "#000000"],     //set color of text shadow
		["fontSize", 64],               //set size of text
		["lineHeight", 2],              //set distane between lines of text
		["shadowOffset", 2],            //set distance of shadow from text
	];
	//loop through each item in array above
	for (var i = 0; i < propertiesAndValues.length; i++) {
		//test if user supplied a property matching an item in the propertiesAndValues array
		if (parameter[propertiesAndValues[i][0]] === undefined) {
			//if user did not supply property, use the default property
			this[propertiesAndValues[i][0]] = propertiesAndValues[i][1];
		} else {
			//if that property is in propertiesAndValues, test to see if user supplied correct data type
			if (typeof parameter[propertiesAndValues[i][0]] === typeof propertiesAndValues[i][1]) {
				//assign user supplied value to RadGrid object
				this[propertiesAndValues[i][0]] = parameter[propertiesAndValues[i][0]];
			}
		}
	}
	//create hueRGB array for use in .animateHue()
	//assign beginning value as red
	this.hueRGB = [
		this.hueHighestValue,
		this.hueLowestValue,
		this.hueLowestValue
	];
	//use temporary values below to tell if range has been changed in .animateHue()
	this.hueLastSettings = [this.hueLowestValue, this.hueHighestValue];
	//change strength of .resetGrid()
	//set to 1 for default strength, set lower for faster reset, high for slower reset, and 0 to turn off
	this.resetGridStrength = 1;
	//declare how many points should be pulled
	this.pointsToBePulled = new Array(this.numberOfPoints);
	//initialized is false because we have not called .initialize() yet
	this.initialized = false;
	//play by default
	this.pause = false;
	//fillEdge will be used for extending grid off-page long enough that you don't see edges
	this.fillEdge = 0;
	//get the ball rolling
	this.initialize();
	//change devMode to false before releasing (only used for stats.js)
	this.devMode = true;
};

//will remove event listeners and pause animation, only called when no longer needed
RadGrid.prototype.destroy = function () {
	this.playPause(); //pause animation, stop requestAnimationFrame calls
	//window.cancelAnimationFrame(this.animation); //may not even be needed but doesn't hurt
	//remove event listeners
	window.removeEventListener("resize", this.resizeCanvasBound);
	this.canvas.removeEventListener("mousedown", this.interactionCaptureBound);
	this.canvas.removeEventListener("touchstart", this.interactionCaptureBound);
	//bind and attach event listeners for changing input position
	this.interactionChangeBound = this.interactionChange.bind(this);
	this.canvas.removeEventListener("mousemove", this.interactionChangeBound);
	this.canvas.removeEventListener("touchmove", this.interactionChangeBound);
	this.canvas.removeEventListener("mouseup", this.interactionReleaseBound);
	this.canvas.removeEventListener("touchend", this.interactionReleaseBound);
};

//initialize the array of verticies for use (can be called again if this.gridSize, radius, or window size is changed)
RadGrid.prototype.initialize = function () {
	//fill the canvas horizontally with points separated by distance of this.gridSize
	var horizontalVertices = Math.ceil(this.canvas.width  / this.gridSize) + 1;
	//Add the radius (whole numbers only) to horizontalVertices, which will help extend grid (this.fillEdge) passed the page
	//NOTE: Using Math.round() below will make decimals into whole numbers (because you cannot have half of a vertex)
	//NOTE: Dividiing and multiplying by 2 while also using rounding will make the number even (useful for this.fillEdge)
	horizontalVertices    += Math.round(this.radius / 2) * 2;
	//fill the canvas vertically with points separated by distance of this.gridSize
	var verticalVertices   = Math.ceil(this.canvas.height / this.gridSize) + 1;
	//Add the radius (whole numbers only) to verticalVertices
	verticalVertices      += Math.round(this.radius / 2) * 2;
	//this.verticies[] will eventually hold all verticies on page and their positions
	//declare first row of verticies in this.verticies[]
	this.verticies         = new Array(horizontalVertices);
	//since this.verticies[] will be changing constantly, record orignal positions also (for use with this.resetGrid())
	this.originalVerticies = new Array(horizontalVertices);
	//assign and x and y coordinate to every vertex on page
	for (var h = 0; h < this.verticies.length; h++) { //"h" for horizontal
		//create a column of new verticies for each item in row
		this.verticies[h] =         new Array(verticalVertices);
		this.originalVerticies[h] = new Array(verticalVertices);
		for (var v = 0; v < this.verticies[h].length; v++) { //"v" for vertical
			//assign position (in pixels) to each vertex in array
			this.verticies[h][v] =         [h * this.gridSize, v * this.gridSize];
			this.originalVerticies[h][v] = [h * this.gridSize, v * this.gridSize];
		}
	}
	/*console.log(window.innerWidth + " x " + window.innerHeight);
	console.log("W: " + horizontalVertices + ", H: ", verticalVertices);
	console.log(this.verticies);*/
	//if .initialize() has not been called before, then start the animation loop
	if (this.initialized === false) {
		this.animation = window.requestAnimationFrame(this.animateLoopBound);
	}
	//if .initialize() has already been called, don't start another animation
	this.initialized = true;
};

//stroke paths between verticies
RadGrid.prototype.drawGrid = function () {
	//define the style of line
	this.draw.strokeStyle = this.gridColor;
	this.draw.lineWidth = this.gridThickness;
	//draw horizontal lines
	//1. start by going through vertical lines (this.verticies[0].length == verticalVertices)
	for (var a = 0; a < this.verticies[0].length; a++) { // <-- can use verticies[0] because verticies[*] are all the same length
		this.draw.moveTo(0, 0);
		this.draw.beginPath();
		//2. then scan through horizontal lines
		for (var i = 0; i < this.verticies.length; i++) {
			//3. draw a line between all points on horizontal line
			this.draw.lineTo(this.verticies[i][a][0], this.verticies[i][a][1]);
			//console.log("Point drawn horizontally: " + this.verticies[i][a][0] + "," + this.verticies[i][a][1]);
		}
		//4. draw the line and then close it
		this.draw.stroke();
		this.draw.closePath();
	}
	//draw vertical lines
	//1. start by going through horizontal lines (this.verticies.length == horizontalVertices)
	for (var b = 0; b < this.verticies.length; b++) {
		this.draw.moveTo(0, 0);
		this.draw.beginPath();
		//2. then scan through vertical lines
		for (var c = 0; c < this.verticies[0].length; c++) {
			//3. draw a line between all points on vertical line
			this.draw.lineTo(this.verticies[b][c][0], this.verticies[b][c][1]);
			//console.log("Point drawn vertically: " + this.verticies[b][c][0] + "," + this.verticies[b][c][1]);
		}
		//4. draw the line and then close it
		this.draw.stroke();
		this.draw.closePath();
	}
};

//just a quick fun alternative to drawing a grid
//instead, draw circles for each vertex
RadGrid.prototype.drawCircles = function () {
	//define the fill style of the circle
	this.draw.fillStyle = this.gridColor;
	//1. start by going through vertical lines (this.verticies[0].length == verticalVertices)
	for (var a = 0; a < this.verticies[0].length; a++) { // <-- can use verticies[0] because verticies[*] are all the same length
		//2. then scan through horizontal lines
		for (var i = 0; i < this.verticies.length; i++) {
			this.draw.beginPath();
			//3. draw a circle for each point
			this.draw.arc(
				this.verticies[i][a][0],
				this.verticies[i][a][1],
				this.gridThickness,
				0,
				2 * Math.PI
			);
			//draw the circle
			this.draw.fill();
			this.draw.closePath();
		}
	}
};

RadGrid.prototype.resizeCanvas = function () {
	if (this.canvas.parentNode.nodeName == "BODY") {
		//if the canvas is a child of <body> then set width and height to body
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	} else {
		//if canvas is child of any other element, set to width and height of parent
		this.canvas.width = window.getComputedStyle(this.canvas.parentNode).getPropertyValue("width").replace("px", "");
		this.canvas.height = window.getComputedStyle(this.canvas.parentNode).getPropertyValue("height").replace("px", "");
	}
	//re-initialize grid so that user does not see edge of grid (will also remove distortions)
	if (this.pause === true) {
		//NOTE: pause does not support resizing the window, not worth the time to fix initialize function
		//just draw next frame even though the edge of grid wil be visible
		this.animateLoop();
	} else {
		//if not paused, just initialize the grid
		this.initialize();
	}
};

//use this function to record coordinates of mouse or touch event and find nearest vertex to device that interacted with it
RadGrid.prototype.interactionPosition = function (x, y, gridSizeReference, radiusReference, boundingClientRect) {
	//record the current position of fingers on the screen in relation to the canvas element
	//NOTE: this will be updated on every touchmove or mousemove
	this.currentCoordinates = [ //should probably rename lastRecordedCoords
		x - boundingClientRect.left,
		y - boundingClientRect.top
	];
	//record the original position of fingers on screen in relation to canvas element
	this.originalCoordinates = [
		this.currentCoordinates[0],
		this.currentCoordinates[1]
	];
	//divide the coordinates by the grid size to get closest vertex to cursor or finger,
	//then add half of the radius to account for grid offset
	this.nearestPointOnGrid = [
		Math.round(this.currentCoordinates[0] / gridSizeReference) + Math.round(radiusReference / 2),
		Math.round(this.currentCoordinates[1] / gridSizeReference) + Math.round(radiusReference / 2)
	];
	//console.log("Finger or mouse at: " + this.nearestPointOnGrid + " on the grid.");
	//cannot create new pull point in this function because its "this" value is different
};

//detect all touches or mouse events on canvas element
RadGrid.prototype.interactionCapture = function (event) {
	if (this.pause === false) {
		//prevent scrolling over top of canvas element if touchscreen and text selection if mouse
		//event.preventDefault();
		//variable below will be used later
		var boundingClientRect;
		//detect if event is from the mouse or a finger
		if (event.type === "touchstart") {
			//test if interactionArray has been created (if no finger has touched screen, it will be undefined)
			if (typeof this.interactionArray === "undefined") {
				//create array if it doesn't exist and create object for each finger
				this.interactionArray = new Array(event.targetTouches.length);
				for (var i = 0; i < this.interactionArray.length; i++) {
					//set touchEnded to true so loop below will create new touch (will be set to false when initialized)
					this.interactionArray[i] = {touchEnded: true};
				}
			}
			//if there are more touches than there were before, create new item(s) in array for finger(s) on screen
			//NOTE: No need for loop to push multiple touches because touchstart is called everytime a new finger is on screen
			if (this.interactionArray.length < event.targetTouches.length) {
				//set touchEnded to true to initialize object (initialization will also change touchEnded back to false)
				this.interactionArray.push({touchEnded: true});
			}
			//these variables will be used in loop, declare above loop to avoid redeclaring over and over again
			var sameID; var noID;
			//loop through interactionArray (recorded touches) and test with each touch on screen
			for (var recordedTouches = 0; recordedTouches < this.interactionArray.length; recordedTouches++) {
				//now loop through fingers currently on screen
				for (var currentTouches = 0; currentTouches < event.targetTouches.length; currentTouches++) {
					//find out if interactionArray has been used yet (test if items in array have been created yet)
					//NOTE: OR condition below: Always use noID if browser randomly assigns value to .identifier and then increments by 1 (to support iOS devices)
					//Make sure identifier is greater than 10 because users on Chrome-based browsers will likely not put more than 10 fingers on screen
					noID = typeof this.interactionArray[recordedTouches].identity === "undefined" || event.targetTouches[currentTouches].identifier > 10;
					//if interactionArray already has been used, test if recorded finger ID matches current finger ID
					sameID = event.targetTouches[currentTouches].identifier === this.interactionArray[recordedTouches].identity;
					if (noID === true) {
						//if this finger has not been on the screen before, then create a new touch for it
						if (this.interactionArray[recordedTouches].touchEnded === true) {
							//record position of canvas in relation to document to get correct vertex position
							boundingClientRect = this.canvas.getBoundingClientRect();
							//find position of finger and nearest vertex on grid to the finger
							//NOTE: use recordedTouches below if no ID has been created yet
							this.interactionArray[recordedTouches] = new this.interactionPosition(
								event.targetTouches[recordedTouches].clientX,
								event.targetTouches[recordedTouches].clientY,
								this.gridSize,
								this.radius,
								boundingClientRect
							);
							//create a new pointToPull around that finger
							this.interactionArray[recordedTouches].point = new this.PointToPull(
								[this.verticies.length, this.verticies[0].length],
								this.gridSize,
								this.radius,
								this.speed,
								this.interactionArray[recordedTouches].nearestPointOnGrid
							);
							//assign the identity to item in interactionArray so individual points can be pulled around page by ID
							this.interactionArray[recordedTouches].identity = event.targetTouches[recordedTouches].identifier;
							//touch has just started so set to false
							this.interactionArray[recordedTouches].touchEnded = false;
							//find out what finger ID has just started
							//console.log("Touch " + this.interactionArray[recordedTouches].identity + " has started");
							//console.log("Touch (noID) created with ID: " + event.targetTouches[recordedTouches].identifier);
						}
					} else if (sameID === true) {
						//if this finger has already left the screen, and this particular ID has been used, then create new touch at same index
						if (this.interactionArray[recordedTouches].touchEnded === true) {
							//record position of canvas in relation to document to get correct vertex position
							boundingClientRect = this.canvas.getBoundingClientRect();
							//find position of finger and nearest vertex on grid to the finger
							//NOTE: use currentTouches below because ID already exists and we want this event and not some previously recorded
							//item in interactionArray that may or may not even exist
							this.interactionArray[recordedTouches] = new this.interactionPosition(
								event.targetTouches[currentTouches].clientX,
								event.targetTouches[currentTouches].clientY,
								this.gridSize,
								this.radius,
								boundingClientRect
							);
							//create a new point around that finger
							//NOTE: Use recordedTouches below because we have just created nearestPointOnGrid in statement above
							this.interactionArray[recordedTouches].point = new this.PointToPull(
								[this.verticies.length, this.verticies[0].length],
								this.gridSize,
								this.radius,
								this.speed,
								this.interactionArray[recordedTouches].nearestPointOnGrid
							);
							//assign the identity to item in interactionArray so individual points can be pulled around page
							this.interactionArray[recordedTouches].identity = event.targetTouches[currentTouches].identifier;
							//touch has just started so set to false
							this.interactionArray[recordedTouches].touchEnded = false;
							//find out what finger ID has just started
							//console.log("Touch " + this.interactionArray[recordedTouches].identity + " has started");
							//console.log("Touch (sameID) created with ID: " + event.targetTouches[currentTouches].identifier);
						}
					}
				}
			}
		} else if (event.type === "mousedown") {
			if (this.cursorStateAsClass === true) {
				this.canvas.className = "grabbing";
			}
			//record where mouse event occurred
			var mousePosition = [
				event.clientX - this.canvas.getBoundingClientRect().left,
				event.clientY - this.canvas.getBoundingClientRect().top
			];
			//before creating new pointToPull, make sure mouse is not in same position as a finger on screen
			var mouseIsActuallyFinger = false;
			//test if fingers have touched the screen at all (if they didn't, interactionArray is undefined)
			if (typeof this.interactionArray !== "undefined") {
				//if fingers have touched the screen, loop through all fingers
				for (var j = 0; j < this.interactionArray.length; j++) {
					//find out if mouse is in same position where touch event occurred on x-axis
					if (mousePosition[0] === this.interactionArray[j].currentCoordinates[0]) {
						//find out if mouse is in same position where touch event occurred on y-axis
						if (mousePosition[1] === this.interactionArray[j].currentCoordinates[1]) {
							mouseIsActuallyFinger = true;
						}
					}
				}
			}
			//if mouse event is not a result of a touch event, then create new pull point
			//with same properties as touch event
			if (mouseIsActuallyFinger === false) {
				//find out if mousedown occurred
				//console.log("Mouse was fired");
				//record position of canvas in relation to document for use with interactionPosition
				boundingClientRect = this.canvas.getBoundingClientRect();
				//find position of finger and nearest vertex on grid to the finger
				this.mouse = new this.interactionPosition(
					event.clientX,
					event.clientY,
					this.gridSize,
					this.radius,
					boundingClientRect
				);
				//create a new point around that finger
				this.mouse.point = new this.PointToPull(
					[this.verticies.length, this.verticies[0].length],
					this.gridSize,
					this.radius,
					this.speed,
					this.mouse.nearestPointOnGrid
				);
				//mouse has not been lifted from page yet, so set to false
				//using this property will mean less work to do for mousemove events
				this.mouse.lifted = false;
				//set cursor type
				//this.canvas.style.cursor = "move";
			}
		}
	}
};

//increment pointToPull based on how far mouse or fingers move
RadGrid.prototype.incrementInput = function (currentXPos, currentYPos, fromTouch, index) {
	//declare withinRadius for later use
	//only increment if mouse or finger is within radius
	var withinRadius = [0, 0];
	//input was from touchscreen
	if (fromTouch === true) {
		//go through all touches on page
		if (this.interactionArray[index].touchEnded === false) {
			//find out how far away finger is from where it originally made contact in relation to grid on x-axis
			withinRadius[0] = (currentXPos - this.interactionArray[index].originalCoordinates[0]) / this.gridSize;
			//if negative, make positive
			withinRadius[0] = withinRadius[0] < 0 ? withinRadius[0] * -1 : withinRadius[0];
			//find out how far away finger is from where it originally made contact in relation to grid on y-axis
			withinRadius[1] = (currentYPos - this.interactionArray[index].originalCoordinates[1]) / this.gridSize;
			//if negative, make positive
			withinRadius[1] = withinRadius[1] < 0 ? withinRadius[1] * -1 : withinRadius[1];

			if (withinRadius[0] > this.radius) {
				this.interactionArray[index].point.increment[0] = 0;
			} else {
				this.interactionArray[index].point.increment[0] = currentXPos - this.interactionArray[index].currentCoordinates[0];
			}
			//if finger movement is greater than radius, set increment to 0 on y-axis
			if (withinRadius[1] > this.radius) {
				this.interactionArray[index].point.increment[1] = 0;
			} else {
				this.interactionArray[index].point.increment[1] = currentYPos - this.interactionArray[index].currentCoordinates[1];
			}
			this.pullPoint(this.interactionArray[index].point);
			//set currentCoordinates (which is currently set to last coordinates before new mousemove event) to the actual current coordinates
			this.interactionArray[index].currentCoordinates[0] = withinRadius[0] < this.radius ? currentXPos : this.interactionArray[index].currentCoordinates[0];
			this.interactionArray[index].currentCoordinates[1] = withinRadius[1] < this.radius ? currentYPos : this.interactionArray[index].currentCoordinates[1];
		}
	} else {
		if (this.mouse.lifted === false) {
			//input was from mouse
			//find out how far away finger is from where it originally made contact in relation to grid on x-axis
			withinRadius[0] = (currentXPos - this.mouse.originalCoordinates[0]) / this.gridSize;
			//if negative, make positive
			withinRadius[0] = withinRadius[0] < 0 ? withinRadius[0] * -1 : withinRadius[0];
			//find out how far away finger is from where it originally made contact in relation to grid on y-axis
			withinRadius[1] = (currentYPos - this.mouse.originalCoordinates[1]) / this.gridSize;
			//if negative, make positive
			withinRadius[1] = withinRadius[1] < 0 ? withinRadius[1] * -1 : withinRadius[1];
			//if mouse movement is greater than radius, set increment to 0 on x-axis
			if (withinRadius[0] > this.radius) {
				this.mouse.point.increment[0] = 0;
			} else {
				this.mouse.point.increment[0] = currentXPos - this.mouse.currentCoordinates[0];
			}
			//if mouse movement is greater than radius, set increment to 0 on y-axis
			if (withinRadius[1] > this.radius) {
				this.mouse.point.increment[1] = 0;
			} else {
				this.mouse.point.increment[1] = currentYPos - this.mouse.currentCoordinates[1];
			}
			this.pullPoint(this.mouse.point);
			//set currentCoordinates (which is currently set to last coordinates before new mousemove event) to the actual current coordinates
			this.mouse.currentCoordinates[0] = withinRadius[0] < this.radius ? currentXPos : this.mouse.currentCoordinates[0];
			this.mouse.currentCoordinates[1] = withinRadius[1] < this.radius ? currentYPos : this.mouse.currentCoordinates[1];
		}
	}
};

//detect movement of mouse or fingers on screen
RadGrid.prototype.interactionChange = function (event) {
	if (this.pause === false) {
		event.preventDefault();
		//detect if event is from the mouse or a finger
		//declare variables below for use in loop without redeclaring over and over again
		var x; var y;
		if (event.type === "touchmove") {
			//interaction came from finger
			//go through array of changed touches (list of touches that have left the screen)
			for (var iCurrent = 0; iCurrent < event.targetTouches.length; iCurrent++) {
				//now loop through recorded touches on screen and test with each touch that has left screen
				for (var iTouches = 0; iTouches < this.interactionArray.length; iTouches++) {
					//get current finger positions on canvas (not document)
					x = event.targetTouches[iCurrent].clientX - this.canvas.getBoundingClientRect().left;
					y = event.targetTouches[iCurrent].clientY - this.canvas.getBoundingClientRect().top;
					//if recorded touch ID in interactionArray matches the touch on screen then set .currentCoordinates[]
					if (event.targetTouches[iCurrent].identifier === this.interactionArray[iTouches].identity) {
						//start .incrementInput() to increment pointToPull according to touch input
						this.incrementInput(x, y, true, iTouches);
						//tell us if a finger ID is moving
						//console.log("Touch " + this.interactionArray[iTouches].identity + " is moving, and is currently at " + x + ", " + y);
					}
				}
			}
		} else if (event.type === "mousemove") {
			//interaction came from mouse
			if (typeof this.mouse !== "undefined") {
				//if mouse has been clicked, test further
				if (this.mouse.lifted === false) {
					x = event.clientX - this.canvas.getBoundingClientRect().left;
					y = event.clientY - this.canvas.getBoundingClientRect().top;
					this.incrementInput(x, y, false);
					//find out if mouse if moving
					//console.log("Mouse is moving");
				}
			}
		}
	}
};

//handle fingers leaving the screen and the mouse lifting up
RadGrid.prototype.interactionRelease = function (event) {
	if (this.pause === false) {
		//event.preventDefault();
		if (event.type === "touchend") {
			//interaction came from finger
			//go through array of changed touches (list of touches that have left the screen)
			for (var iReleased = 0; iReleased < event.changedTouches.length; iReleased++) {
				//now loop through interactionArray and test with each touch that has left screen
				for (var iTouches = 0; iTouches < this.interactionArray.length; iTouches++) {
					//if touch ID in interactionArray matches the touch on screen then set .touchEnded to true
					if (event.changedTouches[iReleased].identifier === this.interactionArray[iTouches].identity) {
						this.interactionArray[iTouches].touchEnded = true;
						//now that the touch has ended, we need to increment these values back to their original positions
						//this will be handled in the animation loop since no more events will be fired from that lifted finger
						//find pullStrength on x and y axis now that touchend has occurred
						//NOTE: create new arrays over old array so code is nicer to look at (lookup if this presents performance issues)
						this.interactionArray[iTouches].point.pullStrength = [
							(this.interactionArray[iTouches].currentCoordinates[0] - this.interactionArray[iTouches].originalCoordinates[0]) * -1,
							(this.interactionArray[iTouches].currentCoordinates[1] - this.interactionArray[iTouches].originalCoordinates[1]) * -1
						];
						//find x and y increment value based on pullStrength and current speed
						this.interactionArray[iTouches].point.increment = [
							this.interactionArray[iTouches].point.pullStrength[0] / this.speed,
							this.interactionArray[iTouches].point.pullStrength[1] / this.speed
						];
						//find out if finger has been lifted from screen
						//console.log("Touch " + this.interactionArray[iTouches].identity + " has ended");
					}
				}
			}
		} else if (event.type === "mouseup") {
			if (this.cursorStateAsClass === true) {
				this.canvas.className = "grab";
			}
			//make sure user didn't click somewhere off of the canvas and then mouseup on canvas
			if (typeof this.mouse !== "undefined") {
				//interaction came from mouse
				//change .lifted to true so .interactionChange() does not do more work than it needs to
				this.mouse.lifted = true;
				//now that the mouse has ended, we need to increment these points back to their original positions (see long comment block in touchend above)
				//find pullStrength on x and y axis now that touchend has occurred
				this.mouse.point.pullStrength = [
					(this.mouse.currentCoordinates[0] - this.mouse.originalCoordinates[0]) * -1,
					(this.mouse.currentCoordinates[1] - this.mouse.originalCoordinates[1]) * -1
				];
				//find x and y increment value based on pullStrength and current speed
				this.mouse.point.increment = [
					this.mouse.point.pullStrength[0] / this.speed,
					this.mouse.point.pullStrength[1] / this.speed
				];
				//change cursor back to default since user is not interacting with mouse anymore
				//this.canvas.style.cursor = "default";
				//find out if mouse was lifted
				//console.log("Mouse was lifted");
			}
		}
	}
};

//handle mouse button being released and finger touches leaving screen
//move points that were controlled by touchscreen or mouse back to orignal positions
RadGrid.prototype.pullInputPointsBack = function () {
	//when a touch ends, points that were pulled need to be pulled back
	//first, test to see if any fingers have touched the screen (if not, interactionArray will be undefined)
	if (typeof this.interactionArray !== "undefined") {
		//go through all touches in interactionArray
		for (var oldTouches = 0; oldTouches < this.interactionArray.length; oldTouches++) {
			//test if a certain touch in array has ended, if it has then test further (.touchEnded)
			//also test to see if point has already been pulled back to orignal position (.finished)
			if (this.interactionArray[oldTouches].touchEnded === true && this.interactionArray[oldTouches].point.finished === false) {
				//test to see which direction point needs to be pulled back so we can further test to see if progress has became
				//less than or greater than the pullStrength (depending on the direction that it is going)
				if (this.interactionArray[oldTouches].point.pullStrength[0] > 0) {
					//if pullStrength is positive then progress needs to become larger than or equal to pullStrength
					if (this.interactionArray[oldTouches].point.progress >= this.interactionArray[oldTouches].point.pullStrength[0]) {
						this.interactionArray[oldTouches].point.finished = true;
					} else {
						this.interactionArray[oldTouches].point.progress = this.pullPoint(this.interactionArray[oldTouches].point);
						//console.log("Progress is now at: " + this.interactionArray[oldTouches].point.progress);
					}
				} else if (this.interactionArray[oldTouches].point.pullStrength[0] < 0) {
					//if pullStrength is negative then progress needs to become less than or equal to pullStrength
					if (this.interactionArray[oldTouches].point.progress <= this.interactionArray[oldTouches].point.pullStrength[0]) {
						this.interactionArray[oldTouches].point.finished = true;
					} else {
						this.interactionArray[oldTouches].point.progress = this.pullPoint(this.interactionArray[oldTouches].point);
						//console.log("Progress is now at: " + this.interactionArray[oldTouches].point.progress);
					}
				}
			}
		}
	}
	//when a mouse button lifts, points that were pulled need to be pulled back
	//refer to interactionArray above to see how code below works (same thing as above but with a mouse)
	if (typeof this.mouse !== "undefined") {
		if (this.mouse.lifted === true && this.mouse.point.finished === false) {
			if (this.mouse.point.pullStrength[0] > 0) {
				if (this.mouse.point.progress >= this.mouse.point.pullStrength[0]) {
					this.mouse.point.finished = true;
				} else {
					this.mouse.point.progress = this.pullPoint(this.mouse.point);
				}
			} else if (this.mouse.point.pullStrength[0] < 0) {
				if (this.mouse.point.progress <= this.mouse.point.pullStrength[0]) {
					this.mouse.point.finished = true;
				} else {
					this.mouse.point.progress = this.pullPoint(this.mouse.point);
				}
			}
		}
	}
};

RadGrid.prototype.cycleThroughAllPointsToBePulled = function () {
	//test to see if grid size has been changed
	if (this.tempGridSize !== this.gridSize || this.tempRadius !== this.radius) {
		//call initialize function to set new grid size
		this.initialize();
		//create all new pull points if grid has been changed
		//pullPoint instances use strength in pixels, so shrinking grid will cause pullStrength to be too large
		//not to mention that all pullPpints would be located in upper left corner of grid
		//so just create new points
		for (var j = 0; j < this.numberOfPoints; j++) {
			this.pointsToBePulled[j] = this.createPullPoint();
		}
	} else {
		//test to make sure that there are points that need to be pulled
		if (this.numberOfPoints !== 0) {
			//if grid size has not changed, cycle through all points (0 through this.numberOfPoints)
			for (var i = 0; i < this.numberOfPoints; i++) {
				//if animation has just started, all points in array will be undefined
				//if they are not undefined, then test further to see if point can be pulled
				if (typeof this.pointsToBePulled[i] !== "undefined") {
					//test to see if point is finished being pulled, if it hasn't test further to see if it can be pulled
					if (this.pointsToBePulled[i].finished === false) {
						//test if there is currently a delay, if there is then don't pull point yet
						if (this.pointsToBePulled[i].delay < 0) {
							//increment value of current pullPoint in array of points to reach pointToPull.pullStrength
							this.pointsToBePulled[i].progress = this.pullPoint(this.pointsToBePulled[i]);
							//if value has been incremented to be larger or less than the pull strength (depending on direction), pull point back towards original position
							//NOTE: In if-else structure below, the contents are simlilar but conditions differ because of positive or negative x-axis direction
							if (this.pointsToBePulled[i].pullStrength[0] > 0) {
								//if x-axis is positive, progress will become greater than pullStrength
								if (this.pointsToBePulled[i].progress >= this.pointsToBePulled[i].pullStrength[0]) {
									//this.pointsToBePulled[i].finished = true;
									//set backToStart to true so we know later that we can flag the pullPoint as finished
									this.pointsToBePulled[i].backToStart = true;
									//multiply by -1 to go in opposite direction
									this.pointsToBePulled[i].increment[0] *= -1;
									this.pointsToBePulled[i].increment[1] *= -1;
								}
								//if a point has went from the value of pullStrength back to 0, then flag as finished
								if (this.pointsToBePulled[i].progress <= 0 && this.pointsToBePulled[i].backToStart === true) {
									this.pointsToBePulled[i].finished = true;
								}
							} else {
								//if x-axis is negative, progress will become less than pullStrength
								if (this.pointsToBePulled[i].progress <= this.pointsToBePulled[i].pullStrength[0]) {
									//this.pointsToBePulled[i].finished = true;
									//set backToStart to true so we know later that we can flag the pullPoint as finished
									this.pointsToBePulled[i].backToStart = true;
									//multiply by -1 to go in opposite direction
									this.pointsToBePulled[i].increment[0] *= -1;
									this.pointsToBePulled[i].increment[1] *= -1;
								}
								//if a point has went from the value of pullStrength back to 0, then flag as finished
								if (this.pointsToBePulled[i].progress >= 0 && this.pointsToBePulled[i].backToStart === true) {
									this.pointsToBePulled[i].finished = true;
								}
							}
						} else {
							//if there's a delay, then make delay shorter for next animation frame
							this.pointsToBePulled[i].delay -= 1;
						}
					} else {
						//if point has been pulled from center and returns to original position (if it's finished), create new a point to be pulled
						this.pointsToBePulled[i] = this.createPullPoint();
					}
				} else {
					//if a point is not defined (like during start of animation), create a new point to be pulled
					this.pointsToBePulled[i] = this.createPullPoint();
					//console.log(this.pointsToBePulled[i]);
				}
			}
		}
	}
	//record current grid size so during next animation frame, we can test for grid size changes
	this.tempGridSize = this.gridSize;
	this.tempRadius = this.radius;
};

//change background color hue slowly over time, called in animation loop
RadGrid.prototype.animateHue = function () {
	//determine if lowest and highest values have changed, if so then reset colors
	//lastHueSettings are set in animation loop
	if (this.hueLastSettings[0] !== this.hueLowestValue || this.hueLastSettings[1] !== this.hueHighestValue) {
		this.hueRGB = [
			this.hueHighestValue,
			this.hueLowestValue,
			this.hueLowestValue
		];
	}
	//make sure increment does not become too fast, to prevent possible seizures
	if (this.hueHighestValue - this.hueLowestValue < 50 || this.hueSpeed > 2) {
		this.hueSpeed = 2;
	}
	//if red is at 255
	if (this.hueRGB[0] === this.hueHighestValue) {
		//if green is at 0
		if (this.hueRGB[1] === this.hueLowestValue) {
			//if blue is greater than 0
			if (this.hueRGB[2] - this.hueSpeed > this.hueLowestValue) {
				//increment blue to 0
				this.hueRGB[2] -= this.hueSpeed;
			} else {
				this.hueRGB[2] = this.hueLowestValue;
			}
		}
		//if blue is at 0
		if (this.hueRGB[2] === this.hueLowestValue) {
			//if green is less than 255
			if (this.hueRGB[1] + this.hueSpeed < this.hueHighestValue) {
				//increment green to 255
				this.hueRGB[1] += this.hueSpeed;
			} else {
				this.hueRGB[1] = this.hueHighestValue;
			}
		}
	}
	//if green is at 255
	if (this.hueRGB[1] === this.hueHighestValue) {
		//if red is greater than 0
		if (this.hueRGB[0] - this.hueSpeed > this.hueLowestValue) {
			//increment red to 0
			this.hueRGB[0] -= this.hueSpeed;
		} else {
			this.hueRGB[0] = this.hueLowestValue;
		}
		//if red is at 0
		if (this.hueRGB[0] === this.hueLowestValue) {
			//if blue is less than 255
			if (this.hueRGB[2] + this.hueSpeed < this.hueHighestValue) {
				//increment blue to 255
				this.hueRGB[2] += this.hueSpeed;
			} else {
				this.hueRGB[2] = this.hueHighestValue;
			}
		}
	}
	//if blue is at 255
	if (this.hueRGB[2] === this.hueHighestValue) {
		//if red is at 0
		if (this.hueRGB[0] === this.hueLowestValue) {
			//if green is greater than 0
			if (this.hueRGB[1] - this.hueSpeed > this.hueLowestValue) {
				//increment green to 0
				this.hueRGB[1] -= this.hueSpeed;
			} else {
				this.hueRGB[1] = this.hueLowestValue;
			}
		}
		//if green is at 0
		if (this.hueRGB[1] === this.hueLowestValue) {
			//if red is less than 255
			if (this.hueRGB[0] + this.hueSpeed < this.hueHighestValue) {
				//increment red to 255
				this.hueRGB[0] += this.hueSpeed;
			} else {
				this.hueRGB[0] = this.hueHighestValue;
			}
		}
	}
	//return string in form "rgb(0,0,0)"
	return "rgb(" + Math.round(this.hueRGB[0]) + "," + Math.round(this.hueRGB[1]) + "," + Math.round(this.hueRGB[2]) + ")";
};

//go through all points in this.verticies and animate them
RadGrid.prototype.animateLoop = function () {
	//use stats.js for recording framerate, testing only
	if (this.devMode === true) {
		if (typeof stats !== "undefined") {
			stats.begin();
		}
	}
	//create color background, if not transparent
	if (this.noBackground === false) {
		if (this.animateBackgroundHue === false) {
			//if not transparent or set to animateHue, fill with specified color
			this.draw.fillStyle = this.backgroundColor;
		} else {
			this.backgroundColor = this.animateHue();
			this.draw.fillStyle = this.backgroundColor;
			this.hueLastSettings = [this.hueLowestValue, this.hueHighestValue];
		}
		this.draw.fillRect(0, 0, this.canvas.width, this.canvas.height);
	} else {
		//if transparent, just clear the canvas
		this.draw.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
	//only move points when points can be seen
	if (this.gridThickness !== 0) {
		// move points controlled by input back to original positions
		this.pullInputPointsBack();
		//translate the entire grid by half of this.radius so distorts do not show edge of grid
		this.fillEdge = Math.round(this.radius / 2) * this.gridSize; //half of radius
		this.draw.translate(this.fillEdge * -1, this.fillEdge * -1);
		//go through all pull points in array and pull them in whatever direction they need to be pulled
		//and then pull those points back to their original positions
		this.cycleThroughAllPointsToBePulled();
		//use .resetGrid() to slowly increment values of .verticies[] back to .originalVerticies[]
		//NOTE: will cause some resistance to point being pulled, and will cause points to bounce back after being pulled to original position
		//this happens because these operations are not related to operations performed in .pullPoint()
		this.resetGrid();
		//draw the grid of verticies, wherever those verticies may be
		if (this.useCirclesInstead === false) {
			this.drawGrid();
		} else {
			this.drawCircles();
		}
		//now that we have finished drawing the grid, recenter the canvas selection so that we can draw centered text
		this.draw.translate(this.fillEdge, this.fillEdge);
	}
	//draw text overlaying the grid of verticies if any is supplied
	if (this.text !== "") {
		this.createText();
	}
	//tell stats.js that we have reached the end of an animation frame, if devMode is set to true
	if (this.devMode === true) {
		if (typeof stats !== "undefined") {
			stats.end();
		}
	}
	//draw the next frame, if we have not set .pause to true
	if (this.pause === false) {
		window.requestAnimationFrame(this.animateLoopBound);
	}
};

//create new point to be pulled
RadGrid.prototype.createPullPoint = function () {
	//this new object is in its own method because of how many times it is called,
	//and because all the parameters are the same each time it is called (not really needed though)
	return new this.PointToPull(
		[this.verticies.length, this.verticies[0].length],
		this.gridSize,
		this.radius,
		this.speed
	);
};

//call this function to pause or play animation
RadGrid.prototype.playPause = function () {
	if (this.pause === true) {
		//play animation
		window.requestAnimationFrame(this.animateLoopBound);
		this.pause = false;
	} else {
		//pause animation
		//NOTE: even though animation is paused, using .resizeCanvas() will play next frame of animation
		this.pause = true;
	}
};

//call this function to create an image from the canvas, user will decide what
//they want to do with it
RadGrid.prototype.saveImage = function (newTab) {
	if (newTab === true) {
		window.open(this.canvas.toDataURL());
	} else {
		return this.canvas.toDataURL();
	}
};

//Find point and surrounding point boundaries that will be pulled on the grid
RadGrid.prototype.PointToPull = function (verticies, gridSize, radius, speed, position, strength) {
	//declare position we will be working with
	this.centerPoint = [0, 0]; //x and y axis
	if (Array.isArray(position)) {
		//if given a position, it probably came from the user
		this.calledByMouse = true;
		//assign X and Y given value, initialize center point
		this.centerPoint[0] = position[0];
		this.centerPoint[1] = position[1];
	} else {
		this.calledByMouse = false;
		//find random point on grid and initialize center point
		this.centerPoint[0] = Math.round(Math.random() * verticies[0]);
		this.centerPoint[1] = Math.round(Math.random() * verticies[1]);
	}
	if (this.calledByMouse === true) {
		//if mouse is moving center point, we cannot determine with what strength the point was pulled until mouseup event
		this.pullStrength = [0, 0];
	} else {
		//declare strength that centerpoint and surrounding points will be pulled
		this.pullStrength = [0, 0]; //x and y axis
		//determine how far, and in which direction, center point will be pulled (do not pull larger than radius)
		//if larger than radius, surrounding points will escape circular radius (created in .pullPoint() method) when pulled
		//IMPORTANT: pullStrength is measured in pixels and has little relation to this.verticies[]
		//NOTE: radius may need to be divided by 2 because pullStrength is too strong when many points are on page
		var pullX = (Math.round(Math.random() * radius / 2)) * gridSize;
		var pullY = (Math.round(Math.random() * radius / 2)) * gridSize;
		//randomly make x and y strength positive or negative
		this.pullStrength[0] = Math.round(Math.random()) === 0 ? pullX : pullX * -1;
		this.pullStrength[1] = Math.round(Math.random()) === 0 ? pullY : pullY * -1;
	}
	//find points on all 4 edges of radius to form square of affected verticies
	this.leftOfCenter = this.centerPoint[0] - radius;
	this.rightOfCenter = this.centerPoint[0] + radius;
	this.topOfCenter = this.centerPoint[1] - radius;
	this.bottomOfCenter = this.centerPoint[1] + radius;
	//find the distance (in pixels) from the center point to the edge
	this.distanceCenterToEdge = radius * gridSize;
	//Determine how far the .pullPoint() method should pull points on every animation frame
	if (this.calledByMouse === true) {
		//if center point is being moved by the mouse, the increment value will be updated on every mousemove event
		this.increment = [0, 0];
	} else {
		//if center point is not being pulled by mouse, move point with strength and direction defined earlier in pullStrength
		//use the speed variable to divide pullStrength into increments
		//IMPORTANT: larger speed values result in slower movement
		this.increment = [this.pullStrength[0] / speed, this.pullStrength[1] / speed];
	}
	//create random delay before center point is pulled
	this.delay = Math.floor((Math.random() * speed));
	//use progress to record additions of increment
	//once progress reaches the value of this.pullStrength[], this.backToStart should become true
	//and incrment should become negative if positive and vice versa
	this.progress = 0;
	//NOTE: backToStart will not be used if point is created by finger or mouse
	this.backToStart = false;
	//once progress reaches 0 and backToStart becomes true, this.finished becomes true
	this.finished = false;
};

//pulls center point and surrounding points according to pullStrength in increments around the grid
RadGrid.prototype.pullPoint = function (point) {
	//assign point that is a distance of radius above the center point to topCounter
	var topCounter = point.topOfCenter;
	//variables below will be used in inner most loop and conditions, and will be initialized and described later
	var x2_minus_x1; var y2_minus_y1; var distance; var complementPercentage;
	//cycle through verticies that will be pulled, vertically (top to bottom)
	//NOTE: Loop reads points like text on a page, top to bottom, left to right
	while (topCounter <= point.bottomOfCenter) {
		//assign point that is a distance of radius left of the center point to topCounter
		var leftCounter = point.leftOfCenter;
		//cycle through affected verticies, horizontally (left to right)
		while (leftCounter <= point.rightOfCenter) {
			//NOTE: Some verticies relative to the center point may not exist if too close to the edge of grid
			//test if current column in this.verticies[] exists
			if (typeof this.verticies[leftCounter] !== "undefined") {
				//test if a row inside that column exists
				if (typeof this.verticies[leftCounter][topCounter] !== "undefined") {
					//find the distance between current vertex in loop (in square radius) and the center vertex
					//NOTE: This is just the distance formula: sqrt((x2 - x1)^2 + (y2 - y1)^2)
					//this.centerPoint[0 == x1, 1 == y1]
					//this.verticies[leftCounter][topCounter][0 == x2, 1 == y2]
					x2_minus_x1 = this.verticies[leftCounter][topCounter][0] - (point.centerPoint[0] * this.gridSize);
					y2_minus_y1 = this.verticies[leftCounter][topCounter][1] - (point.centerPoint[1] * this.gridSize);
					distance = Math.sqrt(Math.pow(x2_minus_x1, 2) + Math.pow(y2_minus_y1, 2));
					//if current vertex in loop is within the distance of the radius of the center point, increment the value
					//This will turn our boundary box (TRBLofCenter) into a circular radius
					if (distance < point.distanceCenterToEdge) {
						/*Sharp curve function (not used):
						complementPercentageNoCurve will take the distance between current point and center, and divide it by
						the radius this will make a larger value if current vertex in loop is closer to the edge of the radius
						but since we want a smaller value as we approach the edge of the radius, we'll use the complement of
						percentage that just we found. this will create sharp curve towards center*/
						//complementPercentageNoCurve = 1 - (distance / point.distanceCenterToEdge);
						/*Smooth curve function:
						First take the distance between current point and center, and divide it by the radius
						this will result in a larger value if current vertex in loop is closer to the edge of the radius
						take this value to the power of 2, and this will create a curve that will becomes steeper as you
						get closer to the edge (but this curve will not extend passed the radius), but because we want the curve to
						become steeper as we approach the CENTER we'll find the complement percentage (subtract this value from 1)*/
						complementPercentage = 1 - Math.pow((distance / point.distanceCenterToEdge), 2);
						/*equation above will only create curve when approaching the center but we want a slow curve from the edge
						towards the center so if we take the value above to the power of 2.5, we will get a curve sloping up and back
						toward the center (see curveTest.htm to see how this works visually)*/
						complementPercentage = Math.pow(complementPercentage, 2.5);
						//increment center point and other points within radius on curve
						this.verticies[leftCounter][topCounter][0] += point.increment[0] * complementPercentage;
						this.verticies[leftCounter][topCounter][1] += point.increment[1] * complementPercentage;
					}
				}
			}
			//go to next vertex in row
			leftCounter++;
			/*keep log of affected vertcies for testing (SLOWS THINGS DOWN A LOT especially as numberOfPoints increases)
			console.log("Points afftected ----- x: " + leftCounter + ", y: " + topCounter);*/
		}
		//go to next vertex in column
		topCounter++;
	}
	//tell animation function how many times point has been incremented on x-axis
	//NOTE: y-axis should increment at same rate as x-axis, so it doesn't need to be recorded
	return point.progress + point.increment[0];
};

//NOTE: Currently influences pullPoint which causes sharp, bounce-like curve back to original position
//EXTRA NOTE: Also looks pretty cool

/*call on .resetGrid() in order to slowly increment positions of verticies[] back to originalVerticies[]
This is important because when we increment points back to orignal positions, only the center point is
pulled back to its correct location while points surrounding it are pulled back on a curve in relation to
the center point. This means if one point is pulled one direction and then changes directions (like when
another point pulled in another direction is very close to it), the surrounding points will be rotated and
won't go back to originalVerticies[]. While there is definitely a way of accounting for changes in
direction, that would be complicated to write (and likely harder for computer to process).
.resetGrid() will only increment points that are not in correct positions, back to their orignal positions
without accounting for rotation, which is lazy but also perfectly fine for the purpose of this web toy.*/
RadGrid.prototype.resetGrid = function () {
	//NOTE: must be slower than speed of verticies being pulled, so points can still be moved from orignal positions
	//NOTE: .resetGrid() will shrink radius of pull points slightly because .resetGrid() will be pulling point in opposite direction of pullStrength
	//NOTE: Will cause points to bounce back to position because it is affecting the increment strength when backToStart is true
	//use .resetGridStrength to determine strength that points should be pulled
	//go through each vertex in 1st row
	for (var h = 0; h < this.verticies.length; h++) {
		//then go through each vertex belonging to that column
		for (var v = 0; v < this.verticies[h].length; v++) {
			//only move points if they are not aligned with original
			//-- move on x-axis if not aligned
			if (this.verticies[h][v][0] !== this.originalVerticies[h][v][0]) {
				if (this.resetGridStrength !== 0) {
					this.verticies[h][v][0] += (this.originalVerticies[h][v][0] - this.verticies[h][v][0]) / (this.speed * this.resetGridStrength);
				}
			}
			//-- move on y-axis if not aligned
			if (this.verticies[h][v][1] !== this.originalVerticies[h][v][1]) {
				if (this.resetGridStrength !== 0) {
					this.verticies[h][v][1] += (this.originalVerticies[h][v][1] - this.verticies[h][v][1]) / (this.speed * this.resetGridStrength);
				}
			}
		}
	}
};

//create lines of text to overlay the grid, to complete the "aesthetic" feel
RadGrid.prototype.createText = function () {
	//create array for placing lines of text
	var text = [this.text];
	//spacesAtIndex will be used and explained later
	var spacesAtIndex;
	//go through each line of text, even though we start out with one line, we will add more if text overflows
	for (var i = 0; i < text.length; i++) {
		//assume that given line of text has a space in it until proven wrong
		spacesAtIndex = true;
		//if current line of text is larger than the width of the canvas, then test further and keep testing until condition
		//either becomes false or we've determined that there are no spaces in current line of text
		//in which case, we will just let it overflow (I'm not writing a system that adds dashes to ridiculously long words, not worth it)
		while (this.draw.measureText(text[i]).width > this.canvas.width && spacesAtIndex === true) {
			//first test to see if there are any spaces in current line, so we can shift words down to next item in array
			if (text[i].indexOf(" ") > -1) {
				//add last word of text to the next item in array (next line)
				if (typeof text[i + 1] === "undefined") {
					//if the next item in the array (next line of text), doesn't exist, create it, and add last word of current item in loop
					text.push(text[i].substring(text[i].lastIndexOf(" ")));
					//console.log("pushed: " + text[i].substring(text[i].lastIndexOf(" ")));
				} else {
					//if next item in array (next line) already exists, prefix it with the new word from current line in loop
					text[i + 1] = text[i].substring(text[i].lastIndexOf(" ")) + text[i + 1];
				}
				//remove last word from current line since we have already added it to the next line
				text[i] = text[i].substring(0, text[i].lastIndexOf(" "));
			} else {
				//if there are no spaces, just leave the text be so we can skip to next line and exit inner loop
				//NOTE: You can't fit supercalifragilisticexpialidocious on the screen. Unless you add spaces.
				spacesAtIndex = false;
			}
		}
		//once finished creating a new line of text, remove prefixing space to better center text on screen
		if (typeof text[i + 1] !== "undefined") {
			text[i + 1] = text[i + 1].substring(1);
		}
	}
	//get height of individual line of text, including line height
	var charHeight = this.fontSize * this.lineHeight;
	//variable below will offset text in the loop so that lines of text will be perfectly centered
	var multilineOffsetY = charHeight * (text.length / 2 - 1) + charHeight / 2;
	//line height temp will be used later in loop
	var lineHeightTemp;
	//set italic and/or bold, if .makeItalic and/or .makeBold is true
	var italic = this.makeItalic === true ? "italic " : "";
	var bold = this.makeBold === true ? "bold " : "";
	//begin to place lines of text on canvas
	for (var i2 = 0; i2 < text.length; i2++) {
		//set font style
		this.draw.font = italic + bold + this.fontSize + "pt " + this.fontFamily;
		//align the first line of text to the center of screen
		this.draw.textAlign = "center";
		this.draw.textBaseline = "middle";
		//draw the shadow first
		this.draw.fillStyle = this.shadowColor;
		//use lineHeightTemp to offset lines of text relative to top line (does not center text)
		lineHeightTemp = i2 > 0 ? (this.lineHeight * this.fontSize) * i2 : 0;
		//draw shadow and account for shadow offset
		if (this.shadowOffset !== 0) {
			this.draw.fillText(text[i2], this.canvas.width / 2 + this.shadowOffset, this.canvas.height / 2 + this.shadowOffset + lineHeightTemp - multilineOffsetY);
		}
		//adding lineHeightTemp will keep lines of text from being written on same line and subtracting multilineOffsetY will center all lines of text
		//draw text overlaying the shadow, remove shadow offset
		this.draw.fillStyle = this.textColor;
		this.draw.fillText(text[i2], this.canvas.width / 2, this.canvas.height / 2 + lineHeightTemp - multilineOffsetY);
		/*test for centered text
		this.draw.fillStyle = "#f00";
		this.draw.fillText("Cool.", this.canvas.width / 2, this.canvas.height / 2);*/
	}
};

/* Example usage with all possible parameters
var grid = new RadGrid({
	canvas: document.getElementsByTagName("canvas")[0],
	gridSize: 24,
	radius: 8,
	numberOfPoints: 24,
	speed: 64,
	backgroundColor: "#f68cff",
	noBackground: false,
	animateBackgroundHue: false,
	//hueLowestValue: 80,
	//hueHighestValue: 208,
	//hueSpeed: 2,
	gridColor: "#fff",
	gridThickness: 1,
	useCirclesInstead: false,
	text: "Cool.",
	fontFamily: "Arial",
	makeItalic: true,
	makeBold: true,
	textColor: "#fff",
	shadowColor: "#000",
	fontSize: 64,
	lineHeight: 2,
	shadowOffset: 2
});
*/
