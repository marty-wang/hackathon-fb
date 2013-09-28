(function () {
	
    var streaming = false,
        video = document.querySelector('#webcam'),
        canvas = document.querySelector('#raw-canvas'),
        target = document.querySelector('#target-canvas'),
        rawCtx = canvas.getContext('2d'),
        targetCtx = target.getContext('2d'),
        //photo = document.querySelector('#photo'),
        //startbutton = document.querySelector('#startbutton'),
        width = 320,
        height = 0,
        isMouseDown = false,
		startx = 0, starty = 0, currx = 0, curry = 0;

    $(target).mousedown(function(evt) {
        isMouseDown = true;
		startx = evt.offsetX;
		starty = evt.offsetY;
		currx = startx;
		curry = starty;
    });

    $(target).mouseup(function() {
        isMouseDown = false;
    });

    $(target).mousemove(function (evt) {
        if (!isMouseDown) return;
        
        currx = evt.offsetX;
        curry = evt.offsetY;
        //var pixelData = targetCtx.getImageData(x, y, 1, 1).data;
        //console.log("x: " + x + " y: " + y);
        //console.log(pixelData);
    });

    navigator.getMedia = (navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

    navigator.getMedia(
      {
          video: true,
          audio: false
      },
      function (stream) {
          //window.stream = stream;
          video.src = window.URL.createObjectURL(stream);
          video.play();
      },
      function (err) {
          console.log("An error occured! " + err);
      }
    );

    video.addEventListener('canplay', function (ev) {
        if (!streaming) {
            height = video.videoHeight / (video.videoWidth / width);
            setElementSize(video, width, height);
            setElementSize(canvas, width, height);
            setElementSize(target, width, height);
            streaming = true;
        }
    }, false);
    
    function setElementSize(element, width, height) {
        element.setAttribute('width', width);
        element.setAttribute('height', height);
    }
    
    function refresh() {
        rawCtx.drawImage(video, 0, 0, width, height);
        onFrame(canvas);
        requestAnimationFrame(refresh);
    }
    
    function createImageData(ctx, width, height) {
        if (ctx.createImageData) {
            return ctx.createImageData(width, height);
        } else {
            return ctx.getImageData(0, 0, width, height);
        }
    }
    
    function onFrame(rawCanvas) {
		
        var width = rawCanvas.width;
        var height = rawCanvas.height;
        
        var inData = rawCtx.getImageData(0, 0, width, height);
        var outData = createImageData(rawCtx, width, height);
		
        var aa = new area(0,0, 0, 0);
		
		if(startx < currx){
			aa.x = startx;
			aa.width = currx - startx;
		}else{
			aa.x = currx;
			aa.width = startx - currx;
		}
		
		if(starty < curry){
			aa.y = starty;
			aa.height = curry - starty;
		}else{
			aa.y = curry;
			aa.height = starty - curry;
		}
        
		applyArea(inData.data, outData.data, canvas.width, canvas.height, aa, applyEdge2);
		//applyArea(outData.data, outData.data, canvas.width, canvas.height, aa, applyNAvg);
		
        // apply effect
        //solarize(inData.data, outData.data, width, height);
		
        // paint to the target canvas
        targetCtx.putImageData(outData, 0, 0);
    }

    function area(x,y,w,h){
        this.x = x;
        this.y= y;
        this.width = w;
        this.height = h;
		
		this.contains = function (xcoord, ycoord){
			return xcoord >= this.x && ycoord >= this.y && xcoord <= (this.x + this.width) && ycoord <= (this.y + this.height);
		}
		
		this.empty = function(){
			return this.width == 0 && this.height == 0;
		}
    }

    requestAnimationFrame(refresh);
    //Apply filter area
    function applyArea (inData, outData, width, height, area, filter){
        var xstart = area.x;
        var ystart = area.y;
        var xend = xstart + area.width;
        var yend = ystart + area.height;
    
		
        for(x = 0; x < width; x++){
            for(y = 0; y < height; y++){
				var offset = (y * width * 4) + (x * 4);
				var r = inData[offset];
				var g = inData[offset + 1];
				var b = inData[offset + 2];
				if(area.contains( x, y) && !area.empty()){
					filter(inData, outData, width, height, x, y);
				}else{
					outData[offset] = r;
					outData[offset + 1] = g;
					outData[offset + 2] = b;
					outData[offset + 3] = inData[offset + 3];
				}
            }
        }
    }
	
	function applyGray (inData, outData, width, height, x, y){
		var offset = (y * width * 4) + (x * 4);
		var r = inData[offset];
		var g = inData[offset + 1];
		var b = inData[offset + 2];
				
		var gray = (r+g+b) / 3;
		outData[offset] = gray;
		outData[offset + 1] = gray;
		outData[offset + 2] = gray;
		outData[offset + 3] = inData[offset + 3];
    }
	
	function applyBw (inData, outData, width, height, x, y){
		var ny = y + 1;
		var nx = x + 1;
		
		var offset = (y * width * 4) + (x * 4);
		var r = inData[offset];
		var g = inData[offset + 1];
		var b = inData[offset + 2];
				
		var gray = (r+g+b) / 3;
		if(gray < 128){
			gray = 0;
		}else{
			gray = 255;
		}
		outData[offset] = gray;
		outData[offset + 1] = gray;
		outData[offset + 2] = gray;
		outData[offset + 3] = inData[offset + 3];
    }
	
	function applyNAvg (inData, outData, width, height, x, y){
		var r = 0;
		var g = 0;
		var b = 0;
		var size = 0;
		var loc = ((y) * width * 4) + ((x) * 4);
		
		for(i = -3; i <= 3; i++){
			for(j = -3; j <= 3; j++){
				if((x+i) < 0 || (y+j) < 0){
					continue;
				}
				var offset = ((y+j) * width * 4) + ((x+i) * 4);
				r += inData[offset];
				g += inData[offset + 1];
				b += inData[offset + 2];
				size++;
			}
		}
		
		outData[loc] = (r / size);
		outData[loc + 1] = (g / size);
		outData[loc + 2] = (b / size);
		outData[loc + 3] = inData[loc + 3];
    }
	
	function applyEdge (inData, outData, width, height, x, y){
		var gx = [ [ -1, 0, 1 ], [ -2, 0, 2 ], [ -1, 0, 1 ] ];  
        var gy = [ [ 1, 2, 1 ], [ 0, 0, 0 ], [ -1, -2, -1 ] ];  
				  
		var nx = 0, ny = 0;
		var size = 0;
		var loc = ((y) * width * 4) + ((x) * 4);
		
		for(i = -1; i <= 1; i++){
			for(j = -1; j <= 1; j++){
				if((x+i) < 0 || (y+j) < 0){
					continue;
				}
				
				var offset = ((y+j) * width * 4) + ((x+i) * 4);
				var gray = (inData[offset] + inData[offset + 1] + inData[offset + 2]) / 3;
				nx += gx[j + 1][ i + 1] * gray;
				ny += gy[j + 1][ i + 1] * gray;
			}
		}
		
		var pix = 255;
		if(((nx*nx) + (ny*ny)) > (128*128)){
			pix = 0;
		}
		
		pix = 255 - ((((nx*nx) + (ny*ny)) / (128*128)) * 255);
		if(pix <= 128){
			outData[loc] = pix;
			outData[loc + 1] = pix;
			outData[loc + 2] = pix;
		}else{
			outData[loc] = inData[loc];
			outData[loc + 1] = inData[loc + 1];
			outData[loc + 2] = inData[loc + 2];
		}
		outData[loc + 3] = inData[loc + 3];
    }
	
	function applyEdge2 (inData, outData, width, height, x, y){
		var gx = [ [ -1, 0, 1 ], [ -2, 0, 2 ], [ -1, 0, 1 ] ];  
        var gy = [ [ 1, 2, 1 ], [ 0, 0, 0 ], [ -1, -2, -1 ] ];  
				  
		var nx = 0, ny = 0;
		var size = 0;
		var loc = ((y) * width * 4) + ((x) * 4);
		
		for(i = -1; i <= 1; i++){
			for(j = -1; j <= 1; j++){
				if((x+i) < 0 || (y+j) < 0){
					continue;
				}
				
				var offset = ((y+j) * width * 4) + ((x+i) * 4);
				var gray = (inData[offset] + inData[offset + 1] + inData[offset + 2]) / 3;
				nx += gx[j + 1][ i + 1] * gray;
				ny += gy[j + 1][ i + 1] * gray;
			}
		}
		
		var pix = 255;
		if(((nx*nx) + (ny*ny)) > (128*128)){
			pix = 0;
		}
		
		pix = 255 - ((((nx*nx) + (ny*ny)) / (128*128)) * 255);
		
		outData[loc] = pix;
		outData[loc + 1] = pix;
		outData[loc + 2] = pix;
		outData[loc + 3] = inData[loc + 3];
    }
    // Effects
    
    var solarize = function (inData, outData, width, height, options, progress) {
        var n = width * height * 4,
            prog, lastProg = 0,
            r, g, b;

        for (i = 0; i < n; i += 4) {
            r = inData[i];
            g = inData[i + 1];
            b = inData[i + 2];

            outData[i] = r > 127 ? 255 - r : r;
            outData[i + 1] = g > 127 ? 255 - g : g;
            outData[i + 2] = b > 127 ? 255 - b : b;
            outData[i + 3] = inData[i + 3];

            if (progress) {
                prog = (i / n * 100 >> 0) / 100;
                if (prog > lastProg) {
                    lastProg = progress(prog);
                }
            }
        }
    };

    //function takepicture() {
    //    canvas.width = width;
    //    canvas.height = height;
    //    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    //    var data = canvas.toDataURL('image/png');
    //    photo.setAttribute('src', data);
    //}

    //startbutton.addEventListener('click', function (ev) {
    //    takepicture();
    //    ev.preventDefault();
    //}, false);


})();
