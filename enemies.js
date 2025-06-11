// Enemy definitions and related functionality

// Enemy class
class Enemy {
    constructor(id, name, hp, moves) {
        this.id = id;
        this.name = name;
        this.maxHp = hp;
        this.hp = hp;
        this.moves = moves; // Array of possible moves
        this.block = 0;
        this.statuses = {}; // Status effects like vulnerable, weak, etc.
        this.nextMove = null; // The next move the enemy will make
    }

    // Choose a move for the next turn
    chooseNextMove() {
        const availableMoves = this.moves.filter(move => {
            if (move.conditions) {
                return move.conditions(this);
            }
            return true;
        });

        if (availableMoves.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableMoves.length);
            this.nextMove = availableMoves[randomIndex];
        } else {
            // Fallback if no valid moves
            this.nextMove = {
                name: "Confused",
                description: "Does nothing",
                effect: () => {}
            };
        }
        
        return this.nextMove;
    }

    // Execute the chosen move
    executeMove(game) {
        if (this.nextMove) {
            this.nextMove.effect(game, this);
            return this.nextMove.name;
        }
        return "No move";
    }

    // Take damage method
    takeDamage(amount) {
        // Apply vulnerable status effect
        if (this.statuses.vulnerable > 0) {
            amount = Math.floor(amount * 1.5);
        }

        if (this.block >= amount) {
            this.block -= amount;
            return { damage: 0, block: amount };
        } else {
            const damageToHp = amount - this.block;
            const blockAbsorbed = this.block;
            this.block = 0;
            this.hp -= damageToHp;
            if (this.hp < 0) this.hp = 0;
            return { damage: damageToHp, block: blockAbsorbed };
        }
    }

    // Apply status effect
    applyStatus(status, value) {
        if (!this.statuses[status]) {
            this.statuses[status] = 0;
        }
        this.statuses[status] += value;
    }

    // Decrease status durations at the end of turn
    decreaseStatuses() {
        for (const status in this.statuses) {
            if (this.statuses[status] > 0) {
                this.statuses[status]--;
            }
        }
    }

    // Check if enemy is dead
    isDead() {
        return this.hp <= 0;
    }

    // Clone the enemy
    clone() {
        return new Enemy(
            this.id, 
            this.name, 
            this.maxHp,
            this.moves.map(move => ({ ...move }))
        );
    }
}

// Enemy move: a function that defines what the enemy does on its turn
class EnemyMove {
    constructor(name, description, effect, conditions = null) {
        this.name = name;
        this.description = description;
        this.effect = effect; // Function that applies the effect
        this.conditions = conditions; // Optional conditions for when this move can be used
    }
}

// Define enemy types
const enemyTypes = [
    new Enemy(1, "Goblin", 30, [
        new EnemyMove(
            "Slash", 
            "Deal 8 damage", 
            (game) => {
                game.dealDamageToPlayer(8);
            }
        ),
        new EnemyMove(
            "Defend", 
            "Gain 5 block", 
            (game, enemy) => {
                enemy.block += 5;
            }
        )
    ]),
    
    new Enemy(2, "Skeleton", 45, [
        new EnemyMove(
            "Bone Strike", 
            "Deal 10 damage", 
            (game) => {
                game.dealDamageToPlayer(10);
            }
        ),
        new EnemyMove(
            "Armor Up", 
            "Gain 8 block", 
            (game, enemy) => {
                enemy.block += 8;
            }
        ),
        new EnemyMove(
            "Weaken", 
            "Apply 2 weak", 
            (game) => {
                game.applyPlayerStatus('weak', 2);
            }
        )
    ]),
    
    new Enemy(3, "Dark Slime", 60, [
        new EnemyMove(
            "Slime Tackle", 
            "Deal 12 damage", 
            (game) => {
                game.dealDamageToPlayer(12);
            }
        ),
        new EnemyMove(
            "Split", 
            "Deal 6 damage twice", 
            (game) => {
                game.dealDamageToPlayer(6);
                game.dealDamageToPlayer(6);
            }
        ),
        new EnemyMove(
            "Goo Shield", 
            "Gain 10 block", 
            (game, enemy) => {
                enemy.block += 10;
            }
        )
    ]),
    
    new Enemy(4, "Cultist", 50, [
        new EnemyMove(
            "Dark Ritual", 
            "Gain 3 strength", 
            (game, enemy) => {
                enemy.applyStatus('strength', 3);
            },
            (enemy) => enemy.hp > enemy.maxHp / 2 // Only use when above half health
        ),
        new EnemyMove(
            "Blood Slash", 
            "Deal 15 damage", 
            (game) => {
                game.dealDamageToPlayer(15);
            }
        ),
        new EnemyMove(
            "Sacrifice", 
            "Lose 5 HP, deal 20 damage", 
            (game, enemy) => {
                enemy.hp -= 5;
                game.dealDamageToPlayer(20);
            },
            (enemy) => enemy.hp > 10 // Only use when enough HP
        )
    ]),
    
    new Enemy(5, "Dragon Whelp", 70, [
        new EnemyMove(
            "Flame Breath", 
            "Deal 18 damage", 
            (game) => {
                game.dealDamageToPlayer(18);
            }
        ),
        new EnemyMove(
            "Tail Sweep", 
            "Deal 10 damage, apply 2 weak", 
            (game) => {
                game.dealDamageToPlayer(10);
                game.applyPlayerStatus('weak', 2);
            }
        ),
        new EnemyMove(
            "Growl", 
            "Apply 3 vulnerable", 
            (game) => {
                game.applyPlayerStatus('vulnerable', 3);
            }
        ),
        new EnemyMove(
            "Scale Shield", 
            "Gain 15 block", 
            (game, enemy) => {
                enemy.block += 15;
            },
            (enemy) => enemy.hp < enemy.maxHp / 2 // Only use when below half health
        )
    ])
];

// Get random enemy
function getRandomEnemy() {
    const randomIndex = Math.floor(Math.random() * enemyTypes.length);
    return enemyTypes[randomIndex].clone();
}

// Get specific enemy by ID
function getEnemyById(id) {
    const enemy = enemyTypes.find(enemy => enemy.id === id);
    return enemy ? enemy.clone() : null;
}

export { Enemy, getRandomEnemy, getEnemyById };