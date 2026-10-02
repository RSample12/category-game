/**
 * Category data
 * -------------
 * Shape:  { id, name, blurb, items: [{ id, name }] }
 *
 * - To add a category, add one `define(...)` call below.
 * - To grow a pool, add names to its list. Item ids are slugs of the name, so
 *   they stay stable when you reorder or expand a list.
 * - Later, "sample N items at deal time" belongs inside `dealSecrets()` /
 *   the board setup in src/game/engine.js. Nothing in the UI reads the full
 *   list directly except through `getCategory(id).items`.
 */

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const define = (id, name, blurb, names) => ({
  id,
  name,
  blurb,
  items: names.map((n) => ({ id: `${id}-${slug(n)}`, name: n })),
});

export const CATEGORIES = [
  define('dogs', 'Dog Breeds', 'Herders, lap dogs and giants.', [
    'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Poodle',
    'Bulldog', 'Beagle', 'Dachshund', 'Chihuahua',
    'Siberian Husky', 'Corgi', 'Pug', 'Boxer',
    'Great Dane', 'Border Collie', 'Shih Tzu', 'Dalmatian',
  ]),
  define('pokemon', 'Pokémon', 'The original 151, a starter pack.', [
    'Pikachu', 'Charizard', 'Bulbasaur', 'Squirtle',
    'Jigglypuff', 'Meowth', 'Psyduck', 'Snorlax',
    'Gengar', 'Eevee', 'Mewtwo', 'Magikarp',
    'Gyarados', 'Machamp', 'Onix', 'Lapras',
  ]),
  define('fruits', 'Fruits', 'Peel it, slice it, pit it.', [
    'Apple', 'Banana', 'Strawberry', 'Watermelon',
    'Pineapple', 'Mango', 'Grape', 'Lemon',
    'Cherry', 'Kiwi', 'Peach', 'Blueberry',
    'Coconut', 'Avocado', 'Pomegranate', 'Orange',
  ]),
];

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id);
export const getItem = (categoryId, itemId) =>
  getCategory(categoryId)?.items.find((i) => i.id === itemId);
