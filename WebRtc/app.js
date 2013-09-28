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
        self.myCanvas = null;
        self.otherCanvas = null;
        self.connection = null;

        self.connectToPeer = function () {
            console.log(self.connectpeerid());
            self.connection = peer.connect(self.connectpeerid());
            var call = peer.call(self.connectpeerid(), self.myStream);

            call.on('stream', function (stream) {
                console.log('call stream');
                viewModel.otherStream = stream;
                viewModel.otherVideo = document.querySelector('#otherWebcam');
                viewModel.otherVideo.src = window.URL.createObjectURL(viewModel.otherStream);
                viewModel.otherVideo.play();
            });
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
      },
      function (err) {
          console.log("An error occured! " + err);
          console.log(err);
      }
    );

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

        call.on('stream', function (stream) {
            console.log('call stream');
            viewModel.otherStream = stream;
            viewModel.otherVideo = document.querySelector('#otherWebcam');
            viewModel.otherVideo.src = window.URL.createObjectURL(viewModel.otherStream);
            viewModel.otherVideo.play();
        });
    });



    //this manages command sending
    peer.on('connection', function (conn) {
        console.log('connection from ' + conn.peer);
        console.log(conn);
        viewModel.connectpeerid(conn.peer);
        viewModel.connection = conn;

        viewModel.connection.on('open', function () {
            viewModel.connection.on('data', function (data) {
                console.log(data);
                viewModel.receiveCommand(data);
            });
        });
    });

    function refresh() {
        rawCtx.drawImage(video, 0, 0, width, height);
        //onFrame(canvas);
        requestAnimationFrame(refresh);
    }

    ko.applyBindings(viewModel);


})();