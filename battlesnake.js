/*jslint esversion: 6*/
const router = require("express").Router();
const _ = require("underscore");

console.log('---> V2 <----');
let games = {};

router.post("/start", function({ body }, res, next) {
  games[body.game.id] = body;
  console.log(games[body.game.id]);
  res.json({
    color: "#5ECBC2",
    headType: "silly",
    tailType: "freckled"
  });
});
router.post("/move", function({ body }, res, next) {
  const me = body.you.body[0];
  let board = [];
  for (var i = 0; i < body.board.width; i++) {
    board.push([]);
    for (var j = 0; j < body.board.height; j++) {
      board[i].push("empty");
    }
  }
  body.board.food.forEach(position => {
    board[position.x][position.y] = "food";
  });
  body.board.snakes.forEach(snake => {
    snake.body.forEach(position => {
      board[position.x][position.y] = snake.id;
    });
  });
  let validDirections = [];
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
  let direction;
  if (body.you.health <= 50) {
    if (bestDirections.indexOf(games[body.game.id]) >= 0) {
      direction = games[body.game.id];
    } else if (
      bestDirections.length > 0 &&
      bestDirections.indexOf(games[body.game.id]) < 0
    ) {
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
  });
});
router.post("/end", function(req, res, next) {
  res.status(200).end();
});
router.post("/ping", function(req, res, next) {
  res.status(200).end();
});
router.get("/", function(req, res, next) {
  res.status(200).send("Success");
});

const distance = (spot1, spot2) => {
  return Math.abs(spot1.x - spot2.x) + Math.abs(spot1.y - spot2.y);
};

const pickDirection = (directions, me, board) => {
  const head = me.body[0];
  const pieces = {
    up: board.height / 2 < me.y,
    down: board.height / 2 > me.y,
    left: board.width / 2 < me.x,
    right: board.width / 2 > me.x
  };
  const recommendedDirections = directions.filter(
    direction => pieces[direction]
  );
  return recommendedDirections.length > 0
    ? recommendedDirections[
        Math.floor(Math.random() * recommendedDirections.length)
      ]
    : directions[Math.floor(Math.random() * directions.length)];
};

const checkSpot = (board, snakes, me, position) => {
  if (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= board.length ||
    position.y >= board[0].length ||
    ["food", "empty"].indexOf(board[position.x][position.y]) >= 0
  ) {
    return true;
  } else {
    //You can do a head-on collision if the snake is smaller than yours
    const snake = _.find(
      snakes,
      snake => board[position.x][position.y] === snake.id
    );
    if (!snake) {
      console.log(
        `what's here? {${position.x}, ${position.y}} -> ${
          board[position.x][position.y]
        }`
      );
      return false;
    } else if (snake.id !== me.id) {
      const head =
        position.x === snake.body[0].x && position.y === snake.body[0].y;
      console.log(
        `{${position.x}, ${position.y}} -> ${snake.body.length} snake, I'm a ${me.body.length}`
      );
      return (snake.body.length < me.body.length && head) || !head;
    } else {
      return true;
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
    },
    { x: body.board.width, y: body.board.height }
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
