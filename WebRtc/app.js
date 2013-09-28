(function () {

    var ratio = 0.75;
    //var widht = 320;
    var width = 640, height = width * ratio;
   
    //var connConfig = {host: '192.168.0.1', port: 9000};
    var connConfig = { key: '5bkpny04pqw4gqfr' };

    function AppViewModel() {

        var self = this;

        self.peerid = ko.observable();
        self.connectpeerid = ko.observable();
        self.commands = ko.observableArray([]);
        self.currentcommand = ko.observable();

        self.myStream = null;
        self.otherStream = null;
        self.myVideo = null;
        self.otherVideo = null;
        self.myRawCanvas = $('#myRawCanvas')[0];
        self.otherRawCanvas = $('#otherRawCanvas')[0];
        self.myFinalCanvas = $('#myFinalCanvas')[0];
        self.otherFinalCanvas = $('#otherFinalCanvas')[0];
        self.connection = null;

        new RtcCanvas('#myRawCanvas');
        new RtcCanvas('#otherRawCanvas');

        self.connectToPeer = function () {
            console.log(self.connectpeerid());
            self.connection = peer.connect(self.connectpeerid());
            setupCommandBinding(self.connection);
            var call = peer.call(self.connectpeerid(), self.myStream);
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

    peer.on('open', function (id) {
        console.log('My peer ID is: ' + id);
        viewModel.peerid(id);
    });

    //this manages making calls
    peer.on('call', function (call) {
        console.log("Call received");
        call.answer(viewModel.myStream);
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
        
        var inData = myRawCtx.getImageData(0, 0, width, height);
        var outData = createImageData(myRawCtx, width, height);

        solarize(inData.data, outData.data, width, height);
        myRawCtx.putImageData(outData, 0, 0);

        inData = otherRawCtx.getImageData(0, 0, width, height);
        outData = createImageData(otherRawCtx, width, height);
        
        solarize(inData.data, outData.data, width, height);
        otherRawCtx.putImageData(outData, 0, 0);

        //onFrame(canvas);
        requestAnimationFrame(refresh);
    }
    
    requestAnimationFrame(refresh);

    ko.applyBindings(viewModel);
    
    function setupCallBinding(callConnection) {
        callConnection.on('stream', function (stream) {
            console.log('call stream');
            viewModel.otherStream = stream;
            viewModel.otherVideo = document.querySelector('#otherWebcam');
            setElementSize(viewModel.otherVideo, width, height);
            viewModel.otherVideo.src = window.URL.createObjectURL(viewModel.otherStream);
            viewModel.otherVideo.play();

        });
    }

    function setupCommandBinding(commandConnection) {
        commandConnection.on('open', function () {
            commandConnection.on('data', function (data) {
                console.log(data);
                viewModel.receiveCommand(data);
            });
        });
    }

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

    function createImageData(ctx, width, height) {
        if (ctx.createImageData) {
            return ctx.createImageData(width, height);
        } else {
            return ctx.getImageData(0, 0, width, height);
        }
    }

    function RtcCanvas(selector) {
        var self = this;
        self.$element = $(selector);
        var isMouseDown = false;
        var ctx = self.$element[0].getContext('2d');

        setElementSize(self.$element[0], width, height);

        self.$element
            .mousedown(function() {
                isMouseDown = true;
            })
            .mouseup(function () {
                isMouseDown = false;
            })
            .mousemove(function (evt) {
                if (!isMouseDown) return;

                var x = evt.offsetX;
                var y = evt.offsetY;
                
                console.log("x: " + x + " y: " + y);
                //var pixelData = ctx.getImageData(x, y, 1, 1).data;
                //console.log(pixelData);
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

})();