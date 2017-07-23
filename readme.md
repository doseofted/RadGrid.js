    ┌─┬─┬─┬─┬─┬─┐
    ├─┼─┼─┼─┼─┼─┤
    ├─┼RadGrid┼─┤by doseofted
    ├─┼─┼─┼─┼─┼─┤
    └─┴─┴─┴─┴─┴─┘

RadGrid is an interactive, distorting grid that can be customized however you like. This is the library I made to be used for the [Aesthetic web app](http://doseofted.com/project/aesthetic/app.htm).
Below is an example with all possible parameters (note that it takes one single object and all properties on that object are optional) along with description of what those properties on the parameter do.

    var grid = new RadGrid({
        canvas: "id-of-canvas",      //give canvas element or ID of canvas
        gridSize: 24,                //set distance between each vertex
        radius: 8,                   //the radius of all points pulled on the page
        numberOfPoints: 24,          //number of points to pull on page
        speed: 64,                   //set speed (lower is faster, higher is slower)
        backgroundColor: "#f68cff",  //set background color
        noBackground: false,         //make background transparent (to place image behind grid)
        animateBackgroundHue: false, //set whether background should change colors over time
        //hueLowestValue: 80,        //- limit how dark colors should become when animated
        //hueHighestValue: 208,      //- limit how light colors should become when animated
        //hueSpeed: 2,               //- set speed that hue should change
        gridColor: "#fff",           //set color of grid
        gridThickness: 1,            //set thickness of lines between vertices
        useCirclesInstead: false,    //draw circles instead of grid lines
        text: "Cool.",               //text to be drawn in front of grid
        fontFamily: "Arial",         //set font family
        makeItalic: true,            //set whether or not font should be italicized
        makeBold: true,              //set whether or not font should be bold
        textColor: "#fff",           //set color of text
        shadowColor: "#000",         //set color of text shadow
        fontSize: 64,                //set size of text overlaying grid
        lineHeight: 2,               //set distance between lines of text
        shadowOffset: 2              //set distance between shadow and text
    });

RadGrid can be expanded upon to do some cool things. For example, it could become ...
- A music visualizer with lyrics (change colors and speed based on sound data, text along with time in song)
- Interactive image made of particles (by replacing each vertex with pixel color of image)
- A fun, interactive loading screen or webpage background
I have decided not to make these tools (at least not in the near future) but I encourage others to do so. Each component of the library is separated nicely and I describe in the comments very thoroughly how it works. If you do decide to make something with the library, share a link back to me because I would love to see it!
