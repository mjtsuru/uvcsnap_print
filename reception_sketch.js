//For Reception

CANVAS_BACK_W = 2560;
CANVAS_BACK_H = 1440;

SCAN_IMG_W = 720;
SCAN_IMG_H = 1115;
SCAN_IMG_DIV = 2.46;
SCAN_IMG_INNER_PADDING_X = 0;
SCAN_IMG_INNER_PADDING_Y = 0;
SCAN_IMG_X_ZERO = 59;
SCAN_IMG_Y_ZERO = 234;
SCAN_IMG_X_PADDING = 870;

STATUS_H_REAL = 276;
STATUS_W_REAL = 947;
STATUS_DIV = 6.46;
STATUS_H = STATUS_H_REAL / STATUS_DIV;
STATUS_W = STATUS_W_REAL / STATUS_DIV;

CANVAS_HEIGHT = 372;
CANVAS_WIDTH = 240;
CANVAS_UPPER_X = 100;
CANVAS_LEFT_X = 100;
CANVAS_LEFTEND_MARGIN = 100;
CANVAS_MARGIN = 20;

var tint_val_scan1 = 255;
var tint_val_scan2 = 255;
var tint_val_scan1_right = 255;
var tint_val_scan2_right = 255;

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
socket.on('message', function(msg, ack) {
  console.log(msg);
  var msg = JSON.parse(msg);

  if (msg.device == 1) {
    if (scan1_status == SCAN1_STATUS_DOING) {
      img_scan1_src = msg.filename;
      console.log('scan1_status to loading');
      scan1_status = SCAN1_STATUS_LOADING;
      keyLeftState = KEY_STATE_IDLE;
    }
  } else if (msg.device == 2) {
    if (scan2_status == SCAN2_STATUS_DOING) {
      img_scan2_src = msg.filename;
      console.log('scan2_status to loading');
      scan2_status = SCAN2_STATUS_LOADING;
      keyRightState = KEY_STATE_IDLE;
    }
  }

  ack('client ack for send');
});

function sketchFuncs(p) {

}

//var socket = io();

var cnv_back;
let song;
KEY_STATE_IDLE = 0;
KEY_STATE_BUSY = 1;
var keyLeftState = KEY_STATE_IDLE;
var keyRightState = KEY_STATE_IDLE;
var cam1Key = ['a'];
var cam2Key = [']'];
var keycodeIgnore = [9, 18, 19, 32, 37, 38, 39, 40, 91, 93, 240, 112, 114, 116, 117, 123, 243, 244, 242];
var sketchBack = function(p) {
  img_back = p.loadImage('data/scan_back_g.png');
  p.setup = function() {

    cnv_back = p.createCanvas(CANVAS_BACK_W / 2, CANVAS_BACK_H / 2);
    p.background(0);
    p.image(img_back, 0, 0, CANVAS_BACK_W / 2, CANVAS_BACK_H / 2);
  };
  p.draw = function() {
    p.image(img_back, 0, 0, CANVAS_BACK_W / 2, CANVAS_BACK_H / 2);
    if (p.keyIsPressed) {
      if (cam1Key.indexOf(p.key) >= 0) {
        if (keyLeftState != KEY_STATE_BUSY) {
          keyLeftState = KEY_STATE_BUSY;
          if (scan1_status == SCAN1_STATUS_OK) {
            OnSendClickDev1();
          } else if (scan1_status == SCAN1_STATUS_BATSU) {
            console.log('confirmation');
            OnConfirmDev1();
          }
        }
      } else if (cam2Key.indexOf(p.key) >= 0) {
        keyRightState = KEY_STATE_BUSY;
        if (scan2_status == SCAN2_STATUS_OK) {
          OnSendClickDev2();
        } else if (scan2_status == SCAN2_STATUS_BATSU) {
          console.log('confirmation');
          OnConfirmDev2();
        }
      }

      // if (keyLeftState != KEY_STATE_BUSY) {
      //   if (p.key == 'a') {
      //     keyLeftState = KEY_STATE_BUSY;
      //     if (scan1_status == SCAN1_STATUS_OK) {
      //       OnSendClickDev1();
      //     } else if (scan1_status == SCAN1_STATUS_BATSU) {
      //       console.log('confirmation');
      //       OnConfirmDev1();
      //     }
      //   }
      // }
      // if (keyRightState != KEY_STATE_BUSY) {
      //   if (p.key == 'l') {
      //     keyRightState = KEY_STATE_BUSY;
      //     if (scan2_status == SCAN2_STATUS_OK) {
      //       OnSendClickDev2();
      //     } else if (scan2_status == SCAN2_STATUS_BATSU) {
      //       console.log('confirmation');
      //       OnConfirmDev2();
      //     }
      //   }
      // }
    }
  };
}

function OnConfirmDev1() {
  socket.emit('stage_buf', img_scan1_src, function onack(res) {
    console.log(res);
  });
  scan1_status_change_done = 3;
  scan1_status = SCAN1_STATUS_OK;
//  keyLeftState = KEY_STATE_BUSY;
}

function OnConfirmDev2() {
  socket.emit('stage_buf', img_scan2_src, function onack(res) {
    console.log(res);
  });
  scan2_status_change_done = 3;
  scan2_status = SCAN1_STATUS_OK;
//  keyLeftState = KEY_STATE_BUSY;
}


var sketch1 = function(p) {
  img_scan1 = p.loadImage('data/trans_g2.png'); //720 x 1115
  //done = p.loadImage('data/done.png'); //2237 × 836
  var w = SCAN_IMG_W / SCAN_IMG_DIV;
  var h = SCAN_IMG_H / SCAN_IMG_DIV;
  p.setup = function() {
    cnv = p.createCanvas(SCAN_IMG_W / SCAN_IMG_DIV, SCAN_IMG_H / SCAN_IMG_DIV);
    //p.background(0);
    cnv.position(SCAN_IMG_X_ZERO + SCAN_IMG_INNER_PADDING_X, SCAN_IMG_Y_ZERO + SCAN_IMG_INNER_PADDING_Y);
  };

  p.draw = function() {
    if (scan1_status == SCAN1_STATUS_OK) {
      if (scan1_status_change_done == 2) {
        console.log('img scan to transparent');
        img_scan1 = p.loadImage('data/dummy_g.png');
        scan1_status_change_done = 0;
      }
    } else if (scan1_status == SCAN1_STATUS_LOADED) {
      img_scan1 = p.loadImage("scanned_buffer/" + img_scan1_src);
      scan1_status = SCAN1_STATUS_BATSU;
    }

    p.image(img_scan1, 0, 0, w, h);
  };
};

var scan1_status_change_done = 1;
var sketch1_status_left = function(p) {
  var img_left_size = STATUS_W * 2;
  img_1_status_left = p.loadImage('data/ok_g.png');

  song = p.loadSound('data/shinkazoku.wav');
  p.setup = function() {
    cnv = p.createCanvas(img_left_size, STATUS_H);
    p.background(255);
    cnv.position(SCAN_IMG_X_ZERO, SCAN_IMG_Y_ZERO - STATUS_H);
    cnv.mouseOver(Status1_Selected);
    cnv.mouseOut(Status1_Diselected);
    cnv.mousePressed(OnSendClickDev1);
    p.image(img_1_status_left, 0, 0, img_left_size, p.height);
  };
  p.draw = function() {
    if (scan1_status == SCAN1_STATUS_DOING) {
      if (scan1_status_change_done == 0) {
        img_left_size = STATUS_W * 2;
        img_1_status_left = p.loadImage('data/doing_g.png');
        scan1_status_change_done = 1;
      }
    } else if (scan1_status == SCAN1_STATUS_LOADING) {
      img_left_size = STATUS_W;
      cnv = p.createCanvas(img_left_size, STATUS_H);
      img_1_status_left = p.loadImage('data/batsu_g2.png');
//      img_1_status_left = p.loadImage('data/next_g.png');
      console.log('scan1_status to loaded');
      scan1_status = SCAN1_STATUS_LOADED;
      scan1_status_change_done = 0;

      //img_1_status_right = p.loadImage('data/next_g.png');
    } else if (scan1_status == SCAN1_STATUS_LOADED) {
      if (scan1_status_change_done == 0) {
        console.log('change status img to BATSU');
        //p.image(img_1_status_right, STATUS_W, 0, STATUS_W, STATUS_H);
        scan1_status_change_done = 1;
      }
    }
    else if (scan1_status == SCAN1_STATUS_OK) {
//      console.log('scan1 status default');
      if (scan1_status_change_done == 0) {
        console.log('status batsu to ok');
        img_left_size = STATUS_W * 2;
        cnv = p.createCanvas(img_left_size, STATUS_H);
        img_1_status_left = p.loadImage('data/ok_g.png');
        scan1_status_change_done = 1;
        keyLeftState = KEY_STATE_IDLE;
      }
    }
    p.background(255);
    p.tint(255,255,255, tint_val_scan1);
    p.image(img_1_status_left, 0, 0, img_left_size, p.height);
  }
}


var sketch1_status_right = function(p) {
  var img_left_size = STATUS_W;
  img_1_status_right = p.loadImage('data/trans_g2.png');
//    img_1_status_right = p.loadImage('data/next_g.png');
  p.setup = function() {
    cnv = p.createCanvas(img_left_size, STATUS_H);
    //p.background(0);
    cnv.position(SCAN_IMG_X_ZERO + STATUS_W, SCAN_IMG_Y_ZERO - STATUS_H);
    cnv.mouseOver(Status1Right_Selected);
    cnv.mouseOut(Status1Right_Diselected);
    cnv.mousePressed(OnConfirmDev1);
    //p.image(img_1_status_right)
  };
  p.draw = function() {
    if (scan1_status == SCAN1_STATUS_DOING) {
      if (scan1_status_change_done == 0) {
        //img_left_size = STATUS_W * 2;
        //img_1_status_left = p.loadImage('data/doing_g.png');
      }
    } else if (scan1_status == SCAN1_STATUS_LOADING) {
      //img_left_size = STATUS_W;
      //img_1_status_left = p.loadImage('data/batsu_g2.png');
      console.log('change status1 img to NEXT');
      console.log('set status1 right back white');
      img_1_status_right = p.loadImage('data/next_g.png');
      //console.log('scan1_status to loaded');
    //  p.image(img_1_status_right, 0, 0, STATUS_W, STATUS_H);
    } else if (scan1_status == SCAN1_STATUS_LOADED) {
      if (scan1_status_change_done == 0) {
        console.log('change status1 img to NEXT');
        console.log('set status1 right back white');
        img_1_status_right = p.loadImage('data/next_g.png');
//        p.image(img_1_status_right, STATUS_W, 0, STATUS_W, STATUS_H);
      }
    } else if (scan1_status == SCAN1_STATUS_OK) {
      if (scan1_status_change_done == 3) {
        console.log('hikitsugi to transparent');
        img_1_status_right = p.loadImage('data/trans_g2.png');
        scan1_status_change_done = 2;
        //p.image(img_1_status_right, 0, 0, STATUS_W, STATUS_H);
      }
    }
    p.background(255,255,255,255);
    p.tint(255,255,255,tint_val_scan1_right);
    p.image(img_1_status_right, 0, 0, STATUS_W, STATUS_H);

  }
}



var sketch2 = function(p) {
  img_scan2 = p.loadImage('data/dummy_g.png'); //720 x 1115
  //done = p.loadImage('data/done.png'); //2237 × 836
  p.setup = function() {
    cnv = p.createCanvas(SCAN_IMG_W / SCAN_IMG_DIV, SCAN_IMG_H / SCAN_IMG_DIV);
    //p.background(0);
    cnv.position(SCAN_IMG_X_PADDING + SCAN_IMG_X_ZERO + SCAN_IMG_INNER_PADDING_X, SCAN_IMG_Y_ZERO + SCAN_IMG_INNER_PADDING_Y);
  };

  p.draw = function() {
    if (scan2_status == SCAN2_STATUS_OK) {
      if (scan2_status_change_done == 2) {
        console.log('img scan to transparent');
        img_scan2 = p.loadImage('data/dummy_g.png');
        scan2_status_change_done = 0;
      }
    }
    if (scan2_status == SCAN2_STATUS_LOADED) {
      console.log('load scan2 image');
      img_scan2 = p.loadImage("scanned_buffer/" + img_scan2_src);
      scan2_status = SCAN2_STATUS_BATSU;
    }
    p.image(img_scan2, 0, 0, p.width, p.height);
  };
};

var scan2_status_change_done = 1;
var sketch2_status_left = function(p) {
  var img_left_size = STATUS_W * 2;
  img_2_status_left = p.loadImage('data/ok_g.png');

  song = p.loadSound('data/shinkazoku.wav');
  p.setup = function() {
    cnv = p.createCanvas(img_left_size, STATUS_H);
    p.background(255);
    cnv.position(SCAN_IMG_X_PADDING + SCAN_IMG_X_ZERO, SCAN_IMG_Y_ZERO - STATUS_H);
    cnv.mouseOver(Status2_Selected);
    cnv.mouseOut(Status2_Diselected);
    cnv.mousePressed(OnSendClickDev2);
    p.image(img_2_status_left, 0, 0, img_left_size, p.height);
  };
  p.draw = function() {
    if (scan2_status == SCAN2_STATUS_DOING) {
      if (scan2_status_change_done == 0) {
        img_left_size = STATUS_W * 2;
        img_2_status_left = p.loadImage('data/doing_g.png');
        scan2_status_change_done = 1;
      }
    } else if (scan2_status == SCAN2_STATUS_LOADING) {
      img_left_size = STATUS_W;
      cnv = p.createCanvas(img_left_size, STATUS_H);
      img_2_status_left = p.loadImage('data/batsu_g2.png');
//      img_2_status_left = p.loadImage('data/next_g.png');
      console.log('scan2_status to loaded');
      scan2_status = SCAN2_STATUS_LOADED;
      scan2_status_change_done = 0;

      //img_2_status_right = p.loadImage('data/next_g.png');
    } else if (scan2_status == SCAN2_STATUS_LOADED) {
      if (scan2_status_change_done == 0) {
        console.log('change status img to BATSU');
        //p.image(img_2_status_right, STATUS_W, 0, STATUS_W, STATUS_H);
        scan2_status_change_done = 1;
      }
    }
    else if (scan2_status == SCAN2_STATUS_OK) {
//      console.log('scan2 status default');
      if (scan2_status_change_done == 0) {
        console.log('status batsu to ok');
        img_left_size = STATUS_W * 2;
        cnv = p.createCanvas(img_left_size, STATUS_H);
        img_2_status_left = p.loadImage('data/ok_g.png');
        scan2_status_change_done = 1;
        keyRightState = KEY_STATE_IDLE;
      }
    }
    p.background(255);
    p.tint(255,255,255, tint_val_scan2);
    p.image(img_2_status_left, 0, 0, img_left_size, p.height);
  }
}

var sketch2_status_right = function(p) {
  var img_left_size = STATUS_W;
  img_2_status_right = p.loadImage('data/trans_g2.png');
  p.setup = function() {
    cnv = p.createCanvas(img_left_size, STATUS_H);
    //p.background(255);
    cnv.position(SCAN_IMG_X_PADDING + SCAN_IMG_X_ZERO + STATUS_W, SCAN_IMG_Y_ZERO - STATUS_H);
    cnv.mouseOver(Status2Right_Selected);
    cnv.mouseOut(Status2Right_Diselected);
    cnv.mousePressed(OnConfirmDev2);
    //p.image(img_2_status_right)
  };
  p.draw = function() {
    if (scan2_status == SCAN2_STATUS_DOING) {
      if (scan2_status_change_done == 0) {
        //img_left_size = STATUS_W * 2;
        //img_2_status_left = p.loadImage('data/doing_g.png');
      }
    } else if (scan2_status == SCAN2_STATUS_LOADING) {
      //img_left_size = STATUS_W;
      //img_2_status_left = p.loadImage('data/batsu_g2.png');
      console.log('change status1 img to NEXT');
      img_2_status_right = p.loadImage('data/next_g.png');
      //console.log('scan2_status to loaded');
    //  p.image(img_2_status_right, 0, 0, STATUS_W, STATUS_H);
  } else if (scan2_status == SCAN2_STATUS_LOADED) {
      if (scan2_status_change_done == 0) {
        console.log('change status1 img to NEXT');
        //p.background(0, 0, 0, 0);
        img_2_status_right = p.loadImage('data/next_g.png');
//        p.image(img_2_status_right, STATUS_W, 0, STATUS_W, STATUS_H);
      }
    } else if (scan2_status == SCAN2_STATUS_OK) {
      if (scan2_status_change_done == 3) {
        console.log('hikitsugi to transparent');
        //p.background(255, 255, 255, 126);
        img_2_status_right = p.loadImage('data/trans_g2.png');
        scan2_status_change_done = 2;
        //p.image(img_2_status_right, 0, 0, STATUS_W, STATUS_H);
      }
    }
    p.background(255,255,255,255);
    p.tint(255,255,255,tint_val_scan2_right);
    p.image(img_2_status_right, 0, 0, STATUS_W, STATUS_H);

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

function OnSendClickDev1() {
  console.log("sending dev1 scan msg");

  if (scan1_status == SCAN1_STATUS_BATSU) {
    socket.emit('rem_buf', img_scan1_src, function onack(res) {
      console.log(res);
    });
    scan1_status_change_done = 3;
    scan1_status = SCAN1_STATUS_OK;
  } else {
    scan1_status = SCAN1_STATUS_DOING;
    scan1_status_change_done = 0;
    // if (song.isPlaying()) {
    //    .isPlaying() returns a boolean
    //   song.stop();
    //
    // } else {
      song.play();

    // }

    socket.send('scan_device1',function onack(res) {
      console.log(res);
    });
  }
};

function Status1Right_Selected() {
  console.log("Status1Right mouse over");
  tint_val_scan1_right = 64;
}

function Status1Right_Diselected() {
  console.log("Status1Right mouse out");
  tint_val_scan1_right = 255;
}


function Status2_Selected() {
  console.log("Status2 mouse over");
  tint_val_scan2 = 127;
}

function Status2_Diselected() {
  console.log("Status2 mouse out");
  tint_val_scan2 = 255;
}

function OnSendClickDev2() {
  console.log("sending dev2 scan msg");
  if (scan2_status == SCAN2_STATUS_BATSU) {
    socket.emit('rem_buf', img_scan2_src, function onack(res) {
      console.log(res);
    });
    scan2_status_change_done = 3;
    scan2_status = SCAN2_STATUS_OK;
  } else {
    scan2_status = SCAN2_STATUS_DOING;
    scan2_status_change_done = 0;
    // if (song.isPlaying()) {
    //   // .isPlaying() returns a boolean
    //   song.stop();
    //
    // } else {
      song.play();

    // }

    socket.send('scan_device2',function onack(res) {
      console.log(res);
    });
  }
};


function Status2Right_Selected() {
  console.log("Status2 mouse over");
  tint_val_scan2_right = 127;
}

function Status2Right_Diselected() {
  console.log("Status2 mouse out");
  tint_val_scan2_right = 255;
}

function OnImageDev2_OK() {
  console.log("sending dev2 scan msg");
  // scan2_status = SCAN2_STATUS_DOING;

  if (song.isPlaying()) {
    // .isPlaying() returns a boolean
    song.stop();

  } else {
    song.play();

  }

  socket.send('scan_device2',function onack(res) {
    console.log(res);
  });
};


new p5(sketch1, "container0");
new p5(sketch2, "container1");
new p5(sketchBack, "container2");
new p5(sketch1_status_right, "container3");
new p5(sketch1_status_left, "container4");
new p5(sketch2_status_right, "container5");
new p5(sketch2_status_left, "container6");
