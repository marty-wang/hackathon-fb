(function () {

    var streaming = false,
        video = document.querySelector('#webcam'),
        canvas = document.querySelector('#raw-canvas'),
        target = document.querySelector('#target-canvas'),
        //photo = document.querySelector('#photo'),
        //startbutton = document.querySelector('#startbutton'),
        width = 320,
        height = 0;

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
        canvas.getContext('2d').drawImage(video, 0, 0, width, height);
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
    
    function onFrame(canvas) {
        var context = canvas.getContext("2d");
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        var ctx = target.getContext('2d');
        ctx.putImageData(imageData, 0, 0);

        var inData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var outData = createImageData(ctx, canvas.width, canvas.height);

        solarize(inData.data, outData.data, canvas.width, canvas.height);

        ctx.putImageData(outData, 0, 0);
    }

    requestAnimationFrame(refresh);
    
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