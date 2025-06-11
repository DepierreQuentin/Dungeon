// Achievement system
class Achievement {
    constructor(id, name, description, condition, reward) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.condition = condition;
        this.reward = reward;
        this.unlocked = false;
    }

    check(game) {
        if (!this.unlocked && this.condition(game)) {
            this.unlock(game);
        }
    }

    unlock(game) {
        this.unlocked = true;
        this.reward(game);
        game.showAchievementNotification(this);
    }
}

const achievements = [
    new Achievement(
        1,
        "First Victory",
        "Win your first battle",
        (game) => game.enemiesDefeated === 1,
        (game) => game.addCardToDeck(getCardById(16)) // Fire Blast card
    ),
    new Achievement(
        2,
        "Perfect Defense",
        "End a battle with 30+ block",
        (game) => game.playerBlock >= 30,
        (game) => game.addCardToDeck(getCardById(17)) // Ice Shield card
    ),
    new Achievement(
        3,
        "Master Strategist",
        "Play 6 cards in one turn",
        (game) => game.cardsPlayedThisTurn >= 6,
        (game) => game.addCardToDeck(getCardById(18)) // Thunder Strike card
    ),
    new Achievement(
        4,
        "Card Collector",
        "Collect 20 different cards",
        (game) => new Set(game.deck.map(card => card.id)).size >= 20,
        (game) => game.addGold(100)
    ),
    new Achievement(
        5,
        "Trading Master",
        "Complete 3 card trades",
        (game) => game.tradesCompleted >= 3,
        (game) => game.addCardToDeck(getCardById(19)) // Vampiric Strike card
    )
];

export { Achievement, achievements };