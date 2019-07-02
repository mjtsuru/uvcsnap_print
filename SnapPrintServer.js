/**
 * Server App main
 */
"use strict";

/*
*
*/
//const TMP_CAMERA_NAME_OSX = "BUFFALO BSWHD06M USB Camera'$'\r\n";
//const TMP_CAMERA_NAME_OSX = "FaceTime HD Camera";
//const TMP_CAMERA_NAME_OSX = 'default';
const TMP_CAMERA_NAME_OSX_1 = 3;
const TMP_CAMERA_NAME_OSX_2 = 4;

const URI_SCANNED_BUFFER = "scanned_buffer";
const URI_SCANNED_IMAGES = "scanned_images";
const URI_PRINT_BUFFER = "print_buffer";
const URI_SCAN_LIST = "scan_list";
const URI_REFRESH_SCAN = "refresh_scan";
const URI_EXEC_PRINT = "exec_print";
const LOCAL_SCANNED_BUFFER = URI_SCANNED_BUFFER;
const LOCAL_SCANNED_IMAGES = URI_SCANNED_IMAGES;
const LOCAL_PRINT_BUFFER = URI_PRINT_BUFFER;

/*
* Modules
*/
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
    //[TODO] Create unique file name
/*
    var writeStream = FS.createWriteStream('cvt_pdf.pdf');
    doc.pipe(writeStream);
    var img = doc.openImage(path);
    doc.addPage({size: [img.width, img.height]});
    doc.image(img, 0, 0);
    doc.end();
    writeStream.on('finish', function () {
      var filename = pdfpath.resolve(process.cwd(), 'cvt_pdf.pdf');
      console.log('printing file name ' + filename);

      FS.readFile(filename, function(err, data){
        if(err) {
          console.error('err:' + err);
          return;
        }
        console.log('data type is: '+typeof(data) + ', is buffer: ' + Buffer.isBuffer(data));
          printer.printDirect({
              data: data,
              type: 'PDF',
              success: function(id) {
                  console.log('printed with id ' + id);
              },
              error: function(err) {
                  console.error('error on printing: ' + err);
              }
          })
      });
    });
*/
    console.log("added file-> " + path);
  })
	.on('addDir', function(path) { console.log("added dir-> " + path); })
	.on('unlink', function(path) { console.log("removed file-> " + path); })
	.on('unlinkDir', function(path) { console.log("removed dir-> " + path); })
	.on('change', function(path) {
/*
    var writeStream = FS.createWriteStream('cvt_pdf.pdf');
    doc.pipe(writeStream);
    var img = doc.openImage(path);
    doc.addPage({size: [img.width, img.height]});
    doc.image(img, 0, 0);
    doc.end();
    writeStream.on('finish', function () {
      var filename = pdfpath.resolve(process.cwd(), 'cvt_pdf.pdf');
      console.log('printing file name ' + filename);

      FS.readFile(filename, function(err, data){
        if(err) {
          console.error('err:' + err);
          return;
        }
        console.log('data type is: '+typeof(data) + ', is buffer: ' + Buffer.isBuffer(data));
          printer.printDirect({
              data: data,
              type: 'PDF',
              success: function(id) {
                  console.log('printed with id ' + id);
              },
              error: function(err) {
                  console.error('error on printing: ' + err);
              }
          })
      });
*/
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

app.use(express.static('.'));
//To Provide scanned file list
app.use(express.static(URI_SCAN_LIST));
//Command URI endpoint
app.use(express.static(URI_REFRESH_SCAN));
app.use(express.static(URI_SCANNED_IMAGES));
app.use(bodyParser.json()) // for parsing application/x-www-form-urlencoded

app.get('/' , function(req, res){
    console.log('get req');
    res.sendFile(__dirname+'/index.html');
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
    if (err) throw err;
    console.log(files);
  })

  // [TODO] Transform jpg to pdf then issue jobs to the printers.
  // Monitor printer jobs and care

  // response should be sent immediately.
  // Now responding with Internal Server Error.
  res.sendStatus(500);
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
io.on('connection',function(socket){
    console.log('connected');

    socket.on('msg', function(data, ack) {
      console.log('received emit');
      console.log(data);
      ack('ack for emit');
    });

    socket.on('message', function(data, ack) {
      now = new Date();
      var filename = date(now, 'yyyymmddHHMMssl');

      switch (data) {
        case 'scan_device1':
          console.log('device1 scan');
          Webcam_1.capture( LOCAL_SCANNED_BUFFER + "/" + filename, function( err, data ) {
              if( err ) {
                  throw err;
              }
              scanned_file_list.files.push(filename + ".jpg");
              console.log(JSON.stringify(scanned_file_list));
              ack('captured');
              var msg = new Object();
              msg.device = 1;
              msg.filename = filename + ".jpg";
              socket.send(JSON.stringify(msg), function onack(res) {
                console.log(res);
              });
          });
        break;
        case 'scan_device2':
          console.log('device2 scan');
          Webcam_2.capture( LOCAL_SCANNED_BUFFER + "/" + filename, function( err, data ) {
              if( err ) {
                  throw err;
              }
              scanned_file_list.files.push(filename + ".jpg");
              console.log(JSON.stringify(scanned_file_list));
              ack('captured');
              var msg = new Object();
              msg.device = 2;
              msg.filename = filename + ".jpg";
              socket.send(JSON.stringify(msg), function onack(res) {
                console.log(res);
              });
          });
        break;
      }
      console.log('received send');

    });
});


//Webcam usage
var NodeWebcam = require( "node-webcam" );
var Webcam_1 = NodeWebcam.create({
    callbackReturn: "base64",
    saveShots: false,
    //width: 1280,
    //height: 720,
    device: TMP_CAMERA_NAME_OSX_1,
    output: "jpeg",
    //verbose: true
});

var Webcam_2 = NodeWebcam.create({
    callbackReturn: "base64",
    saveShots: false,
    //width: 1920,
    //height: 1080,
    device: TMP_CAMERA_NAME_OSX_2,
    output: "jpeg"
    //verbose: true
});

//Start Server
http.listen(PORT, function(){
    console.log('server listening. Port:' + PORT);
});
