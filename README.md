# uvcsnap_print

Node.js based server providing snap taking function with uvc camera and printing function with hardware printer.

## Description

Integrating node packages to provide hardware control services for an art project. Handling functions of scan and print. Hardware devices used are... 1. UVC cameras for taking snaps. 2. Printers for printing. Acting as a back-end server for front-end applications like Web, Unity, etc. Websocket (socket.io) can be used optionally for the interactive messaging.

## Requirement

### Host: Windows10 64bit, MacOSX  

### Node.js: v8.10.0
### Python2.X

### Packages:  
#### Node  

node-webcam (UVC camera)  
https://www.npmjs.com/package/node-webcam  

node-printer (Printer)  
https://github.com/tojocky/node-printer  

jimp (Image Processing)  
https://github.com/oliver-moran/jimp  

socket.io (messaging option)  
https://github.com/socketio/socket.io  

**(OSX Only)** imagesnap  
https://github.com/rharder/imagesnap  

#### Python  
**(Windows)** win32print  

PIL

## Usage

### 1. Provide scanned images  
#### 1-1. interactive messaging (optional)
Scanning can be triggered with socket.io messages.  
Scanned images are firstly in **/scanned_buffer** location.
This server can push the message of new snap taking with file name to the client application.  
If the client application runs locally and only need all images scanned, please just share **scanned_buffer** directory.
[TODO] Detailed API and examples  

#### 1-2. REST APIs for getting newly scanned images
The name of image files in the buffer (sequentially scanned and not yet known by the app) are listed in a JSON format.  

HTTP GET Request to the URI **/scan_list** provides the file name list. The request for the list also triggers the files in **/scanned_buffer** move to **/scanned_images**.  
HTTP GET Request to the file under **/scanned_images** provides the image file.  
HTTP GET Request to the URI **/refresh_scan** triggers the deletion of files under **/scanned_images** and elements in the list (works just as a command).

##### 1-2-1
* **URI**

  scan_list

* **Method**
  GET

* **Success Response:**
  * **Content:** JSONString

* **Error Response:**
  * **Code:** 404 NOTFOUND

##### 1-2-2
* **URI**

  scanned_images

* **Method**
  GET

* **Success Response:**
  * **Content:** jpeg

* **Error Response:**
  * **Code:** 404 NOTFOUND

##### 1-2-3
* **URI**

  refresh_scan

* **Method**
  GET

* **Success Response:**
  * **Code:** 200 OK

* **Error Response:**
  * **Code:** 500 INTERNALSERVERERROR

### 2. Print received images
The expected user-case is that the application processes images then puts them for the printing. Note that 1 to 6 images in certain intervals (called "block") are expected be printed out.
#### 2-1. REST APIs
The server accepts HTTP POST Request to the URI **/print_buffer** with the image file.
After all the files in one "block" is put, please issue the HTTP GET Request to the URI **/exec_print** (works just as a command). It triggers the server to print all the images in the "block" then **print_buffer** is flushed.

##### 2-1-1
* **URI**

  print_buffer

* **Method**
  POST

* **Success Response:**
  * **Code:** 200 OK

* **Error Response:**
  * TBD

#### 2-2. Use locally
If the client application runs locally, just put the image files to be printed out to **print_buffer** directory then issue the GET Request to **/exec_print** after the "block" of images are put like the previous section.

* **URI**

  exec_print

* **Method**
  GET

* **Success Response:**
  * **Code:** 200 OK

* **Error Response:** 500 INTERNALSERVERERROR

## Install
*  **Install nvm.**  

  On Windows  
  https://qiita.com/akuden/items/a88630de9624039c4135

* **Use node v8.10.0.**  
```
nvm install v8.10.0
nvm use v8.10.0
```
Then Please confirm npm also works.
```
npm --version
```

* ***(OSX Only)*** **Install imagesnap**  
```
brew install imagesnap
```

* **Install node packages**
```
npm install windows-build-tools
npm install node-webcam printer async fs glob express body-parser multer socket.io chokidar dateformat pdfkit path commander jimp
```

* **Install git.**

  On Windows  
  https://git-scm.com/

* **Clone this repo.**
```
git clone https://github.com/mjtsuru/uvcsnap_print.git
cd uvcsnap_print
```

* **Try Server**  

Start the server for the test.
```
node SnapPrintServer.js --cam1 3 --cam2 4 --app p
```
Note that cam1 and cam2 options set the uvc camera device name (in Windows, these are numbers).  
"app" option accept 'r':reception and 'p':playground.  

* In OSX, know the name of your uvc cameras by imagesnap.  
```
imagesnap -ls
```  
Then set the cam1 and cam2 options with the name like below.
```
node SnapPrintServer.js --cam1 'FaceTime HD Camera' --cam2 'FaceTime HD Camera'  
```

A sample client is provided.  
Please access **http://localhost** then you can take uvc snaps from buttons.
