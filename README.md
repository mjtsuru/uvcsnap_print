# uvcsnap_print

Node.js based server providing snap taking function with uvc camera and printing function with hardware printer.

## Description

Integrating node packages to provide hardware control services for an art project. Handling functions of scan and print. Hardware devices used are... 1. UVC cameras for taking snaps. 2. Printers for printing. Acting as a back-end server for front-end apps like Web / Unity / etc. Websocket (socket.io) can be used optionally for the interactive messaging.

## Requirement

Host: Windows10 64bit, MacOSX  

Node.js: v8.10.0

Packages:  
node-webcam (UVC camera)  
https://www.npmjs.com/package/node-webcam  

node-printer (Printer)  
https://github.com/tojocky/node-printer  

socket.io (messaging option)  
https://github.com/socketio/socket.io

## Usage

### 1. Provide scanned images  
#### 1-1. interactive messaging (optional)
Scanning can be triggered with socket.io messages.  
Scanned images are firstly in /scanned_buffer location.
This server can push the message of new snap taking with file name to the client application.  
If the client application runs locally and only need all images scanned, please just share /scanned_buffer directory.
[TODO] Detailed API and examples  

#### 1-2. REST APIs for getting newly scanned images
The name of image files in the buffer (sequentially scanned and not yet known by the app) are listed in a JSON format.  

HTTP GET Request to the URI /list provides the file name list. The request for the list also triggers the file in /buffer moves to the /scanned_images.

HTTP GET Request to the file under /scanned_images provides the image file.  

HTTP GET Request to the URI /refresh triggers the deletion of files under /scanned_images and elements in the list.

### 2. Print received images
Expected user-case is that the application process the images and put it for the printing. Note that 1 to 6 images in certain intervals (called "block") are expected be printed out.
#### 2-1. REST APIs
The server accepts HTTP POST Request to the URI /print_buffer with the image file.
After all the file in one "block" is put, please issue the HTTP GET Request to the URI /exec_print (works just as a command). It triggers the server to print all the images in the "block" then print_buffer is flushed.

#### 2-2. Use locally
If the client application runs locally, just put the image files to be printed out to /print_buffer directory then issue the /exec_print REST command after the "block" of images are put like the previous section.

## Install
[TODO]
