import React from 'react';
import { getCardImageFilename } from './utils/cardImageMap';
import './style.css';

export default function Card({ card, onClick, className = '' }) {
  const imageSrc = getCardImageFilename(card);

  return (
    <button
      onClick={onClick}
      className={`card ${className}`}
    >
      <img src={imageSrc} alt={`${card.value} of ${card.suit}`} className="card-img" />
    </button>
  );
}
