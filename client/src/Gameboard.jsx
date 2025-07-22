import React from 'react';
import Card from './Card';
import './style.css';

function cardValue(value) {
  if (typeof value === 'number') return value;
  const order = { J: 11, Q: 12, K: 13, A: 14 };
  return order[value];
}

export default function GameBoard({ state, onPlayCard, onEndTurn, onTakeCards }) {
  const isAttacker = state.attacker === state.playerIndex;
  const isDefender = state.defender === state.playerIndex;

  return (
    <div>
      <h1 className="subtitle">Trump Suit: {state.trump}</h1>
      <h2 className="subtitle">Your Turn: {isAttacker ? 'Attack' : isDefender ? 'Defend' : 'Waiting...'}</h2>


      

      <div className="hand-section">
        <h3 className="subtitle">Your Hand</h3>
        <div className="hand">
          {state.hand.map((card, idx) => {
            const canAddAttack = !isDefender &&
              state.table.length < state.hand.length &&
              (state.table.length === 0 ||
                state.table.some(pair =>
                  pair.attack?.value === card.value || pair.defense?.value === card.value));

            const canDefend = isDefender &&
              state.table.some(pair =>
                pair.defense === null &&
                ((card.suit === pair.attack.suit && cardValue(card.value) > cardValue(pair.attack.value)) ||
                  (card.suit === state.trump && pair.attack.suit !== state.trump)));

            const canPlay = canAddAttack || canDefend;

            return (
              <Card
                key={idx}
                card={card}
                onClick={canPlay ? () => onPlayCard(card) : undefined}
                className={canPlay ? '' : 'disabled'}
              />
            );
          })}
        </div>
      </div>
      <div>
        <div className="board-center">
        <div className="table-wrapper">
          <div className="table">
              {state.deckSize > 0 && (
                <div className="deck-area">
                  <div className="deck-stack">
                    {[...Array(3)].map((_, i) => (
                      <img
                        key={i}
                        src="/cards/cardsDark1.png"
                        alt="Deck"
                        className="card deck-back"
                        style={{ top: `${-i * 4}px` }}
                      />
                    ))}
                    {state.trumpCard && (() => {
                      const suitMap = {
                        'hearts': { A: 37, 6: 21, 7: 23, 8: 25, 9: 27, 10: 29, J: 31, Q: 33, K: 35 },
                        'diamonds': { A: 38, 6: 22, 7: 24, 8: 26, 9: 28, 10: 30, J: 32, Q: 34, K: 36 },
                        'clubs': { A: 67, 6: 50, 7: 52, 8: 54, 9: 56, 10: 58, J: 60, Q: 62, K: 64 },
                        'spades': { A: 65, 6: 49, 7: 51, 8: 53, 9: 55, 10: 57, J: 59, Q: 61, K: 63 }
                      };
                      const card = state.trumpCard;
                      const num = suitMap[card.suit.toLowerCase()]?.[card.value] || 1;
                      const path = `/cards/cardsDark${num}.png`;
                      return (
                        <img
                          src={path}
                          alt={`Trump ${card.value} of ${card.suit}`}
                          className="card trump-card"
                        />
                      );
                    })()}
                  </div>
                </div>
              )}
              {state.table.map((pair, i) => (
              <div key={i} className="table-pair">
                  <Card card={pair.attack} />
                  {pair.defense ? (
                  <Card card={pair.defense} />
                  ) : (
                  <img src="/cards/cardsDark7.png" alt="shield" className="card" />
                  )}
              </div>
              ))}
            </div>
            </div>
              <div className="opponent-hands-vertical">
                {state.playerHandSizes.map((count, idx) => {
                  if (idx === state.playerIndex) return null;
                  return (
                    <div key={idx} className="opponent-hand-vertical">
                      <p className="subtitle">{state.players?.[idx]?.name || `Player ${idx}`}</p>
                      {Array.from({ length: count }).map((_, i) => (
                        <img
                          key={i}
                          src="/cards/cardsDark1.png"
                          alt="Face-down card"
                          className="card"
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
      </div>

      <div className="controls">
        {isAttacker && (
          <button onClick={onEndTurn} className="button button-green">End Turn</button>
        )}
        {isDefender && (
          <button onClick={onTakeCards} className="button button-red">Take Cards</button>
        )}
      </div>
    </div>
  );
}
