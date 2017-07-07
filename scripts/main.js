
define(["jquery", "renderer",
	"com/dalonedrow/engine/systems/base/time"],
	function($, Renderer, Time) {
    var renderer, currentTime, mouse = {};
    console.log("main called");
    // define animation loop method
    window.requestAnimFrame = (function(){
  	  return  window.requestAnimationFrame       || 
  	          window.webkitRequestAnimationFrame || 
  	          window.mozRequestAnimationFrame    || 
  	          window.oRequestAnimationFrame      || 
  	          window.msRequestAnimationFrame     || 
  	          function(/* function */ callback, /* DOMElement */ element){
  	            window.setTimeout(callback, 1000 / 60);
  	          };
  	})();
    // game start-up process:
    // 1. initialize the application
    // 2. initialize the game
    // 3. display the intro screen
    /**
     * App initialization called when page loads.
     */
    var initApp = function() {
        $(document).ready(function() {
            console.log("document ready - in initApp");
        	// create new app
            $('body').click(function(event) {
            	console.log("clicked on body");
            });
            // capture all key events
            $(document).keydown(function(e) {
                e.preventDefault();
                // do my work
                console.log("key was pressed");
                if (e.keyCode == 116) {
                	console.log("f5 pressed");
                    window.location.reload()
                }
            });
            // track mouse movement
            $(document).mousemove(function(event) {
            	setMouseCoordinates(event);
            	//if(game.started) {
            	//    game.movecursor();
            	//}
            });
            // do not use jQuery to get canvas
            renderer = new Renderer(document.getElementById("midground"),
            		document.getElementById("background"),
            		document.getElementById("foreground"));
            run();
        });    	
    };
    var setMouseCoordinates = function(event) {
        var gamePos = $('#container').offset(),
            scale = renderer.getScaleFactor(),
            width = renderer.getWidth(),
            height = renderer.getHeight();

        mouse.x = event.pageX - gamePos.left;
    	mouse.y = event.pageY - gamePos.top;
    	var freeze = false;
    	if (mouse.x <= 0
    			|| mouse.y <= 0
    			|| mouse.x >= width
    			|| mouse.y >= height) {
    		freeze = true;
    	}
    	if (!freeze) {
	    	if (mouse.x <= 0) {
	    	    mouse.x = 0;
	    	} else if (mouse.x >= width) {
	    	    mouse.x = width - 1;
	    	}
	
	    	if (mouse.y <= 0) {
	    	    mouse.y = 0;
	    	} else if(mouse.y >= height) {
	    	    mouse.y = height - 1;
	    	}
	    	$("#pos").html([mouse.x, ", ", mouse.y].join(""));
	    }
    };
    var run = function() {
    	console.log("running...")
        currentTime = new Date().getTime();
        renderer.renderFrame();
        // start frame
        Time.getInstance().startFrame();

        if (this.started) {
        	GameCycle.getInstance().execute();
            //this.updateCursorLogic();
            //this.updater.update();
        	Time.getInstance().startFrame();
        }

        if (!this.isStopped) {
        	// bind this instance to the run method
            requestAnimFrame(run.bind(this));
        }
    };
    var initGame = function() {
        require(['game'], function(Game) {            
            var canvas = document.getElementById("midground"),
            background = document.getElementById("background"),
            foreground = document.getElementById("foreground");
            // initialize the game with canvases
    		game = new Game(app);
    		game.setup('#bubbles', canvas, background, foreground);
    		//game.setup('#bubbles', canvas, background, foreground, input);
    		game.setStorage(app.storage);
    		app.setGame(game);
    		// handle mouse clicks on the canvas
        	if(game.renderer.mobile || game.renderer.tablet) {
                $('#foreground').bind('touchstart', function(event) {
                    app.center();
                    app.setMouseCoordinates(event.originalEvent.touches[0]);
                	game.click();
                	app.hideWindows();
                });
            } else {
                $('#foreground').click(function(event) {
                    app.center();
                    app.setMouseCoordinates(event);
                    if (game) {
                	    game.click();
                	}
                	app.hideWindows();
                    // $('#chatinput').focus();
                });
            }
        	// unbind previous click event for body
            $('body').unbind('click');
            // bind new click event
            $('body').click(function(event) {                
                if(game.started && !game.renderer.mobile) {
                    game.click();
                }
            });
        });
    };
    // initialize the game application
    initApp();
});