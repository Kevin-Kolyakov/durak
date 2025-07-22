export function getCardImageFilename(card) {
  const suitMap = {
    'hearts': {
      A: 37, 6: 21, 7: 23, 8: 25, 9: 27, 10: 29, J: 31, Q: 33, K: 35
    },
    'diamonds': {
      A: 38, 6: 22, 7: 24, 8: 26, 9: 28, 10: 30, J: 32, Q: 34, K: 36
    },
    'clubs': {
      A: 67, 6: 50, 7: 52, 8: 54, 9: 56, 10: 58, J: 60, Q: 62, K: 64
    },
    'spades': {
      A: 65, 6: 49, 7: 51, 8: 53, 9: 55, 10: 57, J: 59, Q: 61, K: 63
    }
  };

  const num = suitMap[card.suit.toLowerCase()]?.[card.value] || 1;
  return `/cards/cardsDark${num}.png`;
}
