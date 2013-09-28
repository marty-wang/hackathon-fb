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
        isMouseDown = false;

    $(target).mousedown(function() {
        isMouseDown = true;
    });

    $(target).mouseup(function() {
        isMouseDown = false;
    });

    $(target).mousemove(function (evt) {
        if (!isMouseDown) return;
        
        var x = evt.offsetX;
        var y = evt.offsetY;
        var pixelData = targetCtx.getImageData(x, y, 1, 1).data;
        console.log("x: " + x + " y: " + y);
        console.log(pixelData);
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

        var aa = new area(0,0, canvas.width/2, canvas.height/2);
	    applyArea(inData.data, outData.data, canvas.width, canvas.height, aa);
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
    }

    requestAnimationFrame(refresh);
    //Apply filter area
    var applyArea = applyFilterArea(inData, outData, width, height, area){
        var xstart = area.x;
	    var ystart = area.y;
        var xend = xstart + area.width;
	    var yend = ystart + area.height;
	
	    for(x = xstart; x < xend; x++){
		    for(y = ystart; y < yend; y++){
		        var offset = (y*width) + (x * 4);
		        var r = inData[offset];
	            var g = inData[offset + 1];
                var b = inData[offset + 2];
		        var gray = (r+g+b) / 3;
		        
                outData[offset] = gray;
                outData[offset + 1] = gray;
                outData[offset + 2] = gray;
                outData[offset + 3] = inData[offset + 3];
		    }
	    }
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
