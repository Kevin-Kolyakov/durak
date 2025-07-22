import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import GameBoard from './Gameboard';

const socket = io('http://localhost:3001');

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [lobbyState, setLobbyState] = useState({ players: 0, gameStarted: false });
  const [playerID, setPlayerID] = useState(null);

  useEffect(() => {
    socket.on('gameState', (data) => {
      console.log('[client] received gameState:', data);
      setGameState(data);
    });

    socket.on('lobbyState', (data) => {
      console.log('[client] received lobbyState:', data);
      setLobbyState(data);
    });

    socket.on('connect', () => {
      console.log('[client] connected with id:', socket.id);
      setPlayerID(socket.id);
    });

    socket.on('error', msg => alert(msg));
  }, []);

  const handleStartGame = () => {
    console.log('[client] emitting startGame');
    socket.emit('startGame');
  };

  const handlePlayCard = card => {
    socket.emit('playCard', { card });
  };

  const handleEndTurn = () => {
    if (gameState?.table?.length > 0) {
      socket.emit('endTurn');
    }
  };

  const handleTakeCards = () => {
    if (gameState?.table?.length > 0) {
      socket.emit('takeCards');
    }
  };

  if (!gameState) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Durak Lobby</h1>
        <p className="mb-4">Players in Lobby: {lobbyState.players}/4</p>
        {lobbyState.players >= 2 && (
          <button
            onClick={handleStartGame}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Game
          </button>
        )}
        {lobbyState.players < 2 && <p>Waiting for more players...</p>}
      </div>
    );
  }

  return (
    <div className="p-4">
      <GameBoard
        state={gameState}
        onPlayCard={handlePlayCard}
        onEndTurn={handleEndTurn}
        onTakeCards={handleTakeCards}
        playerID={playerID}
      />
    </div>
  );
}
