# Scenarios and campaign

Prebuilt situations with an objective, a deadline and medals. Your best medal for each is saved in the browser.

## Scenarios

| Scenario | Objective | Medals |
|---|---|---|
| **Nedry's Night** | Survive to Day 3, 08:00 with fewer than 4 guest casualties | Gold: no casualties · Silver: 1 casualty |
| **Isla Sorna Cleanup** | Contain every dinosaur by the end of Day 10 | Gold: by Day 4 · Silver: by Day 6 |
| **The Lost World** | Ship 6 dinosaurs, including the T. rex, by the end of Day 6 | Gold: by Day 3 · Silver: by Day 4 |
| **Opening Day** | Welcome 1,400 guests by Day 5 with fewer than 6 casualties | Gold: no casualties by Day 4 · Silver: 2 or fewer casualties |
| **Raptor Siege** | Lose fewer than 8 guests before Day 3, 12:00 | Gold: no casualties · Silver: 3 or fewer |
| **Storm Season** | Earn $430,000 from guests (tickets, shops and rides) by Day 12 | Gold: by Day 10 · Silver: by Day 11 |

- **Nedry's Night**: the grid fails at 20:00 on the first night. Walls, a Backup Generator and bunkers before
  dark make the difference between gold and a massacre.
- **Isla Sorna Cleanup** and **The Lost World**: animals are roaming free. Build pens first: an animal can
  only be relocated into a paddock of at least 30% of its species' space (12 tiles minimum).
- **Opening Day**: the crowds are coming and the Indominus is restless.
- **Raptor Siege**: hold out until rescue. Bunkers and the alarm.
- **Storm Season**: a storm every day. The target counts what guests spend (tickets, shops, rides), not your
  bank balance, so building is never punished. Grow the park: sitting still falls short.

## Campaign

Five chapters, played in order. Finishing one unlocks the next and gives a perk in every later chapter.

| Chapter | Objective | Medals | Perk for later chapters |
|---|---|---|---|
| **1. Opening Season** | Reach 2 stars, have 120 guests in the park at once and earn $150,000 from guests, by Day 15 | Gold: by Day 8 · Silver: by Day 11 | +$100k starting money |
| **2. Clever Girls** | Exhibit 3 raptors and hold 24 raptor shows by Day 12, with no more than 4 raptor escapes | Gold: no raptor escapes · Silver: 2 or fewer | Ranger Training researched |
| **3. Monsoon** | Earn $375,000 from guests (tickets, shops and rides) and keep reputation 50+, by Day 26 | Gold: by Day 24 · Silver: by Day 25 | Reinforced Fences researched |
| **4. Site B** | Contain every dinosaur and reach 3 stars by Day 18 | Gold: by Day 9 · Silver: by Day 12 | Fast-Acting Tranquilizers and ACU Gunship researched |
| **5. Jurassic World** | Reach 5 stars with a T. rex on show, a Mosasaur Lagoon and 400 guests at once | Gold: by Day 45 · Silver: by Day 60 | none (the finale) |

- **Clever Girls** counts only raptor escapes; a storm letting the Gallimimus wander does not fail it.
- **Monsoon** and **Storm Season** money goals count guest spending only.

## How these are kept fair

Every scenario and chapter is played by bots on fixed seeds in CI, once sensibly and once badly. Sensible
play has to win and poor play has to be able to lose. See [development.md](development.md#balance-sweep).
