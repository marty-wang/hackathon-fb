(function () {

    var ratio = 0.75;
    //var widht = 320;
    var width = 640, height = width * ratio;
   
    //var connConfig = {host: '192.168.0.1', port: 9000};
    var connConfig = { key: '5bkpny04pqw4gqfr' };

    var payload = {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    };
    
    var myPayload = {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
    };

    function AppViewModel() {

        var self = this;

        self.connected = ko.observable(false);

        self.peerid = ko.observable();
        self.connectpeerid = ko.observable();
        self.commands = ko.observableArray([]);
        self.currentcommand = ko.observable();
        self.filters = ko.observableArray([0,0,0,0,0,0]); //store bloody filters

        self.myStream = null;
        self.otherStream = null;
        self.myVideo = null;
        self.otherVideo = null;
        self.myRawCanvas = $('#myRawCanvas')[0];
        self.otherRawCanvas = $('#otherRawCanvas')[0];
        self.myFinalCanvas = $('#myFinalCanvas')[0];
        self.otherFinalCanvas = $('#otherFinalCanvas')[0];
        self.connection = null;
        self.callConnection = null;

        new RtcCanvas('#myRawCanvas', false);
        new RtcCanvas('#otherRawCanvas', true);

        self.connectToPeer = function () {
            console.log(self.connectpeerid());
            self.connection = peer.connect(self.connectpeerid());
            setupCommandBinding(self.connection);
            var call = peer.call(self.connectpeerid(), self.myStream);
            self.callConnection = call;
            setupCallBinding(call);
        };

        self.sendCommand = function () {
            var cmd = self.currentcommand();
            console.log('adding command ' + cmd)
            self.commands.push(cmd);
            self.currentcommand("");
            self.connection.send(cmd);
        };

        self.receiveCommand = function(receivedCmd) {
            self.commands.push(receivedCmd);
        };

        self.disconnect = function () {
            self.callConnection.close();
        };

        //add remove filter
        self.addRemoveFilter = function (data, event) {
            var filterToRemoveOrEnable = event.target.id.split("_");
            console.log(filterToRemoveOrEnable[1]);
        };
    }

    var viewModel = new AppViewModel();

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
          viewModel.myStream = stream;
          var video = document.querySelector('#webcam');
          setElementSize(video, width, height);
          video.src = window.URL.createObjectURL(viewModel.myStream);
          video.play();
          viewModel.myVideo = video;

      },
      function (err) {
          console.log("An error occured! " + err);
          console.log(err);
      }
    );
    
    function setElementSize(element, width, height) {
        element.setAttribute('width', width);
        element.setAttribute('height', height);
    }

    var peer = new Peer(connConfig);
    //var peer = new Peer({ key: '5bkpny04pqw4gqfr' });

    peer.on('open', function (id) {
        console.log('My peer ID is: ' + id);
        viewModel.peerid(id);
    });

    //this manages making calls
    peer.on('call', function (call) {
        console.log("Call received");
        call.answer(viewModel.myStream);
        viewModel.callConnection = call;
        setupCallBinding(call);
    });

    //this manages command sending
    peer.on('connection', function (conn) {
        console.log('connection from ' + conn.peer);
        console.log(conn);
        viewModel.connectpeerid(conn.peer);
        viewModel.connection = conn;
        setupCommandBinding(conn);
    });

    function refresh() {
        var myRawCanvas = viewModel.myRawCanvas;
        var myRawCtx = myRawCanvas.getContext('2d');
        var myFinalCtx = viewModel.myFinalCanvas.getContext('2d');
        
        if (viewModel.myVideo) {
            myRawCtx.drawImage(viewModel.myVideo, 0, 0, width, height);
        }

        var otherRawCanvas = viewModel.otherRawCanvas;
        var otherRawCtx = otherRawCanvas.getContext('2d');
        var otherFinalCtx = viewModel.otherFinalCanvas.getContext('2d');
        
        if (viewModel.otherVideo) {
            otherRawCtx.drawImage(viewModel.otherVideo, 0, 0, width, height);
        }

        doEffect(myRawCtx, myPayload);
        doEffect(otherRawCtx, payload);

        //onFrame(canvas);
        requestAnimationFrame(refresh);
    }
    
    function doEffect(ctx, payload) {
        var inData = ctx.getImageData(0, 0, width, height);
        var outData = createImageData(ctx, width, height);

        var aa = new area(0, 0, 0, 0);
        
        var startx = payload.startX;
        var starty = payload.startY;
        var currx = payload.currentX;
        var curry = payload.currentY;

        if (startx < currx) {
            aa.x = startx;
            aa.width = currx - startx;
        } else {
            aa.x = currx;
            aa.width = startx - currx;
        }

        if (starty < curry) {
            aa.y = starty;
            aa.height = curry - starty;
        } else {
            aa.y = curry;
            aa.height = starty - curry;
        }

        applyArea(inData.data, outData.data, width, height, aa, applyEdge2);

        ctx.putImageData(outData, 0, 0);
    }
    
    requestAnimationFrame(refresh);

    ko.applyBindings(viewModel);
    
    function setupCallBinding(callConnection) {
        callConnection.on('stream', function (stream) {
            console.log('call stream');
            viewModel.connected(true);
            viewModel.otherStream = stream;
            viewModel.otherVideo = document.querySelector('#otherWebcam');
            setElementSize(viewModel.otherVideo, width, height);
            viewModel.otherVideo.src = window.URL.createObjectURL(viewModel.otherStream);
            viewModel.otherVideo.play();
        });

        callConnection.on('close', function () {
            console.log('close');
            viewModel.connected(false);
        });
    }

    function setupCommandBinding(commandConnection) {
        commandConnection.on('open', function () {
            commandConnection.on('data', function (data) {
                //console.log(data);
                myPayload = data;
                viewModel.receiveCommand(data);
            });
        });
    }

    function createImageData(ctx, width, height) {
        if (ctx.createImageData) {
            return ctx.createImageData(width, height);
        } else {
            return ctx.getImageData(0, 0, width, height);
        }
    }

    function RtcCanvas(selector, canDeface) {
        var self = this;
        self.$element = $(selector);
        setElementSize(self.$element[0], width, height);

        if (!canDeface) return;

        var startX, startY, isMouseDown = false;

        self.$element
            .mousedown(function (evt) {
                evt.preventDefault();
                isMouseDown = true;
                startX = evt.offsetX;
                startY = evt.offsetY;

                sendData(startX, startY, startX, startY);
            })
            .mouseup(function () {
                isMouseDown = false;
            })
            .mousemove(function (evt) {
                if (!isMouseDown) return;
               
                sendData(startX, startY, evt.offsetX, evt.offsetY);

            });

        self.$element
            .on('touchstart', function(evt) {
                
            })
            .on('touchend', function() {                
            })
            .on('touchcancel', function() {
            })
            .on('touchmove', function (evt) {
                evt.preventDefault();
                var touch = evt.originalEvent.changedTouches[0];
                var offset = self.$element.offset();
                var x = touch.pageX - offset.left;
                var y = touch.pageY - offset.top;

                console.log('x: ' + x + " y: " + y);
            });
    }
    
    function sendData(startX, startY, currentX, currentY) {
        
        payload = {
            startX: startX,
            startY: startY,
            currentX: currentX,
            currentY: currentY
        };
        
        viewModel.connection.send(payload);
    }
    
    function area(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;

        this.contains = function (xcoord, ycoord) {
            return xcoord >= this.x && ycoord >= this.y && xcoord <= (this.x + this.width) && ycoord <= (this.y + this.height);
        }

        this.empty = function () {
            return this.width == 0 && this.height == 0;
        }
    }
    
    function applyArea(inData, outData, width, height, area, filter) {
        var xstart = area.x;
        var ystart = area.y;
        var xend = xstart + area.width;
        var yend = ystart + area.height;


        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                var offset = (y * width * 4) + (x * 4);
                var r = inData[offset];
                var g = inData[offset + 1];
                var b = inData[offset + 2];
                if (area.contains(x, y) && !area.empty()) {
                    filter(inData, outData, width, height, x, y);
                } else {
                    outData[offset] = r;
                    outData[offset + 1] = g;
                    outData[offset + 2] = b;
                    outData[offset + 3] = inData[offset + 3];
                }
            }
        }
    }

    function applyGray(inData, outData, width, height, x, y) {
        var offset = (y * width * 4) + (x * 4);
        var r = inData[offset];
        var g = inData[offset + 1];
        var b = inData[offset + 2];

        var gray = (r + g + b) / 3;
        outData[offset] = gray;
        outData[offset + 1] = gray;
        outData[offset + 2] = gray;
        outData[offset + 3] = inData[offset + 3];
    }

    function applyBw(inData, outData, width, height, x, y) {
        var ny = y + 1;
        var nx = x + 1;

        var offset = (y * width * 4) + (x * 4);
        var r = inData[offset];
        var g = inData[offset + 1];
        var b = inData[offset + 2];

        var gray = (r + g + b) / 3;
        if (gray < 128) {
            gray = 0;
        } else {
            gray = 255;
        }
        outData[offset] = gray;
        outData[offset + 1] = gray;
        outData[offset + 2] = gray;
        outData[offset + 3] = inData[offset + 3];
    }

    function applyNAvg(inData, outData, width, height, x, y) {
        var r = 0;
        var g = 0;
        var b = 0;
        var size = 0;
        var loc = ((y) * width * 4) + ((x) * 4);

        for (i = -3; i <= 3; i++) {
            for (j = -3; j <= 3; j++) {
                if ((x + i) < 0 || (y + j) < 0) {
                    continue;
                }
                var offset = ((y + j) * width * 4) + ((x + i) * 4);
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

    function applyEdge(inData, outData, width, height, x, y) {
        var gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        var gy = [[1, 2, 1], [0, 0, 0], [-1, -2, -1]];

        var nx = 0, ny = 0;
        var size = 0;
        var loc = ((y) * width * 4) + ((x) * 4);

        for (i = -1; i <= 1; i++) {
            for (j = -1; j <= 1; j++) {
                if ((x + i) < 0 || (y + j) < 0) {
                    continue;
                }

                var offset = ((y + j) * width * 4) + ((x + i) * 4);
                var gray = (inData[offset] + inData[offset + 1] + inData[offset + 2]) / 3;
                nx += gx[j + 1][i + 1] * gray;
                ny += gy[j + 1][i + 1] * gray;
            }
        }

        var pix = 255;
        if (((nx * nx) + (ny * ny)) > (128 * 128)) {
            pix = 0;
        }

        pix = 255 - ((((nx * nx) + (ny * ny)) / (128 * 128)) * 255);
        if (pix <= 128) {
            outData[loc] = pix;
            outData[loc + 1] = pix;
            outData[loc + 2] = pix;
        } else {
            outData[loc] = inData[loc];
            outData[loc + 1] = inData[loc + 1];
            outData[loc + 2] = inData[loc + 2];
        }
        outData[loc + 3] = inData[loc + 3];
    }

    function applyEdge2(inData, outData, width, height, x, y) {
        var gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        var gy = [[1, 2, 1], [0, 0, 0], [-1, -2, -1]];

        var nx = 0, ny = 0;
        var size = 0;
        var loc = ((y) * width * 4) + ((x) * 4);

        for (i = -1; i <= 1; i++) {
            for (j = -1; j <= 1; j++) {
                if ((x + i) < 0 || (y + j) < 0) {
                    continue;
                }

                var offset = ((y + j) * width * 4) + ((x + i) * 4);
                var gray = (inData[offset] + inData[offset + 1] + inData[offset + 2]) / 3;
                nx += gx[j + 1][i + 1] * gray;
                ny += gy[j + 1][i + 1] * gray;
            }
        }

        var pix = 255;
        if (((nx * nx) + (ny * ny)) > (128 * 128)) {
            pix = 0;
        }

        pix = 255 - ((((nx * nx) + (ny * ny)) / (128 * 128)) * 255);

        outData[loc] = pix;
        outData[loc + 1] = pix;
        outData[loc + 2] = pix;
        outData[loc + 3] = inData[loc + 3];
    }
    
    function applySolarize(inData, outData, width, height, x, y) {
        var loc = ((y) * width * 4) + ((x) * 4);
        var r = inData[loc];
        var g = inData[loc + 1];
        var b = inData[loc + 2];

        outData[loc] = r > 127 ? 255 - r : r;
        outData[loc + 1] = g > 127 ? 255 - g : g;
        outData[loc + 2] = b > 127 ? 255 - b : b;
        outData[loc + 3] = inData[loc + 3];
    }

})();
