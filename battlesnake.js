const router = require('express').Router();
const _ = require('underscore');

console.log('---> V5 <----');
let games = {};

colors = ['#5ECBC2', '#E80978', '#3E338F', '#4C89C8'];

router.get('/', function (req, res, next) {
	res.json({
		apiversion: '1',
		author: 'DigitalBurger',
		color: colors[Math.floor(Math.random() * colors.length)],
		head: 'silly',
		tail: 'freckled',
	});
});

router.post('/start', function ({ body }, res, next) {
	games[body.game.id] = body;
	console.log(games[body.game.id]);
	res.sendStatus(200);
});

router.post('/move', function ({ body }, res, next) {
	const me = body.you.body[0];
	let board = [];
	//Check all the spots on the board
	for (var i = 0; i < body.board.width; i++) {
		board.push([]);
		for (var j = 0; j < body.board.height; j++) {
			board[i].push(
				assessSpot(body.board, body.you, {
					x: i,
					y: j,
				})
			);
		}
	}
	//Find hazards next to movable spots
	let validDirections = [];
	if (
		me.x < body.board.width - 1 &&
		['food', 'empty'].indexOf(board[me.x + 1][me.y].item) >= 0 &&
		games[body.game.id] !== 'left' &&
		checkSnake(board, body.board.snakes, body.you, {
			x: me.x + 1,
			y: me.y,
		})
	) {
		const score = checkPerimeter(board, body.board.snakes, body.you, [
			{
				x: me.x + 1,
				y: me.y - 1,
			},
			{
				x: me.x + 1,
				y: me.y + 1,
			},
			{
				x: me.x + 2,
				y: me.y,
			},
		]);
		if (score >= 1) validDirections.push({ direction: 'right', score });
	}
	if (
		me.x > 0 &&
		['food', 'empty'].indexOf(board[me.x - 1][me.y].item) >= 0 &&
		games[body.game.id] !== 'right' &&
		checkSnake(board, body.board.snakes, body.you, {
			x: me.x - 1,
			y: me.y,
		})
	) {
		const score = checkPerimeter(board, body.board.snakes, body.you, [
			{
				x: me.x - 1,
				y: me.y - 1,
			},
			{
				x: me.x - 1,
				y: me.y + 1,
			},
			{
				x: me.x - 2,
				y: me.y,
			},
		]);
		if (score >= 1) validDirections.push({ direction: 'left', score });
	}
	if (
		me.y > 0 &&
		['food', 'empty'].indexOf(board[me.x][me.y - 1].item) >= 0 &&
		games[body.game.id] !== 'up' &&
		checkSnake(board, body.board.snakes, body.you, {
			x: me.x,
			y: me.y - 1,
		})
	) {
		const score = checkPerimeter(board, body.board.snakes, body.you, [
			{
				x: me.x - 1,
				y: me.y - 1,
			},
			{
				x: me.x + 1,
				y: me.y - 1,
			},
			{
				x: me.x,
				y: me.y - 2,
			},
		]);
		if (score >= 1) validDirections.push({ direction: 'down', score });
	}
	if (
		me.y < body.board.height - 1 &&
		['food', 'empty'].indexOf(board[me.x][me.y + 1].item) >= 0 &&
		games[body.game.id] !== 'down' &&
		checkSnake(board, body.board.snakes, body.you, {
			x: me.x,
			y: me.y + 1,
		})
	) {
		const score = checkPerimeter(board, body.board.snakes, body.you, [
			{
				x: me.x - 1,
				y: me.y + 1,
			},
			{
				x: me.x + 1,
				y: me.y + 1,
			},
			{
				x: me.x,
				y: me.y + 2,
			},
		]);
		if (score >= 1) validDirections.push({ direction: 'up', score });
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
			score: board[me.x + 1][me.y].score,
		});
	}
	if (me.x > 0 && games[body.game.id] !== 'right') {
		directions.push({
			direction: 'left',
			score: board[me.x - 1][me.y].score,
		});
	}
	if (me.y < body.board.width - 1 && games[body.game.id] !== 'down') {
		directions.push({
			direction: 'up',
			score: board[me.x][me.y + 1].score,
		});
	}
	if (me.y > 0 && games[body.game.id] !== 'up') {
		directions.push({
			direction: 'down',
			score: board[me.x][me.y - 1].score,
		});
	}

	const foodDirections = getClosestFood(body, me);
	let direction, shout;

	const goodDirections = _.intersection(
		validDirections.map(dir => dir.direction),
		foodDirections
	);
	let highScoreDirection = _.max(validDirections, direction => direction.score);
	let bestDirections = validDirections
		.filter(direction => direction.score === highScoreDirection.score)
		.map(dir => dir.direction);

	if (bestDirections.length > 0) {
		shout = 'There are Best Directions, pick one';
		const fantasticDirections = _.intersection(bestDirections, foodDirections);
		direction = pickDirection(
			fantasticDirections.length > 0 ? fantasticDirections : bestDirections,
			body.you,
			body.board
		);
	} else if (goodDirections.indexOf(highScoreDirection.direction) >= 0) {
		shout = 'Good Directions include High Score Direction';
		direction = highScoreDirection.direction;
	} else if (goodDirections.indexOf(games[body.game.id]) >= 0) {
		shout = 'Good Directions include Previous Direction';
		direction = games[body.game.id];
	} else if (goodDirections.length > 0) {
		shout = 'There are Good Directions, pick one';
		direction = pickDirection(goodDirections, body.you, body.board);
	} else if (
		_.some(
			validDirections,
			direction => direction.direction === highScoreDirection.direction
		)
	) {
		shout = 'Valid Directions includes High Score Direction';
		direction = highScoreDirection.direction;
	} else if (
		_.some(
			validDirections,
			direction => direction.direction === games[body.game.id]
		)
	) {
		shout = 'Valid Directions includes Previous Direction';
		direction = games[body.game.id];
	} else if (validDirections.length > 0) {
		shout = 'There are Valid Directions, pick one';
		//direction = validDirections[Math.floor(Math.random() * validDirections.length)];
		direction = pickDirection(
			validDirections.map(direction, direction.direction),
			body.you,
			body.board
		);
	} else {
		shout = 'Fuck it, go into the worst direction';
		direction = directions.reduce(
			(worst, direction) => {
				if (worst.score > direction.score) {
					worst = direction;
				}
				return worst;
			},
			{
				score: 50,
				direction: '',
			}
		).direction;
	}

	console.log(shout);
	console.log(`Valid directions: ${validDirections.map(dir => dir.direction)}`);
	console.log(`Best directions: ${bestDirections}`);
	console.log(`Food directions: ${foodDirections}`);
	console.log(`Highest Scored direction: ${highScoreDirection.direction}`);
	console.log(`Previous direction: ${games[body.game.id]}`);
	console.log(`Chosen direction: ${direction}`);

	games[body.game.id] = direction;
	res.json({
		move: direction,
		shout,
	});
});
router.post('/end', function (req, res, next) {
	res.status(200).end();
});

const distance = (spot1, spot2) => {
	return Math.abs(spot1.x - spot2.x) + Math.abs(spot1.y - spot2.y);
};

//Pick a directions out of the given directions
const pickDirection = (directions, me, board) => {
	if (directions.length === 1) return directions[0];
	const head = me.body[0];

	const pieces = {
		up: board.height / 2 > head.y,
		down: board.height / 2 < head.y,
		left: board.width / 2 < head.x,
		right: board.width / 2 > head.x,
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

const checkPerimeter = (board, snakes, me, positions) =>
	positions.reduce(
		(score, position) =>
			score + (checkSpot(board, snakes, me, position) ? 1 : 0),
		0
	);

const checkSpot = (board, snakes, me, position) => {
	if (
		position.x < 0 ||
		position.y < 0 ||
		position.x >= board.length ||
		position.y >= board[0].length ||
		['food', 'empty'].indexOf(board[position.x][position.y].item) >= 0
	) {
		return true;
	} else {
		//You can do a head-on collision if the snake is smaller than yours
		const snake = _.find(
			snakes,
			snake => board[position.x][position.y].item === snake.id
		);
		if (!snake) {
			return true;
		} else if (snake.id !== me.id) {
			const head =
				position.x === snake.body[0].x && position.y === snake.body[0].y;
			const tail =
				position.x === snake.body[snake.body.length - 1].x &&
				position.y === snake.body[snake.body.length - 1].y;
			return (snake.body.length < me.body.length && head) || tail || !head;
		} else {
			return true;
		}
	}
};

const checkSnake = (board, snakes, me, position) => {
	const snake = _.find(
		snakes,
		snake => board[position.x][position.y].item === snake.id
	);
	if (!snake) {
		return true;
	} else if (snake.id !== me.id) {
		const head =
			position.x === snake.body[0].x && position.y === snake.body[0].y;
		const tail =
			position.x === snake.body[snake.body.length - 1].x &&
			position.y === snake.body[snake.body.length - 1].y;
		return (snake.body.length < me.body.length && head) || tail;
	} else {
		return false;
	}
};

const assessSpot = (board, me, position) => {
	let score = 0;
	score += scoreSpot(
		board,
		me,
		{
			x: position.x,
			y: position.y,
		},
		me.health < 50 ? 4 : 2
	);
	score += scoreSpot(
		board,
		me,
		{
			x: position.x - 1,
			y: position.y - 1,
		},
		me.health < 50 ? 1 : 0
	);
	score += scoreSpot(
		board,
		me,
		{
			x: position.x - 1,
			y: position.y,
		},
		me.health < 50 ? 1 : 0
	);
	score += scoreSpot(
		board,
		me,
		{
			x: position.x - 1,
			y: position.y + 1,
		},
		me.health < 50 ? 1 : 0
	);
	score += scoreSpot(
		board,
		me,
		{
			x: position.x,
			y: position.y + 1,
		},
		me.health < 50 ? 1 : 0
	);
	score += scoreSpot(
		board,
		me,
		{
			x: position.x + 1,
			y: position.y - 1,
		},
		me.health < 50 ? 1 : 0
	);
	score += scoreSpot(
		board,
		me,
		{
			x: position.x + 1,
			y: position.y,
		},
		me.health < 50 ? 1 : 0
	);
	score += scoreSpot(
		board,
		me,
		{
			x: position.x + 1,
			y: position.y + 1,
		},
		me.health < 50 ? 1 : 0
	);
	score += scoreSpot(
		board,
		me,
		{
			x: position.x,
			y: position.y - 1,
		},
		me.health < 50 ? 1 : 0
	);
	const snake = _.find(board.snakes, snake =>
		_.some(
			snake.body,
			piece => piece.x === position.x && piece.y === position.y
		)
	);
	const food = _.find(
		board.food,
		piece => piece.x === position.x && piece.y === position.y
	);
	return {
		item: snake ? snake.id : food ? 'food' : 'empty',
		score,
	};
};

const EMPTY = 0;
const WALL = -3;
const FOOD = 3;
const HAZARD = -1;
const SNAKE_BODY = -2;
const MY_BODY = -3;

const scoreSpot = (board, me, position, modifier = 0) => {
	if (
		position.x < 0 ||
		position.y < 0 ||
		position.x >= board.width ||
		position.y >= board.height
	) {
		return WALL;
	}
	if (
		_.some(board.food, food => food.x === position.x && food.y === position.y)
	) {
		return FOOD + modifier;
	} else if (
		_.some(
			board.hazards,
			hazard => hazard.x === position.x && hazard.y === position.y
		)
	) {
		return HAZARD;
	} else {
		const snake = _.find(board.snakes, snake =>
			_.some(
				snake.body,
				piece => piece.x === position.x && piece.y === position.y
			)
		);
		if (!snake) {
			return EMPTY;
		} else if (snake.id !== me.id) {
			//Snake size calculation
			const head =
				position.x === snake.body[0].x && position.y === snake.body[0].y;
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
		},
		{
			x: body.board.width,
			y: body.board.height,
		}
	);
	let directions = [];
	if (food.x < position.x) {
		directions.push('left');
	} else if (food.x > position.x) {
		directions.push('right');
	}
	if (food.y < position.y) {
		directions.push('down');
	} else if (food.y > position.y) {
		directions.push('up');
	}
	return directions;
};

module.exports = router;
