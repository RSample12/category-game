import {
  PawPrint, Orbit, Dice5, UtensilsCrossed, Trophy, Star, Zap, Drama, CircleDot, Car
} from "lucide-react";

/* =========================================================================
   GAME DATA — categories, their items, board icons, and the curated real-
   world facts used as solo-puzzle clues. This is the file to edit to add
   a new category or expand an existing one; no game-logic changes needed.

   To add a category:
     1. Add an entry to CATEGORY_SETS with an Icon (any lucide-react icon)
        and an `items` array of unique names.
     2. Add a matching entry to ITEM_FACTS keyed by the same category name,
        with exactly one array per item containing 2-3 short facts ordered
        from vague/broad to specific/identifying (the solo puzzle reveals
        them in that order, one per wrong guess).
     3. Every item name in CATEGORY_SETS must have a matching key in
        ITEM_FACTS under the same category, or that item falls back to
        name-based clues for every round in solo mode instead.
   ========================================================================= */

export const CATEGORY_SETS = {
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

export const ITEM_FACTS = {
  "Dog Breeds": {
    "Labrador Retriever": ["Classified in the Sporting group of dog breeds.", "Bred to retrieve fishing nets and waterfowl for hunters.", "Originally developed in Newfoundland, Canada, not Labrador."],
    "Poodle": ["Classified in the Non-Sporting group of dog breeds.", "Known for a curly, low-shedding coat often kept in elaborate trims.", "Believed to have originated in Germany as a water retriever, despite its French association."],
    "Bulldog": ["Classified in the Non-Sporting group of dog breeds.", "Known for a wrinkled face, stocky build, and pushed-in nose.", "Originally bred in England for the blood sport of bull-baiting."],
    "Chihuahua": ["Classified in the Toy group of dog breeds.", "One of the smallest dog breeds in the world.", "Named after a state in Mexico."],
    "Beagle": ["Classified in the Hound group of dog breeds.", "Has one of the most powerful senses of smell of any dog breed.", "Traditionally worked and hunted in packs rather than alone."],
    "Dachshund": ["Classified in the Hound group of dog breeds.", "Bred with a long body and short legs to hunt burrowing animals underground.", "The name is German for 'badger dog.'"],
    "Boxer": ["Classified in the Working group of dog breeds.", "Known for a playful, high-energy temperament well into adulthood.", "Developed in Germany, descending from older bull-baiting breeds."],
    "Siberian Husky": ["Classified in the Working group of dog breeds.", "Known for a thick double coat built for extreme cold.", "Bred by the Chukchi people of northeastern Siberia to pull sleds."],
    "Rottweiler": ["Classified in the Working group of dog breeds.", "Known for its strength, confidence, and protective instincts.", "Descended from Roman drover dogs used to herd cattle on long marches."],
    "German Shepherd": ["Classified in the Herding group of dog breeds.", "Known for high intelligence and trainability.", "Developed in Germany in the late 1800s, originally for herding sheep."],
    "Corgi": ["Classified in the Herding group of dog breeds.", "Known for very short legs relative to its long body.", "Long associated with the British royal family."],
    "Great Dane": ["Classified in the Working group of dog breeds.", "One of the tallest dog breeds in the world.", "Originally bred to hunt wild boar."],
    "Shih Tzu": ["Classified in the Toy group of dog breeds.", "Known for a long, flowing double coat.", "Bred in China as a companion for royalty."],
    "Border Collie": ["Classified in the Herding group of dog breeds.", "Widely regarded as the most intelligent dog breed.", "Known for an intense, focused 'herding eye' stare."],
    "Doberman": ["Classified in the Working group of dog breeds.", "Known for a sleek, muscular build and alert stance.", "Developed in Germany in the 1890s by a tax collector who wanted a protective companion."],
    "Golden Retriever": ["Classified in the Sporting group of dog breeds.", "Known for its friendly, patient temperament, especially with children.", "Developed in Scotland in the 1800s for retrieving waterfowl during hunts."],
    "Pug": ["Classified in the Toy group of dog breeds.", "Known for a distinctively flat, wrinkled face.", "Originated in China, where it was favored by emperors."],
    "Dalmatian": ["Classified in the Non-Sporting group of dog breeds.", "Known for a white coat covered in distinctive spots.", "Historically used as a carriage dog, running alongside horse-drawn coaches."],
    "Basset Hound": ["Classified in the Hound group of dog breeds.", "Known for very long ears and short legs.", "Bred in France for scent-hunting small game at a walking pace."],
    "Australian Shepherd": ["Classified in the Herding group of dog breeds.", "Often has a distinctive mottled coat pattern.", "Despite the name, the breed was actually developed in the United States."]
  },
  "Planets & Moons": {
    "Mercury": ["Classified as a planet.", "Experiences some of the most extreme temperature swings in the solar system.", "The closest planet to the Sun."],
    "Venus": ["Classified as a planet.", "Rotates in the opposite direction from most other planets.", "The hottest planet in the solar system due to a runaway greenhouse effect."],
    "Earth": ["Classified as a planet.", "Has exactly one natural satellite.", "The only planet known to support life."],
    "Mars": ["Classified as a planet.", "Has two small moons.", "Known as the Red Planet due to iron oxide on its surface."],
    "Jupiter": ["Classified as a planet.", "Has dozens of known moons, more than any planet except one.", "The largest planet in the solar system."],
    "Saturn": ["Classified as a planet.", "Like Jupiter, it's a gas giant.", "Famous for its extensive, prominent ring system."],
    "Uranus": ["Classified as a planet.", "Classified as an ice giant rather than a gas giant.", "Rotates almost completely on its side compared to other planets."],
    "Neptune": ["Classified as a planet.", "Known for its deep blue color.", "Home to the strongest sustained winds recorded in the solar system."],
    "Pluto": ["Classified as a dwarf planet.", "Located in a region called the Kuiper Belt.", "Reclassified from a full planet in 2006."],
    "The Moon": ["Classified as a moon.", "Has essentially no atmosphere.", "Earth's only natural satellite."],
    "Titan": ["Classified as a moon.", "The only moon in the solar system known to have a thick atmosphere.", "The largest moon of Saturn."],
    "Europa": ["Classified as a moon.", "Has an icy surface believed to cover a hidden liquid ocean.", "One of Jupiter's four largest moons."],
    "Ganymede": ["Classified as a moon.", "Actually bigger in size than the planet Mercury.", "The largest moon in the entire solar system."],
    "Io": ["Classified as a moon.", "The most volcanically active body in the entire solar system.", "A moon of Jupiter."],
    "Callisto": ["Classified as a moon.", "Known for one of the oldest, most heavily cratered surfaces in the solar system.", "One of the four large moons discovered by Galileo."],
    "Triton": ["Classified as a moon.", "Thought to be a captured object rather than having formed alongside its planet.", "The largest moon of Neptune."],
    "Phobos": ["Classified as a moon.", "Slowly spiraling inward toward its planet.", "The larger and closer of Mars's two moons."],
    "Deimos": ["Classified as a moon.", "Named after the Greek personification of dread.", "The smaller and more distant of Mars's two moons."],
    "Enceladus": ["Classified as a moon.", "Known for geysers of water vapor erupting from its icy surface.", "A moon of Saturn."],
    "Charon": ["Classified as a moon.", "Named after the ferryman of the dead in Greek mythology.", "The largest moon of Pluto."]
  },
  "Board Games": {
    "Monopoly": ["Classified as an economic trading game.", "The goal is to bankrupt all your opponents.", "Based on an earlier game called The Landlord's Game."],
    "Clue": ["Classified as a deduction/mystery game.", "Players must determine the culprit, the weapon, and the room.", "Known as Cluedo outside of North America."],
    "Risk": ["Classified as a strategy game.", "Involves dice rolls to resolve battles between armies.", "Players aim for world domination across a global map."],
    "Scrabble": ["Classified as a word game.", "Different letters are worth different point values.", "Certain board squares multiply the value of words or letters."],
    "Chess": ["Classified as an abstract strategy game.", "Each player commands 16 pieces of six different types.", "The goal is to checkmate the opponent's king."],
    "Checkers": ["Classified as an abstract strategy game.", "Players capture opponent pieces by jumping over them.", "Pieces that reach the far side of the board are 'kinged.'"],
    "Battleship": ["Classified as a naval guessing game.", "Each player hides a fleet of ships on a grid the opponent can't see.", "Players call out coordinates to try to land a hit on a hidden ship."],
    "Sorry!": ["Classified as a race/path game.", "Players race colored pawns around a track toward home.", "Based on an ancient cross-and-circle game called Pachisi."],
    "Candy Land": ["Classified as a race/path game.", "Players move along a path by drawing color-matching cards.", "Designed to be playable by young children who can't yet read."],
    "Trouble": ["Classified as a race/path game.", "Players race pegs around the board and try to send opponents back to start.", "Features a plastic bubble in the center of the board that pops a die when pressed."],
    "Connect Four": ["Classified as an abstract strategy game.", "The goal is to connect four of your own discs in a row.", "Players drop colored discs into a vertical grid."],
    "Jenga": ["Classified as a physical skill game.", "Players take turns removing a block and placing it on top.", "The game ends when a stacked tower of wooden blocks collapses."],
    "Pictionary": ["Classified as a drawing-based party game.", "Talking or writing letters or numbers while drawing isn't allowed.", "One player draws clues while teammates try to guess the word."],
    "Yahtzee": ["Classified as a dice-based party game.", "Players aim to form specific scoring combinations, similar to poker hands.", "Played with five dice, rolled up to three times per turn."],
    "The Game of Life": ["Classified as a race/path game.", "Players make choices about careers, family, and finances along a spinning-wheel-driven path.", "Simulates a person's journey through major life milestones."],
    "Operation": ["Classified as a physical skill game.", "Touching the metal edge of an opening triggers a buzzer and lights up the patient's nose.", "Players use tweezers to remove small plastic pieces from a patient's body."],
    "Stratego": ["Classified as a strategy game.", "Higher-ranked pieces generally defeat lower-ranked ones in combat.", "Each side's piece ranks are hidden from the opponent, and the goal is to capture their flag."],
    "Mouse Trap": ["Classified as a physical skill game.", "The completed contraption is eventually used to try to catch an opponent's mouse piece.", "Players gradually assemble pieces of an elaborate chain-reaction machine."],
    "Chutes and Ladders": ["Classified as a race/path game.", "Landing on certain squares sends your piece up a ladder or down a chute.", "Based on an ancient Indian game about morality."],
    "Backgammon": ["Classified as a strategy game.", "Combines dice rolls with strategic decision-making.", "One of the oldest known board games, with roots going back thousands of years."]
  },
  "Ice Cream Flavors": {
    "Vanilla": ["Falls into the classic family of ice cream flavors.", "Often used as a base flavor that pairs with almost any topping.", "Consistently the best-selling ice cream flavor worldwide."],
    "Chocolate": ["Falls into the classic family of ice cream flavors.", "Comes in many variations based on how dark or milky the chocolate is.", "Usually ranks as the second most popular ice cream flavor after vanilla."],
    "Strawberry": ["Falls into the fruit-based family of ice cream flavors.", "Known for its naturally pink or reddish color.", "One of the classic 'Neapolitan' trio flavors alongside chocolate and vanilla."],
    "Mint Chocolate Chip": ["Falls into the classic family of ice cream flavors.", "A popular flavor choice for after-dinner or refreshing treats.", "Naturally a pale off-white color, though often dyed green for visual appeal."],
    "Cookies and Cream": ["Falls into the candy-and-cookie-inspired family of ice cream flavors.", "Became widely popular in the United States starting in the 1980s.", "A vanilla base mixed with crushed chocolate sandwich cookies."],
    "Rocky Road": ["Falls into the nut-and-candy mix-in family of ice cream flavors.", "One of the earliest widely popular 'mix-in' style ice cream flavors.", "Reportedly named partly in reference to hard economic times when it was created."],
    "Pistachio": ["Falls into the nut-based family of ice cream flavors.", "Popular in Italian-style gelato as well as American ice cream.", "Naturally has a pale green color, though it's sometimes enhanced with food coloring."],
    "Butter Pecan": ["Falls into the nut-based family of ice cream flavors.", "A flavor strongly associated with Southern United States cuisine.", "The pecans are typically toasted in butter before being added."],
    "Neapolitan": ["Falls into the classic family of ice cream flavors.", "Named after the Italian city of Naples, though it was popularized in the US.", "Actually three separate flavors served together in one block."],
    "Cookie Dough": ["Falls into the candy-and-cookie-inspired family of ice cream flavors.", "One of the most popular flavors introduced in the late 20th century.", "The dough used is specially made to be safe to eat without baking."],
    "Coffee": ["Falls into the classic family of ice cream flavors.", "Tends to be a favorite among adult ice cream eaters over children.", "Popular as a base for a dessert where hot espresso is poured over it."],
    "Salted Caramel": ["Falls into the candy-and-cookie-inspired family of ice cream flavors.", "Became especially trendy in dessert menus starting in the 2010s.", "The salt is added specifically to offset and enhance the sweetness."],
    "Mango": ["Falls into the fruit-based family of ice cream flavors.", "Especially popular in South Asian and tropical cuisines.", "Often made as a dairy-free sorbet as well as a creamy ice cream."],
    "Black Cherry": ["Falls into the fruit-based family of ice cream flavors.", "Usually has a deep red or purple color.", "A common flavor pairing alongside vanilla or chocolate swirls."],
    "Bubblegum": ["Falls into the candy-and-cookie-inspired family of ice cream flavors.", "Popular primarily with children rather than adults.", "Usually brightly colored, often blue or pink."],
    "Peanut Butter Cup": ["Falls into the nut-and-candy mix-in family of ice cream flavors.", "Popular as both a standalone flavor and a swirl combination.", "Combines two classic dessert flavors: peanut butter and chocolate."],
    "Birthday Cake": ["Falls into the dessert-inspired family of ice cream flavors.", "Designed to evoke the flavor of a classic birthday celebration.", "Almost always includes colorful sprinkles mixed throughout."],
    "Coconut": ["Falls into the fruit-based family of ice cream flavors.", "Frequently used as a dairy-free base for vegan ice cream.", "Often paired with other tropical flavors like pineapple or lime."],
    "Maple Walnut": ["Falls into the nut-based family of ice cream flavors.", "One of the more common flavors specifically featuring maple as the star ingredient.", "Strongly associated with New England and Canadian cuisine."],
    "Tiramisu": ["Falls into the dessert-inspired family of ice cream flavors.", "Sometimes includes a hint of cocoa or ladyfinger-cookie flavoring.", "Typically includes notes of coffee and mascarpone cheese."]
  },
  "Olympic Sports": {
    "Swimming": ["Classified as an aquatic sport at the Olympics.", "Has been part of the Olympics since the very first modern Games in 1896.", "Includes strokes such as freestyle, backstroke, breaststroke, and butterfly."],
    "Gymnastics": ["Classified as a judged (not timed) sport at the Olympics.", "Includes multiple apparatus such as balance beam, rings, and vault.", "Athletes are typically among the youngest competitors at the Olympics."],
    "Track and Field": ["Classified as an athletics sport at the Olympics.", "Includes the 100-meter dash, often considered the highlight event of the Summer Games.", "Actually an umbrella term covering many separate running, jumping, and throwing events."],
    "Basketball": ["Classified as a team sport at the Olympics.", "Became an Olympic sport in the 1930s.", "Played on a court with a hoop at each end."],
    "Soccer": ["Classified as a team sport at the Olympics.", "Known as football in most countries outside North America.", "Widely considered the most popular team sport in the world."],
    "Volleyball": ["Classified as a team sport at the Olympics.", "Has both an indoor and a beach version at the Olympics.", "Teams hit a ball back and forth over a net without letting it touch the ground."],
    "Boxing": ["Classified as a combat sport at the Olympics.", "One of the oldest combat sports in the Olympic program.", "Matches can be won by knockout or by judges' decision."],
    "Wrestling": ["Classified as a combat sport at the Olympics.", "One of the events included in the ancient Olympic Games.", "A combat sport based on grappling rather than striking."],
    "Fencing": ["Classified as a combat sport at the Olympics.", "Has three different weapon disciplines, each with its own rules.", "Competitors wear protective gear, including a mask covering the face."],
    "Archery": ["Classified as a precision/target sport at the Olympics.", "Scoring is based on which ring of the target the arrow lands in.", "Competitors shoot arrows at a stationary target from a set distance."],
    "Rowing": ["Classified as an aquatic sport at the Olympics.", "Has been part of the Olympics since 1900.", "Athletes propel a narrow boat using oars, typically racing in a straight line."],
    "Cycling": ["Classified as a racing sport at the Olympics.", "Track events take place on a banked oval course.", "Includes several different disciplines: road, track, and off-road mountain biking."],
    "Diving": ["Classified as a judged (not timed) sport at the Olympics.", "Judged on factors like execution, difficulty, and entry into the water.", "Athletes perform acrobatic jumps into water from a platform or springboard."],
    "Weightlifting": ["Classified as a strength sport at the Olympics.", "Athletes compete in weight classes based on body mass.", "Competitors attempt to lift the heaviest possible barbell in two specific lift types."],
    "Judo": ["Classified as a combat sport at the Olympics.", "Competitors wear a traditional uniform tied with a colored belt indicating rank.", "A Japanese martial art focused on throws and ground grappling rather than striking."],
    "Taekwondo": ["Classified as a combat sport at the Olympics.", "Competitors wear protective gear including a chest guard and helmet.", "A Korean martial art known especially for its wide variety of kicking techniques."],
    "Table Tennis": ["Classified as a racket sport at the Olympics.", "Uses a very lightweight, hollow ball.", "Played on a small table divided by a low net."],
    "Badminton": ["Classified as a racket sport at the Olympics.", "The shuttlecock can travel faster off the racket than the ball in most other racket sports.", "Played with a shuttlecock instead of a ball."],
    "Rugby": ["Classified as a team sport at the Olympics.", "The Olympic version is typically a faster, shorter format than the traditional full game.", "Played with an oval-shaped ball rather than a round one."],
    "Sailing": ["Classified as an aquatic/racing sport at the Olympics.", "Competitors must constantly adjust course and sail position based on wind direction.", "Involves racing wind-powered boats around a marked course."]
  },
  "Celebrities": {
    "Taylor Swift": ["An American singer-songwriter.", "Known for writing much of her own material, often with narrative, storytelling lyrics.", "Began her career primarily in country music before moving into pop."],
    "Dwayne Johnson": ["An American actor.", "Frequently stars in major action and adventure films.", "A former professional wrestler widely known by a one-word ring nickname."],
    "Beyoncé": ["An American singer.", "Known for elaborate, highly choreographed live performances.", "Rose to fame as part of a girl group before launching a solo career."],
    "Tom Hanks": ["An American actor with a career spanning several decades.", "Known for a wide range of both dramatic and comedic roles.", "Often cast in roles portraying real historical figures."],
    "Oprah Winfrey": ["An American media executive.", "Also known for a highly influential book club recommendation list.", "Her long-running daytime talk show made her one of the most influential figures in American media."],
    "Leonardo DiCaprio": ["An American actor.", "Also known for environmental activism outside of acting.", "Frequently collaborates with the same small group of directors across his career."],
    "Rihanna": ["A singer from Barbados.", "Known for blending genres like pop, R&B, and reggae in her music.", "Built a major cosmetics brand in addition to her music career."],
    "Will Smith": ["An American actor.", "Also has a career as a rapper.", "Got his start on a popular television sitcom before moving into film."],
    "Jennifer Lawrence": ["An American actress.", "Known for a mix of blockbuster and independent film work.", "Rose to major fame through a leading role in a dystopian young-adult film franchise."],
    "Keanu Reeves": ["A Canadian actor.", "Widely known for a calm, understated public persona.", "Known for starring in major science fiction and action film franchises."],
    "Zendaya": ["An American actress and singer.", "Also known for her work as a fashion trendsetter on red carpets.", "Began her career as a Disney Channel star."],
    "Chris Hemsworth": ["An Australian actor.", "Has a brother who is also a well-known actor.", "Known for playing a Norse-mythology-inspired superhero in a major film franchise."],
    "Serena Williams": ["A retired American professional tennis player.", "Has a sister who was also a top professional tennis player.", "Widely regarded as one of the greatest players in the sport's history."],
    "Ryan Reynolds": ["A Canadian actor.", "Also built a business career investing in and promoting consumer brands.", "Known for blending sharp comedic timing with action roles."],
    "Emma Watson": ["A British actress.", "Also known for advocacy work related to gender equality.", "Rose to fame as a child actor in a major fantasy film franchise."],
    "Denzel Washington": ["An American actor and director.", "Has also directed several feature films.", "Known for a long career of acclaimed dramatic film performances."],
    "Ariana Grande": ["An American singer.", "Known for a wide vocal range in her pop music.", "Began her career as a television actress before pivoting to music."],
    "Robert Downey Jr.": ["An American actor.", "Experienced a major career resurgence in the late 2000s.", "Known for playing a wealthy, wisecracking superhero in a long-running film franchise."],
    "Lady Gaga": ["An American singer.", "Later earned acclaim for dramatic film acting roles as well.", "Known early in her career for provocative, theatrical pop performances."],
    "Morgan Freeman": ["An American actor.", "Frequently sought out for narration work in addition to acting roles.", "Known for a distinctive, calming speaking voice."]
  },
  "Pokémon": {
    "Pikachu": ["An Electric-type Pokémon.", "Evolves from an earlier form and can evolve further with the right stone.", "Widely considered the mascot of the entire franchise."],
    "Charizard": ["A Fire and Flying-type Pokémon.", "Resembles a dragon, though it's not actually classified as one.", "The final evolution of one of the original starter Pokémon."],
    "Bulbasaur": ["A Grass and Poison-type Pokémon.", "Has a plant bulb growing on its back that develops as it evolves.", "One of the three original starter Pokémon."],
    "Squirtle": ["A Water-type Pokémon.", "Evolves twice into progressively larger forms.", "A starter Pokémon with a turtle-like appearance."],
    "Charmander": ["A Fire-type Pokémon.", "The flame on its tail is said to reflect its health and mood.", "A starter Pokémon with a lizard-like appearance."],
    "Jigglypuff": ["A round, balloon-like Pokémon.", "Famously draws on the face of anyone who falls asleep during its song.", "Known for a signature move that puts listeners to sleep with its singing."],
    "Mewtwo": ["A Psychic-type Pokémon.", "Based on the DNA of an extremely rare, mythical Pokémon.", "Created artificially through genetic engineering."],
    "Mew": ["A Psychic-type Pokémon.", "Said to contain the genetic makeup of many other Pokémon species.", "Considered a mythical, extremely rare Pokémon."],
    "Eevee": ["A Normal-type Pokémon.", "Which form it evolves into depends on specific conditions like location or friendship level.", "Famous for having an unusually large number of possible evolved forms."],
    "Snorlax": ["A Normal-type Pokémon.", "Often depicted blocking paths while sleeping, requiring a special method to wake it.", "Known for being enormous and famously lazy."],
    "Gengar": ["A Ghost and Poison-type Pokémon.", "The final evolution of a three-stage ghostly Pokémon line.", "Based on the concept of a mischievous shadow."],
    "Gyarados": ["A Water and Flying-type Pokémon.", "Evolves from a Pokémon widely considered one of the weakest in the franchise.", "Known for a fierce, serpentine, dragon-like appearance."],
    "Dragonite": ["A Dragon and Flying-type Pokémon.", "Despite its large size, it's often depicted as friendly and gentle.", "The final evolution of a three-stage Pokémon line."],
    "Machamp": ["A Fighting-type Pokémon.", "The final evolution of a line that starts as a small humanoid Pokémon.", "Known for having four muscular arms."],
    "Alakazam": ["A Psychic-type Pokémon.", "Depicted carrying spoons that are said to help focus its psychic power.", "Known for extremely high intelligence."],
    "Vaporeon": ["A Water-type Pokémon.", "Has a mermaid-like, aquatic appearance.", "One of the possible evolved forms of a Normal-type Pokémon with many evolution options."],
    "Blastoise": ["A Water-type Pokémon.", "Known for a pair of cannons that emerge from its shell.", "The final evolution of a classic Water-type starter line."],
    "Venusaur": ["A Grass and Poison-type Pokémon.", "Known for a large flower blooming on its back.", "The final evolution of a classic Grass-type starter line."],
    "Psyduck": ["A Water-type Pokémon.", "Its psychic powers are said to activate when its headache becomes severe enough.", "Known for suffering from constant headaches."],
    "Magikarp": ["A Water-type Pokémon.", "Evolves into a much more powerful serpentine Pokémon.", "Famous for being one of the weakest Pokémon in battle."]
  },
  "Anime": {
    "Naruto": ["Falls into the shonen action/adventure genre of anime.", "Set in a world where ninja villages compete and cooperate with one another.", "Follows a young ninja who dreams of becoming the leader of his village."],
    "One Piece": ["Falls into the shonen action/adventure genre of anime.", "One of the longest-running and best-selling manga series ever published.", "Follows a pirate crew searching for a legendary treasure."],
    "Dragon Ball Z": ["Falls into the shonen action/adventure genre of anime.", "Known for characters achieving dramatic power-up transformations mid-battle.", "Follows warriors who defend Earth from increasingly powerful threats."],
    "Attack on Titan": ["Falls into the dark fantasy genre of anime.", "Known for a complex, twist-heavy plot that expands well beyond its initial premise.", "Set in a world where humanity lives behind massive walls, threatened by giant humanoid creatures."],
    "My Hero Academia": ["Falls into the shonen action/adventure genre of anime.", "The protagonist starts the series as one of the rare people without a power.", "Set in a world where the vast majority of people are born with superpowers."],
    "Death Note": ["Falls into the psychological thriller genre of anime.", "Known for its heavy use of strategic, chess-like plotting rather than physical action.", "Centers on a supernatural notebook that can kill anyone whose name is written in it."],
    "Fullmetal Alchemist": ["Falls into the adventure/drama genre of anime.", "Combines adventure, dark themes, and a strong emphasis on sibling bonds.", "Follows two brothers seeking a way to restore their bodies after a failed ritual."],
    "Demon Slayer": ["Falls into the shonen action/adventure genre of anime.", "Known for visually striking, elemental-themed combat techniques.", "Follows a young man who becomes a demon hunter after a tragic family attack."],
    "Sailor Moon": ["Falls into the magical girl genre of anime.", "Known for popularizing the 'magical girl team' format worldwide.", "Follows a group of teenage girls who transform to battle evil forces."],
    "Spirited Away": ["Falls into the Studio Ghibli family-film genre of anime.", "Directed by one of the most acclaimed filmmakers in animation history.", "Follows a young girl trapped in a mysterious spirit world centered on a bathhouse."],
    "One Punch Man": ["Falls into the shonen action/adventure genre of anime.", "Known for blending comedy with over-the-top action.", "Follows a superhero so powerful he can defeat any opponent with a single punch."],
    "Hunter x Hunter": ["Falls into the shonen action/adventure genre of anime.", "Known for a detailed, strategy-heavy power system.", "Follows a young boy training to become a licensed 'Hunter.'"],
    "Bleach": ["Falls into the shonen action/adventure genre of anime.", "Known for a large cast of characters each with unique named weapons and abilities.", "Follows a teenager who gains the powers of a soul reaper."],
    "Cowboy Bebop": ["Falls into the sci-fi noir genre of anime.", "Known for a jazz-heavy soundtrack that heavily influenced its tone.", "Follows a crew of bounty hunters traveling through space."],
    "Neon Genesis Evangelion": ["Falls into the psychological thriller genre of anime.", "Known for its heavy psychological and philosophical themes.", "Follows teenagers piloting giant biomechanical robots against mysterious beings."],
    "Jujutsu Kaisen": ["Falls into the shonen action/adventure genre of anime.", "Became one of the most popular new series of its decade shortly after release.", "Follows a student who becomes host to a powerful curse."],
    "Tokyo Ghoul": ["Falls into the dark fantasy genre of anime.", "Known for its darker, more horror-influenced tone compared to typical action series.", "Follows a young man who becomes part-ghoul after a near-fatal encounter."],
    "Fairy Tail": ["Falls into the adventure/drama genre of anime.", "Known for its found-family theme among the guild's rowdy members.", "Follows wizards belonging to a magical guild."],
    "Sword Art Online": ["Falls into the adventure/drama genre of anime.", "One of the most well-known series to center on virtual reality as its core premise.", "Follows players trapped inside a virtual reality game where dying means dying in real life."],
    "My Neighbor Totoro": ["Falls into the Studio Ghibli family-film genre of anime.", "One of the most recognizable and beloved family-friendly animated films ever made.", "Follows two young sisters who befriend a gentle forest spirit."]
  },
  "Famous Soccer Players": {
    "Lionel Messi": ["An Argentine forward.", "Known especially for close ball control and dribbling at speed.", "Widely regarded as one of the greatest players in the sport's history."],
    "Cristiano Ronaldo": ["A Portuguese forward.", "Famous for his powerful heading ability and aerial jumping.", "Known for exceptional athleticism and goal-scoring ability."],
    "Pelé": ["A Brazilian forward from the mid-20th century.", "Won multiple World Cups with the Brazilian national team.", "Widely considered one of the greatest players in the sport's history."],
    "Diego Maradona": ["An Argentine attacking player.", "Involved in one of the most famous and controversial goals in World Cup history.", "Known for extraordinary dribbling ability in tight spaces."],
    "Neymar": ["A Brazilian forward.", "Became one of the most expensive transfers in the sport's history at one point.", "Known for flashy, creative dribbling and flair on the ball."],
    "Kylian Mbappé": ["A French forward.", "Became a World Cup-winning star while still in his teens.", "Known especially for exceptional sprinting speed."],
    "Zinedine Zidane": ["A French midfielder during his playing career.", "Later became a highly successful club manager after retiring as a player.", "Known for elegant technique and vision on the ball."],
    "Ronaldinho": ["A Brazilian attacking player.", "Widely recognized for his constant smile while playing.", "Known for flamboyant flair and creative trick plays."],
    "David Beckham": ["An English midfielder.", "Became one of the sport's most recognizable global celebrities off the field.", "Known especially for precise long passing and free kicks."],
    "Thierry Henry": ["A French forward.", "Spent a long, highly prolific spell playing in England.", "Known for blazing pace combined with clinical finishing."],
    "Kevin De Bruyne": ["A Belgian midfielder.", "One of the sport's most prolific creators of scoring chances for teammates.", "Known for exceptional vision and passing range."],
    "Erling Haaland": ["A Norwegian forward.", "Built a reputation as a prolific goal-scorer from a very young age.", "Known for an unusual combination of large size and sprinting speed."],
    "Mohamed Salah": ["An Egyptian forward.", "Became one of the most celebrated athletes in Egyptian sporting history.", "Known for pace and clinical finishing, often cutting in from the wing."],
    "Luka Modrić": ["A Croatian midfielder.", "Captained his national team to a World Cup final.", "Known for passing range and control in the middle of the field."],
    "Robert Lewandowski": ["A Polish forward.", "Spent much of his career as one of Europe's top annual goal scorers.", "Known for elite finishing and positioning inside the penalty area."],
    "Andrés Iniesta": ["A Spanish midfielder.", "Scored a decisive goal in a World Cup final for his national team.", "Known for tight close control in crowded spaces."],
    "Xavi": ["A Spanish midfielder during his playing career.", "Later returned to manage the club where he spent most of his playing career.", "Known for controlling the tempo and rhythm of a match through passing."],
    "Ronaldo Nazário": ["A Brazilian forward whose peak was in the late 1990s and 2000s.", "Overcame serious knee injuries partway through his career.", "Known for explosive speed and dribbling ability."],
    "Zlatan Ibrahimović": ["A Swedish forward.", "Also well known for a bold, outspoken public personality.", "Known for combining large physical size with unusually refined technical skill."],
    "Wayne Rooney": ["An English forward.", "Became his national team's all-time leading goal scorer for a period.", "Known for a powerful, direct playing style."]
  },
  "Car Brands": {
    "Toyota": ["A Japanese automaker.", "Widely known for a strong reputation for reliability.", "Regularly ranks among the largest car manufacturers in the world by sales."],
    "Ford": ["An American automaker.", "Founded in the early 20th century by its namesake.", "Pioneered the widespread use of the moving assembly line in car manufacturing."],
    "Honda": ["A Japanese automaker.", "Known for producing its own engines used across a wide range of products.", "Also one of the largest motorcycle manufacturers in the world."],
    "Chevrolet": ["An American automotive brand.", "One of the best-selling car brands in the United States.", "Owned by a larger parent company and known for a long history of trucks and muscle cars."],
    "BMW": ["A German automaker.", "The brand's name is an abbreviation referencing motor and engine works.", "Known for luxury and performance-oriented vehicles."],
    "Mercedes-Benz": ["A German automaker.", "Known for luxury vehicles and a three-pointed star logo.", "Traces its roots back to some of the very earliest automobile inventions."],
    "Audi": ["A German automaker.", "Known for a signature all-wheel-drive system used across many models.", "Its logo features four interlocking rings representing four merged companies."],
    "Volkswagen": ["A German automaker.", "Produced one of the best-selling individual car models in automotive history.", "Its name translates to 'people's car.'"],
    "Nissan": ["A Japanese automaker.", "Known for producing both mainstream vehicles and a dedicated sports car line.", "Formed a long-running international alliance with a major French automaker."],
    "Tesla": ["An American automaker.", "Named after a famous inventor and electrical engineer.", "Focuses exclusively on electric vehicles."],
    "Porsche": ["A German automaker.", "Famous for a long-running model line with the engine mounted at the rear.", "Known for high-performance sports cars."],
    "Ferrari": ["An Italian automaker.", "Has a long, storied history in motorsport racing.", "Known for high-performance luxury sports cars."],
    "Lamborghini": ["An Italian automaker.", "Founded by a businessman who originally made tractors.", "Known for dramatic-looking, high-performance supercars."],
    "Subaru": ["A Japanese automaker.", "Uses a distinctive horizontally opposed engine layout in most vehicles.", "Known for including all-wheel drive as standard on most of its models."],
    "Mazda": ["A Japanese automaker.", "Produces one of the best-selling two-seat sports cars in history.", "Historically known for using a distinctive rotary engine in some models."],
    "Hyundai": ["A South Korean automaker.", "Owns another major South Korean car brand as part of the same corporate group.", "One of the largest car manufacturers in the world by production volume."],
    "Kia": ["A South Korean automaker.", "Has become known in recent years for bold, distinctive exterior design.", "Part of the same corporate group as another major South Korean car brand."],
    "Jeep": ["An American automotive brand.", "Traces its roots back to a vehicle developed for military use.", "Known for off-road capable SUVs."],
    "Volvo": ["A Swedish automaker.", "Credited with inventing and popularizing a key seatbelt design used industry-wide.", "Known for a strong brand emphasis on vehicle safety."],
    "Chrysler": ["An American automaker.", "Now part of a larger multinational automotive group.", "Historically one of the 'Big Three' major US car manufacturers."]
  }
};

export const DEAL_LINES = [
  "Decrypting case file…",
  "Assigning evidence numbers…",
  "Sealing the case folder…",
  "Syncing the board…",
  "Clearing the terminal…",
  "Logging new session…"
];
