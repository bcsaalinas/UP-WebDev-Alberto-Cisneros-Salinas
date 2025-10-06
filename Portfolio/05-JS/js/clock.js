function drawClock() {
  drawFace(ctx, radius);
  drawNumbers(ctx, radius);
  drawTime(ctx, radius);
  drawMiddle();
}

function drawFace(ctx, radius) {
  var grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.fillStyle = "white";
  ctx.fill();

  //add the gradient circle on the border of the clock
  const innerR = radius * 0.95;
  const outterR = radius * 1.05;
  grad = ctx.createRadialGradient(0,0,innerR, 0,0,outterR);
  grad.addColorStop(0,"#333")
  grad.addColorStop(0.5,"#fff")
  grad.addColorStop(1,"#333")
  ctx.lineWidth = outterR - innerR;
  ctx.strokeStyle = grad;

  ctx.beginPath();
  ctx.arc(0,0,(innerR + outterR) / 2, 0, Math.PI * 2 );
  ctx.stroke();
}

function drawMiddle(){
   //make the center circle 
  ctx.beginPath();
  ctx.arc(0,0,radius * 0.05,0, Math.PI * 2)
  ctx.fillStyle = "#333"
  ctx.fill();
}

function drawNumbers(ctx, radius) {
  //TODO: Make sure you show all the numbers
  for (let num = 1; num <= 12; num++) {
    var ang;
    ctx.font = radius * 0.15 + "px arial";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ang = (num * Math.PI) / 6;
    ctx.rotate(ang);
    ctx.translate(0, -radius * 0.85);
    ctx.rotate(-ang);
    ctx.fillText(num.toString(), 0, 0);
    ctx.rotate(ang);
    ctx.translate(0, radius * 0.85);
    ctx.rotate(-ang);
  }
}

function drawTime(ctx, radius) {
  // TODO: Calculate the angles of every hand depending on the time

  var now = new Date();
  var hour = now.getHours();
  var minute = now.getMinutes();
  var second = now.getSeconds();
  // for hour used the 12 hour number, add a bit from minutes/seconds, then turn it into radians
  hour = ((hour % 12) + (minute / 60) + (second / 3600)) * (Math.PI / 6);
  drawHand(ctx, hour, radius * 0.5, radius * 0.07);
  // for minute used the minute count and map the 60 slices of the circle to radians
  minute = ((minute) + (second/60)) * (2 * (Math.PI / 60));
  drawHand(ctx, minute, radius * 0.8, radius * 0.07);
  // seconds already run 0-59, so just map that full lap to radians
  second = (second / 60) * (2 * Math.PI);
  drawHand(ctx, second, radius * 0.9, radius * 0.02);
}

function drawHand(ctx, pos, length, width) {
  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.moveTo(0, 0);
  ctx.rotate(pos);
  ctx.lineTo(0, -length);
  ctx.stroke();
  ctx.rotate(-pos);
}