import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import GameBoard from './Gameboard';
import './App.css';
import shuffleSound from './sounds/shuffle.wav';
import jazz from './sounds/jazz.mp3';

const socket = io('https://durak-tuex.onrender.com');

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [lobbyState, setLobbyState] = useState({ players: 0, gameStarted: false });
  const [playerID, setPlayerID] = useState(null);
  const [loserID, setLoserID] = useState(null);
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [usernameMap, setUsernameMap] = useState({});


  const playShuffleSound = () => {
    const shuffle = new Audio(shuffleSound);
    shuffle.volume = 0.02;
    shuffle.play();
  };


  

  const playJazz = () => {
    const music = new Audio(jazz);
    music.loop = true;
    music.volume = 0.03;
    let randomTime = Math.floor(Math.random() * 100);
    music.currentTime = randomTime;
    music.play().catch(() => {});
  };

  useEffect(() => {

    socket.on('gameState', setGameState);
    socket.on('lobbyState', setLobbyState);
    socket.on('gameOver', ({ loserName }) => {
      setLoserID(socket.id === loserName ? socket.id : loserName);
    });
    socket.on('connect', () => setPlayerID(socket.id));
    socket.on('error', msg => alert(msg));
  }, []);

  const handleStartGame = () => socket.emit('startGame');
  const handlePlayCard = card => socket.emit('playCard', { card });
  const handleEndTurn = () => {
    if (gameState?.table?.length > 0) socket.emit('endTurn');
  };
  const handleTakeCards = () => {
    if (gameState?.table?.length > 0) socket.emit('takeCards');
  };

  if (loserID) {
    return (
      <div className="container">
        <h1 className="title loser">Game Over</h1>
        <p className="subtitle">
          {loserID === playerID
            ? 'You are the Durak!'
            : `${loserID} is the Durak!`}
        </p>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="crt-wrapper">
        <div className="lobby-container">
          <h1 className="lobby-title">Здравствуйте, Дурак!</h1>
          <div className="lobby-graphic" role="img" aria-label="Durak Logo" />
          <h1 className="lobby-title">Enter Username</h1>
          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="username-input"
          />
          <button
            onClick={() => {
              if (username.trim()) {
                socket.emit('setUsername', username);
                setJoined(true);
                playJazz();
              }
            }}
            className="button button-green"
          >
            Join Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="crt-wrapper">
        <div className="lobby-container">
          <div className="lobby-graphic" role="img" aria-label="Durak Logo" />
          <h1 className="lobby-title">Durak Lobby</h1>
          <p className="subtitle">Welcome, <strong>{username}</strong>!</p>
          <p className="subtitle">Players in Lobby: {lobbyState.players}/4</p>
          {lobbyState.players >= 2 ? (
            <button onClick={handleStartGame} className="button button-blue">Start Game</button>
          ) : (
            <p>Waiting for more players...</p>
          )}
          {playShuffleSound()}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-background">
        <GameBoard
          state={gameState}
          onPlayCard={handlePlayCard}
          onEndTurn={handleEndTurn}
          onTakeCards={handleTakeCards}
          playerID={playerID}
        />
      </div>
    </div>
  );
}
