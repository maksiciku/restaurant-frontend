// frontend/src/utils/novaKnowledge.js

export const ingredientAliases = {
  "cumberland sausage": "sausage",
  "pork sausage": "sausage",
  "free range eggs": "egg",
  "baked beans": "beans",
  "sliced mushrooms": "mushroom",
  "frozen hashbrowns": "hashbrown",
  "back bacon unsmoked": "bacon",
  "crushed tomatoes": "tomato"
};

export function summarizeIngredients(ingredients, servings) {
  const summary = {};

  ingredients.forEach((item) => {
    const name = item?.ingredient_name;
    if (!name) return;

    const lowerName = name.toLowerCase();
    const base =
      Object.keys(ingredientAliases).find((key) =>
        lowerName.includes(key)
      ) || name;

    const baseTerm = ingredientAliases[base] || base;

    if (!summary[baseTerm]) {
      summary[baseTerm] = 0;
    }

    summary[baseTerm] += servings;
  });

  return summary;
}
