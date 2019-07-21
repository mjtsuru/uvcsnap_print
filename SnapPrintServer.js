/**
 * Server App main
 */
"use strict";

/*
*
*/
var CAMERA_NAME_1 = 3;
var CAMERA_NAME_2 = 4;

const URI_SCANNED_BUFFER = "scanned_buffer";
const URI_SCANNED_IMAGES = "scanned_images";
const URI_PRINT_BUFFER = "print_buffer";
const URI_SCAN_LIST = "scan_list";
const URI_REFRESH_SCAN = "refresh_scan";
const URI_EXEC_PRINT = "exec_print";
const LOCAL_SCANNED_BUFFER = URI_SCANNED_BUFFER;
const LOCAL_SCANNED_IMAGES = URI_SCANNED_IMAGES;
const LOCAL_PRINT_BUFFER = URI_PRINT_BUFFER;

const APP_RECEPTION = 'r';
const APP_PLAYGROUND = 'p';
var APP_SELECT = APP_RECEPTION;

const CROPSIZE_W = 720;
const CROPSIZE_H = 1115;
/*
* Modules
*/
var program = require('commander');
// for async control
const async = require('async');
// for http server
var HTTP = require( "http" );
var FS = require( "fs" );
var glob = require("glob");
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var app = express();
var http = require('http').Server(app);
// for interactive messaging
const io = require('socket.io')(http);
const PORT = process.env.PORT || 80;
// for the filesystem monitoring
var chokidar = require('chokidar');
// for the filename timestamp
var date = require('dateformat');
var now = new Date();

//for the printout
const PDFDocument = require('pdfkit');
const doc = new PDFDocument({autoFirstPage:false});
var printer = require("printer"),
pdfpath = require('path');
  //Use Python script for windows
const spawn = require('child_process').spawn;
const scriptExecution = spawn("python.exe", ["test_pythonshell.py"]);

//Command Arguments
program
  .option('--cam1 <text>')
  .option('--cam2 <text>', 'Set uvc camera 2')
  .option('--app <text>')
  .parse(process.argv);

//Parse args
var ops = program.opts();
if (isNaN(parseInt(ops.cam1))) {
  CAMERA_NAME_1 = ops.cam1;
} else {
  CAMERA_NAME_1 = parseInt(ops.cam1);
}

if (isNaN(parseInt(ops.cam2))) {
  CAMERA_NAME_2 = ops.cam2;
} else {
  CAMERA_NAME_2 = parseInt(ops.cam2);
}

if (isNaN(parseInt(ops.app))) {
  if (ops.app == APP_RECEPTION) {
    APP_SELECT = ops.app;
    console.log('Working for Reception app');
  } else if (ops.app == APP_PLAYGROUND) {
    APP_SELECT = ops.app;
    console.log('Working for Playground app');
  } else {
    console.log("app option error. default app is selected");
  }
} else {
  var whichapp = parseInt(ops.app);
  if (whichapp == 0) {
    APP_SELECT = APP_RECEPTION;
    console.log('Working for Reception app');
  } else if (whichapp == 1) {
    APP_SELECT = APP_PLAYGROUND;
    console.log('Working for Playground app');
  } else {
    console.log("app option error. default app is selected");
  }
}

//Use chokidar
var scan_watcher = chokidar.watch(LOCAL_SCANNED_BUFFER, {
  persistent:true,
  ignoreInitial:true //without this flag, add events occurs when the watcher is created
});
var print_watcher = chokidar.watch(LOCAL_PRINT_BUFFER, {
  persistent:true,
  ignoreInitial:true //without this flag, add events occurs when the watcher is created
});

scan_watcher.on('ready', function() { console.log("start watching " + LOCAL_SCANNED_BUFFER); })
	.on('add', function(path) { console.log("added file-> " + path); })
	.on('addDir', function(path) { console.log("added dir-> " + path); })
	.on('unlink', function(path) { console.log("removed file-> " + path); })
	.on('unlinkDir', function(path) { console.log("removed dir-> " + path); })
	.on('change', function(path) { console.log("modified-> " + path); })
	.on('error', function(error) { console.log("error-> " + error); });

print_watcher.on('ready', function() { console.log("start watching " + LOCAL_PRINT_BUFFER); })
	.on('add', function(path) {
    console.log("added file-> " + path);
  })
	.on('addDir', function(path) { console.log("added dir-> " + path); })
	.on('unlink', function(path) { console.log("removed file-> " + path); })
	.on('unlinkDir', function(path) { console.log("removed dir-> " + path); })
	.on('change', function(path) {
    console.log("modified-> " + path); })

	.on('error', function(error) { console.log("error-> " + error); })


//server setting
//filelist
var scanned_file_list = new Object();
scanned_file_list.files = [];

var storage = multer.diskStorage({
  destination: './' + LOCAL_PRINT_BUFFER,
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
var upload = multer({storage: storage});

app.use(express.static('/'));
app.use(express.static('.'));
//To Provide scanned file list
app.use(express.static(URI_SCAN_LIST));
//Command URI endpoint
app.use(express.static(URI_REFRESH_SCAN));
app.use(express.static(URI_SCANNED_IMAGES));
app.use(bodyParser.json()) // for parsing application/x-www-form-urlencoded

app.get('/' , function(req, res){
    console.log('Webapp opened');
    if (APP_SELECT == APP_RECEPTION) {
      res.sendFile(__dirname+'/reception.html');
    } else {
      res.sendFile(__dirname+'/playground.html');
    }
});

app.get('/' + URI_SCAN_LIST , function(req, res){
    console.log('list request');

    //async series for staging up files from buffer
    async.series([
      (cb) => {
        async.each(scanned_file_list.files, function(i, cb_each) {
          console.log("staging file: " + i);
          FS.renameSync(LOCAL_SCANNED_BUFFER + "/" + i, LOCAL_SCANNED_IMAGES + "/" + i);
          cb_each(null);
        });
        cb(null);
      },
      (cb) => {
        console.log("staging finished");
        res.send(JSON.stringify(scanned_file_list));
        var msg = new Object();
        msg.refresh = true;
        my_socket.send(JSON.stringify(msg),function onack(res) {
          console.log(res);
        });
      },
    ]);
});

app.get('/' + URI_REFRESH_SCAN, function(req, res) {

  async.series([
    (cb) => {
      //remove files
      async.each(scanned_file_list.files, function(i, cb_each) {
        console.log("removing file: " + LOCAL_SCANNED_IMAGES + "/" + i);
        FS.unlink(LOCAL_SCANNED_IMAGES + "/" + i, (err) => {
          if (err) throw err;
          cb_each(null);
        });
      });
      cb(null)
    },
    (cb) => {
      //refreshing list
      scanned_file_list.files = [];
      res.sendStatus(200);
    }
  ])
});

app.get('/' + URI_EXEC_PRINT, function(req, res) {
  //Execute printing out files under print Buffer
  //get file list in the Buffer
  glob(LOCAL_PRINT_BUFFER + "/*.jpg", function(err, files) {
    if (err) {
      res.sendStatus(500);
      throw err;
    }
    var printfile_list = new Object();
    printfile_list.list = files;
    //[TODO] Handle when no files are under the print buffer
    console.log("printing :" + printfile_list.list);

    //ask python script for printing
    const scriptExecution = spawn("python.exe", ["test_pythonshell.py"]);
    scriptExecution.stdout.on('data', (data) => {
        console.log(String.fromCharCode.apply(null, data));
        async.each(printfile_list.list, function(i, cb_each) {
          console.log("removing file: " + i);
          FS.unlink(i, (err) => {
            if (err) throw err;
            cb_each(null);
          });
        });
    });
    scriptExecution.stdin.write(JSON.stringify(printfile_list));
    scriptExecution.stdin.end();
  });
  res.sendStatus(200);
});

app.post('/' + URI_PRINT_BUFFER,  (req, res)  => {
    //console.log(req.body);
    console.log("received post request");

    const base64 = req.body.pad.split(',')[1];
    const decode = new Buffer.from(base64,'base64');
    //[TODO] make Unique file name
    now = new Date();
    var filename = date(now, 'yyyymmddHHMMssl');
    FS.writeFile(LOCAL_PRINT_BUFFER + '/' + filename + 'p.jpg', decode, (err) => {
        if(err){
            console.log(err)
        }else{
            console.log('saved');
            res.sendStatus(200);
        }
    });
});

//socket.io messaging
var my_socket;
io.on('connection',function(socket){
  my_socket = socket;
    console.log('connected');

    socket.on('msg', function(data, ack) {
      console.log('received emit');
      console.log(data);
      ack('ack for emit');
    });

    socket.on('rem_buf', function(data, ack) {
      console.log('remove buffer: ' + data);
      if (data != null) {
        FS.unlink(URI_SCANNED_BUFFER + "/" + data, (err) => {
          if (err) throw err;
        });
        scanned_file_list.files.some(function(v, i){
          if (v==data) scanned_file_list.files.splice(i,1);
        });
        console.log(scanned_file_list);

        ack('remove done');
      } else {
        ack('nothing to remove');
      }
    });

    socket.on('stage_buf', function(data, ack) {
      console.log('staging: ' + data);
      if (data != null) {
        FS.renameSync(LOCAL_SCANNED_BUFFER + "/" + data, LOCAL_SCANNED_IMAGES + "/" + data);
        ack('staging done');
      }
    })

    socket.on('message', function(data, ack) {
      now = new Date();
      var filename = date(now, 'yyyymmddHHMMssl');

      switch (data) {
        case 'scan_device1':
          console.log('device1 scan');
          Webcam_1.capture( 'tmp1', function( err, data ) {
              if( err ) {
                  throw err;
              }
              Jimp.read('tmp1.bmp', (err, func) => {
                if (err) throw err;
                func
                  .rotate(-90)
                  .crop(0, 0, CROPSIZE_W, CROPSIZE_H)
                  .write(LOCAL_SCANNED_BUFFER + "/" + filename + ".jpg", jimpwritecallback(socket, ack, filename, 1));
              });
          });
        break;
        case 'scan_device2':
          console.log('device2 scan');
          Webcam_2.capture('tmp2', function( err, data ) {
              if( err ) {
                  throw err;
              }
              Jimp.read('tmp2.bmp', (err, func) => {
                if (err) throw err;
                if (APP_SELECT == APP_RECEPTION) {
                  func
                    .rotate(-90)
                    .crop(0, 0, CROPSIZE_W, CROPSIZE_H)
                    .write(LOCAL_SCANNED_BUFFER + "/" + filename + ".jpg", jimpwritecallback(socket, ack, filename, 2));
                } else {
                  func
                    .rotate(-90)
                    .crop(0, 0, 1080, 1673)
                    .resize(720, 1115)
                    .write(LOCAL_SCANNED_BUFFER + "/" + filename + ".jpg", jimpwritecallback(socket, ack, filename, 2));
                }
              });
          });
        break;
      }
      console.log('received send');

    });
});

//Responding after image processing is finished
function jimpwritecallback(socket, ack, filename, device) {
  scanned_file_list.files.push(filename + ".jpg");
  console.log(JSON.stringify(scanned_file_list));
  ack('captured');
  var msg = new Object();
  msg.device = device;
  msg.filename = filename + ".jpg";
  socket.send(JSON.stringify(msg), function onack(res) {
    console.log(res);
  });
}

//Webcam usage
var NodeWebcam = require( "node-webcam" );
//image processing
var Jimp = require("jimp");

var Webcam_1 = NodeWebcam.create({
    callbackReturn: "base64",
    saveShots: false,
    device: CAMERA_NAME_1,
    output: "bmp",
});

var Webcam_2 = NodeWebcam.create({
    callbackReturn: "base64",
    saveShots: false,
    device: CAMERA_NAME_2,
    output: "bmp",
});

//Start Server
http.listen(PORT, function(){
    console.log('server listening. Port:' + PORT);
});
