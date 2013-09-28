var printed = false;

var target = document.getElementById('canvas');
var ctx = target.getContext('2d');
var p = new Pixastic(ctx);

var filter = {
    effect: "posterize",
    options: {
        levels: 5
    }
};

var applied = false;

setTimeout(function() {
    applied = true;
}, 1000);
                

function createImageData(ctx, width, height) {
    if (ctx.createImageData) {
        return ctx.createImageData(width, height);
    } else {
        return ctx.getImageData(0, 0, width, height);
    }
}

var solarize = function(inData, outData, width, height, options, progress) {
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

camera.init({
    fps: 30,
    mirror: true,
    //targetCanvas: target,
    onFrame: function (canvas) {
        if (true) {
            
            
            var context = canvas.getContext("2d");
            var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            //var length = pixelData.data.length;
            //for (var i = 0; i < length; i += 4) {
            //    pixelData.data[i] = pixelData.data[i] * ratio;
            //    pixelData.data[i + 1] = pixelData.data[i + 1] * ratio;
            //    pixelData.data[i + 2] = pixelData.data[i + 2] * ratio;
            //}

            //$(target).hide();
            
            var ctx = target.getContext('2d');
            ctx.putImageData(imageData, 0, 0);
            
            var inData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            //console.log(inData);

            var outData = createImageData(ctx, canvas.width, canvas.height);
            //console.log("outdata");
            //console.log(outData);

            solarize(inData.data, outData.data, canvas.width, canvas.height);

            

            ctx.putImageData(outData, 0, 0);

            //var ctx = canvas.getContext('2d');
            //setTimeout(function () {
            //    var p = new Pixastic(ctx);
            //    window.p = p;
            //    p['solarize']().done(function () {
            //        $(target).show();
            //    });
            //}, 1000);
        }

        
    }
});