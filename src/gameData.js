import {
  PawPrint, Orbit, Dice5, UtensilsCrossed, Trophy, Star, Zap, Drama, CircleDot, Car
} from "lucide-react";

/* =========================================================================
   GAME DATA — categories, their items, board icons, and the curated
   fun-fact clues + classification used by solo Puzzle Mode. This is the
   file to edit to add a category or expand an existing one; no
   game-logic changes needed.

   CATEGORY_SETS holds every category, used by BOTH game modes (Pass &
   Play offers all of them). ITEM_FACTS only needs entries for whichever
   categories should be playable in solo Puzzle Mode — the category
   picker in solo mode is driven directly off Object.keys(ITEM_FACTS), so
   adding or removing a category from Puzzle Mode is just adding or
   removing its ITEM_FACTS entry, no other code changes required.

   To add a category to Puzzle Mode:
     1. Add (or reuse) an entry in CATEGORY_SETS with an Icon (any
        lucide-react icon) and an `items` array of unique names.
     2. Add a matching entry to ITEM_FACTS keyed by the same category
        name. Each item needs:
          - `group`: a short classification shared by several items in
            the category (an AKC breed group, a Pokémon type, a broad
            profession, a country of origin, etc). This is never shown
            as a clue — it's only used to mark wrong guesses CLOSE
            (same group as the answer) or FAR (different group).
          - `clues`: exactly 4 short, real facts about the item, ordered
            from vague/broad (origin or history) to specific/identifying
            (a signature, well-known fact). Revealed one per wrong guess.
     3. Every item name in CATEGORY_SETS must have a matching key in
        ITEM_FACTS under the same category, or the puzzle will crash
        trying to build clues for it — Puzzle Mode has no name-based
        fallback the way earlier versions did.
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
    "Labrador Retriever": { group: "Sporting",     clues: ["Bred in the fishing villages of Newfoundland, Canada, to help haul in nets.", "Famously friendly and easygoing — ranked one of the least aggressive breeds around.", "Comes in three classic coat colors: black, yellow, or chocolate brown.", "Has topped America's most popular dog breed list for decades running."] },
    "Poodle":             { group: "Non-Sporting",  clues: ["Despite its French reputation, most historians trace it back to Germany as a working water dog.", "Sharp, eager to please, and surprisingly athletic under all that fancy grooming.", "Its dense, curly coat comes in solid colors like white, black, apricot, or gray.", "The elaborate 'poodle clip' haircut actually started as a practical way to protect its joints in cold water."] },
    "Bulldog":            { group: "Non-Sporting",  clues: ["Descended from dogs bred in England for the brutal old blood sport of bull-baiting.", "Surprisingly gentle and laid-back for a breed with such a tough history.", "Usually seen in shades of white, fawn, brindle, or a mix of the three.", "Its heavily wrinkled face and pushed-in nose are its most recognizable features."] },
    "Chihuahua":          { group: "Toy",           clues: ["Named after a state in Mexico, where the breed is believed to have originated.", "Small but famously bold — often more confident (and vocal) than dogs many times its size.", "Comes in an unusually wide range of colors and coat lengths, both smooth and long-haired.", "Holds the title of one of the smallest dog breeds in the world."] },
    "Beagle":             { group: "Hound",         clues: ["Developed in England, where it was bred to hunt rabbits and hares.", "Friendly and easygoing, though its curiosity and nose can make it stubborn on walks.", "Classically tricolor — a mix of black, white, and tan patches.", "Has one of the most powerful noses in the dog world and was traditionally hunted in packs."] },
    "Dachshund":          { group: "Hound",         clues: ["Bred in Germany to chase badgers and other burrowing animals underground.", "Bold and a bit stubborn, often described as having a 'big dog' attitude in a small body.", "Comes in red, black-and-tan, and a range of dappled or brindle patterns.", "Its name literally translates from German to 'badger dog.'"] },
    "Boxer":              { group: "Working",       clues: ["Developed in Germany from older bull-baiting breeds.", "Playful and high-energy well into adulthood — often called the 'Peter Pan' of dog breeds.", "Typically fawn or brindle, often with white markings on the chest and face.", "Known for a distinctive square jaw and an alert, muscular stance."] },
    "Siberian Husky":     { group: "Working",       clues: ["Bred by the Chukchi people of Siberia to pull sleds across long distances.", "Friendly and outgoing rather than aggressive — not known for being a great guard dog.", "Often has striking blue eyes, or sometimes one of each color.", "Its thick double coat is built to handle extreme cold with ease."] },
    "Rottweiler":         { group: "Working",       clues: ["Descended from Roman drover dogs that herded cattle across long marches.", "Confident and protective, often used as a guard dog — has a reputation for being more assertive than most breeds.", "Always black with distinct rust or mahogany markings.", "Named after a German town where the breed was further developed."] },
    "German Shepherd":    { group: "Herding",       clues: ["Developed in Germany in the late 1800s, originally to herd sheep.", "Highly intelligent and protective — commonly used in police and military work.", "Usually black and tan, though solid black and sable variations exist.", "One of the most popular breeds for working roles worldwide."] },
    "Corgi":              { group: "Herding",       clues: ["A herding breed that originated in Wales.", "Energetic and surprisingly bold for its size, with a strong herding instinct.", "Commonly red, sable, or tricolor, usually with white markings.", "Has been a favorite of the British royal family for generations."] },
    "Great Dane":         { group: "Working",       clues: ["Bred in Germany, despite the name, originally to hunt wild boar.", "Gentle and friendly despite its intimidating size — often called a 'gentle giant.'", "Comes in fawn, brindle, black, blue, or a striking black-and-white harlequin pattern.", "Stands as one of the tallest dog breeds in the world."] },
    "Shih Tzu":           { group: "Toy",           clues: ["Bred in China as a companion for royalty.", "Affectionate and outgoing — bred purely to be a companion, not a worker.", "Can appear in nearly any color, often with a mix of white and another shade.", "Its name roughly translates to 'lion dog.'"] },
    "Border Collie":      { group: "Herding",       clues: ["Developed along the border between England and Scotland to herd sheep.", "Intensely focused and driven to work — not aggressive, but needs a job to stay happy.", "Classic black-and-white, though red, blue, and merle patterns also occur.", "Widely regarded as the most intelligent dog breed."] },
    "Doberman":           { group: "Working",       clues: ["Developed in Germany in the 1890s by a tax collector who wanted a tougher companion for his rounds.", "Alert and protective, with a reputation as one of the more serious guard-dog breeds.", "Typically black or rust with tan markings, sometimes blue or fawn.", "Known for a sleek, muscular build and an ever-alert stance."] },
    "Golden Retriever":   { group: "Sporting",      clues: ["Developed in 1800s Scotland to retrieve waterfowl during hunts.", "Famously friendly and patient — consistently ranked among the least aggressive breeds.", "Ranges from light cream to deep golden shades.", "One of the most popular family dog breeds in the world."] },
    "Pug":                { group: "Toy",           clues: ["Originated in China, where it was favored by emperors.", "Easygoing and affectionate, with a comedic, clownish streak.", "Usually fawn or black, always with a distinctive dark mask on the face.", "Known for one of the flattest, most wrinkled faces in the dog world."] },
    "Dalmatian":          { group: "Non-Sporting",  clues: ["Associated with the Dalmatia region, though its exact origins are debated.", "Energetic and alert, historically valued as a coach dog that could run for miles.", "White coat covered in distinctive black or liver-colored spots.", "Historically used as a carriage dog, running alongside horse-drawn coaches."] },
    "Basset Hound":       { group: "Hound",         clues: ["Bred in France to scent-hunt small game at a walking pace.", "Calm and easygoing, rarely described as aggressive, though famously stubborn.", "Usually tricolor or two-tone, often black, white, and tan.", "Known for very long ears and short legs."] },
    "Australian Shepherd": { group: "Herding",      clues: ["Despite the name, actually developed in the United States, closely tied to ranching in the American West.", "High-energy and eager to work, with strong herding instincts.", "Often has a distinctive mottled 'merle' coat pattern.", "Closely associated with rodeo and ranching culture despite the misleading name."] }
  },
  "Pokémon": {
    "Pikachu":    { group: "Electric", clues: ["Famous for storing electricity in its cheeks and releasing it when startled.", "An Electric-type Pokémon.", "Small, yellow, and mouse-like, with red cheek pouches and a lightning-bolt tail.", "Widely considered the mascot of the entire franchise."] },
    "Charizard":  { group: "Fire",     clues: ["The final evolution of one of the very first starter Pokémon introduced.", "A Fire and Flying-type Pokémon.", "Resembles a dragon, with wings and a flame burning at the tip of its tail.", "One of the most recognizable Pokémon outside the games themselves, often used in marketing."] },
    "Bulbasaur":  { group: "Grass",    clues: ["One of the three original starter Pokémon offered at the very beginning of the games.", "A Grass and Poison-type Pokémon.", "Small and frog-like, with a plant bulb growing on its back.", "The bulb on its back is said to grow larger and eventually bloom as it evolves."] },
    "Squirtle":   { group: "Water",    clues: ["A starter Pokémon known for its calm, easygoing demeanor.", "A Water-type Pokémon.", "Small and turtle-like, with a light blue shell and skin.", "Evolves twice, eventually into a Pokémon with cannons built into its shell."] },
    "Charmander": { group: "Fire",     clues: ["A starter Pokémon whose tail flame is said to reflect its health and mood.", "A Fire-type Pokémon.", "Small and lizard-like, orange-skinned, with a flame burning at the tip of its tail.", "If its tail flame ever goes out, legend says it won't survive."] },
    "Jigglypuff": { group: "Normal",   clues: ["Known for a signature move that puts anyone listening to sleep.", "A Normal-type Pokémon.", "Round and balloon-like, usually pink, with big eyes.", "Famously draws on the face of anyone who falls asleep during its song."] },
    "Mewtwo":     { group: "Psychic", clues: ["Created artificially through genetic engineering rather than occurring in nature.", "A Psychic-type Pokémon.", "Tall, humanoid, and purple, with a long tail.", "Based on the DNA of an extremely rare, mythical Pokémon."] },
    "Mew":        { group: "Psychic", clues: ["Considered a mythical, extremely rare Pokémon.", "A Psychic-type Pokémon.", "Small, pink, and cat-like, with a long thin tail.", "Said to contain the genetic makeup of many other Pokémon species."] },
    "Eevee":      { group: "Normal",   clues: ["Famous for having an unusually large number of possible evolved forms.", "A Normal-type Pokémon.", "Small and fox-like, brown-furred, with a fluffy collar.", "Which form it evolves into depends on specific conditions like location or friendship level."] },
    "Snorlax":    { group: "Normal",   clues: ["Known for being enormous and famously lazy.", "A Normal-type Pokémon.", "Very large, round, and blue-green, usually seen sleeping.", "Often depicted blocking paths while asleep, requiring a special method to wake it."] },
    "Gengar":     { group: "Ghost",    clues: ["Based on the concept of a mischievous shadow lurking nearby.", "A Ghost and Poison-type Pokémon.", "Purple, grinning, and shadow-like, often shown blending into darkness.", "The final evolution of a three-stage ghostly Pokémon line."] },
    "Gyarados":   { group: "Water",    clues: ["Evolves from a Pokémon widely considered one of the weakest in the entire franchise.", "A Water and Flying-type Pokémon.", "Long, serpentine, and blue, with a fierce dragon-like face.", "Known for a dramatic, temperamental personality once it evolves."] },
    "Dragonite":  { group: "Dragon",   clues: ["The final evolution of a three-stage Pokémon line that starts out very small.", "A Dragon and Flying-type Pokémon.", "Large, orange, and dragon-like, with small wings relative to its body.", "Despite its intimidating size, it's often depicted as friendly and gentle."] },
    "Machamp":    { group: "Fighting", clues: ["The final evolution of a line that starts as a small humanoid Pokémon.", "A Fighting-type Pokémon.", "Muscular and humanoid, notable for having four arms.", "Known for incredible strength, said to be able to move mountains with a single punch."] },
    "Alakazam":   { group: "Psychic", clues: ["Known for extremely high intelligence, said to remember everything it's ever experienced.", "A Psychic-type Pokémon.", "Thin, humanoid, and yellow, with a bushy mustache.", "Depicted carrying spoons that are said to help focus its psychic power."] },
    "Vaporeon":   { group: "Water",    clues: ["One of the possible evolved forms of a Normal-type Pokémon with many evolution options.", "A Water-type Pokémon.", "Blue and sleek, with a mermaid-like, aquatic appearance.", "Said to be able to melt invisibly into water."] },
    "Blastoise":  { group: "Water",    clues: ["The final evolution of a classic Water-type starter line.", "A Water-type Pokémon.", "Large and turtle-like, with a hard shell and thick limbs.", "Known for a pair of cannons that emerge from its shell."] },
    "Venusaur":   { group: "Grass",    clues: ["The final evolution of a classic Grass-type starter line.", "A Grass and Poison-type Pokémon.", "Large and toad-like, with a big flower blooming on its back.", "The flower on its back is said to take on vivid colors with enough sunlight."] },
    "Psyduck":    { group: "Water",    clues: ["Known for suffering from constant, severe headaches.", "A Water-type Pokémon.", "Yellow and duck-like, usually shown with a confused expression.", "Its psychic powers are said to activate when its headache becomes unbearable."] },
    "Magikarp":   { group: "Water",    clues: ["Famous for being one of the weakest Pokémon in battle.", "A Water-type Pokémon.", "Orange and fish-like, with little ability to do more than flop around.", "Evolves into a much more powerful, serpentine Pokémon."] }
  },
  "Celebrities": {
    "Taylor Swift":       { group: "Musician", clues: ["Began her career primarily in country music before crossing over into pop.", "Works primarily as a musician.", "Known for writing much of her own material, often with narrative, storytelling lyrics.", "An American singer-songwriter whose massive stadium tours have become cultural events."] },
    "Dwayne Johnson":     { group: "Actor",    clues: ["Got his start as a professional wrestler before transitioning to film.", "Works primarily as an actor.", "Frequently stars in major action and adventure blockbusters.", "Widely known by a one-word wrestling nickname."] },
    "Beyoncé":            { group: "Musician", clues: ["Rose to fame as part of a girl group before launching a solo career.", "Works primarily as a musician.", "Known for elaborate, highly choreographed live performances.", "An American singer whose solo career eclipsed her already-successful group days."] },
    "Tom Hanks":          { group: "Actor",    clues: ["Has had a film career spanning several decades.", "Works primarily as an actor.", "Known for a wide range of both dramatic and comedic roles.", "Often cast in roles portraying real historical figures."] },
    "Oprah Winfrey":      { group: "Media",    clues: ["Built her career as a talk show host before becoming a media executive.", "Works primarily in media and broadcasting.", "Known for a highly influential book club recommendation list.", "Her long-running daytime talk show made her one of the most influential figures in American media."] },
    "Leonardo DiCaprio":  { group: "Actor",    clues: ["Known for leading roles in major dramatic films.", "Works primarily as an actor.", "Also known for environmental activism outside of acting.", "Frequently collaborates with the same small group of directors across his career."] },
    "Rihanna":            { group: "Musician", clues: ["A singer from Barbados.", "Works primarily as a musician.", "Known for blending genres like pop, R&B, and reggae in her music.", "Built a major cosmetics brand in addition to her music career."] },
    "Will Smith":         { group: "Actor",    clues: ["Got his start on a popular television sitcom before moving into film.", "Works primarily as an actor.", "Also has a career as a rapper.", "Known for starring in many major action and comedy blockbusters."] },
    "Jennifer Lawrence":  { group: "Actor",    clues: ["Rose to major fame through a leading role in a dystopian young-adult film franchise.", "Works primarily as an actress.", "Known for a mix of blockbuster and independent film work.", "One of the youngest actresses to headline a major action franchise."] },
    "Keanu Reeves":       { group: "Actor",    clues: ["Known for starring in major science fiction and action film franchises.", "Works primarily as an actor.", "Widely known for a calm, understated public persona.", "A Canadian actor with an unusually devoted global fanbase."] },
    "Zendaya":            { group: "Actor",    clues: ["Began her career as a Disney Channel star.", "Works primarily as an actress.", "Also known for her work as a fashion trendsetter on red carpets.", "An American actress and singer who transitioned from teen TV into major film roles."] },
    "Chris Hemsworth":    { group: "Actor",    clues: ["Known for playing a Norse-mythology-inspired superhero in a major film franchise.", "Works primarily as an actor.", "Has a brother who is also a well-known actor.", "An Australian actor known for his imposing physical presence on screen."] },
    "Serena Williams":    { group: "Athlete",  clues: ["A retired professional tennis player.", "Works primarily as an athlete.", "Has a sister who was also a top professional tennis player.", "Widely regarded as one of the greatest players in tennis history."] },
    "Ryan Reynolds":      { group: "Actor",    clues: ["Known for blending sharp comedic timing with action roles.", "Works primarily as an actor.", "Also built a business career investing in and promoting consumer brands.", "A Canadian actor known for breaking the fourth wall in a foul-mouthed superhero role."] },
    "Emma Watson":        { group: "Actor",    clues: ["Rose to fame as a child actor in a major fantasy film franchise.", "Works primarily as an actress.", "Also known for advocacy work related to gender equality.", "A British actress who grew up on screen playing the same character for a decade."] },
    "Denzel Washington":  { group: "Actor",    clues: ["Known for a long career of acclaimed dramatic film performances.", "Works primarily as an actor.", "Has also directed several feature films.", "An American actor widely regarded as one of the greatest of his generation."] },
    "Ariana Grande":      { group: "Musician", clues: ["Began her career as a television actress before pivoting to music.", "Works primarily as a musician.", "Known for a wide vocal range in her pop music.", "An American singer whose voice is often compared to legendary pop vocalists."] },
    "Robert Downey Jr.":  { group: "Actor",    clues: ["Experienced a major career resurgence in the late 2000s.", "Works primarily as an actor.", "Known for playing a wealthy, wisecracking superhero in a long-running film franchise.", "An American actor whose comeback became one of Hollywood's most talked-about stories."] },
    "Lady Gaga":          { group: "Musician", clues: ["Known early in her career for provocative, theatrical pop performances.", "Works primarily as a musician.", "Later earned acclaim for dramatic film acting roles as well.", "An American singer known for constant reinvention across her career."] },
    "Morgan Freeman":     { group: "Actor",    clues: ["Known for a distinctive, calming speaking voice.", "Works primarily as an actor.", "Frequently sought out for narration work in addition to acting roles.", "An American actor whose voice alone has become instantly recognizable."] }
  },
  "Car Brands": {
    "Toyota":       { group: "Japanese",    clues: ["Widely known for a strong reputation for reliability.", "A Japanese automaker.", "Produces a wide range of vehicles from compact cars to hybrids.", "Regularly ranks among the largest car manufacturers in the world by sales."] },
    "Ford":         { group: "American",    clues: ["Pioneered the widespread use of the moving assembly line in car manufacturing.", "An American automaker.", "Known for a long history of trucks alongside its passenger cars.", "Founded in the early 20th century by its namesake."] },
    "Honda":        { group: "Japanese",    clues: ["Known for producing its own engines used across a wide range of products.", "A Japanese automaker.", "Also one of the largest motorcycle manufacturers in the world.", "Known for engineering-focused, fuel-efficient vehicles."] },
    "Chevrolet":    { group: "American",    clues: ["One of the best-selling car brands in the United States.", "An American automaker.", "Known for a long history of trucks and muscle cars.", "Owned by a larger American parent company alongside several other brands."] },
    "BMW":          { group: "German",      clues: ["The brand's name is an abbreviation referencing motor and engine works.", "A German automaker.", "Known for luxury and performance-oriented vehicles.", "Its logo is often mistaken for a spinning airplane propeller, though that's a popular myth."] },
    "Mercedes-Benz": { group: "German",     clues: ["Traces its roots back to some of the very earliest automobile inventions.", "A German automaker.", "Known for luxury vehicles across sedans, SUVs, and sports cars.", "Recognizable by a three-pointed star logo."] },
    "Audi":         { group: "German",      clues: ["Its logo features four interlocking rings representing four merged companies.", "A German automaker.", "Known for a signature all-wheel-drive system used across many models.", "Known for sleek, minimalist interior design."] },
    "Volkswagen":   { group: "German",      clues: ["Its name translates to 'people's car.'", "A German automaker.", "Produced one of the best-selling individual car models in automotive history.", "Owns several other well-known car brands as part of a larger corporate group."] },
    "Nissan":       { group: "Japanese",    clues: ["Formed a long-running international alliance with a major French automaker.", "A Japanese automaker.", "Known for producing both mainstream vehicles and a dedicated sports car line.", "One of Japan's largest automakers by production volume."] },
    "Tesla":        { group: "American",    clues: ["Named after a famous inventor and electrical engineer.", "An American automaker.", "Focuses exclusively on electric vehicles.", "Known for over-the-air software updates that add features after purchase."] },
    "Porsche":      { group: "German",      clues: ["Famous for a long-running model line with the engine mounted at the rear.", "A German automaker.", "Known for high-performance sports cars.", "Also has a history of building tractors and other vehicles beyond sports cars."] },
    "Ferrari":      { group: "Italian",     clues: ["Has a long, storied history in motorsport racing.", "An Italian automaker.", "Known for high-performance luxury sports cars.", "Recognizable by its prancing horse logo."] },
    "Lamborghini":  { group: "Italian",     clues: ["Founded by a businessman who originally made tractors.", "An Italian automaker.", "Known for dramatic-looking, high-performance supercars.", "Known for giving many of its models names inspired by bulls and bullfighting."] },
    "Subaru":       { group: "Japanese",    clues: ["Uses a distinctive horizontally opposed engine layout in most vehicles.", "A Japanese automaker.", "Known for including all-wheel drive as standard on most of its models.", "Popular among drivers in snowy or rugged terrain."] },
    "Mazda":        { group: "Japanese",    clues: ["Historically known for using a distinctive rotary engine in some models.", "A Japanese automaker.", "Produces one of the best-selling two-seat sports cars in history.", "Known for a design philosophy centered on the feeling of motion."] },
    "Hyundai":      { group: "South Korean", clues: ["One of the largest car manufacturers in the world by production volume.", "A South Korean automaker.", "Produces a wide range of vehicles including sedans, SUVs, and EVs.", "Owns another major South Korean car brand as part of the same corporate group."] },
    "Kia":          { group: "South Korean", clues: ["Part of the same corporate group as another major South Korean car brand.", "A South Korean automaker.", "Has become known in recent years for bold, distinctive exterior design.", "Went from a budget-focused image to winning major design awards in a relatively short time."] },
    "Jeep":         { group: "American",    clues: ["Traces its roots back to a vehicle developed for military use.", "An American automaker.", "Known for off-road capable SUVs.", "Its most iconic model has kept a recognizably similar shape for decades."] },
    "Volvo":        { group: "Swedish",     clues: ["Credited with inventing and popularizing a key seatbelt design used industry-wide.", "A Swedish automaker.", "Known for a strong brand emphasis on vehicle safety.", "Known for boxy, durable styling in its classic models."] },
    "Chrysler":     { group: "American",    clues: ["Historically one of the 'Big Three' major US car manufacturers.", "An American automaker.", "Now part of a larger multinational automotive group.", "Known for pioneering the minivan as a mainstream vehicle category."] }
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
