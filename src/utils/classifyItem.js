// src/utils/classifyItem.js
export const isDrinkItem = (itemName) => {
    const drinkKeywords = [
      "vodka", "whiskey", "wine", "beer", "coke", "fanta", "sprite", "rum",
      "gin", "tonic", "juice", "water", "soda", "red bull", "tequila",
      "liqueur", "prosecco", "champagne", "alcohol", "lager", "brandy", "cider"
    ];
  
    const lower = itemName.toLowerCase();
  
    return drinkKeywords.some(keyword => lower.includes(keyword));
  };
  