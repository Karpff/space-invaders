function get(x)
{
  return document.getElementById(x);
}

function getDistance(x1,y1,x2,y2)
{
  return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
}
var canvas = get("cnv");
canvas.width = 700;
canvas.height = 700;
var c = canvas.getContext('2d');

window.addEventListener('keydown',function(e)
{
  if(e.keyCode=="65" || e.keyCode=="37")
  {
    ship.spdL = -shipSpeed;
  }
  if(e.keyCode=="68" || e.keyCode=="39")
  {
    ship.spdR = shipSpeed;
  }
  if(e.keyCode=="32")
  {
    shooting = true;
  }
  if(e.keyCode=="27" || e.keyCode=="80" || e.keyCode=="13")
  {
    if(!paused)
    {
      paused = true;

    }
    else
    {
      paused = false;
      animate();
    }
  }
});

window.addEventListener('keyup',function(e)
{
  if(e.keyCode=="65" || e.keyCode=="37")
  {
    ship.spdL = 0;
  }
  if(e.keyCode=="68" || e.keyCode=="39")
  {
    ship.spdR = 0;
  }
  if(e.keyCode=="32")
  {
    shooting = false;
  }
});

var shoot1 = get("shoot1");
shoot1.volume = 0.1;
var boom = get("boom");
boom.volume = 0.1;
var win = get("win");
win.volume = 0.3;
var death = get("death");
death.volume = 0.2;
var ufo = get("ufo");
ufo.volume = 0.05;
var move1 = get("move1");
move1.volume = 0.3;
var move2 = get("move2");
move2.volume = 0.3;
var power1 = get("power");
power1.volume = 0.2;

//--==Config==--
var shipSpeed = 4;
var bulletDelay = 40;
var bulletSpeed = 8;
var aBulletSpeed = 5;
var alienJump = 7;
var waveHeight = 120;

var alienSpeed = 50;
var alienSpeedPerAlien = 0.25;
var alienSpeedPerWave = 2;

var bulletChance = 0.005;
var bulletChancePerAlien = 0.0005;
var bulletChancePerWave = 0.005;

var mysteryShipChance = 0.05;
var powerUpChance = 5;
var scoreNeeded = 5000;
//--==End==--

var currentBulletChance = bulletChance;
var currentAlienSpeed = alienSpeed;
var rapid = 0;
var power = 0;
var freeze = 0;
var shooting = false;

var powerUpsColors = ["rgba(0,250,250,0.4)","rgba(0,250,100,0.4)","rgba(250,0,0,0.4)","rgba(250,250,0,0.4)","rgba(250,250,250,0.4)"];
var alienWait = alienSpeed;
var swap = false;
var score = 0;
var wave = 1;
var firstMove = true;
var paused = false;

var ship =
{
  x: 350,
  y: 600,
  spdL: 0,
  spdR: 0,
  spd: 0,
  lives: 3,
  cd: 0,
  boomTimer: 0,
  inv: 0,
  pic: get("ship"),
  update: function()
  {
    if(this.inv > 0)
    {
      this.inv--;
    }
    if(this.boomTimer == 0)
    {
      this.spd = this.spdL + this.spdR;
      this.x+=this.spd;
      if(this.x > 680){this.x = 680;}
      if(this.x < 20){this.x = 20;}
      if(this.cd>0){this.cd--;}
      this.draw();
    }
    else
    {
      this.boomTimer--;
      if(this.boomTimer == 0)
      {
        this.inv = 150;
      }
      this.drawBoom();
    }
  },
  boom: function()
  {
    this.lives--;
    this.boomTimer = 100;
    death.play();
  },
  draw: function()
  {
    if(this.inv>0)
    {
      c.fillStyle = "rgba(0,200,200,0.1)";
      c.beginPath();
      if(this.inv<80){c.arc(this.x,this.y,this.inv/2+1,0,Math.PI*2);}
      else{c.arc(this.x,this.y,40,0,Math.PI*2);}
      c.fill();
    }
    c.drawImage(this.pic,this.x-20,this.y-20,40,40);
  },
  drawBoom: function()
  {
    c.drawImage(get("explosion"),this.x-30,this.y-30,60,60);
  }
};

function bullet(x)
{
  this.x = x;
  this.y = 600;
  this.alive = true;
  if(power > 0){this.super = true;}
  else{this.super = false;}
  this.update = function()
  {
    if(this.alive)
    {
      this.y -= bulletSpeed;
      for(var i=0;i<aliens.length;i++)
      {
        if(getDistance(this.x,this.y,aliens[i].x,aliens[i].y)<aliens[i].hitbox && aliens[i].state == "alive" && this.alive)
        {
          aliens[i].state = "exploding";
          if(!this.super){this.alive = false;}
          currentAlienSpeed-=0.3;
          if(currentAlienSpeed < 5){currentAlienSpeed = 5;}
          currentBulletChance+=bulletChancePerAlien;
          if(aliens[i].type == 1){score+=40;}
          else if(aliens[i].type < 4){score+=20;}
          else if(aliens[i].type < 6){score+=10;}
          if(Math.random()*100<powerUpChance)
          {
            powerUps.push(new powerUp(aliens[i].x,aliens[i].y));
          }
          boom.play();
        }
      }
      if(getDistance(this.x,this.y,mysteryShip.x,mysteryShip.y)<25 && mysteryShip.state == "alive" && this.alive)
      {
        ufo.pause();
        score += 200;
        mysteryShip.state = "exploding";
        mysteryShip.exp = 30;
        this.alive = false;
		if(Math.random()*100<powerUpChance*4)
		{
		  powerUps.push(new powerUp(mysteryShip.x,mysteryShip.y));
		}
        boom.play();
      }
      this.draw();
    }
  }
  this.draw = function()
  {
    if(this.super){c.fillStyle = "#FF0000";}
    else{c.fillStyle = "#00FF00";}
    c.fillRect(this.x-2,this.y-10,4,15);
  }
}
var bullets = [];

function aBullet(x,y)
{
  this.x = x;
  this.y = y;
  this.alive = true;
  this.update = function()
  {
    if(this.alive)
    {
      if(freeze <= 0)
      {
        this.y += aBulletSpeed;
      }
	  else
	  {
		 this.y += aBulletSpeed/4;
	  }
      if(getDistance(this.x,this.y,ship.x,ship.y) < 27 && ship.boomTimer == 0 && ship.inv == 0)
      {
        ship.boom();
        this.alive = false;
      }
      this.draw();
    }
  }
  this.draw = function()
  {
    c.fillStyle = "white";
    c.fillRect(this.x-2,this.y-10,4,10);
  }
}
var aBullets = [];

function alien(x,y,type)
{
  this.x = x;
  this.y = y;
  this.state = "alive";
  this.type = type;
  this.exp = 15;
  this.hitbox = 27 - this.type*4;
  this.pic=get("inv"+type);
  this.move = function()
  {
    this.x += alienJump;
    if(this.x > 660 && alienJump > 0 && this.state != "dead"){swap = true;}
    if(this.x < 40 && alienJump < 0 && this.state != "dead"){swap = true;}
  }
  this.update = function()
  {
    if(this.state == "alive")
    {
      if(Math.random()*100 < currentBulletChance)
      {
        aBullets.push(new aBullet(this.x,this.y));
      }
      if(this.y > 550)
      {
        ship.lives = 0;
      }
      this.draw();
    }
    else if(this.state == "exploding")
    {
      this.exp--;
      c.drawImage(get("explosion"),this.x-20,this.y-20,40,40);
      if(this.exp <= 0)
      {
        this.state = "dead";
      }
    }
  }
  this.draw = function()
  {
    c.drawImage(this.pic,this.x-25+this.type*3,this.y-20,50-this.type*6,50-this.type*6);
  }
}
var aliens = [];

var mysteryShip=
{
  state: "dead",
  x: 740,
  y: 100,
  exp: 30,
  pic: get("inv4"),
  update: function()
  {
    if(this.state == "alive")
    {
      ufo.play();
      if(freeze <= 0){this.x -= 2;}
	  else{this.x -= 0.5;}
      c.drawImage(this.pic,this.x-30,this.y-30,60,60);
      if(this.x < -40){this.state = "dead";}
    }
    else if(this.state == "exploding")
    {
      c.drawImage(get("explosion"),this.x-30,this.y-30,60,60);
      this.exp--;
      if(this.exp == 0)
      {
        this.state = "dead";
        ufo.pause();
      }
    }
  }
}

function powerUp(x,y)
{
  this.x = x;
  this.y = y;
  this.is = true;
  this.type = Math.floor(Math.random()*4);
  if(Math.random()*100<5){this.type = 4;}
  this.color = powerUpsColors[this.type];
  this.update = function()
  {
    if(this.is)
    {
      this.y += 3;
      if(getDistance(this.x,this.y,ship.x,ship.y)<30)
      {
        this.is = false;
        if(this.type == 0){ship.inv = 500;}
        if(this.type == 1){rapid = 200;}
        if(this.type == 2){power = 200;}
        if(this.type == 3){freeze = 500;}
        if(this.type == 4){ship.lives++; win.play();}
        else{power1.play();}
      }
      this.draw();
    }
  }
  this.draw = function()
  {
    c.beginPath();
    c.fillStyle = this.color;
	if(this.type == 4)
	{
		c.arc(this.x,this.y,10,0,Math.PI*2);
		c.drawImage(ship.pic,this.x-5,this.y-5,10,10);
	}
    else{c.arc(this.x,this.y,8,0,Math.PI*2);}
    c.fill();
  }
}
var powerUps = [];

function getHud()
{
  c.fillStyle = "green";
  c.fillRect(0,650,700,3);
  if(freeze > 0)
  {
    c.fillStyle = "yellow";
    c.fillRect(0,651,700,1);
    c.fillStyle = "green";
    c.fillRect(0,651,(500-freeze)*700/500,1);
  }
  for(var i=1;i<=ship.lives;+i++)
  {
    c.drawImage(ship.pic,i*45-30,660,30,30);
  }
  c.strokeStyle = "green";
  c.font = "30px verdana";
  c.strokeText("Score: "+score,470,690);
  c.strokeText("Wave: "+wave,20,40);
}

function gameOver()
{
  c.fillStyle = "#060606";
  c.fillRect(0,0,700,700);
  c.strokeStyle = "white";
  c.font = "70px verdana";
  c.strokeText("GAME OVER",130,300);
  c.strokeStyle = "green";
  c.font = "40px verdana";
  c.strokeText("Score: "+score,150,360);
  c.strokeText("Wave: "+wave,150,420);
}

function newWave()
{
  bulletChance += bulletChancePerWave;
  alienSpeed -= alienSpeedPerWave;
  currentBulletChance = bulletChance;
  currentAlienSpeed = alienSpeed;
  alienJump = Math.abs(alienJump);
  aliens = [];
  bullets = [];
  aBullets = [];
  powerUps = [];
  ship.inv = 300;
  wave++;
  init();
}

function init()
{
  for(var i=1;i<=11;i++)
  {
    for(var j=1;j<=5;j++)
    {
      aliens.push(new alien(i*45+70,j*45+waveHeight,Math.ceil((6-j)/2)));
    }
  }
}
init();

function animate()
{
  if(freeze > 0){c.fillStyle = "rgba(0,0,0,0.2)";}
  else{c.fillStyle = "#060606";}
  c.fillRect(0,0,innerWidth,innerHeight);
  if(alienWait > 0){alienWait--;}
  else
  {
    if(firstMove){move1.play(); firstMove=false;}
    else{move2.play(); firstMove=true;}
    alienWait = currentAlienSpeed;
    if(swap)
    {
      alienJump = -alienJump;
      swap = false;
      waveHeight += 20;
      if(waveHeight > 320){waveHeight = 320;}
      for(var i=0;i<aliens.length;i++)
      {
        aliens[i].y+=20;
      }
    }
    for(var i=0;i<aliens.length;i++)
    {
      if(freeze <= 0)
      {
        aliens[i].move();
      }
    }
  }
  var undead = 0;
  for(var i=0;i<aliens.length;i++)
  {
    aliens[i].update();
    if(aliens[i].state == "alive")undead++;
  }
  if(ship.cd <= 0 && shooting)
  {
    shoot1.volume = 0.1;
    bullets.push(new bullet(ship.x));
    if(power > 0)
    {
      ship.cd = parseInt(2*bulletDelay);
      shoot1.volume = 0.3;
    }
    else if(rapid > 0){ship.cd = parseInt(bulletDelay/2);}
    else{ship.cd = bulletDelay;}
    shoot1.play();
  }
  for(var i=0;i<bullets.length;i++)
  {
    bullets[i].update();
  }
  for(var i=0;i<aBullets.length;i++)
  {
    aBullets[i].update();
  }
  for(var i=0;i<powerUps.length;i++)
  {
    powerUps[i].update();
  }
  if(rapid > 0){rapid--;}
  if(power > 0){power--;}
  if(freeze > 0){freeze--;}
  if(Math.random()*100<mysteryShipChance && mysteryShip.state == "dead")
  {
    mysteryShip.x = 730;
    mysteryShip.state = "alive";
  }
  if(score >= scoreNeeded)
  {
	  win.play();
	  ship.lives++;
	  scoreNeeded = scoreNeeded * 2;
  }
  mysteryShip.update();
  getHud();
  ship.update();
  if(undead == 0)
  {
    win.play();
    newWave();
  }
  if(ship.lives <= 0)
  {
    gameOver();
  }
  else if(paused)
  {
    c.fillStyle = "rgba(0,0,0,0.8)";
    c.fillRect(0,0,700,700);
    c.fillStyle = "red";
    c.font = "50px verdana";
    c.fillText("PAUSED",250,300);
  }
  else
  {
    window.requestAnimationFrame(animate);
  }
}
animate();
