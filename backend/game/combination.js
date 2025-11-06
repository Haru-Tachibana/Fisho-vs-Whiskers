export function detectCombination(cards) {
  const n = cards.length;
  if (n === 0) return null;
  
  const vals = cards.map(c => c.value).sort((a, b) => a - b);
  const set = new Set(vals);

  if (n === 1) return { type: 'single', rank: vals[0] };
  
  if (n === 2 && set.size === 1) return { type: 'pair', rank: vals[0] };
  
  if (n === 3 && set.size === 1) return { type: 'triple', rank: vals[0] };
  
  if (n === 4 && set.size === 1) return { type: 'bomb', rank: vals[0] };
  
  if (n === 5) {
    const valueCounts = new Map();
    vals.forEach(v => {
      valueCounts.set(v, (valueCounts.get(v) || 0) + 1);
    });
    const counts = Array.from(valueCounts.values()).sort((a, b) => b - a);
    if (counts.length === 2 && counts[0] === 3 && counts[1] === 2) {
      for (const [val, count] of valueCounts.entries()) {
        if (count === 3) {
          return { type: 'fullhouse', rank: val };
        }
      }
    }
  }
  
  if (n >= 5) {
    const validRange = vals.every(v => v >= 3 && v <= 13);
    if (validRange && set.size === n) {
      let isConsecutive = true;
      for (let i = 1; i < vals.length; i++) {
        if (vals[i] !== vals[i-1] + 1) {
          isConsecutive = false;
          break;
        }
      }
      if (isConsecutive) {
        return { type: 'sequence', rank: vals[0], length: n };
      }
    }
  }
  
  if (n >= 6 && n % 2 === 0) {
    const pairCount = n / 2;
    if (pairCount >= 3) {
      const valueCounts = new Map();
      vals.forEach(v => {
        valueCounts.set(v, (valueCounts.get(v) || 0) + 1);
      });
      
      const allPairs = Array.from(valueCounts.values()).every(count => count === 2);
      if (allPairs) {
        const uniqueVals = Array.from(valueCounts.keys()).sort((a, b) => a - b);
        const validRange = uniqueVals.every(v => v >= 3 && v <= 13);
        
        if (validRange && uniqueVals.length === pairCount) {
          let isConsecutive = true;
          for (let i = 1; i < uniqueVals.length; i++) {
            if (uniqueVals[i] !== uniqueVals[i-1] + 1) {
              isConsecutive = false;
              break;
            }
          }
          if (isConsecutive) {
            return { type: 'sequentialPairs', rank: uniqueVals[0], length: pairCount };
          }
        }
      }
    }
  }
  
  return null;
}

export function beats(candidate, current) {
  if (!candidate || candidate.length === 0) return false;
  
  const c1 = detectCombination(candidate);
  const c2 = detectCombination(current);
  
  if (!c1) return false;
  
  if (!c2 || current.length === 0) return true;
  
  if (c1.type === 'bomb' && c2.type !== 'bomb') return true;
  if (c1.type !== 'bomb' && c2.type === 'bomb') return false;
  
  if (c1.type !== c2.type) return false;
  
  if (c1.type === 'sequence') {
    if (c1.length !== c2.length) return false;
    return c1.rank > c2.rank;
  }
  
  if (c1.type === 'sequentialPairs') {
    if (c1.length !== c2.length) return false;
    return c1.rank > c2.rank;
  }
  
  if (c1.type === 'fullhouse') {
    return c1.rank > c2.rank;
  }
  
  return c1.rank > c2.rank;
}

