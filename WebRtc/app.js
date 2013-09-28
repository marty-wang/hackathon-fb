(function () {

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
        self.connection = null;

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
          video.src = window.URL.createObjectURL(viewModel.myStream);
          video.play();
          viewModel.myVideo = video;

          setElementSize(viewModel.myRawCanvas, 640, 480);
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

    //var peer = new Peer({host: '192.168.0.1', port: 9000});
    var peer = new Peer({ key: '5bkpny04pqw4gqfr' });

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
        var width = 640, height = 480;
        var myRawCanvas = viewModel.myRawCanvas;
        var myRawCtx = myRawCanvas.getContext('2d');
        
        if (viewModel.myVideo) {
            myRawCtx.drawImage(viewModel.myVideo, 0, 0, width, height);
        }

        var otherRawCanvas = viewModel.otherRawCanvas;
        var otherRawCtx = otherRawCanvas.getContext('2d');
        
        if (viewModel.otherVideo) {
            otherRawCtx.drawImage(viewModel.otherVideo, 0, 0, width, height);

        }

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
            viewModel.otherVideo.src = window.URL.createObjectURL(viewModel.otherStream);
            viewModel.otherVideo.play();

            setElementSize(viewModel.otherRawCanvas, 640, 480);
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

})();