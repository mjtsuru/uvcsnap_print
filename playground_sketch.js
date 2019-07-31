//For Reception
CANVAS_BACK_DIV = 0.505;
CANVAS_BACK_W = 2560 * CANVAS_BACK_DIV;
CANVAS_BACK_H = 1440 * CANVAS_BACK_DIV;
CANVAS_BACK_OFFSET_W =-5;
CANVAS_BACK_OFFSET_H =-5;

BACK_DIV = 0.5;
BACK_IMG_W = 2560 * BACK_DIV;
BACK_IMG_H = 1440 * BACK_DIV;
//はがきは 100mm x 148mm ここははがきサイズ想定になっている
//1585 x 2345
SCAN_IMG_W = 100;
SCAN_IMG_H = 148;
SCAN_IMG_INNER_PADDING_X = 5;
SCAN_IMG_INNER_PADDING_Y = 8;


SCAN_IMG_DIV = 0.523;
SCAN_IMG_X_ZERO = 32.5;
SCAN_IMG_Y_ZERO = 409;
SCAN_IMG_X_PADDING = 204.85;

STATUS_H = 37.7; //1585 x 314 --- 190.5 x 37.7
CANVAS_UPPER_X = 100;
CANVAS_LEFT_X = 100;
CANVAS_LEFTEND_MARGIN = 100;
CANVAS_MARGIN = 20;

var tint_val_scan1 = 255;
var tint_val_scan2 = 255;
var tint_val_scan3 = 255;
var tint_val_scan4 = 255;
var tint_val_scan5 = 255;
var tint_val_scan6 = 255;

IMG_NUMBER = 6;

var img_scan1_src;
SCAN1_STATUS_OK = 0;
SCAN1_STATUS_DOING = 1;
SCAN1_STATUS_LOADING = 2;
SCAN1_STATUS_LOADED = 3;
SCAN1_STATUS_BATSU = 4;
var scan1_status = SCAN1_STATUS_OK;

var img_scan2_src;
SCAN2_STATUS_OK = 0;
SCAN2_STATUS_DOING = 1;
SCAN2_STATUS_LOADING = 2;
SCAN2_STATUS_LOADED = 3;
SCAN2_STATUS_BATSU = 4;
var scan2_status = SCAN2_STATUS_OK;

var socket = io();

var cnv_back;
let song;
var img_slot = new Array(IMG_NUMBER);
var img_slot_names = new Array(IMG_NUMBER);

KEY_STATE_IDLE = 0;
KEY_STATE_BUSY = 1;
var keyState_Cam1 = KEY_STATE_IDLE;
var keyState_Cam2 = KEY_STATE_IDLE;
var cam1Key = ['a'];
var cam2Key = [']'];
var keycodeIgnore = [9, 18, 19, 32, 37, 38, 39, 40, 91, 93, 240, 112, 114, 116, 117, 123, 243, 244, 242];
//91win, 242Kana, 243Hankaku, 244Zenkaku => registry
var sketchBack = function(p) {
  img_back = p.loadImage('data/scan_back_y.png');
  var w = (SCAN_IMG_W / SCAN_IMG_DIV) - SCAN_IMG_INNER_PADDING_X * 2;
  var h = (SCAN_IMG_H / SCAN_IMG_DIV) - SCAN_IMG_INNER_PADDING_Y * 2;

  for (var i = 0; i < IMG_NUMBER;i++) {
    img_slot[i] = p.loadImage('data/trans_y.png');
  }
  p.setup = function() {
    cnv_back = p.createCanvas(CANVAS_BACK_W + CANVAS_BACK_OFFSET_W, CANVAS_BACK_H + CANVAS_BACK_OFFSET_H);
    p.background(0);
    p.image(img_back, 0, 0, BACK_IMG_W, BACK_IMG_H);

    for (let i in img_slot) {
      p.image(img_slot[i], SCAN_IMG_X_ZERO + SCAN_IMG_X_PADDING * i + SCAN_IMG_INNER_PADDING_X, SCAN_IMG_Y_ZERO + SCAN_IMG_INNER_PADDING_Y, w, h);
    }

  };
  p.draw = function() {
    //Change image src after scan

    //Exec Display
    p.image(img_back, 0, 0, BACK_IMG_W, BACK_IMG_H);
    for (let i in img_slot) {
      p.image(img_slot[i], SCAN_IMG_X_ZERO + SCAN_IMG_X_PADDING * i + SCAN_IMG_INNER_PADDING_X, SCAN_IMG_Y_ZERO + SCAN_IMG_INNER_PADDING_Y, w, h);
    }

    if (p.keyIsPressed) {
        console.log(p.keyCode);
        console.log("keyStates " + keyState_Cam1 + " " + keyState_Cam2);
        //if (p.key == 'a' || p.key == 's' || p.key == 'd' || p.key == 'f' || p.key == 'g' ) {
        if (cam1Key.indexOf(p.key) >= 0) {
          if (keyState_Cam1 != KEY_STATE_BUSY) {
            keyState_Cam1 = KEY_STATE_BUSY;
            OnSendClickDev1(p);
          }
//        } else if (p.key == 'j' || p.key == 'k' || p.key == 'l' || p.key == ';') {
        } else if (cam2Key.indexOf(p.key) >= 0) {
          if (keyState_Cam2 != KEY_STATE_BUSY) {
            keyState_Cam2 = KEY_STATE_BUSY;
            OnSendClickDev2(p);
          }
        }
    }
  };
}

var flg_refresh = false;
var task = function(p) {
  socket.on('message', function(msg, ack) {
    console.log(msg);
    var msg = JSON.parse(msg);

    if (msg.device) {
      if (msg.device == 1) {
        keyState_Cam1 = KEY_STATE_IDLE;
      } else {
        keyState_Cam2 = KEY_STATE_IDLE;
      }
      for (var i = 0; i < img_slot_names.length; i++) {
        if (img_slot_names[i] == "doing") {
          img_slot[i] = p.loadImage("scanned_buffer/" + msg.filename);
          img_slot_names[i] = msg.filename;
          img_status[i] = p.loadImage("data/batsu_y.png");
          break;
        }
      }
      console.log(img_slot_names);
    } else if (msg.refresh) {
      for (var i = 0; i < img_slot_names.length; i++) {
        img_slot_names[i] = null;
      }
      flg_refresh = true;
    } else if (msg.error) {
      console.log("Cam capture error!");
      if (msg.error == 1) {
        keyState_Cam1 = KEY_STATE_IDLE;
      } else {
        keyState_Cam2 = KEY_STATE_IDLE;
      }
      for (var i = 0; i < img_slot_names.length; i++) {
        if (img_slot_names[i] == "doing") {
          img_slot_names[i] = null;
          img_status[i] = p.loadImage("data/trans_y.png");
          break;
        }
      }
    } else if (msg.command) {
      if (msg.command == "key1") {
        if (keyState_Cam1 != KEY_STATE_BUSY) {
          keyState_Cam1 = KEY_STATE_BUSY;
          OnSendClickDev1(p);
        }
      } else if (msg.command == "key2") {
        if (keyState_Cam2 != KEY_STATE_BUSY) {
          keyState_Cam2 = KEY_STATE_BUSY;
          OnSendClickDev2(p);
        }
      }
    }

    ack('client ack for send');
  });
  p.setup = function() {
    cnv = p.createCanvas(0, 0);
    cnv.position(0, 0);
  }
  p.draw = function() {
    if (flg_refresh) {
      console.log("refresh");
      for (var i = 0; i < img_slot_names.length; i++) {
        if (img_slot_names[i] == null) {
          img_slot[i] = p.loadImage("data/trans_y.png");
          img_status[i] = p.loadImage("data/ok_y.png");
        }
      }
      console.log("refresh done");
      flg_refresh = false;
    }
  }
}
var scan1_status_change_done = 0;
var img_status = new Array(IMG_NUMBER);
var sketch1_status = function(p) {
  img_status[0] = p.loadImage('data/ok_y.png');
  song = p.loadSound('data/shinkazoku.wav');
  p.setup = function() {
    p.background(0);
    var cnv_w = SCAN_IMG_W / SCAN_IMG_DIV;
    var cnv_h = STATUS_H;
    cnv = p.createCanvas(SCAN_IMG_W / SCAN_IMG_DIV, STATUS_H);
    cnv.position(SCAN_IMG_X_ZERO, SCAN_IMG_Y_ZERO - STATUS_H);
    cnv.mouseOver(Status1_Selected);
    cnv.mouseOut(Status1_Diselected);
    cnv.mousePressed(OnClickBatsu0);
  };
  p.draw = function() {
    if (img_slot_names[0] != null) p.background(255);
    p.tint(255, 255, 255, tint_val_scan1);
    p.image(img_status[0], 0, 0, p.width, p.height);
  }
}
function Status1_Selected() {
  console.log("Status1 mouse over");
  tint_val_scan1 = 127;
}

function Status1_Diselected() {
  console.log("Status1 mouse out");
  tint_val_scan1 = 255;
}

var sketch2_status = function(p) {
  img_status[1] = p.loadImage('data/ok_y.png');
  song = p.loadSound('data/shinkazoku.wav');
  p.setup = function() {
    var cnv_w = SCAN_IMG_W / SCAN_IMG_DIV;
    var cnv_h = STATUS_H;
    cnv = p.createCanvas(SCAN_IMG_W / SCAN_IMG_DIV, STATUS_H);
    cnv.position(SCAN_IMG_X_ZERO + SCAN_IMG_X_PADDING * 1, SCAN_IMG_Y_ZERO - STATUS_H);
    cnv.mouseOver(Status2_Selected);
    cnv.mouseOut(Status2_Diselected);
    cnv.mousePressed(OnClickBatsu1);
  };
  p.draw = function() {
    if (img_slot_names[1] != null) p.background(255);
    p.tint(255, 255, 255, tint_val_scan2);
    p.image(img_status[1], 0, 0, p.width, p.height)
  }
}
function Status2_Selected() {
  console.log("Status1 mouse over");
  tint_val_scan2 = 127;
}

function Status2_Diselected() {
  console.log("Status1 mouse out");
  tint_val_scan2 = 255;
}

var sketch3_status = function(p) {
  img_status[2] = p.loadImage('data/ok_y.png');
  song = p.loadSound('data/shinkazoku.wav');
  p.setup = function() {
    var cnv_w = SCAN_IMG_W / SCAN_IMG_DIV;
    var cnv_h = STATUS_H;
    cnv = p.createCanvas(SCAN_IMG_W / SCAN_IMG_DIV, STATUS_H);
    cnv.position(SCAN_IMG_X_ZERO+ SCAN_IMG_X_PADDING * 2, SCAN_IMG_Y_ZERO - STATUS_H);
    cnv.mouseOver(Status3_Selected);
    cnv.mouseOut(Status3_Diselected);
    cnv.mousePressed(OnClickBatsu2);
  };
  p.draw = function() {
    if (img_slot_names[2] != null) p.background(255);
    p.tint(255, 255, 255, tint_val_scan3);
    p.image(img_status[2], 0, 0, p.width, p.height)
  }
}
function Status3_Selected() {
  console.log("Status1 mouse over");
  tint_val_scan3 = 127;
}

function Status3_Diselected() {
  console.log("Status1 mouse out");
  tint_val_scan3 = 255;
}

var sketch4_status = function(p) {
  img_status[3] = p.loadImage('data/ok_y.png');
  song = p.loadSound('data/shinkazoku.wav');
  p.setup = function() {
    var cnv_w = SCAN_IMG_W / SCAN_IMG_DIV;
    var cnv_h = STATUS_H;
    cnv = p.createCanvas(SCAN_IMG_W / SCAN_IMG_DIV, STATUS_H);
    cnv.position(SCAN_IMG_X_ZERO + SCAN_IMG_X_PADDING * 3, SCAN_IMG_Y_ZERO - STATUS_H);
    cnv.mouseOver(Status4_Selected);
    cnv.mouseOut(Status4_Diselected);
    cnv.mousePressed(OnClickBatsu3);
  };
  p.draw = function() {
    if (img_slot_names[3] != null) p.background(255);
    p.tint(255, 255, 255, tint_val_scan4);
    p.image(img_status[3], 0, 0, p.width, p.height)
  }
}
function Status4_Selected() {
  console.log("Status1 mouse over");
  tint_val_scan4 = 127;
}

function Status4_Diselected() {
  console.log("Status1 mouse out");
  tint_val_scan4 = 255;
}


var sketch5_status = function(p) {
  img_status[4] = p.loadImage('data/ok_y.png');
  song = p.loadSound('data/shinkazoku.wav');
  p.setup = function() {
    var cnv_w = SCAN_IMG_W / SCAN_IMG_DIV;
    var cnv_h = STATUS_H;
    cnv = p.createCanvas(SCAN_IMG_W / SCAN_IMG_DIV, STATUS_H);
    cnv.position(SCAN_IMG_X_ZERO + SCAN_IMG_X_PADDING * 4, SCAN_IMG_Y_ZERO - STATUS_H);
    cnv.mouseOver(Status5_Selected);
    cnv.mouseOut(Status5_Diselected);
    cnv.mousePressed(OnClickBatsu4);
  };
  p.draw = function() {
    if (img_slot_names[4] != null) p.background(255);
    p.tint(255, 255, 255, tint_val_scan5);
    p.image(img_status[4], 0, 0, p.width, p.height)
  }
}
function Status5_Selected() {
  console.log("Status1 mouse over");
  tint_val_scan5 = 127;
}

function Status5_Diselected() {
  console.log("Status1 mouse out");
  tint_val_scan5 = 255;
}


var sketch6_status = function(p) {
  img_status[5] = p.loadImage('data/ok_y.png');
  song = p.loadSound('data/shinkazoku.wav');
  p.setup = function() {
    var cnv_w = SCAN_IMG_W / SCAN_IMG_DIV;
    var cnv_h = STATUS_H;
    cnv = p.createCanvas(SCAN_IMG_W / SCAN_IMG_DIV, STATUS_H);
    cnv.position(SCAN_IMG_X_ZERO + + SCAN_IMG_X_PADDING * 5, SCAN_IMG_Y_ZERO - STATUS_H);
    cnv.mouseOver(Status6_Selected);
    cnv.mouseOut(Status6_Diselected);
    cnv.mousePressed(OnClickBatsu5);
  };
  p.draw = function() {
    if (img_slot_names[5] != null) p.background(255);
    p.tint(255, 255, 255, tint_val_scan6);
    p.image(img_status[5], 0, 0, p.width, p.height)
  }
}
function Status6_Selected() {
  console.log("Status1 mouse over");
  tint_val_scan6 = 127;
}

function Status6_Diselected() {
  console.log("Status1 mouse out");
  tint_val_scan6 = 255;
}


function OnClickBatsu0() {
  //remove buffer msg to the Server
  console.log("OnClickBatsu0");
  socket.emit('rem_buf', img_slot_names[0], function onack(res) {
    console.log(res);
  });

  img_slot_names[0] = null;
  console.log(img_slot_names);
  flg_refresh = true;

}

function OnClickBatsu1() {
  //remove buffer msg to the Server
  console.log("OnClickBatsu1");
  socket.emit('rem_buf', img_slot_names[1], function onack(res) {
    console.log(res);
  });

  img_slot_names[1] = null;
  console.log(img_slot_names);
  flg_refresh = true;

}

function OnClickBatsu2() {
  //remove buffer msg to the Server
  console.log("OnClickBatsu2");
  socket.emit('rem_buf', img_slot_names[2], function onack(res) {
    console.log(res);
  });

  img_slot_names[2] = null;
  console.log(img_slot_names);
  flg_refresh = true;

}

function OnClickBatsu3() {
  //remove buffer msg to the Server
  console.log("OnClickBatsu3");
  socket.emit('rem_buf', img_slot_names[3], function onack(res) {
    console.log(res);
  });

  img_slot_names[3] = null;
  console.log(img_slot_names);
  flg_refresh = true;

}

function OnClickBatsu4() {
  //remove buffer msg to the Server
  console.log("OnClickBatsu4");
  socket.emit('rem_buf', img_slot_names[4], function onack(res) {
    console.log(res);
  });

  img_slot_names[4] = null;
  console.log(img_slot_names);
  flg_refresh = true;

}

function OnClickBatsu5() {
  //remove buffer msg to the Server
  console.log("OnClickBatsu5");
  socket.emit('rem_buf', img_slot_names[5], function onack(res) {
    console.log(res);
  });

  img_slot_names[5] = null;
  console.log(img_slot_names);
  flg_refresh = true;

}


function OnSendClickDev1(p) {
  console.log("sending dev1 scan msg");
  scan1_status = SCAN1_STATUS_DOING;
  var flg_notfull = false;
  for (var i = 0; i < img_slot_names.length; i++) {
    if (img_slot_names[i] == null || img_slot_names[i] == undefined) {
      flg_notfull = true;
      if (song.isPlaying()) {
        // .isPlaying() returns a boolean
        //song.stop();
      } else {
        song.play();
      }
      img_status[i] = p.loadImage("data/doing_y.png");
      img_slot_names[i] = "doing";
      break;
    }
  }
  if (!flg_notfull) {
    console.log("scan num full");
    keyState_Cam1 = KEY_STATE_IDLE;
    scan1_status = SCAN1_STATUS_OK;
    return;
  }
  console.log(img_slot_names);
  socket.send('scan_device1',function onack(res) {
    console.log(res);
    if (res == "listfull") {
      keyState_Cam1 = KEY_STATE_IDLE;
      img_slot_names[i] = null;
      scan1_status = SCAN1_STATUS_OK;
      flg_refresh = true;
    }
  });
};

function OnSendClickDev2(p) {
  console.log("sending dev2 scan msg");
  scan2_status = SCAN2_STATUS_DOING;
  var flg_notfull = false;
  for (var i = 0; i < img_slot_names.length; i++) {
    if (img_slot_names[i] == null || img_slot_names[i] == undefined) {
      flg_notfull = true;
      if (song.isPlaying()) {
        // .isPlaying() returns a boolean
        //song.stop();
      } else {
        song.play();
      }
      img_status[i] = p.loadImage("data/doing_y.png");
      img_slot_names[i] = "doing";
      break;
    }
  }
  if (flg_notfull != true) {
    console.log("scan full");
    keyState_Cam2 = KEY_STATE_IDLE;
    scan2_status = SCAN1_STATUS_OK;
    return;
  }
  socket.send('scan_device2',function onack(res) {
    console.log(res);
    if (res == "listfull") {
      keyState_Cam2 = KEY_STATE_IDLE;
      img_slot_names[i] = null;
      scan2_status = SCAN2_STATUS_OK;
      flg_refresh = true;
    }
  });
};

function Status2_Selected() {
  console.log("Status2 mouse over");
  tint_val_scan2 = 127;
}

function Status2_Diselected() {
  console.log("Status2 mouse out");
  tint_val_scan2 = 255;
}

new p5(sketchBack, "container0");
new p5(task, "container1");
new p5(sketch1_status, "container3");
new p5(sketch2_status, "container4");
new p5(sketch3_status, "container5");
new p5(sketch4_status, "container6");
new p5(sketch5_status, "container7");
new p5(sketch6_status, "container8");

document.onkeydown = (event) => {
  if (keycodeIgnore.indexOf(event.keyCode) >= 0 ) {
    console.log('ignore key');
    event.preventDefault();
    return false;
  }
};
