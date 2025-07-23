  const { getCardImageFilename } = require('./utils/cardImageMap');
const path = require('path');


const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const usernames = {};
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());

let players = [];
let game = null;
let gameStarted = false;

function createDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = [6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
  return suits.flatMap(suit => values.map(value => ({ suit, value })));
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function cardValue(value) {
  if (typeof value === 'number') return value;
  const order = { J: 11, Q: 12, K: 13, A: 14 };
  return order[value];
}

function beats(cardA, cardB, trump) {
  if (cardA.suit === cardB.suit) {
    return cardValue(cardA.value) > cardValue(cardB.value);
  }
  return cardA.suit === trump && cardB.suit !== trump;
}

function initializeGame() {
  const deck = createDeck();
  shuffle(deck);
  const trumpCard = deck[deck.length - 1];
  trumpCard.img = getCardImageFilename(trumpCard);
  const trump = trumpCard.suit;
  const hands = players.map(() => deck.splice(0, 6));

  let attacker = 0;
  let defender = 1;

  let lowestTrump = null;
  for (let i = 0; i < hands.length; i++) {
    for (const card of hands[i]) {
      if (card.suit === trump) {
        if (!lowestTrump || cardValue(card.value) < cardValue(lowestTrump.card.value)) {
          lowestTrump = { player: i, card };
        }
      }
    }
  }
  if (lowestTrump) {
    attacker = lowestTrump.player;
    defender = (attacker + 1) % players.length;
  }

  return {
    deck,
    trumpCard,
    trump,
    hands,
    table: [],
    attacker,
    defender,
    currentAttacks: 0,
    defending: false,
    beatenCards: [],
    defenderTook: false,
  };
}

function emitLobbyState() {
  io.emit('lobbyState', {
    players: players.length,
    gameStarted,
  });
}

function emitGameState() {
  players.forEach((player, index) => {
    io.to(player.id).emit('gameState', {
      hand: game.hands[index],
      table: game.table,
      trump: game.trump,
      attacker: game.attacker,
      defender: game.defender,
      playerIndex: index,
      deckSize: game.deck.length,
      trumpCard: game.trumpCard,
      playerHandSizes: game.hands.map(h => h.length),
      players: players.map(p => ({ id: p.id, name: p.name || 'Player' })),
    });
  });
}

function refillHands() {
  const order = [];
  for (let i = 0; i < players.length; i++) {
    const pos = (game.attacker + i) % players.length;
    order.push(pos);
  }
  for (const idx of order) {
    while (game.hands[idx].length < 6 && game.deck.length > 0) {
      game.hands[idx].push(game.deck.pop());
    }
  }
}


function endTurn() {
  refillHands();
  game.table = [];
  game.currentAttacks = 0;
  game.beatenCards = [];

  const totalPlayers = players.length;

  const findNextWithCards = (startIdx) => {
    let idx = startIdx;
    for (let i = 0; i < totalPlayers; i++) {
      const check = (idx + i) % totalPlayers;
      if (game.hands[check].length > 0) {
        return check;
      }
    }
    return null;
  };

  if (game.defenderTook) {
    game.defenderTook = false;
    game.attacker = findNextWithCards((game.attacker + 2) % totalPlayers);
  } else {
    game.attacker = findNextWithCards((game.attacker + 1) % totalPlayers);
  }

  game.defender = findNextWithCards((game.attacker + 1) % totalPlayers);

const playersWithCards = players
  .map((p, i) => ({ id: p.id, count: game.hands[i].length }))
  .filter(p => p.count > 0);

if (playersWithCards.length === 1) {
  const loser = playersWithCards[0];
  const loserName = usernames[loser.id] || 'Unknown Player';
  console.log('Game over. Durak is:', loserName);
  io.emit('gameOver', { loserName });
  gameStarted = false;
  game = null;
  return;
}


  emitGameState();
}

function defenderTakes() {
  game.hands[game.defender].push(...game.table.flatMap(pair => [pair.attack, pair.defense].filter(Boolean)));
  game.table = [];
  game.currentAttacks = 0;
  game.defenderTook = true;
  refillHands();
  endTurn();
}

io.on('connection', socket => {
  socket.on('setUsername', (name) => {
  usernames[socket.id] = name;
  const player = players.find(p => p.id === socket.id);
  if (player) {
    player.name = name;
  }
});
  if (players.length >= 4 || gameStarted) {
    socket.emit('error', 'Game is full or already started');
    return;
  }

  players.push({ id: socket.id });
  console.log('Player joined:', socket.id);
  emitLobbyState();

  socket.on('startGame', () => {
    if (!gameStarted && players.length >= 2) {
      const allNamed = players.every(p => p.name && p.name.trim() !== '');
      if (!allNamed) {
        socket.emit('error', 'All players must enter a username.');
        return;
      }

      game = initializeGame();
      gameStarted = true;
      emitGameState();
    }
  });

  socket.on('playCard', ({ card }) => {
    if (!gameStarted) return;

    const index = players.findIndex(p => p.id === socket.id);
    const hand = game.hands[index];
    const cardIndex = hand.findIndex(
        c => c.suit === card.suit && c.value === card.value
    );
    if (cardIndex === -1) return;

    const isDefender = index === game.defender;
    const defenderHandSize = game.hands[game.defender].length;

    const cardValuesOnTable = new Set(
        game.table.flatMap(pair => [pair.attack?.value, pair.defense?.value]).filter(Boolean)
    );

    const canAttack =
        !isDefender &&
        game.table.filter(pair => pair.attack).length < defenderHandSize &&
        (game.table.length === 0 || cardValuesOnTable.has(card.value));

    if (canAttack) {
        const [played] = hand.splice(cardIndex, 1);
        game.table.push({ attack: played, defense: null });
        emitGameState();
        return;
    }

    if (isDefender) {
        const lastPair = game.table.find(pair => pair.defense === null);
        if (lastPair && beats(card, lastPair.attack, game.trump)) {
        const [played] = hand.splice(cardIndex, 1);
        lastPair.defense = played;
        emitGameState();
        }
    }
    });
    socket.on('endTurn', () => {
    if (!gameStarted) return;

    const index = players.findIndex(p => p.id === socket.id);
    if (index !== game.attacker) return; // only attacker can end turn

    const allDefended = game.table.every(pair => pair.defense);
    if (allDefended) {
      endTurn();
    }
  });

  socket.on('takeCards', () => {
    if (!gameStarted) return;
    defenderTakes();
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    console.log('Player left:', socket.id);

    if (players.length === 0) {
        gameStarted = false;
        game = null;
        console.log('All players left — resetting game.');
    }

    emitLobbyState();
    delete usernames[socket.id];
    });

});

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));