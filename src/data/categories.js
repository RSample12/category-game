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
    'Rottweiler', 'Doberman Pinscher', 'Australian Shepherd', 'Saint Bernard',
  ]),
  define('pokemon', 'Pokémon', 'The original 151, a starter pack.', [
    'Pikachu', 'Charizard', 'Bulbasaur', 'Squirtle',
    'Jigglypuff', 'Meowth', 'Psyduck', 'Snorlax',
    'Gengar', 'Eevee', 'Mewtwo', 'Magikarp',
    'Gyarados', 'Machamp', 'Onix', 'Lapras',
    'Alakazam', 'Vulpix', 'Dragonite', 'Ditto',
  ]),
  define('fruits', 'Fruits', 'Peel it, slice it, pit it.', [
    'Apple', 'Banana', 'Strawberry', 'Watermelon',
    'Pineapple', 'Mango', 'Grape', 'Lemon',
    'Cherry', 'Kiwi', 'Peach', 'Blueberry',
    'Coconut', 'Avocado', 'Pomegranate', 'Orange',
    'Pear', 'Raspberry', 'Papaya', 'Grapefruit',
  ]),
  define('soccer', 'Soccer Players', 'Stars of the club and country game.', [
    'Lionel Messi', 'Cristiano Ronaldo', 'Kylian Mbappé', 'Erling Haaland',
    'Neymar Jr', 'Kevin De Bruyne', 'Mohamed Salah', 'Luka Modrić',
    'Robert Lewandowski', 'Vinícius Jr', 'Jude Bellingham', 'Harry Kane',
    'Lamine Yamal', 'Son Heung-min', 'Virgil van Dijk', 'Zlatan Ibrahimović',
    'Karim Benzema', 'Bukayo Saka', 'Pedri', 'Ronaldinho',
  ]),
  define('games', 'Video Game Franchises', 'Consoles, PCs and phones.', [
    'Super Mario', 'The Legend of Zelda', 'Sonic the Hedgehog', 'Halo',
    'Call of Duty', 'Grand Theft Auto', 'Minecraft', 'Fortnite',
    'Fallout', 'The Sims', 'Street Fighter', 'Mortal Kombat',
    'Animal Crossing', 'God of War', 'Overwatch', "Assassin's Creed",
    'Pac-Man', 'Tetris', 'Resident Evil', 'Final Fantasy',
  ]),
  define('anime', 'Anime', 'Series every fan has an opinion on.', [
    'Naruto', 'One Piece', 'Dragon Ball Z', 'Attack on Titan',
    'Death Note', 'My Hero Academia', 'Demon Slayer', 'Bleach',
    'Fullmetal Alchemist', 'Jujutsu Kaisen', 'Hunter x Hunter', 'Sailor Moon',
    'Cowboy Bebop', 'One Punch Man', 'Tokyo Ghoul', 'Spy x Family',
    'Chainsaw Man', 'Neon Genesis Evangelion', 'Fairy Tail', 'Haikyu!!',
  ]),
  define('cars', 'Car Brands', 'Badges from Detroit to Stuttgart to Tokyo.', [
    'Toyota', 'Honda', 'Ford', 'Chevrolet',
    'Tesla', 'BMW', 'Mercedes-Benz', 'Audi',
    'Porsche', 'Ferrari', 'Lamborghini', 'Volkswagen',
    'Subaru', 'Jeep', 'Hyundai', 'Nissan',
    'Kia', 'Mazda', 'Volvo', 'Land Rover',
  ]),
  define('restaurants', 'Chain Restaurants', 'Drive-thru, dine-in and coffee runs.', [
    "McDonald's", 'Burger King', "Wendy's", 'Taco Bell',
    'Chick-fil-A', 'Subway', 'Chipotle', 'Starbucks',
    "Domino's", 'Pizza Hut', 'KFC', 'Popeyes',
    'Panda Express', "Dunkin'", 'Olive Garden', "Applebee's",
    "Arby's", 'Five Guys', 'Panera Bread', "Chili's",
  ]),
];

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id);
export const getItem = (categoryId, itemId) =>
  getCategory(categoryId)?.items.find((i) => i.id === itemId);
