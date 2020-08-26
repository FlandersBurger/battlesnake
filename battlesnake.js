/*jslint esversion: 6*/
const router = require("express").Router();
const _ = require("underscore");

console.log('---> V5 <----');
let games = {};


router.post("/start", function({
  body
}, res, next) {
  games[body.game.id] = body;
  console.log(games[body.game.id]);
  res.json({
    color: "#5ECBC2",
    headType: "silly",
    tailType: "freckled"
  });
});

router.post("/move", function({
  body
}, res, next) {
  const me = body.you.body[0];
  let board = [];
  for (var i = 0; i < body.board.width; i++) {
    board.push([]);
    for (var j = 0; j < body.board.height; j++) {
      board[i].push(assessSpot(body.board, body.you, {
        x: i,
        y: j
      }));
    }
  }
  let validDirections = [];
  if (me.x < body.board.width - 1 && ['food', 'empty'].indexOf(board[me.x + 1][me.y].item) >= 0 && games[body.game.id] !== 'left') {
    if (checkSpot(board, body.board.snakes, body.you, {
        x: me.x + 1,
        y: me.y - 1
      }) && checkSpot(board, body.board.snakes, body.you, {
        x: me.x + 1,
        y: me.y + 1
      }) && checkSpot(board, body.board.snakes, body.you, {
        x: me.x + 2,
        y: me.y
      }))
      validDirections.push('right');
  }
  if (me.x > 0 && ['food', 'empty'].indexOf(board[me.x - 1][me.y].item) >= 0 && games[body.game.id] !== 'right') {
    if (checkSpot(board, body.board.snakes, body.you, {
        x: me.x - 1,
        y: me.y - 1
      }) && checkSpot(board, body.board.snakes, body.you, {
        x: me.x - 1,
        y: me.y + 1
      }) && checkSpot(board, body.board.snakes, body.you, {
        x: me.x - 2,
        y: me.y
      }))
      validDirections.push('left');
  }
  if (me.y < body.board.width - 1 && ['food', 'empty'].indexOf(board[me.x][me.y + 1].item) >= 0 && games[body.game.id] !== 'up') {
    if (checkSpot(board, body.board.snakes, body.you, {
        x: me.x - 1,
        y: me.y + 1
      }) && checkSpot(board, body.board.snakes, body.you, {
        x: me.x + 1,
        y: me.y + 1
      }) && checkSpot(board, body.board.snakes, body.you, {
        x: me.x,
        y: me.y + 2
      }))
      validDirections.push('down');
  }
  if (me.y > 0 && ['food', 'empty'].indexOf(board[me.x][me.y - 1].item) >= 0 && games[body.game.id] !== 'down') {
    if (checkSpot(board, body.board.snakes, body.you, {
        x: me.x - 1,
        y: me.y - 1
      }) && checkSpot(board, body.board.snakes, body.you, {
        x: me.x + 1,
        y: me.y - 1
      }) && checkSpot(board, body.board.snakes, body.you, {
        x: me.x,
        y: me.y - 2
      }))
      validDirections.push('up');
  }

  let directions = [];
  /*
  directions.push({ direction: 'right', score: board[me.x + 1][me.y].score });
  directions.push({ direction: 'left', score: board[me.x - 1][me.y].score });
  directions.push({ direction: 'down', score: board[me.x][me.y + 1].score });
  directions.push({ direction: 'up', score: board[me.x][me.y - 1].score });
  */
  if (me.x < body.board.width - 1 && games[body.game.id] !== 'left') {
    directions.push({
      direction: 'right',
      score: board[me.x + 1][me.y].score
    });
  }
  if (me.x > 0 && games[body.game.id] !== 'right') {
    directions.push({
      direction: 'left',
      score: board[me.x - 1][me.y].score
    });
  }
  if (me.y < body.board.width - 1 && games[body.game.id] !== 'up') {
    directions.push({
      direction: 'down',
      score: board[me.x][me.y + 1].score
    });
  }
  if (me.y > 0 && games[body.game.id] !== 'down') {
    directions.push({
      direction: 'up',
      score: board[me.x][me.y - 1].score
    });
  }

  const foodDirections = getClosestFood(body, me);
  let direction, shout;

  const goodDirections = _.intersection(validDirections, foodDirections);
  let bestDirections = goodDirections.map(direction => {
    let score = 0;
    switch (direction) {
      case 'up':
        for (let i = me.y + 1; i < body.board.height; i++) {
          if (['food', 'empty'].indexOf(board[me.x][i].item) >= 0) score++;
          else break;
        }
        break;
      case 'down':
        for (let i = me.y - 1; i > 0; i--) {
          if (['food', 'empty'].indexOf(board[me.x][i].item) >= 0) score++;
          else break;
        }
        break;
      case 'left':
        for (let i = me.x - 1; i > 0; i--) {
          if (['food', 'empty'].indexOf(board[i][me.y].item) >= 0) score++;
          else break;
        }
        break;
      case 'right':
        for (let i = me.x + 1; i < body.board.width; i++) {
          if (['food', 'empty'].indexOf(board[i][me.y].item) >= 0) score++;
          else break;
        }
        break;
    }
    return {
      direction,
      score
    };
  });

  //const validDirections = directions.filter(direction => direction.score > -5).map(direction => direction.direction);
  let highScoreDirection = directions.reduce((best, direction) => {
    if (best.score < direction.score && validDirections.indexOf(direction.direction) >= 0) {
      best = direction;
    }
    return best;
  }, {
    score: -50,
    direction: ''
  });

  if (highScoreDirection.score === -50) {
    highScoreDirection = directions.reduce((best, direction) => {
      if (best.score < direction.score && bestDirections.indexOf(direction.direction) >= 0) {
        best = direction;
      }
      return best;
    }, {
      score: -50,
      direction: ''
    });
  }

  if (bestDirections.indexOf(highScoreDirection.direction) >= 0) {
    shout = 'Best Directions include High Score Direction';
    direction = highScoreDirection.direction;
  } else if (bestDirections.indexOf(games[body.game.id]) >= 0) {
    shout = 'Best Directions include Previous Direction';
    direction = games[body.game.id];
  } else if (bestDirections.length > 0) {
    shout = 'There are Best Directions, pick one';
    direction = pickDirection(bestDirections, body.you, body.board);
  } else if (validDirections.indexOf(games[body.game.id]) >= 0) {
    shout = 'Valid Directions includes Previous Direction';
    direction = games[body.game.id];
  } else if (validDirections.indexOf(highScoreDirection.direction) >= 0) {
    shout = 'Valid Directions includes High Score Direction';
    direction = highScoreDirection.direction;
  } else if (validDirections.length > 0) {
    shout = 'There are Valid Directions, pick one';
    //direction = validDirections[Math.floor(Math.random() * validDirections.length)];
    direction = pickDirection(validDirections, body.you, body.board);
  } else {
    shout = 'Fuck it, go into the worst direction';
    direction = directions.reduce((worst, direction) => {
      if (worst.score > direction.score) {
        worst = direction;
      }
      return worst;
    }, {
      score: 50,
      direction: ''
    }).direction;
  }

  //direction = highScoreDirection.direction;
  /*
    console.log(`Valid directions: ${validDirections}`);
    console.log(`Best directions: ${bestDirections}`);
    console.log(`Food directions: ${foodDirections}`);
    console.log(`Highest Scored direction: ${highScoreDirection.direction}`);
    console.log(`Previous direction: ${games[body.game.id]}`);
    console.log(`Chosen direction: ${direction}`);
  */
  games[body.game.id] = direction;
  res.json({
    move: direction,
    shout
  });

  /*
  if (me.x < body.board.width - 2 && ['food', 'empty'].indexOf(board[me.x + 1][me.y]) >= 0) {
    if (checkSpot(board, body.board.snakes, body.you, { x: me.x + 1, y: me.y - 1 }) && checkSpot(board, body.board.snakes, body.you, { x: me.x + 1, y: me.y + 1 }) && checkSpot(board, body.board.snakes, body.you, { x: me.x + 2, y: me.y }))
      validDirections.push('right');
  }
  if (me.x > 1 && ['food', 'empty'].indexOf(board[me.x - 1][me.y]) >= 0) {
    if (checkSpot(board, body.board.snakes, body.you, { x: me.x - 1, y: me.y - 1 }) && checkSpot(board, body.board.snakes, body.you, { x: me.x - 1, y: me.y + 1 }) && checkSpot(board, body.board.snakes, body.you, { x: me.x - 2, y: me.y }))
      validDirections.push('left');
  }
  if (me.y < body.board.width - 2 && ['food', 'empty'].indexOf(board[me.x][me.y + 1]) >= 0) {
    if (checkSpot(board, body.board.snakes, body.you, { x: me.x - 1, y: me.y + 1 }) && checkSpot(board, body.board.snakes, body.you, { x: me.x + 1, y: me.y + 1 }) && checkSpot(board, body.board.snakes, body.you, { x: me.x, y: me.y - 2 }))
      validDirections.push('down');
  }
  if (me.y > 1 && ['food', 'empty'].indexOf(board[me.x][me.y - 1]) >= 0) {
    if (checkSpot(board, body.board.snakes, body.you, { x: me.x - 1, y: me.y - 1 }) && checkSpot(board, body.board.snakes, body.you, { x: me.x + 1, y: me.y - 1 }) && checkSpot(board, body.board.snakes, body.you, { x: me.x, y: me.y + 2 }))
      validDirections.push('up');
  }
  if (validDirections.length === 0) {
    if (me.x === body.board.width - 2) {
      validDirections.push('right');
    } else if (me.x === 1) {
      validDirections.push('left');
    } else if (me.y === body.board.height - 2) {
      validDirections.push('down');
    } else if (me.y === 1) {
      validDirections.push('up');
    } else if (me.x === body.board.width - 1) {
      validDirections.push('left');
    } else if (me.x === 0) {
      validDirections.push('right');
    } else if (me.y === body.board.height - 1) {
      validDirections.push('up');
    } else if (me.y === 0) {
      validDirections.push('down');
    }
  }
  const foodDirections = getClosestFood(body, me);
  const bestDirections = _.intersection(validDirections, foodDirections);
  if (body.you.health <= 50) {
    if (bestDirections.indexOf(games[body.game.id]) >= 0) {
      direction = games[body.game.id];
    } else if (bestDirections.length > 0 && bestDirections.indexOf(games[body.game.id]) < 0) {
      //direction = bestDirections[Math.floor(Math.random() * bestDirections.length)];
      direction = pickDirection(bestDirections, body.you, body.board);
    } else if (validDirections.indexOf(games[body.game.id]) >= 0) {
      direction = games[body.game.id];
    } else {
      //direction = validDirections[Math.floor(Math.random() * validDirections.length)];
      direction = pickDirection(validDirections, body.you, body.board);
    }
  } else {
    const random = Math.random() * 100;
    console.log(`Rando! ${random}`);
    if (random < body.you.health || bestDirections.length === 0) {
      //direction = validDirections[Math.floor(Math.random() * validDirections.length)];
      direction = pickDirection(validDirections, body.you, body.board);
    } else {
      //direction = bestDirections[Math.floor(Math.random() * bestDirections.length)];
      direction = pickDirection(bestDirections, body.you, body.board);
    }
  }

  console.log(`Valid directions: ${validDirections}`);
  console.log(`Best directions: ${bestDirections}`);
  console.log(`Previous direction: ${games[body.game.id]}`);
  console.log(`Chosen direction: ${direction}`);
  console.log(`Health: ${body.you.health}`);
  games[body.game.id] = direction;
  res.json({
    move: direction,
    shout: "Moving!"
  });*/
});
router.post("/end", function(req, res, next) {
  res.status(200).end();
});
router.post("/ping", function(req, res, next) {
  res.status(200).end();
});
router.get("/", function(req, res, next) {
  res.json({
    apiversion: 1,
    //author: "FlandersBurger",
    color: "#5ECBC2",
    headType: "silly",
    tailType: "freckled"
  });
});

const distance = (spot1, spot2) => {
  return Math.abs(spot1.x - spot2.x) + Math.abs(spot1.y - spot2.y);
};

const pickDirection = (directions, me, board) => {
  const head = me.body[0];
  const pieces = {
    up: board.height / 2 < head.y,
    down: board.height / 2 > head.y,
    left: board.width / 2 < head.x,
    right: board.width / 2 > head.x
  };
  const recommendedDirections = directions.filter(
    direction => pieces[direction]
  );
  return recommendedDirections.length > 0 ? recommendedDirections[Math.floor(Math.random() * recommendedDirections.length)] : directions[Math.floor(Math.random() * directions.length)];
};

const checkSpot = (board, snakes, me, position) => {
  if (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= board.length ||
    position.y >= board[0].length || ["food", "empty"].indexOf(board[position.x][position.y].item) >= 0
  ) {
    return true;
  } else {
    //You can do a head-on collision if the snake is smaller than yours
    const snake = _.find(
      snakes,
      snake => board[position.x][position.y].item === snake.id
    );
    if (!snake) {
      return false;
    } else if (snake.id !== me.id) {
      const head = position.x === snake.body[0].x && position.y === snake.body[0].y;
      return (snake.body.length < me.body.length && head) || !head;
    } else {
      return true;
    }
  }
};

const assessSpot = (board, me, position) => {
  let score = 0;
  score += scoreSpot(board, me, {
    x: position.x,
    y: position.y
  }, me.health < 50 ? 4 : 2);
  score += scoreSpot(board, me, {
    x: position.x - 1,
    y: position.y - 1
  }, me.health < 50 ? 1 : 0);
  score += scoreSpot(board, me, {
    x: position.x - 1,
    y: position.y
  }, me.health < 50 ? 1 : 0);
  score += scoreSpot(board, me, {
    x: position.x - 1,
    y: position.y + 1
  }, me.health < 50 ? 1 : 0);
  score += scoreSpot(board, me, {
    x: position.x,
    y: position.y + 1
  }, me.health < 50 ? 1 : 0);
  score += scoreSpot(board, me, {
    x: position.x + 1,
    y: position.y - 1
  }, me.health < 50 ? 1 : 0);
  score += scoreSpot(board, me, {
    x: position.x + 1,
    y: position.y
  }, me.health < 50 ? 1 : 0);
  score += scoreSpot(board, me, {
    x: position.x + 1,
    y: position.y + 1
  }, me.health < 50 ? 1 : 0);
  score += scoreSpot(board, me, {
    x: position.x,
    y: position.y - 1
  }, me.health < 50 ? 1 : 0);
  const snake = _.find(board.snakes, snake => _.some(snake.body, piece => piece.x === position.x && piece.y === position.y));
  const food = _.find(board.food, piece => piece.x === position.x && piece.y === position.y);
  return {
    item: snake ? snake.id : (food ? 'food' : 'empty'),
    score
  };
};

const EMPTY = 0;
const WALL = -1;
const FOOD = 3;
const HAZARD = -1;
const SNAKE_BODY = -2;
const MY_BODY = -2;

const scoreSpot = (board, me, position, modifier = 0) => {
  if (position.x < 0 || position.y < 0 || position.x >= board.width || position.y >= board.height) {
    return WALL;
  }
  if (_.some(board.food, food => food.x === position.x && food.y === position.y)) {
    return FOOD + modifier;
  } else if (_.some(board.hazards, hazard => hazard.x === position.x && hazard.y === position.y)) {
    return HAZARD;
  } else {
    const snake = _.find(board.snakes, snake => _.some(snake.body, piece => piece.x === position.x && piece.y === position.y));
    if (!snake) {
      return EMPTY;
    } else if (snake.id !== me.id) {
      //Snake size calculation
      const head = position.x === snake.body[0].x && position.y === snake.body[0].y;
      return head ? me.body.length - snake.body.length - 2 : SNAKE_BODY;
    } else if (snake.id === me.id) {
      return MY_BODY;
    } else {
      return 0;
    }
  }
};

const getClosestFood = (body, position) => {
  const food = body.board.food.reduce(
    (closest, crumb) => {
      if (
        Math.abs(position.x - crumb.x) + Math.abs(position.y - crumb.y) <
        Math.abs(position.x - closest.x) + Math.abs(position.y - closest.y)
      ) {
        closest.x = crumb.x;
        closest.y = crumb.y;
      }
      return closest;
    }, {
      x: body.board.width,
      y: body.board.height
    }
  );
  let directions = [];
  if (food.x < position.x) {
    directions.push("left");
  } else if (food.x > position.x) {
    directions.push("right");
  }
  if (food.y < position.y) {
    directions.push("up");
  } else if (food.y > position.y) {
    directions.push("down");
  }
  return directions;
};

module.exports = router;