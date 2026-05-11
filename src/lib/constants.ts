export const categories = [
  "Daily",
  "Outfit",
  "Food",
  "Fitness",
  "Gaming",
  "Music",
  "Travel",
  "Study",
  "Work",
  "Pets",
  "Art",
  "Random",
];

export function normalizeCategory(value?: string | null) {
  if (!value) return "Daily";
  if (value === "Fit") return "Outfit";
  return categories.includes(value) ? value : "Random";
}

export const moods = ["Glowy", "Charged", "Cozy", "Electric", "Focused", "Calm"];

export const imageRules = {
  maxBytes: 10 * 1024 * 1024,
  types: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  extensions: ["jpg", "jpeg", "png", "webp"],
};
