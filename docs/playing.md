# Playing Jurassic Tycoon

How the park works, with the numbers. The in-game **How to Play** panel (☰ menu) covers the same ground more
briefly, and the **Tutorial** on the title screen walks you through a first park.

- [Your first park](#your-first-park)
- [Power and fences](#power-and-fences)
- [Dinosaurs](#dinosaurs)
- [Guests, money and the star rating](#guests-money-and-the-star-rating)
- [When something gets out](#when-something-gets-out)
- [Buildings](#buildings)
- [Research](#research)
- [Disasters](#disasters)
- [Difficulty and game options](#difficulty-and-game-options)
- [Goals and the late game](#goals-and-the-late-game)
- [Controls](#controls)

## Your first park

1. **Power Plant** first. Electric fences only work inside its blue coverage (13 tiles); **Pylons** extend it.
2. **Paddock**: drag a rectangle with the Paddock tool inside the coverage, then put a **Feeder** inside.
3. **Hatchery**, then the Hatch tool: pick a species and click inside the paddock. Eggs take a few hours.
4. **Paths** from the Main Gate to the paddock, with a **Viewing Platform** against the fence.
5. A **Restaurant**, **Restroom** and **Gift Shop** near the paths, then a **Ranger Station** and a
   **Maintenance Shed** before you hatch anything with teeth.

The goal panel (bottom left) leads you through this, and its **Show me** button selects the right tool.

## Power and fences

- A Power Plant makes 110 MW. Every powered building and every stretch of electric fence draws from it. The
  HUD bar shows demand against supply; press **O** for the coverage overlay.
- **Electric fence** is cheap but dead without power. **Concrete wall** costs more and needs none.
- When demand exceeds supply the grid sheds load in this order: fences keep power longest, then staff, then
  shelters and sirens, then the hatchery, restrooms, restaurants and Visitor Center, then lamps, then the rest.
- **A blackout lets carnivores out** unless you have a **Backup Generator** (70 MW for a while).

## Dinosaurs

| Species | Diet | Cost | Appeal | Danger to people | Space (tiles each) | Herd size | Unlocks at |
|---|---|---|---|---|---|---|---|
| Gallimimus | herbivore | $22,000 | 3 | 1/10 | 14 | 3 | start |
| Parasaurolophus | herbivore | $34,000 | 4 | 0/10 | 18 | 2 | start |
| Dilophosaurus | carnivore | $45,000 | 5 | 4/10 | 16 | 1 | start |
| Triceratops | herbivore | $60,000 | 6 | 2/10 | 30 | 1 | 1★ |
| Stegosaurus | herbivore | $52,000 | 5 | 1/10 | 26 | 2 | 1★ |
| Velociraptor | carnivore | $95,000 | 8 | 8/10 | 20 | 3 | 2★ |
| Ankylosaurus | herbivore | $72,000 | 5 | 2/10 | 26 | 1 | 2★ |
| Brachiosaurus | herbivore | $130,000 | 10 | 1/10 | 50 | 2 | 2★ |
| Tyrannosaurus | carnivore | $220,000 | 14 | 10/10 | 60 | 1 | 3★ |
| Spinosaurus | carnivore | $280,000 | 15 | 10/10 | 60 | 1 | 4★ |
| Indominus | carnivore | $600,000 | 26 | 10/10 | 80 | 1 | 5★ |
| Pteranodon | carnivore | $65,000 | 7 | 5/10 | Aviary | 1 | 2★ |

Each animal has a **comfort** score built from space, tree cover, water, herd size, food and whether predators
are near. Click a paddock to see what it lacks. Unhappy or hungry animals attack fences; raptors look for the
weakest stretch; an Indominus hides and schemes.

- **Space** is per animal: three Triceratops want about 90 tiles.
- **Trees** and **ponds** (Build menu) raise comfort. **Hatch another** in the paddock panel tops up a herd.
- Keep carnivores and herbivores in separate paddocks.
- Animals die of old age. Restock, or the rating slides.
- Species unlock with stars, or early through **genome research**.

## Guests, money and the star rating

- Guests arrive at the Main Gate, walk the paths and pick among the attractions you actually have. They get
  hungry, need restrooms, shop, and leave unhappy if paths are crowded or dark.
- The park holds **450 guests at most**; each powered Ferry Terminal adds 150.
- Income is tickets plus what guests spend. Set the ticket price from the Finances panel (**$**).
- **Rating = attraction + reputation × 0.9.** Attraction is every animal's appeal scaled by its comfort, plus
  8 per species, plus building appeal. Stars come at 55, 110, 165, 235, 330 points.
  Click the rating in the HUD for the breakdown.
- **Reputation** drifts each night toward a mix of guest happiness (55%) and safety (45%). Deaths and escapes
  cost it directly.
- Narrow paths jam, especially in a panic. Use the **Wide Path** tool where crowds gather.

## When something gets out

1. Press **RESPOND** (**B**) on the breach banner: rangers and helicopters go after the worst escapee, and the
   evacuation alarm sounds if it is dangerous. **E** toggles the alarm by hand.
2. Guests run for the **Visitor Center** (60), **Lodge Hotel** (50) or a **Bunker** (45). A door lets about
   three people through a second, so several small shelters beat one long queue. When shelters are full,
   guests run for the gate.
3. **Rangers** dart the animal; the **ACU Helipad** airlifts it home. **Engineers** mend the fence.
4. Sound the all-clear when the advisor says nothing dangerous is loose.

**Siren Towers** sound on their own when a predator is near. You can also select rangers, engineers and
helicopters and order them about directly (click one, or shift-drag to select several, then right-click a
target; on touch use **Send…**), but they work on their own too.

A guest death costs reputation and a $30,000 fine.

## Buildings

### Guests

| Building | Cost | Upkeep / day | Power (MW) | What it does |
|---|---|---|---|---|
| Main Gate | $15,000 | $100 | 0 | Guests enter and exit here. Must touch a path. |
| Visitor Center | $60,000 | $400 | 6 | Guest hub and emergency shelter for 60 guests. |
| Restaurant | $18,000 | $200 | 3 | Feeds hungry guests. Good income. |
| Gift Shop | $14,000 | $120 | 2 | Plush raptors and amber keychains. |
| Restroom | $4,000 | $40 | 1 | Guests get grumpy without these. Not a great hiding place. |
| Viewing Platform | $9,000 | $40 | 0 | Place by a paddock. Guests here see dinos up to 11 tiles away. |
| Lodge Hotel | $90,000 | $600 | 8 | Overnight stays in 40 rooms. Big income and a shelter for 50. |
| Amber Museum (4★) | $600,000 | $1,200 | 6 | A prestige landmark: fossils, amber and a mosquito or two. Adds 22 to the park rating. One per park. |
| Ferry Terminal (5★) | $900,000 | $2,500 | 8 | A second way onto the island: the park can hold 150 more guests while it has power (normally 450 at most). Two per park. |
| Bunker | $12,000 | $60 | 1 | Reinforced emergency bunker for 45 guests. |
| Mosasaur Lagoon (4★) | $380,000 | $1,000 | 10 | A Mosasaurus in a giant pool. Feeding shows draw huge crowds. Needs 4 stars. |
| Lamp Post | $300 | $2 | 0.2 | Lights the night. Guests feel safer. |
| Tour Station | $35,000 | $300 | 3 | Electric jeeps carry guests along Tour Track past the paddocks. Must touch a path and a track. |
| Gyrosphere Station (1★) | $70,000 | $400 | 4 | Glass balls roll guests right through the paddock it touches. Build it against a paddock fence, next to a path. Carnivore paddocks thrill riders... until something cracks the glass. |
| Raptor Arena (2★) | $95,000 | $600 | 3 | Trained raptors perform every few hours of daylight for everyone within 10 tiles. Build it within 6 tiles of a paddock holding 2+ raptors. Lucrative, but every show riles them up. |
| Feeding Grandstand | $45,000 | $200 | 1 | At noon and 6pm the biggest carnivore in a paddock within 6 tiles is fed in front of the crowd. Free meal, huge cheers. |

### Power

| Building | Cost | Upkeep / day | Power (MW) | What it does |
|---|---|---|---|---|
| Power Plant | $45,000 | $500 | 0 | Generates 110 MW and powers a radius of 13 tiles. |
| Power Pylon | $1,200 | $10 | 0 | Extends grid coverage by 8 tiles. Must be inside existing coverage. |
| Backup Generator | $28,000 | $150 | 0 | Kicks in during grid failure: 70 MW for a while. |
| Siren Tower | $6,000 | $20 | 1 | Sounds by itself when something dangerous is loose nearby: guests in range head for shelter, no alarm needed. |

### Staff

| Building | Cost | Upkeep / day | Power (MW) | What it does |
|---|---|---|---|---|
| Ranger Station | $24,000 | $450 | 2 | Two rangers with tranquilizer rifles. |
| Maintenance Shed | $14,000 | $300 | 1 | Two engineers who repair fences and buildings. |
| ACU Helipad | $65,000 | $700 | 2 | Asset Containment helicopter airlifts sedated dinos home. |
| Vet Clinic | $30,000 | $350 | 2 | Treats sick dinosaurs and stops outbreaks. |

### Dinosaurs

| Building | Cost | Upkeep / day | Power (MW) | What it does |
|---|---|---|---|---|
| Aviary | $110,000 | $500 | 4 | Mesh dome for Pteranodons (up to 6). Below 35% condition, they escape. Needs a path for guests to enjoy it. |
| Research Lab | $35,000 | $400 | 3 | Researches upgrades and dinosaur genomes. More labs research faster. |
| Hatchery | $40,000 | $300 | 4 | Required to hatch dinosaurs. |
| Herbivore Feeder | $2,500 | $20 | 0 | Place inside a paddock. Each meal costs $150. |
| Carnivore Feeder | $4,500 | $30 | 0 | Live goats. Place inside a paddock. Each meal costs $400. |

Costs are for Standard difficulty at normal prices.

## Research

Build a **Research Lab** and open Research (**Y**). More labs research faster.

| Project | Cost | Hours | Effect |
|---|---|---|---|
| Reinforced Fences | $30,000 | 30 | Electric fences get 60% more integrity. |
| High-Voltage Grid | $70,000 | 48 | Shocks deter longer, and only the very strongest can push through a live fence. |
| Fast-Acting Tranquilizers | $40,000 | 36 | Every dinosaur needs one dart fewer to go down, and darts miss a running target less often. |
| Ranger Training | $35,000 | 30 | Rangers run 30% faster and shoot from further away. |
| Efficient Turbines | $45,000 | 36 | Power plants produce 40% more electricity. |
| Dinosaur Medicine | $30,000 | 30 | Illness heals twice as fast, with or without a Vet Clinic. |
| Automated Feeders | $35,000 | 30 | Each meal costs half as much. |
| Motion Sensors | $55,000 | 40 | Guests are warned from further away and camouflage no longer hides escapees. |
| ACU Gunship | $60,000 | 40 | ACU strikes cost $3k instead of $8k and helicopters fly faster. |
| Marketing Campaign | $50,000 | 24 | Permanently draws 15% more visitors. |
| Genome: Triceratops | $30,000 | 24 | Unlocks Triceratops without needing stars. |
| Genome: Velociraptor | $60,000 | 36 | Unlocks Velociraptors without needing stars. |
| Genome: Pteranodon | $50,000 | 30 | Unlocks Pteranodons without needing stars. |
| Genome: Tyrannosaurus | $140,000 | 60 | Unlocks the T. rex without needing stars. |
| Genome: Spinosaurus | $160,000 | 60 | Unlocks Spinosaurus without needing stars. |
| Hybrid: Indominus | $300,000 | 90 | Splice an Indominus without a 5-star rating. What could go wrong? |

## Disasters

Disasters arrive on their own (how often depends on difficulty) and you can trigger any of them from the ☄ menu.

| Disaster | What happens |
|---|---|
| Tropical Storm | Lightning, power cuts, stressed dinosaurs. |
| System Failure | A disgruntled programmer shuts down the grid. |
| Earthquake | Shakes fences and buildings apart. |
| Volcanic Eruption | Lava pours from the mountain. |
| Outbreak | A dinosaur falls ill. It may spread. |
| Rampage | A dinosaur goes berserk. |
| Clever Girls | Raptors coordinate a fence probe. |
| Safety Inspection | Inspector visit: fines or praise. |

## Difficulty and game options

| Difficulty | Starting money | Disasters |
|---|---|---|
| Calm | $650,000 | None. An overloaded grid can still let carnivores out. |
| Relaxed | $650,000 | Half as often |
| Standard | $450,000 | The intended experience |
| Chaos Theory | $400,000 | Every day or two, and predators are man-eaters (below) |

On **Chaos Theory** a loose predator hunts whether or not it has eaten, runs straight for the nearest guests
from anywhere in the park, goes round your staff to reach them, and guests take a moment to believe the alarm.
Keep predators far from the paths, respond at once and spread bunkers around.

You also choose island size (Small, Medium, Large) and day length.
**Sandbox mode** starts with $5,000,000, everything unlocked and no bankruptcy. The game autosaves at the start of each day.

## Goals and the late game

Free play has sixteen goals, each paying a grant:

| # | Goal | Grant |
|---|---|---|
| 1 | Build a Hatchery | $10,000 |
| 2 | Build a Power Plant | $10,000 |
| 3 | Fence a paddock (use the Paddock tool) and add a feeder inside | $15,000 |
| 4 | Hatch your first dinosaur | $20,000 |
| 5 | Connect paths to attractions and welcome 20 guests | $15,000 |
| 6 | Build a Ranger Station (rangers tranquilize escapees) | $10,000 |
| 7 | Build a Maintenance Shed (engineers repair fences) | $10,000 |
| 8 | Exhibit 3 different species | $30,000 |
| 9 | Reach a 2-star park rating | $40,000 |
| 10 | Hatch a carnivore (keep it away from herbivores!) | $30,000 |
| 11 | Build an ACU Helipad | $25,000 |
| 12 | Have 150 guests in the park at once | $60,000 |
| 13 | Exhibit a Tyrannosaurus rex | $80,000 |
| 14 | Reach a 4-star rating | $100,000 |
| 15 | Have $2,000,000 in the bank | none |
| 16 | Reach a 5-star rating: the greatest park on Earth | $250,000 |

After the last one the park earns **Legacy levels**: each needs a higher park score (370, 410, 450, ...) and
pays $100,000 × the level. Two late buildings give the money somewhere to go: the **Amber Museum** (+22
rating) and **Ferry Terminals** (more guests).

## Controls

| Input | Action |
| --- | --- |
| Left click | Use tool / select |
| Drag | Build lines (paths, fences, walls) and areas (paddock, demolish, trees, ponds) |
| Right-drag, or drag with Inspect | Pan |
| Mouse wheel / pinch | Zoom |
| WASD / arrows | Pan |
| Space, 1–4 | Pause / speed |
| E | Evacuation alarm |
| O / K | Power / paddock overlays |
| L | Jump to loose dinosaur |
| B / M | Respond to a breach / select all rangers |
| G | Dinosaur roster |
| U or Ctrl+Z | Undo last construction, demolition or egg |
| Y | Research |
| Q P I N J F R V X T C H | Tools: inspect, path, wide path, smart path, tour track, fence, paddock, wall, demolish, trees, clear, hatch |

On a phone or tablet: tap to use a tool, drag to build, drag with Inspect to pan, pinch to zoom.
