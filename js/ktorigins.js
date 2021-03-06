/** ==================================================
 *  CMSI 185 - Final Project - K'torigins
 *  ==================================================
 * Author 1: Keziah Camille Rezaey
 * UID 1:    946961211
 * Author 2: Michael Elias
 * UID 2:    951090175
 *
 */
// ---------------------------------------------------
// PAGE ELEMENT CONFIGURATION
// Store the relevant HTML entities for reference here
// ---------------------------------------------------
    // General Selectors
let lobbyCont  = document.querySelector("#lobby-container"),
    gameCont   = document.querySelector("#game-container"),
    loading    = document.querySelector("#loading"),

    // Lobby Selectors
    configButt = document.querySelector("#config-launch"),
    charSelect = "[name=char-select]:checked",
    diffSelect = "[name=diff-select]:checked",
    mazeSelect = "[name=customMaze]",

    // Game Selectors
    timeLeft   = document.querySelector("#game-timer"),
    healthLeft = document.querySelector("#game-health"),
    currRound  = document.querySelector("#game-round"),
    mazeCont   = document.querySelector("#game-maze"),
    abilityCool = document.querySelector("#ability-timer"),
    scoreReport = document.querySelector("#score-count"),
    scoreInfo = document.querySelector("#score-info"),

    // Any relative paths to game assets, including images,
    // sounds, etc.
    assets = {
      images: {
        architect: "./assets/images/architect.png",
        zombie: "./assets/images/zombie.png",
        wall: "./assets/images/wall.png"
      },
      sounds: {
        eaten: new Audio("./assets/sounds/eatingpickles.mp3"),
        dead: new Audio("./assets/sounds/dead.mp3"),
        soundtrack: new Audio("./assets/sounds/soundtrack.mp3")
      }
    },

    // Global objects
    activeGame,
    activeP5,
    message,
    scoreCount,

    // Default maze in the case where there is no user-
    // specifiable arena
    campaignMaze = [
      "XXXXXXXXXXXXX",
      "XZ....X....ZX",
      "X...........X",
      "X...X...X...X",
      "X.....P.....X",
      "X...X...X...X",
      "X...........X",
      "XZ....X....ZX",
      "XXXXXXXXXXXXX"
    ],

    // Size of each cell rendered by p5; shrink to make
    // larger maps fit on the screen!
    cellDims = 50;


// ---------------------------------------------------
// GRAPHICS CONFIGURATION
// We'll use the following Graphics functions to
// configure p5
// ---------------------------------------------------

/*
 * Configures an "on demand" version of p5 that begins
 * executing its draw loop when a new game is started,
 * rather than when the page loads (the default use)
 * NOTE: This means all interfacing with p5 is done
 * through the global activeP5 variable
 */
function setupP5 (p) {

  p.setup = function () {
    let canvasHeight = activeGame.rows * cellDims,
        canvasWidth  = activeGame.cols * cellDims;
    p.createCanvas(canvasWidth, canvasHeight);

    // Setup assets as p5 image handles
    assets.p5Images = {};
    for (let im in assets.images) {
      assets.p5Images[im] = p.loadImage(assets.images[im]);
    }
    p.textAlign(p.CENTER, p.CENTER);
  }

  p.draw = function () {
    if (!activeGame) { return; }
    p.background(0);
    p.drawKtahbjects();
    p.writeMessage();
  }

  p.writeMessage = function () {
    if (message) {
      p.fill("red");
      p.textSize(40);
      p.text(message, p.width/2, p.height/4);
    }
  }

  p.drawKtahbjects = function () {
    activeGame.forEachKtahbject((k, r, c) => {
      p.image(assets.p5Images[k.asset], c*cellDims, r*cellDims, cellDims, cellDims);
    });
  }

}


// ---------------------------------------------------
// INTERFACE CONFIGURATION
// We'll use the following functions to communicate
// with the user and collect their input
// ---------------------------------------------------

function beginGameLoad () {
  lobbyCont.style.display = "none";
  loading.style.display = "";
  mazeCont.innerHTML = "";
  timeLeft.value = 100;
  healthLeft.value = 100;
  abilityCool.value = 100;
  score.count = 0;
}

function endGameLoad () {
  loading.style.display = "none";
  gameCont.style.display = "";
}

function updateHealth (percentage) {
  healthLeft.value = Math.floor(percentage * 100);
}

function updateTimer (percentage) {
  timeLeft.value = Math.floor(percentage * 100);
}

function updateRound (round) {
  currRound.innerHTML = round;
}

function updateCooldown(percentage) {
  abilityCool.value = Math.floor(percentage * 100);
}

function endGame () {
  playSound(assets.sounds.dead, false);
  gameCont.style.display = "none";
  lobbyCont.style.display = "";
  mazeCont.innerHTML = "";
  scoreCount = 0;
}

function _key_listener (event) {
  event.preventDefault();
  let player = activeGame.player,
      r = player.r,
      c = player.c;
  switch (event.key) {
    case "a": c--; break;
    case "s": r++; break;
    case "d": c++; break;
    case "w": r--; break;
    case " ": activeGame.player.useAbility(); return;
  }
  activeGame.player.moveTo(r, c);
}

/*
 * Configures the keyboard event handlers for the player;
 * we'll use the standard asdw movement
 */
function bindPlayerKeys () {
  document.addEventListener("keypress", _key_listener);
}

/*
 * Removes the keybindings for the player controls
 */
function removePlayerKeys () {
  document.removeEventListener("keypress", _key_listener);
}

function playSound(sound, loopCondition) {
  if (typeof sound.loop == 'boolean') {
      sound.loop = loopCondition;
  }
  else {
      sound.addEventListener('ended', function() {
          this.currentTime = 0;
          this.play();
      }, false);
  }
  sound.play();
}

// ---------------------------------------------------
// LOBBY CONFIGURATION
// We'll handle all setup options here
// ---------------------------------------------------

// Configure the game initialization
function initGame (config) {
  playSound(assets.sounds.soundtrack, true);
  beginGameLoad();
  activeGame = new Game(config);
  activeP5 = new p5(setupP5, "game-maze");
  endGameLoad();
  scoreCount = 0;
};

// Configure the launch button below:
configButt.onclick = function () {
  let maze = document.querySelector(mazeSelect).value.split("\n"),
      character = document.querySelector(charSelect).value,
      difficulty = document.querySelector(diffSelect).value;

  if (!isValidMaze(maze)) {
    alert("[X] Your maze is malformed. Please see the requirements for a valid maze to play.");
    return;
  }

  // If we make it here, then the game is good to go! Create a
  // new game object in our global activeGame to start
  initGame({
    maze: maze,
    char: character,
    diff: difficulty
  });
}


// ---------------------------------------------------
// KTAHBJECT SUPERCLASS
// The following classes will represent all of our
// interactive objects in the game itself
// ---------------------------------------------------

class Ktahbject {
  constructor (r, c, game) {
    this.r = r;
    this.c = c;
    this.game = game;
    this.health = 100;
  }

  /*
   * Moves the current Ktahbject from its current location
   * to the one at the given row and col
   */
  moveTo (row, col) {
    // Create a variable called target that gets the
    // object(s) at the requested row, col
    // [!] see Game's getKtahbjectsAt method
    let target = this.game.getKtahbjectsAt(row, col);
    this.facing = {r: row - this.r, c: col - this.c};
    // set a property called facing on this object
    // that is an object with 2 properties: r and c
    // This property represents which way the moved
    // ktahbject is facing. For example, if it just moved
    // left, then this.facing = {r: 0, c: -1}; if it just
    // moved up, then this.facing = {r: -1, c: 0}, etc.
    // this.facing = {r: ???, c: ???};
    //
    // We'll use the facing property when a player uses
    // their ability, and that ability must occur in a given
    // direction compared to where they're facing


    // Only move if the spot is open; check to see if
    // the target is an empty location; if it is, then
    // we can move to the requested spot; if it isn't, then
    // do nothing!
    if (target.length === 0) {
         this.game.addAt(this, row, col);
         this.game.eraseAt(this, this.r, this.c);
         //set this ktahbject's r to row and c to col
         this.r = row;
         this.c = col;
    }
  }
}


// ---------------------------------------------------
// PLAYER CLASS
// The Player object will be used to track the Player's
// state during the game, including its used abilities
// ---------------------------------------------------

class Player extends Ktahbject {
  constructor (r, c, game) {
    super(r, c, game);
    // Leave these lines as-is:
    this.asset = this.character = this.game.character;
    this.facing = {r: -1, c: 0}; // Default: facing up
    this.cooldown = 0;
  }

  /*
   * Players who are adjacent to a Zombie at a game tick
   * will take damage proportional to the difficulty of
   * the game. If the player's health is reduced below 0,
   * then the game will end.
   * All damage updates the health bar of the player using
   * the updateHealth function.
   */
  getEaten () {
    // reduce this player's health property by the amount
    // decided in the game instance's playerDamage property
    // ???
    this.health -= this.game.playerDamage;
    // // update the health bar with the percentage of the player's
    // // remaining health, out of a maximum 100
    // // [!] updateHealth(percentage)
    // // ???
    updateHealth(this.health / 100);
    playSound(assets.sounds.eaten, false);
    // // if the player's health is <= 0, then have the game end
    // // in defeat
    if (this.health <= 0) {
      this.game.end();
    }
  }

  /*
   * Players can use their character's ability as long as it
   * isn't on cooldown, which lasts some number of difficulty-
   * adjusted ticks
   */
  useAbility () {
    let triggerCooldown = false;
    if (this.cooldown === 0) {
      switch (this.character) {
        case "architect":
          let wallLoc = {r: this.r + this.facing.r, c: this.c + this.facing.c},
              objsAtLoc = this.game.getKtahbjectsAt(wallLoc.r, wallLoc.c);

          // if there's nothing in objsAtLoc, then it's clear and
          // ready to have a wall placed in it!


           if (objsAtLoc.length === 0) {
            //create a new Wall object at the given wallLoc
            let newWall = new Wall(wallLoc.r, wallLoc.c, this.game, false);
            this.game.addAt(newWall, wallLoc.r, wallLoc.c);

            // add the newWall to the game's ktahbjects:
            // [!] this.game.ktahbjects
            // ???

            // Uncomment, then leave this line as-is:
            triggerCooldown = true;
          }
          break;
      }
    }
    if (triggerCooldown) { this.cooldown += this.game.cooldown; }
  }

  /*
   * A player's act on a given tick reduces their cooldown by
   * 1, but to a min of 0
   */

  act () {
    this.cooldown = Math.max(0, (this.cooldown-1));
    if (this.cooldown > 0 && this.cooldown < 100) {
      updateCooldown(this.cooldown / this.game.cooldown);
    }
    else {
      updateCooldown(10);
    }
    // simple: set this Player's cooldown to
    // the max of 0 and this.cooldown - 1
    // [!] Math.max
  }
}


// ---------------------------------------------------
// ZOMBIE CLASS
// The Ktahmbies themselves! All state related to each
// Zombie in the game will be templated here
// ---------------------------------------------------

//  Change the Zombie class definition to inherit from Ktahbject
class Zombie extends Ktahbject {
  constructor (r, c, game) {
    super(r, c, game);
    this.asset = "zombie";
  }

  /*
   * A Zombie acts at every tick, performing the following:
   * 1) Ensure that the zombie is removed if its health is <= 0
   * 2) Checks if a player is adjacent to them, if so, the
   *    player will take damage
   * 3) If the player is NOT adjacent, the Zombie moves in
   *    a random direction: up, down, left, or right; if the
   *    direction chosen is blocked (by a wall or zombie),
   *    then this Zombie does nothing for this tick
   */
  act () {
    if (this.health <= 0) {
      // Satisfy act requirement #1:
      // If this Zombie is dead, then remove it from the game,
      // and then return from this function
      this.game.eraseAt(this, this.r, this.c)
      return;
      // ???
    }

    let r = this.r,
        c = this.c,
        // Lists all of the putative directions the Zombie can move
        dirs = [{r:0, c:1}, {r:0, c:-1}, {r:1, c:0}, {r:-1, c:0}],
        // Chooses one of those at random
        chosenDir = dirs[Math.floor(Math.random()*4)],
        // Provides a row, col coordinate of the desired location to move
        toMoveTo = {r: r + chosenDir.r, c: c + chosenDir.c};

    // Satisfy act requirement #2: check if the Player is
    // in any of the adjacent cells to the Zombie, and if so,
    // have the Player get eaten and *return* from this function
    // immediately after
    // [!] this.game.player
    // [!] this.game.player.getEaten
    // [!] activeP5.dist  // p5's dist method!
    // ??? (this will be an if statement with stuff inside)
    if (activeP5.dist(r, c, this.game.player.r, this.game.player.c) <= 1) {
       this.game.player.getEaten()
    }





    // Satisfy act requirement #3: move the Zombie. If we
    // reach here, then we know the Player is not adjacent to the
    // Zombie, and it is still alive, so move it to the location
    // we made in toMoveTo above
    //this.moveTo = this.toMoveTo;
    // ???
    this.moveTo(toMoveTo.r,toMoveTo.c);
  }
}


// ---------------------------------------------------
// WALL CLASS
// Used to model the game's boundaries and impassable
// barriers... can also be used for Architect's walls!
// ---------------------------------------------------

class Wall extends Ktahbject {
  // [!] Below, permanent is an *optional* parameter, meaning
  // that it will have the value given (true) if the user does
  // not specify it, otherwise, it attains the value of an
  // entered argument; use this parameter to distinguish permanent
  // walls from those constructed by the Architect
  constructor (r, c, game, permanent = true) {
    super(r, c, game);
    this.permanent = permanent;
    if (this.permanent === false) {
      this.health = 5;
    }
    //  If the wall is NOT permanent (i.e., was made
    // by the architect) set its health to 5 here
    // ??
    // Leave these lines as-is:
    this.asset = "wall";


  }

  /*
   * Walls "act" by losing 1 health every tick IF
   * they are not permanent. This allows us to make
   * temporary ones via the Architect. Kill the wall
   * if its health is <= 0
   */
  act () {
    if (this.permanent === false) {
      this.health-=1;
    }
    // remove 1 health from this wall IF it is
    // not permanent
    // ???
    if (this.health <= 0) {
      this.game.eraseAt(this, this.r, this.c);
    }
    // if this wall's health is <= 0, then remove
    // it from the game
  }
}


// ---------------------------------------------------
// GAME CLASS CONFIGURATION
// We'll use the following Game class to configure all
// of our setup and gameplay
// ---------------------------------------------------

class Game {

  /*
   * A Game instance will be passed a configuration, which
   * is a JS Object containing properties needed for
   * setup. These properties include:
   *   - maze: the user's input Maze, to be parsed into
   *           individual Ktahbjects
   *   - char: the character class selected by the user
   *   - diff: the difficulty setting chosen by the user
   *
   * All property values in the config param are assumed
   * to be valid. Any invalid input will be handled by
   * our lobby configuration below
   */
  constructor (config) {
    let maze = config.maze,
        diffs = ["ktrivial", "ktolerable", "kterrible"],
        diffMultiplier,
        game = this;

    // We'll save each Ktahbject in the Game's state;
    // Important: ktahbjects is an array of arrays of arrays,
    // structured as: ktahbjects[rows][cols][objects]
    this.ktahbjects = [];
    this.player = null;

    this.difficulty = config.diff;
    this.character = config.char;
    this.rows = maze.length;
    this.cols = maze[0].length;
    this.round = 0;
    this.nZoms = 0;

    // Save the amount of damage a player takes from
    // getting eaten, the length of a tick, and the
    // amount of time needed to survive based on difficulty
    diffMultiplier    = diffs.indexOf(this.difficulty);
    this.playerDamage = (diffMultiplier + 2) * 5;
    this.cooldown     = (diffMultiplier + 2) * 3;
    this.tickLength   = (3 - diffMultiplier) * 200 + 500;
    this.surviveTime  = (diffMultiplier + 1) * 15 + 10;
    this.timerMax     = this.surviveTime;

    // Parse each cell's contents to create a new
    // Ktahbject of the given type
    for (let r = 0; r < this.rows; r++) {
      let ktahbjectRow = this.ktahbjects[r] = [],
          mazeRow = maze[r];
      for (let c = 0; c < this.cols; c++) {
        let ktahbjectCol = ktahbjectRow[c] = [],
            mazeCell = mazeRow[c];

        switch (mazeCell) {
          case "P":
            // We'll track the player separately for
            // convenience, but they'll also be in the
            // ktahbjects array
            // Create a new Player instance and save it
            // within the game's player property
            this.player = new Player(r, c, this);

            // add that newly created player object to the
            // ktahbjects array
            this.addAt(this.player, r, c);
            break;
          case "Z":
            // Create a new Zombie instance and push it into
            // the game's ktahbjects array, and increments
            let zombie = new Zombie(r, c, this);
            this.addAt(zombie, r, c);
            // [!] this.nZoms
            // ???
            this.nZoms++;
            break;
          case "X":
            // Create a new Wall instance and push it into
            // the game's ktahbjects array
            let wall = new Wall(r, c, this);
            this.addAt(wall, r, c);
            // ???
            break;
        }
      }
    }

    // Configure the newly created Player's movement
    bindPlayerKeys();
    updateRound(this.round);

    // Start the game!
    this.ticking = setInterval(function () { game.doTick(); }, this.tickLength);
  }

  //function that increases score based on round and diff level
  increaseScore(round) {
    let bonus = null;
    switch (this.difficulty) {
      case "ktrivial": bonus = 0; break;
      case "ktolerable": bonus = 2; break;
      case "kterrible": bonus = 5; break;
    }
    scoreCount += (10 + round + bonus);
    scoreReport.innerHTML = `Score: ${scoreCount}`;
    scoreInfo.innerHTML = `+${this.round} for round and +${bonus} for ${this.difficulty} difficulty`;
  }
  /*
   * Adds the given ktahbject to the maze in the position specified;
   * useful for moving ktahbjects from one location to another,
   * or for creating them for the first time
   */
  addAt (ktahbject, row, col) {
    this.ktahbjects[row][col].push(ktahbject);
  }

  /*
   * Erases the given ktahbject in the position specified;
   * useful for moving ktahbjects from one location to another
   * when you know their origin.
   */

  eraseAt (ktahbject, row, col) {
    let index = this.ktahbjects[row][col].indexOf(ktahbject);
    if (index !== -1) {
      this.ktahbjects[row][col].splice(index, 1);
    }
    return index !== -1;
  }

  /*
   * Kills all objects of a particular ClassType, as specified by
   * the parameter. Useful for cleaning up zombies in between
   * rounds.
   */
  killAll (Type) {
    this.forEachKtahbject((k, r, c) => {
      if (k instanceof Type) {
        this.eraseAt(k, r, c);
      }
    });
  }

  /*
   * Returns the ktahbjects at the requested row and col
   */
  getKtahbjectsAt (row, col) {
    return this.ktahbjects[row][col];
  }

  /*
   * Helper to iterate over all Ktahbjects currently stored
   * in the game; will call the given function specified
   * by the behavior parameter with each Ktahbject
   */
  forEachKtahbject (behavior) {
    for (let row in this.ktahbjects) {
      for (let col in this.ktahbjects[row]) {
        for (let k of this.ktahbjects[row][col]) {
          behavior(k, row, col);
        }
      }
    }
  }

  /*
   * The main control for zombies and game mechanics, the
   * game will periodically (depending on the difficulty)
   * instruct zombies to move, and check if the player has
   * survived / died yet
   */
  doTick () {
    if (!activeGame) { return; }
    let actors = new Set();
    this.forEachKtahbject((k) => actors.add(k));
    actors.forEach((k) => k.act());
    this.surviveTime--;
    updateTimer(this.surviveTime / this.timerMax);
    if (this.surviveTime <= 0) {
      this.nextRound();
    }
    this.increaseScore(this.round);
  }

  /*
   * Called after a player survives a round; will kill all
   * remaining zombies and respawn them after a short delay,
   * thus beginning the next round
   */
  nextRound () {
    this.killAll(Zombie);
    this.playerDamage++;
    this.nZoms++;
    this.timerMax++;
    this.round++;
    this.surviveTime = this.timerMax;
    message = "K'tah sleeps... for now...";
    updateRound(this.round);

    // Dramatic delay before next round
    setTimeout(() => {
      message = "";
      for (let i=0; i < this.nZoms; i++) {
        let randRow = Math.floor(Math.random() * this.rows),
            randCol = Math.floor(Math.random() * this.cols);
        if (this.getKtahbjectsAt(randRow, randCol).length === 0) {
          this.addAt((new Zombie(randRow, randCol, this)), randRow, randCol);
        }
        else {
          i--;
        }
      }
      // Respawn this.nZoms in random locations
      // around the map -- the shock factor that only
      // K'tah! can deliver
      // [!] this.addAt
      // ???
    }, 3000);
  }

  /*
   * Terminates the current game with a score summary
   */
  end () {
    removePlayerKeys();
    clearInterval(this.ticking);
    alert(`K'tah claims another victim...\n You survived ${this.round} rounds and scored ${scoreCount} points.`);
    endGame();
  }

}


// ---------------------------------------------------
// HELPER FUNCTIONS
// Any functions that make your life easier here!
// ---------------------------------------------------

/*
 * isValidMaze checks to make sure a given maze (as
 * described in the spec) meets a variety of validity
 * criteria, and returns true if all are met:
 *   1. All rows have same number of cols
 *   2. First and last rows are all "X"
 *   3. First and last cols of every row are "X"
 *   4. Exactly 1 player starting location
 *   5. At least 1 zombie starting location
 *   6. No invalid cell contents
 */
function isValidMaze (maze) {
  // Helper function: returns true if and only if the
  // given row contains only the "X" character
  let isAllXRow = function (row) {
        if (!row) { return false; }
        for (let r of row) {
          if (r !== "X") { return false; }
        }
        return true;
      },

      // Helper function: returns true if and only if the
      // given row's first and last cell are "X"
      hasXBorder = function (row) {
        return row[0] === "X" && row[row.length - 1] === "X";
      },

      playerCount = 0,
      zombieCount = 0,
      columnCount = maze[0] && maze[0].length;

  // [Criteria 2 Check]
  if (!(isAllXRow(maze[0]) && isAllXRow(maze[maze.length - 1]))) {
    return false;
  }

  for (let currRow of maze) {
    // [Criteria 1 Check]
    if (currRow.length !== columnCount) { return false; }

    // [Criteria 3 Check]
    if (!hasXBorder(currRow)) { return false; }

    for (let cell of currRow) {
      switch (cell) {
        case "P":
          playerCount++;
          // [Criteria 4 Check]
          if (playerCount > 1) { return false; }
          break;
        case "Z":
          zombieCount++;
          break;
        case "X":
        case ".":
          break;
        // [Criteria 6 Check]
        default:
          return false;
      }
    }
  }

  // [Criteria 4, 5 Check]
  return zombieCount >= 1 && playerCount === 1;
}
