/**
 * Category data
 * -------------
 * Shape:  { id, name, blurb, group, items: [{ id, name }] }
 *         Categories are listed by theme group (GROUPS); the setup screen shows them that way.
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

/** Theme groups, in the order the setup screen shows them. */
export const GROUPS = [
  {
    id: 'characters',
    name: 'Characters',
    categories: [
      define('cartoons', 'Cartoon Characters', 'Animated icons from every Saturday morning.', [
        'Mickey Mouse', 'Bugs Bunny', 'Homer Simpson', 'SpongeBob SquarePants',
        'Scooby-Doo', 'Tom', 'Jerry', 'Daffy Duck',
        'Bart Simpson', 'Peter Griffin', 'Stewie Griffin', 'Patrick Star',
        'Fred Flintstone', 'Popeye', 'Donald Duck', 'Goofy',
        'Eric Cartman', 'Rick Sanchez', 'Bluey', 'Tweety',
      ]),
      define('pokemon', 'Pokémon', 'The original 151, a starter pack.', [
        'Pikachu', 'Charizard', 'Bulbasaur', 'Squirtle',
        'Jigglypuff', 'Meowth', 'Psyduck', 'Snorlax',
        'Gengar', 'Eevee', 'Mewtwo', 'Magikarp',
        'Gyarados', 'Machamp', 'Onix', 'Lapras',
        'Alakazam', 'Vulpix', 'Dragonite', 'Ditto',
      ]),
      define('anime', 'Anime Characters', 'Heroes and rivals from the biggest series.', [
        'Naruto Uzumaki', 'Goku', 'Monkey D. Luffy', 'Vegeta',
        'Light Yagami', 'L', 'Ichigo Kurosaki', 'Edward Elric',
        'Eren Yeager', 'Mikasa Ackerman', 'Levi Ackerman', 'Tanjiro Kamado',
        'Nezuko Kamado', 'Izuku Midoriya', 'All Might', 'Saitama',
        'Sailor Moon', 'Spike Spiegel', 'Gon Freecss', 'Anya Forger',
      ]),
      define('games', 'Video Game Characters', 'Heroes, villains and one famous plumber.', [
        'Mario', 'Luigi', 'Princess Peach', 'Bowser',
        'Yoshi', 'Donkey Kong', 'Link', 'Princess Zelda',
        'Sonic', 'Pac-Man', 'Kirby', 'Master Chief',
        'Lara Croft', 'Kratos', 'Samus Aran', 'Mega Man',
        'Cloud Strife', 'Crash Bandicoot', 'Spyro', 'Ryu',
      ]),
    ],
  },
  {
    id: 'animals',
    name: 'Animals',
    categories: [
      define('dogs', 'Dog Breeds', 'Herders, lap dogs and giants.', [
        'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Poodle',
        'Bulldog', 'Beagle', 'Dachshund', 'Chihuahua',
        'Siberian Husky', 'Corgi', 'Pug', 'Boxer',
        'Great Dane', 'Border Collie', 'Shih Tzu', 'Dalmatian',
        'Rottweiler', 'Doberman Pinscher', 'Australian Shepherd', 'Saint Bernard',
      ]),
      define('wild', 'Wild Animals', 'Savanna, jungle and tundra.', [
        'Lion', 'Tiger', 'Elephant', 'Giraffe',
        'Zebra', 'Gorilla', 'Kangaroo', 'Koala',
        'Giant Panda', 'Polar Bear', 'Grizzly Bear', 'Wolf',
        'Cheetah', 'Hippopotamus', 'Rhinoceros', 'Crocodile',
        'Camel', 'Sloth', 'Moose', 'Red Fox',
      ]),
      define('sea', 'Sea Creatures', 'Fins, shells and tentacles.', [
        'Shark', 'Dolphin', 'Blue Whale', 'Orca',
        'Octopus', 'Squid', 'Jellyfish', 'Sea Turtle',
        'Seahorse', 'Starfish', 'Crab', 'Lobster',
        'Clownfish', 'Stingray', 'Seal', 'Walrus',
        'Pufferfish', 'Manatee', 'Swordfish', 'Narwhal',
      ]),
      define('birds', 'Birds', 'Wings, beaks and feathers.', [
        'Bald Eagle', 'Hawk', 'Owl', 'Penguin',
        'Flamingo', 'Parrot', 'Peacock', 'Ostrich',
        'Hummingbird', 'Toucan', 'Pelican', 'Robin',
        'Blue Jay', 'Cardinal', 'Crow', 'Seagull',
        'Swan', 'Woodpecker', 'Pigeon', 'Duck',
      ]),
    ],
  },
  {
    id: 'food',
    name: 'Food',
    categories: [
      define('fruits', 'Fruits', 'Peel it, slice it, pit it.', [
        'Apple', 'Banana', 'Strawberry', 'Watermelon',
        'Pineapple', 'Mango', 'Grape', 'Lemon',
        'Cherry', 'Kiwi', 'Peach', 'Blueberry',
        'Coconut', 'Avocado', 'Pomegranate', 'Orange',
        'Pear', 'Raspberry', 'Papaya', 'Grapefruit',
      ]),
      define('veggies', 'Vegetables', 'Eat your greens (and oranges).', [
        'Carrot', 'Broccoli', 'Potato', 'Sweet Potato',
        'Tomato', 'Corn', 'Onion', 'Garlic',
        'Lettuce', 'Spinach', 'Cucumber', 'Bell Pepper',
        'Mushroom', 'Eggplant', 'Celery', 'Peas',
        'Cauliflower', 'Zucchini', 'Asparagus', 'Cabbage',
      ]),
      define('desserts', 'Desserts', 'Save room for these.', [
        'Chocolate Cake', 'Cheesecake', 'Apple Pie', 'Pumpkin Pie',
        'Key Lime Pie', 'Ice Cream', 'Banana Split', 'Brownie',
        'Chocolate Chip Cookie', 'Cupcake', 'Donut', 'Cinnamon Roll',
        'Churro', 'Tiramisu', 'Crème Brûlée', 'Macaron',
        'Baklava', 'Mochi', 'Fudge', 'Cannoli',
      ]),
      define('restaurants', 'Chain Restaurants', 'Drive-thru, dine-in and coffee runs.', [
        "McDonald's", 'Burger King', "Wendy's", 'Taco Bell',
        'Chick-fil-A', 'Subway', 'Chipotle', 'Starbucks',
        "Domino's", 'Pizza Hut', 'KFC', 'Popeyes',
        'Panda Express', "Dunkin'", 'Olive Garden', "Applebee's",
        "Arby's", 'Five Guys', 'Panera Bread', "Chili's",
      ]),
    ],
  },
  {
    id: 'people',
    name: 'People',
    categories: [
      define('actors', 'Actors', 'Leading names from the big screen.', [
        'Tom Hanks', 'Leonardo DiCaprio', 'Brad Pitt', 'Denzel Washington',
        'Robert De Niro', 'Morgan Freeman', 'Will Smith', 'Johnny Depp',
        'Tom Cruise', 'Dwayne Johnson', 'Ryan Reynolds', 'Keanu Reeves',
        'Margot Robbie', 'Scarlett Johansson', 'Zendaya', 'Jennifer Lawrence',
        'Meryl Streep', 'Emma Stone', 'Chris Hemsworth', 'Robert Downey Jr.',
      ]),
      define('musicians', 'Musicians', 'Chart-toppers across the decades.', [
        'Taylor Swift', 'Beyoncé', 'Drake', 'Michael Jackson',
        'Elvis Presley', 'Madonna', 'Rihanna', 'Ed Sheeran',
        'Billie Eilish', 'Bruno Mars', 'Lady Gaga', 'Adele',
        'Eminem', 'Ariana Grande', 'Justin Bieber', 'Bad Bunny',
        'Dolly Parton', 'Freddie Mercury', 'Elton John', 'Bob Marley',
      ]),
      define('soccer', 'Soccer Players', 'Stars of the club and country game.', [
        'Lionel Messi', 'Cristiano Ronaldo', 'Kylian Mbappé', 'Erling Haaland',
        'Neymar Jr', 'Kevin De Bruyne', 'Mohamed Salah', 'Luka Modrić',
        'Robert Lewandowski', 'Vinícius Jr', 'Jude Bellingham', 'Harry Kane',
        'Lamine Yamal', 'Son Heung-min', 'Virgil van Dijk', 'Zlatan Ibrahimović',
        'Karim Benzema', 'Bukayo Saka', 'Pedri', 'Ronaldinho',
      ]),
      define('history', 'Historical Figures', 'Names straight out of the history books.', [
        'Abraham Lincoln', 'George Washington', 'Benjamin Franklin', 'Cleopatra',
        'Julius Caesar', 'Alexander the Great', 'Napoleon Bonaparte', 'Joan of Arc',
        'Queen Elizabeth I', 'Leonardo da Vinci', 'William Shakespeare', 'Galileo Galilei',
        'Isaac Newton', 'Albert Einstein', 'Marie Curie', 'Amelia Earhart',
        'Mahatma Gandhi', 'Martin Luther King Jr.', 'Rosa Parks', 'Nelson Mandela',
      ]),
    ],
  },
  {
    id: 'places',
    name: 'Places',
    categories: [
      define('countries', 'Countries', 'Nations from every corner of the map.', [
        'United States', 'Canada', 'Mexico', 'Brazil',
        'Argentina', 'United Kingdom', 'France', 'Germany',
        'Italy', 'Spain', 'Egypt', 'South Africa',
        'Nigeria', 'India', 'China', 'Japan',
        'South Korea', 'Australia', 'Russia', 'Turkey',
      ]),
      define('landmarks', 'World Landmarks', 'Famous sights from around the globe.', [
        'Eiffel Tower', 'Statue of Liberty', 'Great Wall of China', 'Taj Mahal',
        'Colosseum', 'Pyramids of Giza', 'Big Ben', 'Sydney Opera House',
        'Machu Picchu', 'Christ the Redeemer', 'Golden Gate Bridge', 'Stonehenge',
        'Leaning Tower of Pisa', 'Mount Rushmore', 'Burj Khalifa', 'Angkor Wat',
        'Petra', 'Niagara Falls', 'Acropolis', 'Brandenburg Gate',
      ]),
      define('states', 'US States', 'Twenty of the fifty, coast to coast.', [
        'California', 'Texas', 'Florida', 'New York',
        'Alaska', 'Hawaii', 'Washington', 'Oregon',
        'Colorado', 'Arizona', 'Nevada', 'Utah',
        'Illinois', 'Michigan', 'Ohio', 'Pennsylvania',
        'Massachusetts', 'Georgia', 'Tennessee', 'Louisiana',
      ]),
      define('cities', 'World Cities', 'Big cities and bright lights.', [
        'Paris', 'London', 'New York City', 'Los Angeles',
        'Toronto', 'Mexico City', 'Rio de Janeiro', 'Tokyo',
        'Beijing', 'Mumbai', 'Bangkok', 'Sydney',
        'Dubai', 'Cairo', 'Cape Town', 'Rome',
        'Barcelona', 'Amsterdam', 'Istanbul', 'Moscow',
      ]),
    ],
  },
];

export const CATEGORIES = GROUPS.flatMap((g) => g.categories.map((c) => ({ ...c, group: g.id })));

/** Selected on a first visit. */
export const DEFAULT_CATEGORY_ID = 'dogs';

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id);
export const getItem = (categoryId, itemId) =>
  getCategory(categoryId)?.items.find((i) => i.id === itemId);
