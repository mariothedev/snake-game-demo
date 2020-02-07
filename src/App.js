import React, { useEffect, useRef, useReducer } from 'react';
import './App.css';
import Timer from "./Timer"


const Keys = {
  Space: 32,
  Left: 37,
  Up: 38,
  Right: 39,
  Down: 40,
  a: 65,
  s: 83,
  w: 87,
  d: 68
}

let move = Keys.Right;
const grid = initGrid(30, 30);
const initState = {
  grid,
  snake: {
    head: {
      row: 5,
      col: 9,
    },
    tail: [],
  },
  food: {
    row: Math.floor(Math.random() * 5),
    col: Math.floor(Math.random() * 5),
  },
  score: 0,
  showGrid: true,
  lost: false,
  message: 'Click start button or any key on keyboard to start the game.',
  inProgress: false,
  highScore: 0,
}

function initGrid(rowLength = 20, colLength = 20) {
  const grid = [];
  for (let row = 0; row < rowLength; row++) {
    const cols = [];
    for (let col = 0; col < colLength; col++) {
      cols.push({
        row,
        col
      });
    }
    grid.push(cols);
  }
  return grid;
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'game_lost':
      return {
        ...state,
        showGrid: state.showGrid,
        lost: true,
        inProgress: false,
        highScore: action.highScore
      }
    case 'update':
      return {
        ...state,
        ...action.newState
      }

    case 'toggle_grid':
      return {
        ...state,
        showGrid: !state.showGrid
      };
    case 'update_grid':
      return {
        ...state,
        grid: action.grid,
      }

    case 'restart':
      let newState = {
        ...initState,
        inProgress: true,
        highScore: action.highScore,
        grid: state.grid,
        showGrid: state.showGrid,
      }
      return newState;
    default: {
      return state;
    }
  }
};

function App() {
  const [state, dispatch] = useReducer(reducer, initState);
  const { score, snake, message, inProgress } = state;
  const childRef = useRef();

  // Keyboard events
  const handleKeyPress = (e) => {
    if (!inProgress) handleRestart()
    else if (e.which === Keys.Left || e.which === Keys.a) {
      move = Keys.Left;
    }
    else if (e.which === Keys.Right || e.which === Keys.d) {
      move = Keys.Right;
    }
    else if (e.which === Keys.Up || e.which === Keys.w) {
      move = Keys.Up;
    }
    else if (e.which === Keys.Down || e.which === Keys.s) {
      move = Keys.Down;
    }
  }

  useEffect(() => {
    let interval = null;
    if (inProgress) {
      interval = setInterval(() => {
        gameEngine()
      }, 100);
    } else if (!inProgress) {
      clearInterval(interval);
    }
    return function cleanup() {
      clearInterval(interval)
    }
  }, [inProgress, snake.head]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return function cleanup() {
      document.removeEventListener('keydown', handleKeyPress);
    }
  });

  const drawGrid = () => {
    const { grid } = state;
    return (
      grid.map((row) => {
        return row.map(cell => {
          let actorStyle = styleCell(cell);
          return <div key={cell.row + cell.col} className={actorStyle} />
        });
      })
    );
  }

  const styleCell = (cell) => {
    const { snake, food, showGrid } = state;
    let style = `cell `;
    if (snake.head.row === cell.row && snake.head.col === cell.col) {
      style = `cell head`;
    }
    else if (food.row === cell.row && food.col === cell.col) {
      style = `cell food`;
    }
    else if (snake.tail.find(t => t.row === cell.row
      && t.col === cell.col)) {
      style = `cell tail`;
    }

    style = showGrid ? style + ' cell-border' : style;
    return style;
  }
  const randomizeFood = () => {
    const { snake } = state;
    const newFood = {
      row: Math.floor(Math.random() * 30),
      col: Math.floor(Math.random() * 30),
    }

    //edge case where generated random number is same
    if (snake.head.row === newFood.row
      && snake.head.col === newFood.col) {
      return randomizeFood();
    }
    return newFood;
  }
  const updateHighScore = () => {
    let highScore = localStorage.getItem('highScore') || 0;
    if (score > highScore) {
      highScore = score;
    }
    localStorage.setItem('highScore', highScore);
  }
  const getHighScore = () => {
    return localStorage.getItem('highScore') || 0;
  }
  let highScore = getHighScore();
  const gameEngine = () => {
    const snakeAteFood = didSnakeAteFood();
    const collideWithSelfOrWall = didSnakeCollideWithSelfOrWall();


    if (collideWithSelfOrWall) {
      resetGameEngine();
      return;
    }

    let x = 1, y = 0;
    if (move === Keys.Left) {
      [x, y] = [-1, 0];
    } else if (move === Keys.Right) {
      [x, y] = [1, 0];
    } else if (move === Keys.Up) {
      [x, y] = [0, -1];
    } else if (move === Keys.Down) {
      [x, y] = [0, 1];
    }
    const nextState = {
      snake: {
        ...state.snake,
        head: {
          row: state.snake.head.row + y,
          col: state.snake.head.col + x
        },
        tail: [state.snake.head, ...state.snake.tail]
      },
      food: snakeAteFood ?
        randomizeFood() : state.food,
      score: snakeAteFood ? score + 1 : score,
    };
    if (!snakeAteFood) {
      nextState.snake.tail.pop();
    }

    dispatch({
      type: 'update',
      newState: nextState
    });
  }

  const didSnakeAteFood = () => {
    const { food, snake } = state;
    return food.row === snake.head.row &&
      food.col === snake.head.col;
  }

  const didSnakeCollideWithSelfOrWall = () => {
    const { snake, grid } = state;
    const { head, tail } = snake;
    return (snake.head.col >= grid.length ||
      snake.head.row >= grid.length ||
      snake.head.col < 0 ||
      snake.head.row < 0) ||
      tail.find(t => t.row === head.row
        && t.col === head.col)
  }
  const onShowGridChange = (e) => {
    dispatch({
      type: 'toggle_grid'
    });
  }
  const handleRestart = () => {
    childRef.current.reset()
    restart()
  }
  const resetGameEngine = () => {
    childRef.current.toggle();
    updateHighScore();
    highScore = getHighScore()
    dispatch({ type: 'game_lost', highScore });
  }
  const restart = () => {
    highScore = getHighScore();
    dispatch({
      type: 'restart',
      highScore
    })
  }

  return (
    <div className="App">
      <div className="info-wrapper">
        <Timer ref={childRef} />

        <label class="checkbox-wrapper">show grid
  <input type="checkbox"
            checked={state.showGrid}
            onChange={onShowGridChange}
            className="toggle-grid" />
          <span class="check-mark"></span>
        </label>
        <div className="checkbox-wrapper" >


        </div>
        {<div>Score : {score}</div>}
        <div>high-score : {highScore} </div>
        <button onClick={handleRestart} className="restart">Restart/Start</button>

      </div>
      <div className="message">{message}</div>
      <div className="grid-container">
        <div className="grid">
          {drawGrid()}
        </div>
      </div>

    </div>
  );
}



export default App;


