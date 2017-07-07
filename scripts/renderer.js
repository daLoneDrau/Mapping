define(["camera", "timer"],
	function(Camera, Timer) {
	var Renderer = function(canvas, background, foreground) {
        this.backgroundLayer = null;
        this.groundLayer = null;
        this.foreground = null;
        console.log(canvas);
        if (canvas && canvas.getContext) {
        	this.backgroundLayer = canvas.getContext("2d");
        }
        if (background && background.getContext) {
        	this.groundLayer = background.getContext("2d");
        }
        if (foreground && foreground.getContext) {
        	this.foreground = foreground.getContext("2d");
        }
        this.canvas = canvas;
        this.backcanvas = background;
        this.forecanvas = foreground;

        this.initFPS();
        this.tilesize = 16;
    
        this.upscaledRendering = this.backgroundLayer.mozImageSmoothingEnabled !== undefined;
        this.supportsSilhouettes = this.upscaledRendering;
    
        this.rescale(this.getScaleFactor());
    
        this.lastTime = new Date();
        this.frameCount = 0;
        this.maxFPS = this.FPS;
        this.realFPS = 0;
        this.isDebugInfoVisible = false;
    
        this.animatedTileCount = 0;
        this.highTileCount = 0;
    
        this.tablet = Detect.isTablet(window.innerWidth);
        
        this.fixFlickeringTimer = new Timer(100);
	};
	/**
	 * Clears all previously drawn content.
	 * @param ctx the {@link CanvasRenderingContext2D} instance being cleared
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clearRect
	 */
	Renderer.prototype.clearScreen = function(ct2) {
        ct2.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
	Renderer.prototype.createCamera = function() {
        this.camera = new Camera(this);
        this.camera.rescale();
        console.log(this.camera.gridW)
        console.log(this.tilesize)
        console.log(this.scale)
        this.canvas.width = this.camera.gridW * this.tilesize * this.scale;
        this.canvas.height = this.camera.gridH * this.tilesize * this.scale;
        log.debug("#entities set to "+this.canvas.width+" x "+this.canvas.height);
    
        this.backcanvas.width = this.canvas.width;
        this.backcanvas.height = this.canvas.height;
        log.debug("#background set to "+this.backcanvas.width+" x "+this.backcanvas.height);
    
        this.forecanvas.width = this.canvas.width;
        this.forecanvas.height = this.canvas.height;
        log.debug("#foreground set to "+this.forecanvas.width+" x "+this.forecanvas.height);
    };
    Renderer.prototype.getWidth = function() {
        return this.canvas.width;
    };
    Renderer.prototype.getHeight = function() {
        return this.canvas.height;
    };
    /**
     * Gets the game's scale factor, based on the window's height.  If less than 1000px, the scale
     * factor is 2.  If between 870px and 1500px, scale factor is 3, and over 1500px, scale factor
     * is 3.
     */
    Renderer.prototype.getScaleFactor = function() {
        var w = window.innerWidth,
            h = window.innerHeight,
            scale;
    
        this.mobile = false;
    
        if (w <= 1000) {
            scale = 2;
            this.mobile = true;
        } else if (w <= 1500 || h <= 870) {
            scale = 2;
        } else {
            scale = 3;
        }
    
        return scale;
    };
    /**
     * Initializes the game's font size based on the scale.
     */
    Renderer.prototype.initFont = function() {
        var fontsize;
    
        switch(this.scale) {
            case 1:
                fontsize = 10;
                break;
            case 2:
            	if (Detect.isWindows()) {
            		fontsize = 10;
            	} else {
            		fontsize = 13;
            	}
                break;
            default:
                fontsize = 20;
        }
        this.setFontSize(fontsize);
    };
    /**
     * Initializes the Frame Per Second.  Always 50.
     */
	Renderer.prototype.initFPS = function() {
        this.FPS = this.mobile ? 50 : 50;
    };
    Renderer.prototype.rescale = function(factor) {
        this.scale = this.getScaleFactor();
    
        this.createCamera();
    
        this.backgroundLayer.mozImageSmoothingEnabled = false;
        this.groundLayer.mozImageSmoothingEnabled = false;
        this.foreground.mozImageSmoothingEnabled = false;
    
        this.initFont();
        this.initFPS();
    
        /*
        if (!this.upscaledRendering && this.game.map && this.game.map.tilesets) {
            this.setTileset(this.game.map.tilesets[this.scale - 1]);
        }
        if (this.game.renderer) {
            this.game.setSpriteScale(this.scale);
        }
        */
    };
    Renderer.prototype.renderFrame = function() {
        if(this.mobile || this.tablet) {
            this.renderFrameMobile();
        }
        else {
            this.renderFrameDesktop();
        }
    };
    Renderer.prototype.getMapHeight = function() {
    	return this.map.getHeight();
    }
    Renderer.prototype.getMapWidth = function() {
    	return this.map.getWidth();
    }
    Renderer.prototype.renderFrameDesktop = function() {
    	// clear the screen and push onto the drawing stack
        this.clearScreen(this.backgroundLayer);
        this.backgroundLayer.save();
        // fill the screen with black
        this.backgroundLayer.fillStyle = "black";
        this.backgroundLayer.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.foreground.strokeStyle = "white";
        var xOff = this.camera.x, yOff = this.camera.y;
        // render grid lines at 32x32
        for (var row = 0 - xOff; row < 960; row += 32) {
            for (var col = 0 - yOff; col < 512; col += 32) {
	            this.foreground.strokeRect(row, col, 32, 32);
            }
        }
        this.foreground.font = "8px 'Press Start 2P'";
        this.foreground.fillStyle = "red";
        this.foreground.fillText("Hello World",10,50);
        this.foreground.font = "30px Courier";
        this.foreground.fillText("Hello World",10,80);
    };
    Renderer.prototype.renderGame = function() {
    	
    }
    Renderer.prototype.renderMap = function() {
        // iterate through the map drawing tiles
        var cells = this.map[0].getCells();
        for (var i = cells.length - 1; i >= 0; i--) {
        	var cell = cells[i];
        	if (this.camera.isVisible(cell)) {
        		console.log("render cell");
        		console.log(cell);
        		var cx = cell.getPosition().getX() * cell.getSize() - this.camera.getX();
        		var cy = cell.getPosition().getY() * cell.getSize() - this.camera.getY();
        		cy = this.canvas.height - cell.getSize() - cy;
        		cell.render(this.groundLayer, cx, cy, this.map[0]);
        	}
        }
        if (this.map.length > 1) {
            cells = this.map[1].getCells();
            for (var i = cells.length - 1; i >= 0; i--) {
            	var cell = cells[i];
            	if (this.camera.isVisible(cell)) {
            		var cx = cell.getPosition().getX() * cell.getSize() - this.camera.getX();
            		var cy = cell.getPosition().getY() * cell.getSize() - this.camera.getY();
            		cy = this.canvas.height - cell.getSize() - cy;
            		cell.render(this.backgroundLayer, cx, cy, this.map[0]);
            	}
            }
        }
    };
    /**
     * Sets the game's font size on the context and background canvases.
     * @param size the font size
     */
    Renderer.prototype.setFontSize = function(size) {
        var font = [size, "px GraphicPixel"].join("");
    
        this.backgroundLayer.font = font;
        this.groundLayer.font = font;
    };
	Renderer.prototype.textDimensions = function(text) {
	    var div = document.createElement("div");
	    div.style.position = "absolute";
	    div.style.top="-999px";
	    div.style.left="-999px";
	    div.style.fontFamily = "Pixel Emulator, Press Start 2P, Courier new, monospace"
	    div.id = "width";
	    div.innerHTML = text;
	    document.body.appendChild(div);
	    var el = document.getElementById("width");
	    var w = [el.offsetWidth, el.offsetHeight];
	    el.parentNode.removeChild(el);
	    return w;
    };
	return Renderer;
});