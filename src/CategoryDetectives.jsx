import React, { useReducer, useEffect, useRef, useState } from "react";
import {
  Search, LayoutGrid, Layers, RefreshCw, ArrowRight, Eye, EyeOff,
  Lock, Lightbulb, Target, Scissors, AlertTriangle, Award, PawPrint, Orbit,
  Dice5, UtensilsCrossed, Trophy, Star, Zap, Drama, CircleDot,
  Car, Loader2, CheckCircle2, X, Users, Volume2, VolumeX, History, Trash2, Puzzle
} from "lucide-react";

/* =========================================================================
   DATA — categories, items, icons.
   ========================================================================= */

const CATEGORY_SETS = {
  "Dog Breeds": {
    Icon: PawPrint,
    items: ["Labrador Retriever","Poodle","Bulldog","Chihuahua","Beagle","Dachshund","Boxer","Siberian Husky","Rottweiler","German Shepherd","Corgi","Great Dane","Shih Tzu","Border Collie","Doberman","Golden Retriever","Pug","Dalmatian","Basset Hound","Australian Shepherd"]
  },
  "Planets & Moons": {
    Icon: Orbit,
    items: ["Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","The Moon","Titan","Europa","Ganymede","Io","Callisto","Triton","Phobos","Deimos","Enceladus","Charon"]
  },
  "Board Games": {
    Icon: Dice5,
    items: ["Monopoly","Clue","Risk","Scrabble","Chess","Checkers","Battleship","Sorry!","Candy Land","Trouble","Connect Four","Jenga","Pictionary","Yahtzee","The Game of Life","Operation","Stratego","Mouse Trap","Chutes and Ladders","Backgammon"]
  },
  "Ice Cream Flavors": {
    Icon: UtensilsCrossed,
    items: ["Vanilla","Chocolate","Strawberry","Mint Chocolate Chip","Cookies and Cream","Rocky Road","Pistachio","Butter Pecan","Neapolitan","Cookie Dough","Coffee","Salted Caramel","Mango","Black Cherry","Bubblegum","Peanut Butter Cup","Birthday Cake","Coconut","Maple Walnut","Tiramisu"]
  },
  "Olympic Sports": {
    Icon: Trophy,
    items: ["Swimming","Gymnastics","Track and Field","Basketball","Soccer","Volleyball","Boxing","Wrestling","Fencing","Archery","Rowing","Cycling","Diving","Weightlifting","Judo","Taekwondo","Table Tennis","Badminton","Rugby","Sailing"]
  },
  "Celebrities": {
    Icon: Star,
    items: ["Taylor Swift","Dwayne Johnson","Beyoncé","Tom Hanks","Oprah Winfrey","Leonardo DiCaprio","Rihanna","Will Smith","Jennifer Lawrence","Keanu Reeves","Zendaya","Chris Hemsworth","Serena Williams","Ryan Reynolds","Emma Watson","Denzel Washington","Ariana Grande","Robert Downey Jr.","Lady Gaga","Morgan Freeman"]
  },
  "Pokémon": {
    Icon: Zap,
    items: ["Pikachu","Charizard","Bulbasaur","Squirtle","Charmander","Jigglypuff","Mewtwo","Mew","Eevee","Snorlax","Gengar","Gyarados","Dragonite","Machamp","Alakazam","Vaporeon","Blastoise","Venusaur","Psyduck","Magikarp"]
  },
  "Anime": {
    Icon: Drama,
    items: ["Naruto","One Piece","Dragon Ball Z","Attack on Titan","My Hero Academia","Death Note","Fullmetal Alchemist","Demon Slayer","Sailor Moon","Spirited Away","One Punch Man","Hunter x Hunter","Bleach","Cowboy Bebop","Neon Genesis Evangelion","Jujutsu Kaisen","Tokyo Ghoul","Fairy Tail","Sword Art Online","My Neighbor Totoro"]
  },
  "Famous Soccer Players": {
    Icon: CircleDot,
    items: ["Lionel Messi","Cristiano Ronaldo","Pelé","Diego Maradona","Neymar","Kylian Mbappé","Zinedine Zidane","Ronaldinho","David Beckham","Thierry Henry","Kevin De Bruyne","Erling Haaland","Mohamed Salah","Luka Modrić","Robert Lewandowski","Andrés Iniesta","Xavi","Ronaldo Nazário","Zlatan Ibrahimović","Wayne Rooney"]
  },
  "Car Brands": {
    Icon: Car,
    items: ["Toyota","Ford","Honda","Chevrolet","BMW","Mercedes-Benz","Audi","Volkswagen","Nissan","Tesla","Porsche","Ferrari","Lamborghini","Subaru","Mazda","Hyundai","Kia","Jeep","Volvo","Chrysler"]
  }
};

const DEAL_LINES = [
  "Decrypting case file…",
  "Assigning evidence numbers…",
  "Sealing the case folder…",
  "Syncing the board…",
  "Clearing the terminal…",
  "Logging new session…"
];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function buildDeal(key, gamesPlayed) {
  const items = CATEGORY_SETS[key].items.map((name, idx) => ({ id: idx, name }));
  const forSecrets = shuffle(items);
  const secret = { p1: forSecrets[0].id, p2: forSecrets[1].id };
  const board = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const turn = gamesPlayed % 2 === 0 ? "p1" : "p2";
  return { board, secret, turn };
}

function otherPlayer(p) { return p === "p1" ? "p2" : "p1"; }
function hasFreshEliminations(state, turn) {
  return Object.keys(state.eliminated[turn]).some((id) => !state.locked[turn][id]);
}

/* =========================================================================
   SOLO PUZZLE — Wordle-style single-player mode. One secret item, a
   fresh clue revealed each round, difficulty controls how many guesses
   you get and how vague the clues stay.
   ========================================================================= */

const ITEM_FACTS = {
  "Dog Breeds": {
    "Labrador Retriever": ["Originally developed in Newfoundland, Canada, not Labrador.", "Bred to retrieve fishing nets and waterfowl for hunters.", "Consistently ranks among the most popular family dog breeds in the world."],
    "Poodle": ["Believed to have originated in Germany as a water retriever, despite its French association.", "Known for a curly, low-shedding coat often kept in elaborate trims.", "Comes in three official size varieties: standard, miniature, and toy."],
    "Bulldog": ["Originally bred in England for the blood sport of bull-baiting.", "Known for a wrinkled face, stocky build, and pushed-in nose.", "Often used as a mascot, including for many US universities."],
    "Chihuahua": ["Named after a state in Mexico.", "One of the smallest dog breeds in the world.", "Known for a big personality despite its tiny size."],
    "Beagle": ["Bred in England primarily for scent-based hunting of rabbits and hares.", "Has one of the most powerful senses of smell of any dog breed.", "Traditionally worked and hunted in packs rather than alone."],
    "Dachshund": ["The name is German for 'badger dog.'", "Bred with a long body and short legs to hunt burrowing animals underground.", "Comes in standard and miniature sizes, plus smooth, wire, and long-haired coats."],
    "Boxer": ["Developed in Germany, descending from older bull-baiting breeds.", "Known for a playful, high-energy temperament well into adulthood.", "Recognizable by its square-shaped muzzle and strong jaw."],
    "Siberian Husky": ["Bred by the Chukchi people of northeastern Siberia to pull sleds.", "Known for a thick double coat built for extreme cold.", "Often has striking blue eyes, though brown or one of each is also common."],
    "Rottweiler": ["Descended from Roman drover dogs used to herd cattle on long marches.", "Named after a German town.", "Known for its strength, confidence, and protective instincts."],
    "German Shepherd": ["Developed in Germany in the late 1800s, originally for herding sheep.", "One of the most common breeds used in police and military work.", "Known for high intelligence and trainability."],
    "Corgi": ["A herding breed that originated in Wales.", "Known for very short legs relative to its long body.", "Long associated with the British royal family."],
    "Great Dane": ["Despite the name, the breed was developed in Germany, not Denmark.", "Originally bred to hunt wild boar.", "One of the tallest dog breeds in the world."],
    "Shih Tzu": ["The name translates roughly to 'lion dog.'", "Bred in China as a companion for royalty.", "Known for a long, flowing double coat."],
    "Border Collie": ["Developed along the border between England and Scotland for herding sheep.", "Widely regarded as the most intelligent dog breed.", "Known for an intense, focused 'herding eye' stare."],
    "Doberman": ["Developed in Germany in the 1890s by a tax collector who wanted a protective companion.", "Known for a sleek, muscular build and alert stance.", "Commonly used as a guard and police dog."],
    "Golden Retriever": ["Developed in Scotland in the 1800s for retrieving waterfowl during hunts.", "Known for its friendly, patient temperament, especially with children.", "Frequently trained as a guide or therapy dog."],
    "Pug": ["Originated in China, where it was favored by emperors.", "Brought to Europe by Dutch traders in the 16th century.", "Known for a distinctively flat, wrinkled face."],
    "Dalmatian": ["Associated with the Dalmatia region, though its exact origins are debated.", "Historically used as a carriage dog, running alongside horse-drawn coaches.", "Known for a white coat covered in distinctive spots."],
    "Basset Hound": ["The name comes from the French word 'bas,' meaning low.", "Bred in France for scent-hunting small game at a walking pace.", "Known for very long ears and short legs."],
    "Australian Shepherd": ["Despite the name, the breed was actually developed in the United States.", "Closely associated with ranching and rodeo culture in the American West.", "Often has a distinctive mottled coat pattern."]
  },
  "Planets & Moons": {
    "Mercury": ["The closest planet to the Sun.", "Has no moons of its own.", "Experiences some of the most extreme temperature swings in the solar system."],
    "Venus": ["The second planet from the Sun.", "The hottest planet in the solar system due to a runaway greenhouse effect.", "Rotates in the opposite direction from most other planets."],
    "Earth": ["The third planet from the Sun.", "The only planet known to support life.", "Has exactly one natural satellite."],
    "Mars": ["Known as the Red Planet due to iron oxide on its surface.", "Has two small moons.", "Home to the largest volcano in the solar system."],
    "Jupiter": ["The largest planet in the solar system.", "Known for a massive, centuries-old storm.", "Has dozens of known moons, more than any planet except one."],
    "Saturn": ["The second-largest planet in the solar system.", "Famous for its extensive, prominent ring system.", "Like Jupiter, it's classified as a gas giant."],
    "Uranus": ["Rotates almost completely on its side compared to other planets.", "Has a pale blue-green color caused by methane in its atmosphere.", "Classified as an ice giant rather than a gas giant."],
    "Neptune": ["The farthest known planet from the Sun.", "Home to the strongest sustained winds recorded in the solar system.", "Known for its deep blue color."],
    "Pluto": ["Reclassified from a planet to a dwarf planet in 2006.", "Located in a region called the Kuiper Belt.", "Has a large moon that's almost half its own size."],
    "The Moon": ["Earth's only natural satellite.", "Its gravitational pull is the main cause of ocean tides.", "Has essentially no atmosphere."],
    "Titan": ["The largest moon of Saturn.", "The only moon in the solar system known to have a thick atmosphere.", "Has lakes and rivers, but made of liquid methane rather than water."],
    "Europa": ["One of Jupiter's four largest moons.", "Has an icy surface believed to cover a hidden liquid ocean.", "Considered one of the best candidates in the solar system for extraterrestrial life."],
    "Ganymede": ["A moon of Jupiter.", "The largest moon in the entire solar system.", "Actually bigger in size than the planet Mercury."],
    "Io": ["A moon of Jupiter.", "The most volcanically active body in the entire solar system.", "Its surface is constantly reshaped by ongoing eruptions."],
    "Callisto": ["A moon of Jupiter.", "Known for having one of the oldest, most heavily cratered surfaces in the solar system.", "One of the four large moons discovered by Galileo."],
    "Triton": ["The largest moon of Neptune.", "Unusually, it orbits its planet in the opposite direction of the planet's rotation.", "Thought to be a captured object rather than having formed alongside its planet."],
    "Phobos": ["One of the two moons of Mars.", "The larger and closer of Mars's two moons.", "Slowly spiraling inward and expected to eventually crash into Mars or break apart."],
    "Deimos": ["One of the two moons of Mars.", "The smaller and more distant of Mars's two moons.", "Named after the Greek personification of dread."],
    "Enceladus": ["A moon of Saturn.", "Known for geysers of water vapor erupting from its icy surface.", "Believed to hide a liquid ocean beneath its ice."],
    "Charon": ["The largest moon of Pluto.", "So large relative to Pluto that the pair is sometimes described as a double dwarf planet.", "Named after the ferryman of the dead in Greek mythology."]
  },
  "Board Games": {
    "Monopoly": ["A real estate trading game where players buy, sell, and develop properties.", "The goal is to bankrupt all your opponents.", "Based on an earlier game called The Landlord's Game."],
    "Clue": ["A murder mystery game where players deduce who committed the crime.", "Players must determine the culprit, the weapon, and the room.", "Known as Cluedo outside of North America."],
    "Risk": ["A strategy game centered on conquering territories across a world map.", "Involves dice rolls to resolve battles between armies.", "Players aim for world domination."],
    "Scrabble": ["A word game where players form words on a grid using lettered tiles.", "Different letters are worth different point values.", "Certain board squares multiply the value of words or letters."],
    "Chess": ["Played on an 8x8 checkered board with no element of chance involved.", "Each player commands 16 pieces of six different types.", "The goal is to checkmate the opponent's king."],
    "Checkers": ["Played on the same style of board as chess, but with simpler rules.", "Players capture opponent pieces by jumping over them.", "Pieces that reach the far side of the board are 'kinged.'"],
    "Battleship": ["A naval combat game played by guessing grid coordinates.", "Each player hides a fleet of ships on a grid the opponent can't see.", "Players call out coordinates to try to land a hit on a hidden ship."],
    "Sorry!": ["Based on an ancient cross-and-circle game called Pachisi.", "Players race colored pawns around a track toward home.", "Landing on an opponent's piece sends it back to its start."],
    "Candy Land": ["Designed to be playable by young children who can't yet read.", "Players move along a path by drawing color-matching cards.", "Set in a candy-themed fantasy land."],
    "Trouble": ["Features a plastic bubble in the center of the board that pops a die when pressed.", "Players race pegs around the board and try to send opponents back to start.", "The dice-popper mechanism avoided the need for a separate die that could be lost."],
    "Connect Four": ["Players drop colored discs into a vertical grid.", "The goal is to connect four of your own discs in a row.", "The connection can be made horizontally, vertically, or diagonally."],
    "Jenga": ["A physical skill game built around a tower of stacked wooden blocks.", "Players take turns removing a block and placing it on top.", "The game ends when the tower collapses."],
    "Pictionary": ["A team game where one player draws clues while others guess the word.", "Talking or writing letters or numbers while drawing isn't allowed.", "Categories often include people, places, objects, and actions."],
    "Yahtzee": ["Played with five dice, rolled up to three times per turn.", "Players aim to form specific scoring combinations, similar to poker hands.", "The highest-scoring combination shares its name with the game itself."],
    "The Game of Life": ["Simulates a person's journey through major life milestones.", "Players make choices about careers, family, and finances along a spinning-wheel-driven path.", "One of the oldest commercially produced board games still in print."],
    "Operation": ["Players use tweezers to remove small plastic pieces from a patient's body.", "Touching the metal edge of an opening triggers a buzzer and lights up the patient's nose.", "Each successful removal corresponds to a specific fictional ailment."],
    "Stratego": ["A two-player strategy game where each side's piece ranks are hidden from the opponent.", "The main objective is to capture the opponent's flag.", "Higher-ranked pieces generally defeat lower-ranked ones in combat."],
    "Mouse Trap": ["Players gradually assemble pieces of an elaborate chain-reaction machine.", "The completed contraption is eventually used to try to catch an opponent's mouse piece.", "One of the earliest mass-produced games built around a working chain-reaction mechanism."],
    "Chutes and Ladders": ["A simple race game popular with young children.", "Landing on certain squares sends your piece up a ladder or down a chute.", "Based on an ancient Indian game about morality."],
    "Backgammon": ["One of the oldest known board games, with roots going back thousands of years.", "Combines dice rolls with strategic decision-making.", "Players race to move all their pieces off the board before their opponent."]
  },
  "Ice Cream Flavors": {
    "Vanilla": ["Consistently the best-selling ice cream flavor worldwide.", "Flavored using extract from a type of orchid pod.", "Often used as a base flavor that pairs with almost any topping."],
    "Chocolate": ["Flavored using cocoa, derived from cacao beans.", "Usually ranks as the second most popular ice cream flavor after vanilla.", "Comes in many variations based on how dark or milky the chocolate is."],
    "Strawberry": ["Made using real strawberry fruit or puree.", "One of the classic 'Neapolitan' trio flavors alongside chocolate and vanilla.", "Known for its naturally pink or reddish color."],
    "Mint Chocolate Chip": ["A mint-flavored base studded with small chocolate pieces.", "Naturally a pale off-white color, though often dyed green for visual appeal.", "A popular flavor choice for after-dinner or refreshing treats."],
    "Cookies and Cream": ["A vanilla base mixed with crushed chocolate sandwich cookies.", "Became widely popular in the United States starting in the 1980s.", "One of the most requested mix-in-style flavors in ice cream shops."],
    "Rocky Road": ["A chocolate base mixed with marshmallows and nuts.", "Reportedly named partly in reference to hard economic times when it was created.", "One of the earliest widely popular 'mix-in' style ice cream flavors."],
    "Pistachio": ["Flavored using pistachio nuts.", "Naturally has a pale green color, though it's sometimes enhanced with food coloring.", "Popular in Italian-style gelato as well as American ice cream."],
    "Butter Pecan": ["A buttery-flavored base mixed with toasted pecan pieces.", "The pecans are typically toasted in butter before being added.", "A flavor strongly associated with Southern United States cuisine."],
    "Neapolitan": ["Actually three separate flavors served together in one block.", "Traditionally combines chocolate, vanilla, and strawberry.", "Named after the Italian city of Naples, though it was popularized in the US."],
    "Cookie Dough": ["A vanilla base mixed with chunks of edible cookie dough.", "The dough used is specially made to be safe to eat without baking.", "One of the most popular flavors introduced in the late 20th century."],
    "Coffee": ["Flavored using brewed coffee or espresso.", "Popular as a base for a dessert where hot espresso is poured over it.", "Tends to be a favorite among adult ice cream eaters over children."],
    "Salted Caramel": ["A caramel-flavored base balanced with a touch of salt.", "Became especially trendy in dessert menus starting in the 2010s.", "The salt is added specifically to offset and enhance the sweetness."],
    "Mango": ["Flavored using mango fruit.", "Especially popular in South Asian and tropical cuisines.", "Often made as a dairy-free sorbet as well as a creamy ice cream."],
    "Black Cherry": ["A cherry-flavored base often studded with chunks of dark cherries.", "Usually has a deep red or purple color.", "A common flavor pairing alongside vanilla or chocolate swirls."],
    "Bubblegum": ["Flavored to taste like classic bubblegum candy.", "Usually brightly colored, often blue or pink.", "Popular primarily with children rather than adults."],
    "Peanut Butter Cup": ["A peanut butter-flavored base mixed with chocolate candy pieces.", "Combines two classic dessert flavors: peanut butter and chocolate.", "Popular as both a standalone flavor and a swirl combination."],
    "Birthday Cake": ["A vanilla base flavored to taste like cake batter.", "Almost always includes colorful sprinkles mixed throughout.", "Designed to evoke the flavor of a classic birthday celebration."],
    "Coconut": ["Flavored using coconut.", "Frequently used as a dairy-free base for vegan ice cream.", "Often paired with other tropical flavors like pineapple or lime."],
    "Maple Walnut": ["A maple syrup-flavored base mixed with chopped walnuts.", "Strongly associated with New England and Canadian cuisine.", "One of the more common flavors specifically featuring maple as the star ingredient."],
    "Tiramisu": ["Flavored to evoke the classic Italian dessert of the same name.", "Typically includes notes of coffee and mascarpone cheese.", "Sometimes includes a hint of cocoa or ladyfinger-cookie flavoring."]
  },
  "Olympic Sports": {
    "Swimming": ["Competed in a pool over a range of strokes and distances.", "Has been part of the Olympics since the very first modern Games in 1896.", "Includes strokes such as freestyle, backstroke, breaststroke, and butterfly."],
    "Gymnastics": ["Judged on a combination of difficulty and execution rather than a race against the clock.", "Includes multiple apparatus such as balance beam, rings, and vault.", "Athletes are typically among the youngest competitors at the Olympics."],
    "Track and Field": ["Actually an umbrella term covering many separate running, jumping, and throwing events.", "Includes the 100-meter dash, often considered the highlight event of the Summer Games.", "One of the oldest categories of Olympic competition, dating back to the ancient Games."],
    "Basketball": ["Played on a court with a hoop at each end.", "Became an Olympic sport in the 1930s.", "Teams score by shooting a ball through the opposing hoop."],
    "Soccer": ["Widely considered the most popular team sport in the world.", "Players use mostly their feet, legs, and head rather than their hands.", "Known as football in most countries outside North America."],
    "Volleyball": ["Teams hit a ball back and forth over a net without letting it touch the ground.", "Has both an indoor and a beach version at the Olympics.", "Each team is generally allowed a limited number of touches before sending the ball back over."],
    "Boxing": ["A combat sport in which competitors wear padded gloves.", "Matches can be won by knockout or by judges' decision.", "One of the oldest combat sports in the Olympic program."],
    "Wrestling": ["A combat sport based on grappling rather than striking.", "Has two major Olympic styles that differ in which holds are allowed.", "One of the events included in the ancient Olympic Games."],
    "Fencing": ["A combat sport that uses swords to score points.", "Has three different weapon disciplines, each with its own rules.", "Competitors wear protective gear, including a mask covering the face."],
    "Archery": ["Competitors shoot arrows at a stationary target from a set distance.", "Scoring is based on which ring of the target the arrow lands in.", "One of the events with roots going back to the ancient Olympic era."],
    "Rowing": ["Athletes propel a narrow boat using oars, typically racing in a straight line.", "Boats can carry different numbers of rowers, sometimes with someone steering.", "Has been part of the Olympics since 1900."],
    "Cycling": ["Includes several different disciplines: road, track, and off-road mountain biking.", "Track events take place on a banked oval course.", "Road racing can cover distances well over 100 miles in some competitions."],
    "Diving": ["Athletes perform acrobatic jumps into water from a platform or springboard.", "Judged on factors like execution, difficulty, and entry into the water.", "Closely related to gymnastics in its scoring approach."],
    "Weightlifting": ["Competitors attempt to lift the heaviest possible barbell in two specific lift types.", "Athletes compete in weight classes based on body mass.", "One lift requires bringing the bar from the floor to overhead in a single continuous motion."],
    "Judo": ["A Japanese martial art and combat sport.", "Focused on throws and ground grappling rather than striking.", "Competitors wear a traditional uniform tied with a colored belt indicating rank."],
    "Taekwondo": ["A Korean martial art and combat sport.", "Known especially for its wide variety of kicking techniques.", "Competitors wear protective gear including a chest guard and helmet."],
    "Table Tennis": ["Played on a small table divided by a low net.", "Uses a very lightweight, hollow ball.", "Also commonly known by a nickname referencing the sound of the ball."],
    "Badminton": ["Played with a shuttlecock instead of a ball.", "Uses a notably higher net than most other racket sports.", "The shuttlecock can travel faster off the racket than the ball in most other racket sports."],
    "Rugby": ["Played with an oval-shaped ball rather than a round one.", "Points can be scored by carrying the ball into the opponent's end zone and touching it down.", "The Olympic version is typically a faster, shorter format than the traditional full game."],
    "Sailing": ["Involves racing wind-powered boats around a marked course.", "Competitors must constantly adjust course and sail position based on wind direction.", "Also historically known by another name in some Olympic eras."]
  },
  "Celebrities": {
    "Taylor Swift": ["An American singer-songwriter.", "Began her career primarily in country music before moving into pop.", "Known for writing much of her own material, often with narrative, storytelling lyrics."],
    "Dwayne Johnson": ["A former professional wrestler turned actor.", "Widely known by a one-word ring nickname.", "Frequently stars in major action and adventure films."],
    "Beyoncé": ["An American singer.", "Rose to fame as part of a girl group before launching a solo career.", "Known for elaborate, highly choreographed live performances."],
    "Tom Hanks": ["An American actor with a career spanning several decades.", "Known for a wide range of both dramatic and comedic roles.", "Often cast in roles portraying real historical figures."],
    "Oprah Winfrey": ["An American media executive and former talk show host.", "Her long-running daytime talk show made her one of the most influential figures in American media.", "Also known for a highly influential book club recommendation list."],
    "Leonardo DiCaprio": ["An American actor known primarily for leading dramatic film roles.", "Also known for environmental activism outside of acting.", "Frequently collaborates with the same small group of directors across his career."],
    "Rihanna": ["A singer from Barbados.", "Built a major cosmetics brand in addition to her music career.", "Known for blending genres like pop, R&B, and reggae in her music."],
    "Will Smith": ["An American actor who also has a career as a rapper.", "Got his start on a popular television sitcom before moving into film.", "Known for starring in many major action and comedy blockbusters."],
    "Jennifer Lawrence": ["An American actress.", "Rose to major fame through a leading role in a dystopian young-adult film franchise.", "Known for a mix of blockbuster and independent film work."],
    "Keanu Reeves": ["A Canadian actor.", "Known for starring in major science fiction and action film franchises.", "Widely known for a calm, understated public persona."],
    "Zendaya": ["An American actress and singer.", "Began her career as a Disney Channel star.", "Also known for her work as a fashion trendsetter on red carpets."],
    "Chris Hemsworth": ["An Australian actor.", "Known for playing a Norse-mythology-inspired superhero in a major film franchise.", "Has a brother who is also a well-known actor."],
    "Serena Williams": ["A retired American professional tennis player.", "Widely regarded as one of the greatest players in the sport's history.", "Has a sister who was also a top professional tennis player."],
    "Ryan Reynolds": ["A Canadian actor.", "Known for blending sharp comedic timing with action roles.", "Also built a business career investing in and promoting consumer brands."],
    "Emma Watson": ["A British actress.", "Rose to fame as a child actor in a major fantasy film franchise.", "Also known for advocacy work related to gender equality."],
    "Denzel Washington": ["An American actor and director.", "Known for a long career of acclaimed dramatic film performances.", "Has also directed several feature films."],
    "Ariana Grande": ["An American singer.", "Began her career as a television actress before pivoting to music.", "Known for a wide vocal range in her pop music."],
    "Robert Downey Jr.": ["An American actor.", "Experienced a major career resurgence in the late 2000s.", "Known for playing a wealthy, wisecracking superhero in a long-running film franchise."],
    "Lady Gaga": ["An American singer.", "Known early in her career for provocative, theatrical pop performances.", "Later earned acclaim for dramatic film acting roles as well."],
    "Morgan Freeman": ["An American actor.", "Known for a distinctive, calming speaking voice.", "Frequently sought out for narration work in addition to acting roles."]
  },
  "Pokémon": {
    "Pikachu": ["An Electric-type Pokémon.", "Widely considered the mascot of the entire franchise.", "Evolves from an earlier form and can evolve further with the right stone."],
    "Charizard": ["A Fire and Flying-type Pokémon.", "The final evolution of one of the original starter Pokémon.", "Resembles a dragon, though it's not actually classified as one."],
    "Bulbasaur": ["A Grass and Poison-type Pokémon.", "One of the three original starter Pokémon.", "Has a plant bulb growing on its back that develops as it evolves."],
    "Squirtle": ["A Water-type starter Pokémon.", "Has a turtle-like appearance.", "Evolves twice into progressively larger forms."],
    "Charmander": ["A Fire-type starter Pokémon.", "Has a flame burning on the tip of its tail.", "The flame is said to reflect the health and mood of the Pokémon."],
    "Jigglypuff": ["A round, balloon-like Pokémon.", "Known for a signature move that puts listeners to sleep with its singing.", "Famously draws on the face of anyone who falls asleep during its song."],
    "Mewtwo": ["A Psychic-type Pokémon.", "Created artificially through genetic engineering.", "Based on the DNA of an extremely rare, mythical Pokémon."],
    "Mew": ["A Psychic-type Pokémon.", "Considered a mythical, extremely rare Pokémon.", "Said to contain the genetic makeup of many other Pokémon species."],
    "Eevee": ["A Normal-type Pokémon.", "Famous for having an unusually large number of possible evolved forms.", "Which form it evolves into depends on specific conditions like location or friendship level."],
    "Snorlax": ["A Normal-type Pokémon.", "Known for being enormous and famously lazy.", "Often depicted blocking paths while sleeping, requiring a special method to wake it."],
    "Gengar": ["A Ghost and Poison-type Pokémon.", "Based on the concept of a mischievous shadow.", "The final evolution of a three-stage ghostly Pokémon line."],
    "Gyarados": ["A Water and Flying-type Pokémon.", "Known for a fierce, serpentine, dragon-like appearance.", "Evolves from a Pokémon widely considered one of the weakest in the franchise."],
    "Dragonite": ["A Dragon and Flying-type Pokémon.", "The final evolution of a three-stage Pokémon line.", "Despite its large size, it's often depicted as friendly and gentle."],
    "Machamp": ["A Fighting-type Pokémon.", "Known for having four muscular arms.", "The final evolution of a line that starts as a small humanoid Pokémon."],
    "Alakazam": ["A Psychic-type Pokémon.", "Known for extremely high intelligence.", "Depicted carrying spoons that are said to help focus its psychic power."],
    "Vaporeon": ["A Water-type Pokémon.", "One of the possible evolved forms of a Normal-type Pokémon with many evolution options.", "Has a mermaid-like, aquatic appearance."],
    "Blastoise": ["A Water-type Pokémon.", "The final evolution of a classic Water-type starter line.", "Known for a pair of cannons that emerge from its shell."],
    "Venusaur": ["A Grass and Poison-type Pokémon.", "The final evolution of a classic Grass-type starter line.", "Known for a large flower blooming on its back."],
    "Psyduck": ["A Water-type Pokémon.", "Known for suffering from constant headaches.", "Its psychic powers are said to activate when its headache becomes severe enough."],
    "Magikarp": ["A Water-type Pokémon.", "Famous for being one of the weakest Pokémon in battle.", "Evolves into a much more powerful serpentine Pokémon."]
  },
  "Anime": {
    "Naruto": ["Follows a young ninja who dreams of becoming the leader of his village.", "Set in a world where ninja villages compete and cooperate with one another.", "One of the best-selling manga series of all time."],
    "One Piece": ["Follows a pirate crew searching for a legendary treasure.", "The protagonist's body gained unusual stretching properties after eating a mysterious fruit.", "One of the longest-running and best-selling manga series ever published."],
    "Dragon Ball Z": ["A martial arts and science fiction series.", "Follows warriors who defend Earth from increasingly powerful threats.", "Known for characters achieving dramatic power-up transformations mid-battle."],
    "Attack on Titan": ["Set in a world where humanity lives behind massive walls for protection.", "The threat comes from giant humanoid creatures that prey on humans.", "Known for a complex, twist-heavy plot that expands well beyond its initial premise."],
    "My Hero Academia": ["Set in a world where the vast majority of people are born with superpowers.", "Follows a student attending a school specifically for training superheroes.", "The protagonist starts the series as one of the rare people without a power."],
    "Death Note": ["Centers on a supernatural notebook that can kill anyone whose name is written in it.", "Follows a cat-and-mouse psychological battle between two brilliant minds.", "Known for its heavy use of strategic, chess-like plotting rather than physical action."],
    "Fullmetal Alchemist": ["Follows two brothers seeking a way to restore their bodies after a failed ritual.", "Set in a world where alchemy is treated as an exact science with strict rules.", "Combines adventure, dark themes, and a strong emphasis on sibling bonds."],
    "Demon Slayer": ["Follows a young man who becomes a demon hunter after a tragic family attack.", "The protagonist's younger sister survives but is transformed into a demon.", "Known for visually striking, elemental-themed combat techniques."],
    "Sailor Moon": ["A pioneering entry in the magical girl genre.", "Follows a group of teenage girls who transform to battle evil forces.", "Known for popularizing the 'magical girl team' format worldwide."],
    "Spirited Away": ["Follows a young girl trapped in a mysterious spirit world.", "The story centers around a bathhouse that serves spirits and gods.", "Directed by one of the most acclaimed filmmakers in animation history."],
    "One Punch Man": ["Follows a superhero so powerful he can defeat any opponent with a single punch.", "A recurring theme of the series is the hero's struggle with boredom from being unbeatable.", "Known for blending comedy with over-the-top action."],
    "Hunter x Hunter": ["Follows a young boy training to become a licensed 'Hunter.'", "One of his personal goals is to track down his long-absent father.", "Known for a detailed, strategy-heavy power system."],
    "Bleach": ["Follows a teenager who gains the powers of a soul reaper.", "Centers on battles against corrupted, evil spirits.", "Known for a large cast of characters each with unique named weapons and abilities."],
    "Cowboy Bebop": ["Follows a crew of bounty hunters traveling through space.", "Blends genres including science fiction, western, and noir.", "Known for a jazz-heavy soundtrack that heavily influenced its tone."],
    "Neon Genesis Evangelion": ["Follows teenagers piloting giant biomechanical robots.", "The robots defend against mysterious, otherworldly beings.", "Known for its heavy psychological and philosophical themes."],
    "Jujutsu Kaisen": ["Follows a student who becomes host to a powerful curse after swallowing a cursed object.", "Set in a world where sorcerers battle curses born from negative human emotions.", "Became one of the most popular new series of its decade shortly after release."],
    "Tokyo Ghoul": ["Follows a young man who becomes part-ghoul after a near-fatal encounter.", "Explores the divide between humans and flesh-eating ghouls coexisting in a city.", "Known for its darker, more horror-influenced tone compared to typical action series."],
    "Fairy Tail": ["Follows wizards belonging to a magical guild.", "Known for its found-family theme among the guild's rowdy members.", "Set in a world where magic guilds take on jobs for clients."],
    "Sword Art Online": ["Follows players trapped inside a virtual reality video game.", "The stakes are unusually high because dying in the game means dying in real life.", "One of the most well-known series to center on virtual reality as its core premise."],
    "My Neighbor Totoro": ["Follows two young sisters who move to the countryside.", "They befriend a gentle, large forest spirit near their new home.", "One of the most recognizable and beloved family-friendly animated films ever made."]
  },
  "Famous Soccer Players": {
    "Lionel Messi": ["An Argentine forward.", "Widely regarded as one of the greatest players in the sport's history.", "Known especially for close ball control and dribbling at speed."],
    "Cristiano Ronaldo": ["A Portuguese forward.", "Known for exceptional athleticism and goal-scoring ability.", "Famous for his powerful heading ability and aerial jumping."],
    "Pelé": ["A Brazilian forward from the mid-20th century.", "Widely considered one of the greatest players in the sport's history.", "Won multiple World Cups with the Brazilian national team."],
    "Diego Maradona": ["An Argentine attacking player.", "Known for extraordinary dribbling ability in tight spaces.", "Involved in one of the most famous and controversial goals in World Cup history."],
    "Neymar": ["A Brazilian forward.", "Known for flashy, creative dribbling and flair on the ball.", "Became one of the most expensive transfers in the sport's history at one point."],
    "Kylian Mbappé": ["A French forward.", "Known especially for exceptional sprinting speed.", "Became a World Cup-winning star while still in his teens."],
    "Zinedine Zidane": ["A French midfielder during his playing career.", "Known for elegant technique and vision on the ball.", "Later became a highly successful club manager after retiring as a player."],
    "Ronaldinho": ["A Brazilian attacking player.", "Known for flamboyant flair and creative trick plays.", "Widely recognized for his constant smile while playing."],
    "David Beckham": ["An English midfielder.", "Known especially for precise long passing and free kicks.", "Became one of the sport's most recognizable global celebrities off the field."],
    "Thierry Henry": ["A French forward.", "Known for blazing pace combined with clinical finishing.", "Spent a long, highly prolific spell playing in England."],
    "Kevin De Bruyne": ["A Belgian midfielder.", "Known for exceptional vision and passing range.", "One of the sport's most prolific creators of scoring chances for teammates."],
    "Erling Haaland": ["A Norwegian forward.", "Known for an unusual combination of large size and sprinting speed.", "Built a reputation as a prolific goal-scorer from a very young age."],
    "Mohamed Salah": ["An Egyptian forward.", "Known for pace and clinical finishing, often cutting in from the wing.", "Became one of the most celebrated athletes in Egyptian sporting history."],
    "Luka Modrić": ["A Croatian midfielder.", "Known for passing range and control in the middle of the field.", "Captained his national team to a World Cup final."],
    "Robert Lewandowski": ["A Polish forward.", "Known for elite finishing and positioning inside the penalty area.", "Spent much of his career as one of Europe's top annual goal scorers."],
    "Andrés Iniesta": ["A Spanish midfielder.", "Known for tight close control in crowded spaces.", "Scored a decisive goal in a World Cup final for his national team."],
    "Xavi": ["A Spanish midfielder during his playing career.", "Known for controlling the tempo and rhythm of a match through passing.", "Later returned to manage the club where he spent most of his playing career."],
    "Ronaldo Nazário": ["A Brazilian forward whose peak was in the late 1990s and 2000s.", "Known for explosive speed and dribbling ability.", "Overcame serious knee injuries partway through his career."],
    "Zlatan Ibrahimović": ["A Swedish forward.", "Known for combining large physical size with unusually refined technical skill.", "Also well known for a bold, outspoken public personality."],
    "Wayne Rooney": ["An English forward.", "Known for a powerful, direct playing style.", "Became his national team's all-time leading goal scorer for a period."]
  },
  "Car Brands": {
    "Toyota": ["A Japanese automaker.", "Regularly ranks among the largest car manufacturers in the world by sales.", "Widely known for a strong reputation for reliability."],
    "Ford": ["An American automaker.", "Pioneered the widespread use of the moving assembly line in car manufacturing.", "Founded in the early 20th century by its namesake."],
    "Honda": ["A Japanese automaker.", "Also one of the largest motorcycle manufacturers in the world.", "Known for producing its own engines used across a wide range of products."],
    "Chevrolet": ["An American automotive brand owned by a larger parent company.", "Known for a long history of trucks and muscle cars.", "One of the best-selling car brands in the United States."],
    "BMW": ["A German automaker.", "Known for luxury and performance-oriented vehicles.", "The brand's name is an abbreviation referencing motor and engine works."],
    "Mercedes-Benz": ["A German automaker.", "Traces its roots back to some of the very earliest automobile inventions.", "Known for luxury vehicles and a three-pointed star logo."],
    "Audi": ["A German automaker.", "Its logo features four interlocking rings representing four merged companies.", "Known for a signature all-wheel-drive system used across many models."],
    "Volkswagen": ["A German automaker.", "Its name translates to 'people's car.'", "Produced one of the best-selling individual car models in automotive history."],
    "Nissan": ["A Japanese automaker.", "Formed a long-running international alliance with a major French automaker.", "Known for producing both mainstream vehicles and a dedicated sports car line."],
    "Tesla": ["An American automaker.", "Focuses exclusively on electric vehicles.", "Named after a famous inventor and electrical engineer."],
    "Porsche": ["A German automaker.", "Known for high-performance sports cars.", "Famous for a long-running model line with the engine mounted at the rear."],
    "Ferrari": ["An Italian automaker.", "Known for high-performance luxury sports cars.", "Has a long, storied history in motorsport racing."],
    "Lamborghini": ["An Italian automaker.", "Known for dramatic-looking, high-performance supercars.", "Founded by a businessman who originally made tractors."],
    "Subaru": ["A Japanese automaker.", "Known for including all-wheel drive as standard on most of its models.", "Uses a distinctive horizontally opposed engine layout in most vehicles."],
    "Mazda": ["A Japanese automaker.", "Historically known for using a distinctive rotary engine in some models.", "Produces one of the best-selling two-seat sports cars in history."],
    "Hyundai": ["A South Korean automaker.", "One of the largest car manufacturers in the world by production volume.", "Owns another major South Korean car brand as part of the same corporate group."],
    "Kia": ["A South Korean automaker.", "Part of the same corporate group as another major South Korean car brand.", "Has become known in recent years for bold, distinctive exterior design."],
    "Jeep": ["An American automotive brand.", "Known for off-road capable SUVs.", "Traces its roots back to a vehicle developed for military use."],
    "Volvo": ["A Swedish automaker.", "Known for a strong brand emphasis on vehicle safety.", "Credited with inventing and popularizing a key seatbelt design used industry-wide."],
    "Chrysler": ["An American automaker.", "Historically one of the 'Big Three' major US car manufacturers.", "Now part of a larger multinational automotive group."]
  }
};

function clueWeak(name) {
  const letters = name.replace(/[^A-Za-z]/g, "");
  const words = name.trim().split(/\s+/);
  const first = name[0].toUpperCase();
  return pickRandom([
    `The name has ${words.length > 1 ? "more than one word" : "only one word"}.`,
    `The name starts with a letter from ${first <= "M" ? "A–M" : "N–Z"}.`,
    `Excluding spaces, the name is ${letters.length > 9 ? "longer than 9 letters" : "9 letters or fewer"}.`
  ]);
}
function clueMedium(name) {
  const letters = name.replace(/[^A-Za-z]/g, "");
  const words = name.trim().split(/\s+/);
  const first = name[0].toUpperCase();
  const quartile = first <= "F" ? "A–F" : first <= "M" ? "G–M" : first <= "S" ? "N–S" : "T–Z";
  const rest = Array.from(new Set(letters.toLowerCase().split(""))).filter((c) => c !== letters[0].toLowerCase());
  const sample = rest.length ? pickRandom(rest) : letters[0].toLowerCase();
  return pickRandom([
    `The name starts with a letter from ${quartile}.`,
    `The name contains the letter "${sample.toUpperCase()}".`,
    `The name has exactly ${words.length} word${words.length === 1 ? "" : "s"}.`
  ]);
}
function clueStrong(name) {
  const letters = name.replace(/[^A-Za-z]/g, "");
  return pickRandom([
    `The name starts with "${name.slice(0, 2)}".`,
    `Excluding spaces, the name has exactly ${letters.length} letters.`
  ]);
}
function clueVeryStrong(name) {
  return `The name starts with "${name.slice(0, 3)}".`;
}

const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy",   rounds: 6, tiers: ["weak", "weak", "medium", "medium", "strong", "verystrong"] },
  medium: { label: "Medium", rounds: 5, tiers: ["weak", "weak", "medium", "medium", "strong"] },
  hard:   { label: "Hard",   rounds: 4, tiers: ["weak", "weak", "weak", "medium"] }
};

function tierClue(tier, name) {
  if (tier === "weak") return clueWeak(name);
  if (tier === "medium") return clueMedium(name);
  if (tier === "strong") return clueStrong(name);
  return clueVeryStrong(name);
}

function buildClueSequence(name, categoryKey, difficulty) {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
  const facts = (ITEM_FACTS[categoryKey] && ITEM_FACTS[categoryKey][name]) || [];
  const sequence = [];

  // Real facts about the thing itself come first, ordered vague → specific.
  const factsToUse = Math.min(facts.length, cfg.rounds);
  for (let i = 0; i < factsToUse; i++) sequence.push(facts[i]);

  // Only fall back to name-based structural clues for any rounds left over,
  // continuing the tier escalation from where the facts left off.
  const used = new Set(sequence);
  cfg.tiers.slice(sequence.length).forEach((tier) => {
    let clue = tierClue(tier, name);
    let attempts = 0;
    while (used.has(clue) && attempts < 5) { clue = tierClue(tier, name); attempts++; }
    used.add(clue);
    sequence.push(clue);
  });

  return sequence.slice(0, cfg.rounds);
}

function buildSoloPuzzle(categoryKey, difficulty) {
  const items = CATEGORY_SETS[categoryKey].items.map((name, idx) => ({ id: idx, name }));
  const board = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const secretItem = pickRandom(items);
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
  return {
    board,
    soloSecretId: secretItem.id,
    soloClues: buildClueSequence(secretItem.name, categoryKey, difficulty),
    soloMaxRounds: cfg.rounds
  };
}

/* =========================================================================
   SOUND — tiny Web Audio synth, no audio files. Tactile sounds fire from
   click handlers; outcome sounds fire reactively off state transitions.
   ========================================================================= */

let audioCtx = null;
function getCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function tone(freq, duration, type, startGain, delay) {
  if (!Sound.enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(startGain || 0.06, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}
const Sound = {
  enabled: true,
  click() { tone(720, 0.045, "square", 0.05); },
  select() { tone(560, 0.07, "sine", 0.06); },
  eliminate() { tone(240, 0.09, "square", 0.05); },
  undo() { tone(340, 0.06, "square", 0.045); },
  openGuess() { tone(880, 0.08, "triangle", 0.06); },
  deal() { tone(300, 0.06, "sine", 0.05, 0); tone(450, 0.06, "sine", 0.05, 0.07); tone(600, 0.08, "sine", 0.05, 0.14); },
  correct() { tone(523.25, 0.12, "sine", 0.07, 0); tone(659.25, 0.12, "sine", 0.07, 0.09); tone(783.99, 0.18, "sine", 0.08, 0.18); },
  wrong() { tone(220, 0.16, "sawtooth", 0.06, 0); tone(164.81, 0.22, "sawtooth", 0.06, 0.1); },
  lose() { tone(392, 0.14, "sawtooth", 0.05, 0); tone(311.13, 0.14, "sawtooth", 0.05, 0.12); tone(233.08, 0.24, "sawtooth", 0.06, 0.24); }
};

const SOUND_KEY = "category-detectives-sound";
function loadSoundPref() {
  try { return localStorage.getItem(SOUND_KEY) !== "0"; } catch { return true; }
}

/* =========================================================================
   STATS — persisted to localStorage.
   ========================================================================= */

const STATS_KEY = "category-detectives-stats-v2";
const DEFAULT_STATS = { gamesPlayed: 0, soloWins: 0, soloLosses: 0, soloStreak: 0, soloBestStreak: 0, categoryCounts: {} };

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS, categoryCounts: {} };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATS, ...parsed, categoryCounts: { ...(parsed.categoryCounts || {}) } };
  } catch {
    return { ...DEFAULT_STATS, categoryCounts: {} };
  }
}

/* =========================================================================
   STATE
   ========================================================================= */

const initialState = {
  screen: "intro",
  gameMode: "duel",       // "duel" | "solo"
  difficulty: "medium",   // solo only
  names: { p1: "Player 1", p2: "Player 2" },
  categoryKey: null,
  board: [],
  // duel fields
  secret: { p1: null, p2: null },
  eliminated: { p1: {}, p2: {} },
  locked: { p1: {}, p2: {} },
  turn: "p1",
  rounds: 0,
  mode: "eliminate",
  modalGuess: null,
  turnNotice: null,
  score: { p1: 0, p2: 0 },
  // solo fields
  soloSecretId: null,
  soloClues: [],
  soloRound: 0,
  soloMaxRounds: 0,
  soloWrongGuesses: {},
  soloModalGuess: null,
  // shared
  winner: null,
  winReason: null,
  gamesPlayed: 0
};

function resolveGuess(state, turn, opponent, id) {
  const correct = state.secret[opponent] === id;
  const remainingBeforeGuess = state.board.filter((b) => !state.eliminated[turn][b.id]);
  const wasLastOption = remainingBeforeGuess.length <= 1;

  if (correct) {
    return {
      ...state, modalGuess: null,
      winner: turn, winReason: "correct_guess",
      score: { ...state.score, [turn]: state.score[turn] + 1 },
      screen: "win"
    };
  }
  if (wasLastOption) {
    const eliminated = { ...state.eliminated, [turn]: { ...state.eliminated[turn], [id]: true } };
    return {
      ...state, modalGuess: null, eliminated,
      winner: opponent, winReason: "opponent_exhausted",
      score: { ...state.score, [opponent]: state.score[opponent] + 1 },
      screen: "win"
    };
  }
  const nextElimTurn = { ...state.eliminated[turn], [id]: true };
  const locked = { ...state.locked, [turn]: { ...state.locked[turn], ...nextElimTurn } };
  const item = state.board.find((b) => b.id === id);
  return {
    ...state, modalGuess: null,
    eliminated: { ...state.eliminated, [turn]: nextElimTurn },
    locked,
    rounds: state.rounds + 1,
    turnNotice: { wrongGuess: true, guesser: turn, itemName: item ? item.name : "" },
    turn: opponent, mode: "eliminate",
    screen: "handoff"
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, names: { ...state.names, [action.player]: action.value } };

    case "SET_GAME_MODE":
      return { ...state, gameMode: action.value };

    case "SET_DIFFICULTY":
      return { ...state, difficulty: action.value };

    case "GO_CATEGORY":
      return { ...state, screen: "category" };

    case "SELECT_CATEGORY":
      return { ...state, categoryKey: action.key };

    case "DEAL": {
      if (state.gameMode === "solo") {
        const { board, soloSecretId, soloClues, soloMaxRounds } = buildSoloPuzzle(state.categoryKey, state.difficulty);
        return {
          ...state, board, soloSecretId, soloClues, soloMaxRounds,
          soloRound: 0, soloWrongGuesses: {}, soloModalGuess: null,
          winner: null, winReason: null,
          gamesPlayed: state.gamesPlayed + 1,
          screen: "dealing"
        };
      }
      const { board, secret, turn } = buildDeal(state.categoryKey, state.gamesPlayed);
      return {
        ...state, board, secret, turn,
        eliminated: { p1: {}, p2: {} },
        locked: { p1: {}, p2: {} },
        rounds: 0, winner: null, winReason: null, mode: "eliminate",
        modalGuess: null, turnNotice: null,
        gamesPlayed: state.gamesPlayed + 1,
        screen: "dealing"
      };
    }

    case "FINISH_DEALING": {
      if (state.screen !== "dealing") return state;
      return { ...state, screen: state.gameMode === "solo" ? "solo-play" : "play" };
    }

    case "SET_MODE": {
      if (action.mode === "guess" && hasFreshEliminations(state, state.turn)) return state;
      return { ...state, mode: action.mode };
    }

    case "TOGGLE_ELIMINATE": {
      const { turn } = state;
      const id = action.id;
      const isElim = !!state.eliminated[turn][id];
      const isLocked = !!state.locked[turn][id];
      if (isLocked) return state;
      if (!isElim) {
        const remainingBefore = state.board.filter((b) => !state.eliminated[turn][b.id]);
        if (remainingBefore.length <= 1) return { ...state, modalGuess: id };
      }
      const nextElim = { ...state.eliminated[turn] };
      if (isElim) delete nextElim[id]; else nextElim[id] = true;
      const eliminated = { ...state.eliminated, [turn]: nextElim };
      const remaining = state.board.filter((b) => !eliminated[turn][b.id]);
      const modalGuess = remaining.length === 1 ? remaining[0].id : null;
      return { ...state, eliminated, modalGuess };
    }

    case "OPEN_GUESS": {
      const isElim = !!state.eliminated[state.turn][action.id];
      if (isElim) return state;
      return { ...state, modalGuess: action.id };
    }

    case "CANCEL_GUESS":
      return { ...state, modalGuess: null };

    case "CONFIRM_GUESS": {
      const { turn } = state;
      const opponent = otherPlayer(turn);
      return resolveGuess(state, turn, opponent, state.modalGuess);
    }

    case "END_TURN": {
      const { turn } = state;
      const locked = { ...state.locked, [turn]: { ...state.locked[turn], ...state.eliminated[turn] } };
      return {
        ...state, locked, rounds: state.rounds + 1,
        turn: otherPlayer(turn), mode: "eliminate",
        screen: "handoff"
      };
    }

    case "ACK_HANDOFF":
      return { ...state, turnNotice: null, screen: "play" };

    case "SOLO_OPEN_GUESS": {
      if (state.soloWrongGuesses[action.id]) return state;
      return { ...state, soloModalGuess: action.id };
    }

    case "SOLO_CANCEL_GUESS":
      return { ...state, soloModalGuess: null };

    case "SOLO_CONFIRM_GUESS": {
      const id = state.soloModalGuess;
      if (id === state.soloSecretId) {
        return { ...state, soloModalGuess: null, winner: "player", winReason: "solo_win", screen: "win" };
      }
      const nextRound = state.soloRound + 1;
      const soloWrongGuesses = { ...state.soloWrongGuesses, [id]: true };
      if (nextRound >= state.soloMaxRounds) {
        return { ...state, soloModalGuess: null, soloWrongGuesses, soloRound: nextRound, winner: null, winReason: "solo_lose", screen: "win" };
      }
      return { ...state, soloModalGuess: null, soloWrongGuesses, soloRound: nextRound };
    }

    case "SOLO_REMATCH": {
      const { board, soloSecretId, soloClues, soloMaxRounds } = buildSoloPuzzle(state.categoryKey, state.difficulty);
      return {
        ...state, board, soloSecretId, soloClues, soloMaxRounds,
        soloRound: 0, soloWrongGuesses: {}, soloModalGuess: null,
        winner: null, winReason: null,
        gamesPlayed: state.gamesPlayed + 1,
        screen: "dealing"
      };
    }

    case "REMATCH_SAME_CATEGORY": {
      const { board, secret, turn } = buildDeal(state.categoryKey, state.gamesPlayed);
      return {
        ...state, board, secret, turn,
        eliminated: { p1: {}, p2: {} }, locked: { p1: {}, p2: {} },
        rounds: 0, winner: null, winReason: null, mode: "eliminate",
        modalGuess: null, turnNotice: null,
        gamesPlayed: state.gamesPlayed + 1, screen: "dealing"
      };
    }

    case "NEW_CATEGORY":
      return { ...state, categoryKey: null, screen: "category" };

    case "BACK_TO_START":
      return { ...state, screen: "intro", score: { p1: 0, p2: 0 }, gamesPlayed: 0 };

    default:
      return state;
  }
}

/* =========================================================================
   STYLE — Terminal Noir: near-black system, one amber signal, mono data
   readouts, condensed industrial display type.
   ========================================================================= */

function FontLoader() {
  useEffect(() => {
    if (document.getElementById("cd-terminal-fonts")) return;
    const link = document.createElement("link");
    link.id = "cd-terminal-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
}

function GlobalStyles() {
  return (
    <style>{`
      html, body {
        margin: 0;
        padding: 0;
        background: #0A0A0C;
      }
      #root {
        min-height: 100vh;
        background: #0A0A0C;
      }
      .cd-root {
        --void: #0A0A0C;
        --panel: #131317;
        --panel-2: #1B1B20;
        --line: #29292F;
        --line-strong: #3B3B42;
        --ink: #F3F2EE;
        --ink-dim: #99968F;
        --ink-faint: #5C5A55;
        --amber: #FFB020;
        --amber-ink: #1A1200;
        --red: #FF5449;
        --red-dim: #402019;
        --green: #34D399;
        --green-dim: #143327;
        --focus: #FFB020;

        --font-display: 'Big Shoulders Display', 'Arial Narrow', sans-serif;
        --font-body: 'Public Sans', system-ui, sans-serif;
        --font-mono: 'JetBrains Mono', 'SFMono-Regular', Menlo, monospace;

        box-sizing: border-box;
        background: var(--void);
        color: var(--ink);
        font-family: var(--font-body);
        min-height: 100vh;
        position: relative;
        -webkit-font-smoothing: antialiased;
      }
      .cd-root *, .cd-root *::before, .cd-root *::after { box-sizing: inherit; }
      .cd-root::before {
        content: "";
        position: fixed; inset: 0; pointer-events: none; z-index: 0;
        background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px);
        mix-blend-mode: overlay;
      }
      .cd-shell {
        position: relative; z-index: 1;
        max-width: 520px; margin: 0 auto;
        padding: 28px 20px 56px;
      }
      @media (min-width: 720px) {
        .cd-shell { max-width: 720px; padding: 44px 32px 64px; }
      }
      @media (min-width: 1120px) {
        .cd-shell { max-width: 1180px; padding: 56px 48px 80px; }
      }

      .cd-root h1, .cd-root h2, .cd-root h3 { margin: 0; font-family: var(--font-display); font-weight: 800; letter-spacing: -0.01em; }
      .cd-root p { margin: 0; }
      .cd-root button { font-family: inherit; }
      .cd-root :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

      /* ---------- toolbar ---------- */
      .cd-toolbar { display: flex; justify-content: flex-end; margin-bottom: 14px; }
      .cd-icon-btn {
        width: 40px; height: 40px; border-radius: 3px;
        border: 1px solid var(--line-strong); background: var(--panel); color: var(--ink-dim);
        display: flex; align-items: center; justify-content: center; cursor: pointer;
        transition: border-color 0.12s ease, color 0.12s ease;
      }
      .cd-icon-btn:hover { border-color: var(--amber); color: var(--amber); }

      /* ---------- kicker / eyebrow ---------- */
      .cd-kicker {
        display: inline-flex; align-items: center; gap: 8px;
        font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.16em;
        text-transform: uppercase; color: var(--amber);
      }
      .cd-kicker::after {
        content: "_"; animation: cd-blink 1.1s steps(1) infinite; color: var(--amber);
      }
      @keyframes cd-blink { 50% { opacity: 0; } }

      .cd-title {
        font-size: 44px; line-height: 0.98; margin-top: 10px;
        text-transform: uppercase;
      }
      @media (min-width: 720px) { .cd-title { font-size: 60px; } }
      .cd-subtitle { color: var(--ink-dim); font-size: 15px; margin-top: 14px; line-height: 1.6; max-width: 46ch; }

      /* ---------- layout: intro / category ---------- */
      .cd-intro-grid { margin-top: 32px; display: flex; flex-direction: column; gap: 16px; }
      @media (min-width: 1120px) {
        .cd-intro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
      }

      /* ---------- panels ---------- */
      .cd-panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 4px;
        padding: 22px;
      }
      .cd-panel-head {
        display: flex; align-items: center; gap: 10px;
        font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em;
        text-transform: uppercase; color: var(--ink-faint); margin-bottom: 16px;
      }
      .cd-panel-head svg { color: var(--amber); }

      .cd-field { margin-top: 16px; }
      .cd-field:first-child { margin-top: 0; }
      .cd-field label {
        display: block; font-family: var(--font-mono); font-size: 10.5px;
        text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-faint);
        margin-bottom: 8px;
      }
      .cd-field input {
        width: 100%; min-height: 50px;
        background: var(--void); border: 1px solid var(--line-strong); border-radius: 3px;
        padding: 12px 14px; color: var(--ink);
        font-family: var(--font-body); font-size: 16px; font-weight: 500;
        transition: border-color 0.12s ease;
      }
      .cd-field input:hover { border-color: var(--ink-faint); }
      .cd-field input:focus { outline: none; border-color: var(--amber); }

      /* ---------- how-to list ---------- */
      .cd-how-list { display: flex; flex-direction: column; gap: 16px; }
      .cd-how-item { display: flex; gap: 14px; align-items: flex-start; }
      .cd-how-item .cd-num {
        flex: none; width: 26px; height: 26px; border-radius: 2px;
        background: var(--panel-2); border: 1px solid var(--line-strong);
        color: var(--amber); display: flex; align-items: center; justify-content: center;
        font-family: var(--font-mono); font-size: 12px; font-weight: 700;
      }
      .cd-how-item p { color: var(--ink-dim); font-size: 14px; line-height: 1.55; }

      /* ---------- buttons ---------- */
      .cd-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 9px;
        width: 100%; min-height: 54px;
        padding: 14px 20px;
        border: 1px solid transparent; border-radius: 3px;
        font-family: var(--font-display); font-weight: 700; font-size: 16px;
        letter-spacing: 0.01em; text-transform: uppercase;
        cursor: pointer;
        transition: background 0.12s ease, border-color 0.12s ease, transform 0.05s ease, opacity 0.12s ease;
      }
      .cd-btn:active:not(:disabled) { transform: translateY(1px); }
      .cd-btn-primary { background: var(--amber); color: var(--amber-ink); }
      .cd-btn-primary:hover:not(:disabled) { background: #FFC24D; }
      .cd-btn-secondary { background: transparent; color: var(--ink); border-color: var(--line-strong); }
      .cd-btn-secondary:hover:not(:disabled) { border-color: var(--amber); color: var(--amber); }
      .cd-btn-ghost { background: transparent; color: var(--ink-dim); border-color: var(--line); }
      .cd-btn-ghost:hover:not(:disabled) { color: var(--ink); border-color: var(--line-strong); }
      .cd-btn-danger { background: var(--red); color: #fff; }
      .cd-btn-danger:hover:not(:disabled) { background: #FF6E63; }
      .cd-btn:disabled { opacity: 0.32; cursor: not-allowed; }

      .cd-stack { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }

      /* ---------- turn banner ---------- */
      .cd-turn-banner {
        display: flex; align-items: center; gap: 14px;
        background: var(--panel); border: 1px solid var(--line-strong); border-left: 3px solid var(--amber);
        border-radius: 3px; padding: 16px 18px;
      }
      .cd-turn-avatar {
        flex: none; width: 44px; height: 44px; border-radius: 2px;
        background: var(--amber); color: var(--amber-ink);
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-display); font-weight: 800; font-size: 18px;
      }
      .cd-turn-name { font-family: var(--font-display); font-weight: 700; font-size: 19px; text-transform: uppercase; }
      .cd-turn-hint { color: var(--ink-faint); font-size: 12.5px; margin-top: 4px; line-height: 1.4; font-family: var(--font-mono); }

      /* ---------- hold to peek ---------- */
      .cd-hold-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
      .cd-hold-btn {
        min-height: 56px; border: 1px dashed var(--line-strong); border-radius: 3px;
        background: var(--panel-2); color: var(--ink-faint);
        display: flex; align-items: center; justify-content: center; gap: 7px; text-align: center;
        font-family: var(--font-mono); font-size: 11px; padding: 8px; line-height: 1.3;
        user-select: none; touch-action: manipulation; transition: background 0.1s ease, color 0.1s ease;
      }
      .cd-hold-btn:hover { border-color: var(--ink-faint); color: var(--ink-dim); }
      .cd-hold-btn.is-revealing { background: var(--amber); border-color: var(--amber); color: var(--amber-ink); }
      .cd-hold-reveal { display: none; align-items: center; gap: 6px; font-family: var(--font-display); font-weight: 700; font-size: 14px; }
      .cd-hold-btn.is-revealing .cd-hold-reveal { display: inline-flex; }
      .cd-hold-btn.is-revealing .cd-hold-label { display: none; }

      /* ---------- mode toggle (also reused for mode/difficulty selectors) ---------- */
      .cd-mode-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
      .cd-mode-toggle:first-child { margin-top: 0; }
      .cd-mode-btn {
        min-height: 52px; border: 1px solid var(--line-strong); border-radius: 3px;
        background: var(--panel); color: var(--ink-dim);
        font-family: var(--font-display); font-weight: 700; font-size: 14px; text-transform: uppercase;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        cursor: pointer; transition: all 0.12s ease;
      }
      .cd-mode-btn:hover:not(:disabled):not(.is-active) { border-color: var(--ink-faint); color: var(--ink); }
      .cd-mode-btn.is-active.eliminate { background: var(--ink); color: var(--void); border-color: var(--ink); }
      .cd-mode-btn.is-active.guess { background: var(--red); color: #fff; border-color: var(--red); }
      .cd-mode-btn:disabled { opacity: 0.32; cursor: not-allowed; }

      /* ---------- board ---------- */
      .cd-play-layout { margin-top: 20px; display: flex; flex-direction: column; gap: 20px; }
      @media (min-width: 1120px) {
        .cd-play-layout { display: grid; grid-template-columns: 320px 1fr; gap: 32px; align-items: start; }
        .cd-play-sidebar { position: sticky; top: 32px; display: flex; flex-direction: column; gap: 14px; }
      }
      .cd-board {
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
      }
      @media (min-width: 640px) { .cd-board { grid-template-columns: repeat(3, 1fr); } }
      @media (min-width: 1120px) { .cd-board { grid-template-columns: repeat(4, 1fr); gap: 12px; } }

      .cd-card {
        position: relative;
        border: 1px solid var(--line-strong); border-radius: 3px;
        background: var(--panel);
        padding: 14px 12px 12px;
        min-height: 108px;
        text-align: left; cursor: pointer;
        display: flex; flex-direction: column; justify-content: space-between;
        transition: border-color 0.12s ease, background 0.12s ease, transform 0.06s ease;
      }
      .cd-card:hover:not(.is-locked):not(.is-eliminated) { border-color: var(--amber); }
      .cd-card:active:not(.is-locked) { transform: scale(0.98); }
      .cd-card-top { display: flex; align-items: center; justify-content: space-between; }
      .cd-card-top svg { color: var(--ink-faint); }
      .cd-card-tag {
        font-family: var(--font-mono); font-size: 9.5px; color: var(--ink-faint);
        border: 1px solid var(--line); border-radius: 2px; padding: 1px 5px;
      }
      .cd-card-name { font-family: var(--font-body); font-weight: 700; font-size: 13.5px; line-height: 1.25; margin-top: 12px; }

      .cd-card.is-selected { border-color: var(--amber); background: rgba(255,176,32,0.08); }
      .cd-card.is-selected .cd-card-top svg { color: var(--amber); }
      .cd-card.is-guess-mode { border-color: var(--red); }

      .cd-card.is-eliminated { background: var(--void); }
      .cd-card.is-eliminated .cd-card-top svg { color: var(--ink-faint); }
      .cd-card.is-eliminated .cd-card-name { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-faint); }
      .cd-card.is-eliminated.is-fresh { border-color: var(--red); }
      .cd-card.is-eliminated.is-fresh .cd-card-name { color: var(--red); }
      .cd-card.is-eliminated.is-locked { cursor: default; opacity: 0.5; }

      /* ---------- helper ---------- */
      .cd-helper { margin-top: 16px; border: 1px solid var(--line); border-radius: 3px; background: var(--panel); overflow: hidden; }
      .cd-helper summary {
        padding: 14px 16px; min-height: 50px; list-style: none; cursor: pointer;
        display: flex; align-items: center; gap: 9px;
        font-family: var(--font-mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-dim);
      }
      .cd-helper summary::-webkit-details-marker { display: none; }
      .cd-helper summary svg { color: var(--amber); }
      .cd-helper-body { padding: 0 16px 16px; color: var(--ink-dim); font-size: 13.5px; line-height: 1.7; }
      .cd-helper-body ul { margin: 4px 0 0; padding-left: 18px; }
      .cd-helper-body li { margin-bottom: 7px; }

      /* ---------- clue list (solo) ---------- */
      .cd-clue-list { display: flex; flex-direction: column; gap: 12px; }
      .cd-clue-item { display: flex; gap: 12px; align-items: flex-start; font-size: 14.5px; color: var(--ink); line-height: 1.5; }
      .cd-clue-item:not(:last-child) { color: var(--ink-dim); }
      .cd-clue-num {
        flex: none; width: 24px; height: 24px; border-radius: 2px;
        background: var(--panel-2); border: 1px solid var(--line-strong);
        color: var(--amber); display: flex; align-items: center; justify-content: center;
        font-family: var(--font-mono); font-size: 11px; font-weight: 700;
      }

      /* ---------- status / score ---------- */
      .cd-status-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
      .cd-chip {
        font-family: var(--font-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-dim); background: var(--panel-2); border: 1px solid var(--line); border-radius: 999px; padding: 5px 11px;
      }
      .cd-score {
        display: flex; align-items: center; justify-content: center; gap: 12px;
        background: var(--panel); border: 1px solid var(--line-strong); border-radius: 3px;
        padding: 12px 18px; margin-top: 16px;
      }
      .cd-score-name { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-faint); }
      .cd-score-num { font-family: var(--font-display); font-weight: 800; font-size: 22px; color: var(--amber); }
      .cd-score-sep { color: var(--ink-faint); }

      /* ---------- notices (error state) ---------- */
      .cd-notice {
        display: flex; align-items: flex-start; gap: 10px;
        background: var(--red-dim); border: 1px solid var(--red); color: var(--ink);
        border-radius: 3px; padding: 14px 16px; margin-bottom: 16px;
      }
      .cd-notice svg { color: var(--red); flex: none; margin-top: 1px; }
      .cd-notice-title { font-family: var(--font-display); font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.02em; }
      .cd-notice-body { font-size: 13px; color: var(--ink-dim); margin-top: 3px; line-height: 1.4; }

      /* ---------- modal ---------- */
      .cd-modal-backdrop {
        position: fixed; inset: 0; background: rgba(10,10,12,0.82);
        display: flex; align-items: flex-end; justify-content: center; z-index: 30;
        padding: 0 16px 24px; animation: cd-fade 0.14s ease-out;
      }
      @media (min-width: 720px) { .cd-modal-backdrop { align-items: center; } }
      @keyframes cd-fade { from { opacity: 0; } to { opacity: 1; } }
      .cd-modal {
        width: 100%; max-width: 440px; background: var(--panel);
        border: 1px solid var(--line-strong); border-top: 3px solid var(--amber);
        border-radius: 4px; padding: 24px;
        animation: cd-slide 0.16s ease-out;
      }
      @keyframes cd-slide { from { transform: translateY(16px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
      .cd-modal-title { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-faint); }
      .cd-modal-target {
        margin-top: 12px; display: flex; align-items: center; gap: 12px;
        background: var(--void); border: 1px solid var(--line-strong); border-radius: 3px; padding: 16px;
      }
      .cd-modal-target svg { color: var(--amber); }
      .cd-modal-target span { font-family: var(--font-display); font-weight: 800; font-size: 19px; text-transform: uppercase; }
      .cd-modal-sub { color: var(--ink-dim); font-size: 13px; margin-top: 12px; line-height: 1.5; }
      .cd-modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }

      /* ---------- win (success / default-win states) ---------- */
      .cd-win-banner {
        text-align: center; padding: 40px 24px; border-radius: 4px;
        border: 1px solid var(--line-strong); position: relative; overflow: hidden;
      }
      .cd-win-banner.is-success { background: var(--green-dim); border-color: var(--green); }
      .cd-win-banner.is-default { background: var(--panel); border-color: var(--amber); }
      .cd-win-icon-wrap {
        width: 64px; height: 64px; border-radius: 50%; margin: 0 auto;
        display: flex; align-items: center; justify-content: center;
        animation: cd-pop 0.4s cubic-bezier(.2,1.6,.4,1);
      }
      .is-success .cd-win-icon-wrap { background: rgba(52,211,153,0.15); color: var(--green); }
      .is-default .cd-win-icon-wrap { background: rgba(255,176,32,0.15); color: var(--amber); }
      @keyframes cd-pop { 0% { transform: scale(0); } 65% { transform: scale(1.15); } 100% { transform: scale(1); } }
      .cd-win-title { font-size: 30px; margin-top: 18px; text-transform: uppercase; }
      .cd-win-sub { color: var(--ink-dim); font-size: 14px; margin-top: 10px; line-height: 1.55; max-width: 40ch; margin-left: auto; margin-right: auto; }

      .cd-win-secret {
        margin-top: 14px; display: flex; align-items: center; gap: 12px;
        background: var(--panel); border: 1px solid var(--line-strong); border-radius: 3px;
        padding: 14px 16px; text-align: left;
      }
      .cd-win-secret svg { color: var(--ink-faint); flex: none; }
      .cd-win-secret-label { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-faint); }
      .cd-win-secret-name { font-family: var(--font-display); font-weight: 700; font-size: 16px; text-transform: uppercase; }

      /* ---------- loading state ---------- */
      .cd-loading { margin: 10vh auto; text-align: center; max-width: 360px; }
      .cd-spinner { color: var(--amber); animation: cd-spin 0.9s linear infinite; }
      @keyframes cd-spin { to { transform: rotate(360deg); } }
      .cd-loading-title { font-size: 22px; margin-top: 18px; text-transform: uppercase; }
      .cd-loading-line { font-family: var(--font-mono); font-size: 12.5px; color: var(--ink-faint); margin-top: 12px; line-height: 1.6; }

      /* ---------- empty state ---------- */
      .cd-empty {
        border: 1px dashed var(--line-strong); border-radius: 4px; background: var(--panel);
        padding: 22px; display: flex; align-items: center; gap: 14px;
      }
      .cd-empty svg { color: var(--ink-faint); flex: none; }
      .cd-empty.is-filled { border-style: solid; border-color: var(--amber); background: rgba(255,176,32,0.06); }
      .cd-empty.is-filled svg { color: var(--amber); }
      .cd-empty-title { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-faint); }
      .cd-empty.is-filled .cd-empty-title { color: var(--amber); }
      .cd-empty-body { font-size: 13.5px; color: var(--ink-dim); margin-top: 4px; line-height: 1.5; }

      /* ---------- stats ---------- */
      .cd-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px 12px; }
      @media (min-width: 520px) { .cd-stats-grid { grid-template-columns: repeat(4, 1fr); } }
      .cd-stat { text-align: center; }
      .cd-stat-num { font-family: var(--font-display); font-weight: 800; font-size: 22px; }
      .cd-stat-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint); margin-top: 4px; }

      .cd-footer { text-align: center; color: var(--ink-faint); font-family: var(--font-mono); font-size: 11px; margin-top: 32px; line-height: 1.6; }
    `}</style>
  );
}

/* =========================================================================
   SMALL PIECES
   ========================================================================= */

function ScoreChip({ state }) {
  return (
    <div className="cd-score">
      <span className="cd-score-name">{state.names.p1}</span>
      <span className="cd-score-num">{state.score.p1}</span>
      <span className="cd-score-sep">/</span>
      <span className="cd-score-num">{state.score.p2}</span>
      <span className="cd-score-name">{state.names.p2}</span>
    </div>
  );
}

function HoldButton({ label, item }) {
  const ref = useRef(null);
  const show = (e) => { e.preventDefault(); ref.current && ref.current.classList.add("is-revealing"); };
  const hide = () => { ref.current && ref.current.classList.remove("is-revealing"); };
  return (
    <div
      ref={ref}
      className="cd-hold-btn"
      onPointerDown={show}
      onPointerUp={hide}
      onPointerLeave={hide}
      onPointerCancel={hide}
    >
      <span className="cd-hold-label" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Eye size={14} strokeWidth={1.75} /> HOLD: {label}'S SECRET
      </span>
      <span className="cd-hold-reveal">
        {item ? item.name : ""}
      </span>
    </div>
  );
}

function StatsPanel({ stats, onReset }) {
  const hasGames = stats.gamesPlayed > 0;
  const topCategory = Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1])[0];
  const soloTotal = stats.soloWins + stats.soloLosses;

  return (
    <div className="cd-panel" style={{ marginTop: 16 }}>
      <div className="cd-panel-head"><History size={14} /> CASE LOG</div>
      {!hasGames ? (
        <div className="cd-empty">
          <History size={22} strokeWidth={1.75} />
          <div>
            <div className="cd-empty-title">NO CASES LOGGED YET</div>
            <div className="cd-empty-body">Finish a game and your record shows up here.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="cd-stats-grid">
            <div className="cd-stat">
              <div className="cd-stat-num">{stats.gamesPlayed}</div>
              <div className="cd-stat-label">GAMES LOGGED</div>
            </div>
            <div className="cd-stat">
              <div className="cd-stat-num">{soloTotal > 0 ? `${stats.soloWins}-${stats.soloLosses}` : "—"}</div>
              <div className="cd-stat-label">SOLO RECORD</div>
            </div>
            <div className="cd-stat">
              <div
                className="cd-stat-num"
                style={{ color: stats.soloStreak > 0 ? "var(--green)" : stats.soloStreak < 0 ? "var(--red)" : "var(--ink)" }}
              >
                {stats.soloStreak > 0 ? `+${stats.soloStreak}` : stats.soloStreak || "—"}
              </div>
              <div className="cd-stat-label">CURRENT STREAK</div>
            </div>
            <div className="cd-stat">
              <div className="cd-stat-num" style={{ fontSize: 14, lineHeight: 1.3 }}>{topCategory ? topCategory[0] : "—"}</div>
              <div className="cd-stat-label">TOP CASE FILE</div>
            </div>
          </div>
          <button
            className="cd-btn cd-btn-ghost"
            style={{ marginTop: 18 }}
            onClick={() => { Sound.click(); onReset(); }}
          >
            <Trash2 size={15} strokeWidth={1.75} /> Reset Stats
          </button>
        </>
      )}
    </div>
  );
}

/* =========================================================================
   SCREENS — shared (intro / category / dealing)
   ========================================================================= */

function IntroScreen({ state, dispatch, stats, onResetStats }) {
  const solo = state.gameMode === "solo";
  return (
    <div>
      <div className="cd-kicker"><Search size={14} strokeWidth={2} /> SESSION 01 // NEW CASE</div>
      <h1 className="cd-title">Category<br />Detectives</h1>
      <p className="cd-subtitle">
        A deduction terminal. Agree on a category, get dealt a secret item
        from it at random, and out-question your opponent to name theirs
        first — or crack a solo puzzle against the clock.
      </p>

      <div className="cd-intro-grid">
        <div className="cd-panel">
          <div className="cd-panel-head"><Users size={14} /> GAME MODE</div>
          <div className="cd-mode-toggle">
            <button
              className={"cd-mode-btn eliminate" + (!solo ? " is-active" : "")}
              aria-pressed={!solo}
              onClick={() => { Sound.click(); dispatch({ type: "SET_GAME_MODE", value: "duel" }); }}
            >
              <Users size={16} strokeWidth={2} /> Pass &amp; Play
            </button>
            <button
              className={"cd-mode-btn eliminate" + (solo ? " is-active" : "")}
              aria-pressed={solo}
              onClick={() => { Sound.click(); dispatch({ type: "SET_GAME_MODE", value: "solo" }); }}
            >
              <Puzzle size={16} strokeWidth={2} /> Puzzle Mode
            </button>
          </div>

          {solo && (
            <div className="cd-field">
              <label>Difficulty</label>
              <div className="cd-mode-toggle" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                {["easy", "medium", "hard"].map((d) => (
                  <button
                    key={d}
                    className={"cd-mode-btn eliminate" + (state.difficulty === d ? " is-active" : "")}
                    aria-pressed={state.difficulty === d}
                    onClick={() => { Sound.click(); dispatch({ type: "SET_DIFFICULTY", value: d }); }}
                  >
                    {DIFFICULTY_CONFIG[d].label}
                  </button>
                ))}
              </div>
              <p className="cd-subtitle" style={{ marginTop: 10, fontSize: 12.5 }}>
                {DIFFICULTY_CONFIG[state.difficulty].rounds} guesses, clues stay {state.difficulty === "hard" ? "vague the whole way" : state.difficulty === "easy" ? "generous and specific" : "moderate"}.
              </p>
            </div>
          )}

          <div className="cd-field">
            <label>{solo ? "Your Name" : "Player 1"}</label>
            <input
              type="text" maxLength={18} placeholder="Player 1"
              value={state.names.p1}
              onChange={(e) => dispatch({ type: "SET_NAME", player: "p1", value: e.target.value.trim() || "Player 1" })}
            />
          </div>
          {!solo && (
            <div className="cd-field">
              <label>Player 2</label>
              <input
                type="text" maxLength={18} placeholder="Player 2"
                value={state.names.p2}
                onChange={(e) => dispatch({ type: "SET_NAME", player: "p2", value: e.target.value.trim() || "Player 2" })}
              />
            </div>
          )}
        </div>

        <div className="cd-panel">
          <div className="cd-panel-head"><Lightbulb size={14} /> BRIEFING</div>
          <div className="cd-how-list">
            {(solo
              ? [
                  "Pick a category — we'll choose a secret item from it.",
                  "Each round reveals a new clue about the secret.",
                  "Guess an item from the board — wrong guesses are ruled out.",
                  "Solve it before your guesses for this difficulty run out."
                ]
              : [
                  "Together, agree on one shared category from the list.",
                  "Each player is randomly dealt one secret item — you don't choose it.",
                  "Both players see the same board of every item in the category.",
                  "Ask yes/no questions, eliminate wrong answers, then guess."
                ]
            ).map((t, i) => (
              <div className="cd-how-item" key={i}>
                <div className="cd-num">{i + 1}</div>
                <p>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StatsPanel stats={stats} onReset={onResetStats} />

      <div className="cd-stack">
        <button className="cd-btn cd-btn-primary" onClick={() => { Sound.click(); dispatch({ type: "GO_CATEGORY" }); }}>
          <LayoutGrid size={18} strokeWidth={2} /> Open Case File
        </button>
      </div>

      <div className="cd-footer">
        {solo
          ? "PLAY SOLO, ANYTIME — A FRESH PUZZLE EVERY ROUND."
          : "BEST PLAYED SEATED ACROSS FROM YOUR OPPONENT — PASS THE DEVICE WHEN PROMPTED."}
      </div>
    </div>
  );
}

function CategoryScreen({ state, dispatch }) {
  const selected = state.categoryKey;
  const solo = state.gameMode === "solo";
  return (
    <div>
      <div className="cd-kicker"><LayoutGrid size={14} strokeWidth={2} /> STEP 01</div>
      <h1 className="cd-title" style={{ fontSize: 36 }}>Select Category</h1>
      <p className="cd-subtitle">
        {solo ? "Pick any category — we'll choose your secret item for you." : "Decide together out loud — this part isn't secret."}
      </p>

      <div style={{ marginTop: 20 }}>
        {selected ? (
          <div className="cd-empty is-filled">
            <CheckCircle2 size={22} strokeWidth={1.75} />
            <div>
              <div className="cd-empty-title">CASE FILE LOADED</div>
              <div className="cd-empty-body">
                <strong style={{ color: "var(--ink)" }}>{selected}</strong> — {CATEGORY_SETS[selected].items.length} items on the board. Ready to deal.
              </div>
            </div>
          </div>
        ) : (
          <div className="cd-empty">
            <LayoutGrid size={22} strokeWidth={1.75} />
            <div>
              <div className="cd-empty-title">NO CASE FILE SELECTED</div>
              <div className="cd-empty-body">Tap a category below to load it, then deal the cards.</div>
            </div>
          </div>
        )}
      </div>

      <div className="cd-board" style={{ marginTop: 16 }}>
        {Object.keys(CATEGORY_SETS).map((key) => {
          const { Icon, items } = CATEGORY_SETS[key];
          const isSel = key === selected;
          return (
            <button
              key={key}
              className={"cd-card" + (isSel ? " is-selected" : "")}
              onClick={() => { Sound.select(); dispatch({ type: "SELECT_CATEGORY", key }); }}
            >
              <div className="cd-card-top">
                <Icon size={20} strokeWidth={1.75} />
                <span className="cd-card-tag">{String(items.length).padStart(2, "0")}</span>
              </div>
              <div className="cd-card-name">{key}</div>
            </button>
          );
        })}
      </div>

      <div className="cd-stack">
        <button
          className="cd-btn cd-btn-primary"
          disabled={!selected}
          onClick={() => { Sound.deal(); dispatch({ type: "DEAL" }); }}
        >
          <Layers size={18} strokeWidth={2} /> Deal Cards
        </button>
      </div>
    </div>
  );
}

function DealingScreen({ state }) {
  const line = DEAL_LINES[state.gamesPlayed % DEAL_LINES.length];
  return (
    <div className="cd-loading">
      <Loader2 size={44} strokeWidth={1.75} className="cd-spinner" />
      <div className="cd-loading-title">Assigning Cases</div>
      <div className="cd-loading-line">{line}<br />CATEGORY: {state.categoryKey}</div>
    </div>
  );
}

/* =========================================================================
   SCREENS — pass & play (duel)
   ========================================================================= */

function HandoffScreen({ state, dispatch, nameOf }) {
  const notice = state.turnNotice;
  return (
    <div className="cd-panel" style={{ marginTop: "12vh", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
      {notice && notice.wrongGuess && (
        <div className="cd-notice">
          <AlertTriangle size={18} strokeWidth={2} />
          <div>
            <div className="cd-notice-title">Incorrect Guess</div>
            <div className="cd-notice-body">{nameOf(notice.guesser)} guessed "{notice.itemName}" — not a match.</div>
          </div>
        </div>
      )}
      <div className="cd-kicker">HANDOFF REQUIRED</div>
      <h2 className="cd-title" style={{ fontSize: 30, marginTop: 8 }}>Pass to {nameOf(state.turn)}</h2>
      <p className="cd-subtitle">
        It's {nameOf(state.turn)}'s turn to question {nameOf(otherPlayer(state.turn))} and narrow the board.
      </p>
      <div className="cd-stack">
        <button className="cd-btn cd-btn-primary" onClick={() => { Sound.click(); dispatch({ type: "ACK_HANDOFF" }); }}>
          {nameOf(state.turn)}, I'm Ready <ArrowRight size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function PlayScreen({ state, dispatch, nameOf, boardItem }) {
  const turn = state.turn;
  const opponent = otherPlayer(turn);
  const total = state.board.length;
  const elimCount = Object.keys(state.eliminated[turn]).length;

  return (
    <div className="cd-play-layout">
      <div className="cd-play-sidebar">
        <div className="cd-turn-banner">
          <div className="cd-turn-avatar">{nameOf(turn).charAt(0).toUpperCase()}</div>
          <div>
            <div className="cd-turn-name">{nameOf(turn)}'s Turn</div>
            <div className="cd-turn-hint">CASE: {state.categoryKey} — QUESTION {nameOf(opponent).toUpperCase()}, THEN NARROW YOUR BOARD.</div>
          </div>
        </div>

        {state.gamesPlayed > 1 && <ScoreChip state={state} />}

        <div className="cd-hold-row">
          <HoldButton label={nameOf("p1")} item={boardItem(state.secret.p1)} />
          <HoldButton label={nameOf("p2")} item={boardItem(state.secret.p2)} />
        </div>

        <details className="cd-helper">
          <summary><Lightbulb size={14} /> NEED QUESTION IDEAS?</summary>
          <div className="cd-helper-body">
            <ul>
              <li>Does the name start with a letter after M?</li>
              <li>Is the name more than two words long?</li>
              <li>Is it one of the more well-known items in this category?</li>
              <li>Would you rank it in the top half of the list alphabetically?</li>
              <li>Is there a number, color, or place name in it?</li>
            </ul>
          </div>
        </details>

        <div className="cd-mode-toggle">
          <button
            className={"cd-mode-btn eliminate" + (state.mode === "eliminate" ? " is-active" : "")}
            aria-pressed={state.mode === "eliminate"}
            onClick={() => { Sound.click(); dispatch({ type: "SET_MODE", mode: "eliminate" }); }}
          >
            <Scissors size={16} strokeWidth={2} /> Eliminate
          </button>
          <button
            className={"cd-mode-btn guess" + (state.mode === "guess" ? " is-active" : "")}
            aria-pressed={state.mode === "guess"}
            disabled={hasFreshEliminations(state, turn)}
            onClick={() => { Sound.click(); dispatch({ type: "SET_MODE", mode: "guess" }); }}
          >
            <Target size={16} strokeWidth={2} /> Guess
          </button>
        </div>
        {hasFreshEliminations(state, turn) && (
          <p className="cd-subtitle" style={{ marginTop: 4, fontSize: 12.5 }}>
            Guessing is locked after an elimination — finish narrowing or end your turn.
          </p>
        )}

        <div className="cd-status-row">
          <span className="cd-chip">{elimCount} / {total} RULED OUT</span>
          <span className="cd-chip">ROUND {state.rounds + 1}</span>
        </div>

        <button
          className="cd-btn cd-btn-secondary"
          style={{ marginTop: 14 }}
          onClick={() => { Sound.click(); dispatch({ type: "END_TURN" }); }}
        >
          End {nameOf(turn)}'s Turn <ArrowRight size={16} strokeWidth={2} />
        </button>
      </div>

      <div>
        <div className="cd-board">
          {state.board.map((cat) => {
            const isElim = !!state.eliminated[turn][cat.id];
            const isLocked = !!state.locked[turn][cat.id];
            const cls = [
              "cd-card",
              isElim && "is-eliminated",
              isElim && !isLocked && "is-fresh",
              isLocked && "is-locked",
              state.mode === "guess" && "is-guess-mode"
            ].filter(Boolean).join(" ");
            return (
              <button
                key={cat.id}
                className={cls}
                onClick={() => {
                  if (state.mode === "eliminate") {
                    if (!isLocked) Sound[isElim ? "undo" : "eliminate"]();
                    dispatch({ type: "TOGGLE_ELIMINATE", id: cat.id });
                  } else {
                    if (!isElim) Sound.openGuess();
                    dispatch({ type: "OPEN_GUESS", id: cat.id });
                  }
                }}
              >
                <div className="cd-card-top">
                  {isElim ? (isLocked ? <Lock size={16} strokeWidth={1.75} /> : <EyeOff size={16} strokeWidth={1.75} />) : <span className="cd-card-tag">{String(cat.id + 1).padStart(2, "0")}</span>}
                </div>
                <div className="cd-card-name">{isElim ? (isLocked ? "Cleared" : "Cleared · undo") : cat.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {state.modalGuess !== null && (
        <GuessModal state={state} dispatch={dispatch} nameOf={nameOf} boardItem={boardItem} opponent={opponent} />
      )}
    </div>
  );
}

function GuessModal({ state, dispatch, nameOf, boardItem, opponent }) {
  const item = boardItem(state.modalGuess);
  return (
    <div className="cd-modal-backdrop">
      <div className="cd-modal">
        <div className="cd-modal-title">CONFIRM GUESS</div>
        <div className="cd-modal-target">
          <Target size={22} strokeWidth={1.75} />
          <span>{item ? item.name : ""}</span>
        </div>
        <p className="cd-modal-sub">Locking this in as {nameOf(opponent)}'s secret item. This ends your turn either way.</p>
        <div className="cd-modal-actions">
          <button className="cd-btn cd-btn-ghost" onClick={() => { Sound.click(); dispatch({ type: "CANCEL_GUESS" }); }}>
            <X size={16} strokeWidth={2} /> Keep Thinking
          </button>
          <button className="cd-btn cd-btn-danger" onClick={() => { Sound.click(); dispatch({ type: "CONFIRM_GUESS" }); }}>
            Lock It In
          </button>
        </div>
      </div>
    </div>
  );
}

function DuelWinScreen({ state, dispatch, nameOf, boardItem }) {
  const winner = state.winner;
  const loser = otherPlayer(winner);
  const isSuccess = state.winReason === "correct_guess";

  return (
    <div>
      <div className={"cd-win-banner" + (isSuccess ? " is-success" : " is-default")}>
        <div className="cd-win-icon-wrap">
          {isSuccess ? <CheckCircle2 size={30} strokeWidth={1.75} /> : <Award size={30} strokeWidth={1.75} />}
        </div>
        <h1 className="cd-win-title">{nameOf(winner)} {isSuccess ? "Cracked It" : "Wins by Default"}</h1>
        <p className="cd-win-sub">
          {isSuccess
            ? `Correctly identified ${nameOf(loser)}'s secret item from ${state.categoryKey} after ${state.rounds + 1} round${state.rounds === 0 ? "" : "s"} of questioning.`
            : `${nameOf(loser)} ruled out every other item and guessed wrong on the last one, so ${nameOf(winner)} takes the case.`}
        </p>
      </div>

      <ScoreChip state={state} />

      {[winner, loser].map((p) => {
        const item = boardItem(state.secret[p]);
        return (
          <div className="cd-win-secret" key={p}>
            <Lock size={18} strokeWidth={1.75} />
            <div>
              <div className="cd-win-secret-label">{nameOf(p)}'S SECRET WAS</div>
              <div className="cd-win-secret-name">{item ? item.name : ""}</div>
            </div>
          </div>
        );
      })}

      <div className="cd-stack">
        <button className="cd-btn cd-btn-primary" onClick={() => { Sound.click(); dispatch({ type: "REMATCH_SAME_CATEGORY" }); }}>
          <RefreshCw size={18} strokeWidth={2} /> Rematch — Same Category
        </button>
        <button className="cd-btn cd-btn-secondary" onClick={() => { Sound.click(); dispatch({ type: "NEW_CATEGORY" }); }}>
          New Category, Same Players <ArrowRight size={18} strokeWidth={2} />
        </button>
        <button className="cd-btn cd-btn-ghost" onClick={() => { Sound.click(); dispatch({ type: "BACK_TO_START" }); }}>
          Back to Start
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   SCREENS — solo puzzle
   ========================================================================= */

function SoloPlayScreen({ state, dispatch, boardItem }) {
  const cluesShown = state.soloClues.slice(0, state.soloRound + 1);
  const roundsLeft = state.soloMaxRounds - state.soloRound;

  return (
    <div>
      <div className="cd-kicker"><Puzzle size={14} strokeWidth={2} /> CASE: {state.categoryKey}</div>
      <h1 className="cd-title" style={{ fontSize: 36 }}>Crack The Case</h1>

      <div className="cd-panel" style={{ marginTop: 20 }}>
        <div className="cd-panel-head"><Lightbulb size={14} /> CLUES REVEALED</div>
        <div className="cd-clue-list">
          {cluesShown.map((c, i) => (
            <div className="cd-clue-item" key={i}>
              <span className="cd-clue-num">{i + 1}</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cd-status-row">
        <span className="cd-chip">{roundsLeft} GUESS{roundsLeft === 1 ? "" : "ES"} LEFT</span>
        <span className="cd-chip">{DIFFICULTY_CONFIG[state.difficulty].label.toUpperCase()} DIFFICULTY</span>
      </div>

      <div className="cd-board" style={{ marginTop: 16 }}>
        {state.board.map((item) => {
          const isWrong = !!state.soloWrongGuesses[item.id];
          return (
            <button
              key={item.id}
              className={"cd-card" + (isWrong ? " is-eliminated is-locked" : "")}
              disabled={isWrong}
              onClick={() => {
                if (isWrong) return;
                Sound.openGuess();
                dispatch({ type: "SOLO_OPEN_GUESS", id: item.id });
              }}
            >
              <div className="cd-card-top">
                {isWrong ? <X size={16} strokeWidth={1.75} /> : <span className="cd-card-tag">{String(item.id + 1).padStart(2, "0")}</span>}
              </div>
              <div className="cd-card-name">{isWrong ? "Wrong Guess" : item.name}</div>
            </button>
          );
        })}
      </div>

      {state.soloModalGuess !== null && (
        <SoloGuessModal state={state} dispatch={dispatch} boardItem={boardItem} />
      )}
    </div>
  );
}

function SoloGuessModal({ state, dispatch, boardItem }) {
  const item = boardItem(state.soloModalGuess);
  return (
    <div className="cd-modal-backdrop">
      <div className="cd-modal">
        <div className="cd-modal-title">LOCK IN YOUR GUESS</div>
        <div className="cd-modal-target">
          <Target size={22} strokeWidth={1.75} />
          <span>{item ? item.name : ""}</span>
        </div>
        <p className="cd-modal-sub">If this isn't the answer, it's ruled out and the next clue reveals.</p>
        <div className="cd-modal-actions">
          <button className="cd-btn cd-btn-ghost" onClick={() => { Sound.click(); dispatch({ type: "SOLO_CANCEL_GUESS" }); }}>
            <X size={16} strokeWidth={2} /> Keep Thinking
          </button>
          <button className="cd-btn cd-btn-danger" onClick={() => { Sound.click(); dispatch({ type: "SOLO_CONFIRM_GUESS" }); }}>
            Lock It In
          </button>
        </div>
      </div>
    </div>
  );
}

function SoloWinScreen({ state, dispatch, boardItem, stats }) {
  const isWin = state.winReason === "solo_win";
  const secretItem = boardItem(state.soloSecretId);
  const guessesUsed = state.soloRound + (isWin ? 1 : 0);

  return (
    <div>
      <div className={"cd-win-banner" + (isWin ? " is-success" : " is-default")}>
        <div className="cd-win-icon-wrap">
          {isWin ? <CheckCircle2 size={30} strokeWidth={1.75} /> : <Award size={30} strokeWidth={1.75} />}
        </div>
        <h1 className="cd-win-title">{isWin ? "Case Solved" : "Case Closed"}</h1>
        <p className="cd-win-sub">
          {isWin
            ? `Solved it in ${guessesUsed} of ${state.soloMaxRounds} guess${state.soloMaxRounds === 1 ? "" : "es"} on ${DIFFICULTY_CONFIG[state.difficulty].label} difficulty.`
            : `Out of guesses on ${DIFFICULTY_CONFIG[state.difficulty].label} difficulty. Better luck on the next case.`}
        </p>
      </div>

      <div className="cd-win-secret">
        <Lock size={18} strokeWidth={1.75} />
        <div>
          <div className="cd-win-secret-label">THE ANSWER WAS</div>
          <div className="cd-win-secret-name">{secretItem ? secretItem.name : ""}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <span className="cd-chip">SOLO RECORD: {stats.soloWins}-{stats.soloLosses}</span>
      </div>

      <div className="cd-stack">
        <button className="cd-btn cd-btn-primary" onClick={() => { Sound.click(); dispatch({ type: "SOLO_REMATCH" }); }}>
          <RefreshCw size={18} strokeWidth={2} /> New Puzzle — Same Category
        </button>
        <button className="cd-btn cd-btn-secondary" onClick={() => { Sound.click(); dispatch({ type: "NEW_CATEGORY" }); }}>
          New Category <ArrowRight size={18} strokeWidth={2} />
        </button>
        <button className="cd-btn cd-btn-ghost" onClick={() => { Sound.click(); dispatch({ type: "BACK_TO_START" }); }}>
          Back to Start
        </button>
      </div>
    </div>
  );
}

function WinScreen(props) {
  if (props.state.gameMode === "solo") return <SoloWinScreen {...props} />;
  return <DuelWinScreen {...props} />;
}

/* =========================================================================
   ROOT
   ========================================================================= */

export default function CategoryDetectives() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(loadStats);
  const [soundOn, setSoundOn] = useState(loadSoundPref);
  const countedGameRef = useRef(null);
  const prevScreenRef = useRef(state.screen);
  const prevNoticeRef = useRef(null);
  const prevSoloRoundRef = useRef(0);

  useEffect(() => {
    Sound.enabled = soundOn;
    try { localStorage.setItem(SOUND_KEY, soundOn ? "1" : "0"); } catch { /* ignore */ }
  }, [soundOn]);

  useEffect(() => {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch { /* ignore */ }
  }, [stats]);

  // dealing → play/solo-play transition
  useEffect(() => {
    if (state.screen === "dealing") {
      const t = setTimeout(() => dispatch({ type: "FINISH_DEALING" }), 1400);
      return () => clearTimeout(t);
    }
  }, [state.screen, state.gamesPlayed]);

  // reset the per-game "counted" guard whenever we're back at the start screen
  useEffect(() => {
    if (state.screen === "intro") countedGameRef.current = null;
  }, [state.screen]);

  // outcome sounds + stats logging
  useEffect(() => {
    const prevScreen = prevScreenRef.current;

    if (state.screen === "win" && prevScreen !== "win") {
      if (state.gameMode === "solo") {
        Sound[state.winReason === "solo_win" ? "correct" : "lose"]();
      } else {
        Sound[state.winReason === "correct_guess" ? "correct" : "wrong"]();
      }

      if (countedGameRef.current !== state.gamesPlayed) {
        countedGameRef.current = state.gamesPlayed;
        setStats((prev) => {
          const cat = state.categoryKey;
          const next = {
            ...prev,
            gamesPlayed: prev.gamesPlayed + 1,
            categoryCounts: { ...prev.categoryCounts, [cat]: (prev.categoryCounts[cat] || 0) + 1 }
          };
          if (state.gameMode === "solo") {
            const playerWon = state.winReason === "solo_win";
            const streak = playerWon
              ? (prev.soloStreak >= 0 ? prev.soloStreak + 1 : 1)
              : (prev.soloStreak <= 0 ? prev.soloStreak - 1 : -1);
            next.soloWins = prev.soloWins + (playerWon ? 1 : 0);
            next.soloLosses = prev.soloLosses + (playerWon ? 0 : 1);
            next.soloStreak = streak;
            next.soloBestStreak = Math.max(prev.soloBestStreak, streak > 0 ? streak : 0);
          }
          return next;
        });
      }
    }

    prevScreenRef.current = state.screen;
  }, [state.screen, state.winReason, state.gameMode, state.categoryKey, state.gamesPlayed]);

  // wrong-guess buzz for duel handoff notices
  useEffect(() => {
    if (state.turnNotice && state.turnNotice !== prevNoticeRef.current) {
      Sound.wrong();
    }
    prevNoticeRef.current = state.turnNotice;
  }, [state.turnNotice]);

  // wrong-guess buzz for solo mode (only when the game continues, not on the losing guess)
  useEffect(() => {
    if (state.soloRound > prevSoloRoundRef.current && state.screen === "solo-play") {
      Sound.wrong();
    }
    prevSoloRoundRef.current = state.soloRound;
  }, [state.soloRound, state.screen]);

  const nameOf = (p) => state.names[p];
  const boardItem = (id) => state.board.find((b) => b.id === id);
  const resetStats = () => setStats({ ...DEFAULT_STATS, categoryCounts: {} });

  return (
    <>
      <FontLoader />
      <GlobalStyles />
      <div className="cd-root">
        <div className="cd-shell">
          <div className="cd-toolbar">
            <button
              className="cd-icon-btn"
              aria-label={soundOn ? "Mute sound" : "Unmute sound"}
              onClick={() => setSoundOn((v) => !v)}
            >
              {soundOn ? <Volume2 size={17} strokeWidth={1.75} /> : <VolumeX size={17} strokeWidth={1.75} />}
            </button>
          </div>
          {state.screen === "intro" && <IntroScreen state={state} dispatch={dispatch} stats={stats} onResetStats={resetStats} />}
          {state.screen === "category" && <CategoryScreen state={state} dispatch={dispatch} />}
          {state.screen === "dealing" && <DealingScreen state={state} />}
          {state.screen === "handoff" && <HandoffScreen state={state} dispatch={dispatch} nameOf={nameOf} />}
          {state.screen === "play" && <PlayScreen state={state} dispatch={dispatch} nameOf={nameOf} boardItem={boardItem} />}
          {state.screen === "solo-play" && <SoloPlayScreen state={state} dispatch={dispatch} boardItem={boardItem} />}
          {state.screen === "win" && <WinScreen state={state} dispatch={dispatch} nameOf={nameOf} boardItem={boardItem} stats={stats} />}
        </div>
      </div>
    </>
  );
}
