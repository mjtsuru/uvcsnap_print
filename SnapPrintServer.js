/**
 * Server App main
 */
"use strict";

/*
* Modules
*/
// for async control
const async = require('async');
// for http server
var HTTP = require( "http" );
var FS = require( "fs" );
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

//for the printout
const PDFDocument = require('pdfkit');
const doc = new PDFDocument({autoFirstPage:false});
var printer = require("printer"),
pdfpath = require('path');

/*
*
*/
const TMP_CAMERA_NAME_OSX = "BUFFALO BSWHD06M USB Camera'$'\r\n";
//TMP_CAMERA_NAME_OSX = "MX-1";

//Use chokidar
var scan_watcher = chokidar.watch('scanned_buffer', {
  persistent:true,
  ignoreInitial:true //without this flag, add events occurs when the watcher is created
});
var print_watcher = chokidar.watch('print_buffer', {
  persistent:true,
  ignoreInitial:true //without this flag, add events occurs when the watcher is created
});

scan_watcher.on('ready', function() { console.log("start"); })
	.on('add', function(path) { console.log("added file-> " + path); })
	.on('addDir', function(path) { console.log("added dir-> " + path); })
	.on('unlink', function(path) { console.log("removed file-> " + path); })
	.on('unlinkDir', function(path) { console.log("removed dir-> " + path); })
	.on('change', function(path) { console.log("modified-> " + path); })
	.on('error', function(error) { console.log("error-> " + error); });

print_watcher.on('ready', function() { console.log("start"); })
	.on('add', function(path) {
    //[TODO] Create unique file name
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
    console.log("added file-> " + path);
  })
	.on('addDir', function(path) { console.log("added dir-> " + path); })
	.on('unlink', function(path) { console.log("removed file-> " + path); })
	.on('unlinkDir', function(path) { console.log("removed dir-> " + path); })
	.on('change', function(path) {
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
    console.log("modified-> " + path); })
	.on('error', function(error) { console.log("error-> " + error); })


//server setting
var storage = multer.diskStorage({
  destination: './print_buffer',
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
var upload = multer({storage: storage});

app.use(express.static('.'));
app.use(express.static('scanned_images'));
app.use(bodyParser.json()) // for parsing application/x-www-form-urlencoded

app.get('/' , function(req, res){
    console.log('get req');
    res.sendFile(__dirname+'/index.html');
});

app.post('/print_buffer',  (req, res)  => {
    //console.log(req.body);
    console.log("received post request");

    const base64 = req.body.pad.split(',')[1];
    const decode = new Buffer.from(base64,'base64');
    //[TODO] make Unique file name
    FS.writeFile('print_buffer/picture.jpg', decode, (err) => {
        if(err){
            console.log(err)
        }else{
            console.log('saved');
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
      switch (data) {
        case 'scan':
          console.log('get picture');
          //capture(ack('captured'));
          Webcam.capture( "scanned_buffer/picture", function( err, data ) {
              if( err ) {
                  throw err;
              }
              ack('captured');
              socket.send('data', function onack(res) {
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
var Webcam = NodeWebcam.create({
    callbackReturn: "base64",
    saveShots: false,
    //device: TMP_CAMERA_NAME_OSX
});

function capture(callback) {
  //[TODO] Create unique filename
    Webcam.capture( "scanned_buffer/picture", function( err, data ) {
        if( err ) {
            throw err;
        }
        callback();
    });
}


//Start Server
http.listen(PORT, function(){
    console.log('server listening. Port:' + PORT);
});
