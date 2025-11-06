import { detectCombination, beats } from '../game/combination.js';

export function getAllValidCombosFromHand(hand) {
  const valMap = new Map();
  hand.forEach(c => {
    if (!valMap.has(c.value)) valMap.set(c.value, []);
    valMap.get(c.value).push(c);
  });

  const combos = [];
  
  hand.forEach(c => combos.push([c]));
  
  for (const [v, arr] of valMap.entries()) {
    if (arr.length >= 2) combos.push(arr.slice(0, 2));
    if (arr.length >= 3) combos.push(arr.slice(0, 3));
    if (arr.length >= 4) combos.push(arr.slice(0, 4));
  }
  
  const triples = [];
  const pairs = [];
  for (const [v, arr] of valMap.entries()) {
    if (arr.length >= 3) triples.push({ value: v, cards: arr.slice(0, 3) });
    if (arr.length >= 2) pairs.push({ value: v, cards: arr.slice(0, 2) });
  }
  for (const triple of triples) {
    for (const pair of pairs) {
      if (triple.value !== pair.value) {
        combos.push([...triple.cards, ...pair.cards]);
      }
    }
  }
  
  const valueGroups = new Map();
  hand.forEach(c => {
    if (c.value >= 3 && c.value <= 13) {
      if (!valueGroups.has(c.value)) {
        valueGroups.set(c.value, []);
      }
      valueGroups.get(c.value).push(c);
    }
  });
  
  const sortedValues = Array.from(valueGroups.keys()).sort((a, b) => a - b);
  
  for (let start = 0; start < sortedValues.length; start++) {
    for (let len = 5; len <= sortedValues.length - start; len++) {
      let isConsecutive = true;
      for (let i = 1; i < len; i++) {
        if (start + i >= sortedValues.length || 
            sortedValues[start + i] !== sortedValues[start + i - 1] + 1) {
          isConsecutive = false;
          break;
        }
      }
      
      if (isConsecutive) {
        const sequence = [];
        for (let i = 0; i < len; i++) {
          const value = sortedValues[start + i];
          const cards = valueGroups.get(value);
          if (cards && cards.length > 0) {
            sequence.push(cards[0]);
          }
        }
        if (sequence.length === len) {
          combos.push(sequence);
        }
      } else {
        break;
      }
    }
  }
  
  const pairValues = [];
  for (const [v, arr] of valMap.entries()) {
    if (v >= 3 && v <= 13 && arr.length >= 2) {
      pairValues.push({ value: v, cards: arr.slice(0, 2) });
    }
  }
  pairValues.sort((a, b) => a.value - b.value);
  
  for (let start = 0; start < pairValues.length; start++) {
    for (let pairCount = 3; pairCount <= pairValues.length - start; pairCount++) {
      const sequentialPairs = [];
      let lastValue = pairValues[start].value;
      sequentialPairs.push(...pairValues[start].cards);
      
      for (let i = start + 1; i < pairValues.length && sequentialPairs.length < pairCount * 2; i++) {
        if (pairValues[i].value === lastValue + 1) {
          sequentialPairs.push(...pairValues[i].cards);
          lastValue = pairValues[i].value;
        } else if (pairValues[i].value > lastValue + 1) {
          break;
        }
      }
      
      if (sequentialPairs.length === pairCount * 2) {
        combos.push(sequentialPairs);
      } else {
        break;
      }
    }
  }

  return combos;
}

export function chooseAIMove(aiHand, lastPlay, gameState) {
  const combos = getAllValidCombosFromHand(aiHand);
  
  if (!lastPlay || lastPlay.length === 0) {
    if (combos.length === 0) {
      return null;
    }
    
    const maxLength = Math.max(...combos.map(c => c.length));
    const maxLengthCombos = combos.filter(c => c.length === maxLength);
    
    if (maxLengthCombos.length === 0) {
      const sortedCombos = [...combos].sort((a, b) => b.length - a.length);
      return sortedCombos[0];
    }
    
    const sortedMaxCombos = maxLengthCombos.sort((a, b) => {
      const comboA = detectCombination(a);
      const comboB = detectCombination(b);
      
      const typePriority = {
        sequence: 3,
        sequentialPairs: 3,
        fullhouse: 2,
        bomb: 1,
        triple: 0,
        pair: 0,
        single: 0
      };
      
      const priorityA = typePriority[comboA.type] || 0;
      const priorityB = typePriority[comboB.type] || 0;
      
      if (priorityB !== priorityA) {
        return priorityB - priorityA;
      }
      
      return comboA.rank - comboB.rank;
    });
    
    return sortedMaxCombos[0];
  } else {
    const beating = combos.filter(c => beats(c, lastPlay));
    
    if (beating.length === 0) {
      return null;
    }

    const bombs = beating.filter(c => {
      const combo = detectCombination(c);
      return combo && combo.type === 'bomb';
    });
    const nonBombs = beating.filter(c => {
      const combo = detectCombination(c);
      return combo && combo.type !== 'bomb';
    });
    
    if (gameState.playerHandSize <= 3) {
      if (bombs.length > 0) {
        bombs.sort((a, b) => {
          const comboA = detectCombination(a);
          const comboB = detectCombination(b);
          return comboA.rank - comboB.rank;
        });
        return bombs[0];
      }
      if (nonBombs.length > 0) {
        nonBombs.sort((A, B) => {
          const comboA = detectCombination(A);
          const comboB = detectCombination(B);
          if (A.length !== B.length) return B.length - A.length;
          return comboA.rank - comboB.rank;
        });
        return nonBombs[0];
      }
    }
    
    if (nonBombs.length > 0) {
      nonBombs.sort((A, B) => {
        const comboA = detectCombination(A);
        const comboB = detectCombination(B);
        const typeOrder = { 
          single: 1, 
          pair: 2, 
          triple: 3, 
          fullhouse: 4, 
          sequence: 5, 
          sequentialPairs: 6 
        };
        const ta = comboA.type;
        const tb = comboB.type;
        if (typeOrder[ta] !== typeOrder[tb]) {
          return typeOrder[ta] - typeOrder[tb];
        }
        return comboA.rank - comboB.rank;
      });
      return nonBombs[0];
    }
    
    if (bombs.length > 0) {
      bombs.sort((a, b) => {
        const comboA = detectCombination(a);
        const comboB = detectCombination(b);
        return comboA.rank - comboB.rank;
      });
      return bombs[0];
    }
    
    return null;
  }
}

