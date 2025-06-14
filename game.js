// Main game logic
import { gsap } from 'gsap';
import { Card, createStarterDeck, getCardById, getRandomCard, getRewardCards, animateCardPlayed, getRandomTradeOptions } from './cards.js';
import { Enemy, getRandomEnemy, getEnemyById } from './enemies.js';
import { Achievement, achievements } from './achievements.js';

class CardGame {
    constructor() {
        this.playerMaxHp = 100;
        this.playerHp = 100;
        this.playerBlock = 0;
        this.playerMaxEnergy = 3;
        this.playerEnergy = 3;
        this.playerStatuses = {}; // Status effects like strength, dexterity, etc.
        
        this.deck = []; // Player's full deck
        this.hand = []; // Cards in hand
        this.discardPile = []; // Discard pile
        this.drawPile = []; // Current draw pile
        
        this.currentEnemy = null;
        this.battleActive = false;
        this.enemiesDefeated = 0;
        this.battleLog = [];
        
        this.gold = 100;
        this.tradesCompleted = 0;
        this.cardsPlayedThisTurn = 0;
        this.achievements = [...achievements];
        
        this.initializeGame();
    }
    
    // Initialize game elements and event listeners
    initializeGame() {
        // Initialize DOM elements
        this.gameContainer = document.getElementById('game-container');
        this.titleScreen = document.getElementById('title-screen');
        this.tutorialScreen = document.getElementById('tutorial-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.rewardScreen = document.getElementById('reward-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.tradingScreen = document.getElementById('trading-screen');
        this.achievementScreen = document.getElementById('achievement-screen');
        
        this.enemyNameElement = document.getElementById('enemy-name');
        this.enemyHealthElement = document.getElementById('enemy-health');
        this.enemyHealthBar = document.getElementById('enemy-health-bar');
        this.enemyIntentElement = document.getElementById('enemy-intent');
        this.enemyImageElement = document.getElementById('enemy-image');
        
        this.playerHealthElement = document.getElementById('player-health');
        this.playerHealthBar = document.getElementById('player-health-bar');
        this.playerEnergyElement = document.getElementById('player-energy');
        this.playerBlockElement = document.getElementById('player-block');
        
        this.handContainer = document.getElementById('hand-container');
        this.deckPile = document.getElementById('deck-pile');
        this.discardPileElement = document.getElementById('discard-pile');
        this.battleLogElement = document.getElementById('battle-log');
        
        this.endTurnButton = document.getElementById('end-turn-button');
        this.rewardCardsContainer = document.getElementById('reward-cards');
        this.tradingButton = document.getElementById('trading-button');
        this.achievementsButton = document.getElementById('achievements-button');
        
        // Initialize buttons
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('how-to-play').addEventListener('click', () => this.showTutorial());
        document.getElementById('tutorial-back').addEventListener('click', () => this.showTitleScreen());
        this.endTurnButton.addEventListener('click', () => this.endPlayerTurn());
        document.getElementById('skip-reward').addEventListener('click', () => this.startNextBattle());
        document.getElementById('play-again').addEventListener('click', () => this.resetGame());
        this.tradingButton.addEventListener('click', () => this.showTradingScreen());
        this.achievementsButton.addEventListener('click', () => this.showAchievementScreen());
        document.getElementById('close-trading').addEventListener('click', () => {
            document.getElementById('trading-screen').classList.add('hidden');
        });
        document.getElementById('close-achievements').addEventListener('click', () => {
            document.getElementById('achievement-screen').classList.add('hidden');
        });
        
        // Show title screen
        this.showTitleScreen();
    }
    
    // Show title screen
    showTitleScreen() {
        this.titleScreen.classList.remove('hidden');
        this.tutorialScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.rewardScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.tradingScreen.classList.add('hidden');
        this.achievementScreen.classList.add('hidden');
    }
    
    // Show tutorial screen
    showTutorial() {
        this.titleScreen.classList.add('hidden');
        this.tutorialScreen.classList.remove('hidden');
    }
    
    // Start new game
    startGame() {
        // Initialize player deck
        this.deck = createStarterDeck();
        this.playerHp = this.playerMaxHp;
        this.enemiesDefeated = 0;
        
        this.titleScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        
        // Start first battle
        this.startNewBattle();
    }
    
    // Start a new battle
    startNewBattle() {
        // Reset battle state
        this.hand = [];
        this.discardPile = [];
        this.drawPile = [...this.deck]; // Copy deck to draw pile
        this.shuffleDrawPile();
        
        this.playerEnergy = this.playerMaxEnergy;
        this.playerBlock = 0;
        this.playerStatuses = {};
        
        // Get a random enemy
        this.currentEnemy = getRandomEnemy();
        
        // Set up enemy display
        this.enemyNameElement.textContent = this.currentEnemy.name;
        this.updateEnemyHealth();
        
        // Set enemy image based on name
        const enemyImageName = this.currentEnemy.name.toLowerCase().replace(' ', '_');
        this.enemyImageElement.src = `images/enemy_${enemyImageName}.png`;
        
        // Choose enemy's first move
        this.currentEnemy.chooseNextMove();
        this.updateEnemyIntent();
        
        // Draw initial hand
        this.drawCards(5);
        
        // Update UI
        this.updatePlayerStats();
        this.updateCardPiles();
        this.clearBattleLog();
        this.addToBattleLog(`Battle with ${this.currentEnemy.name} begins!`);
        
        this.battleActive = true;
    }
    
    // Update enemy health display
    updateEnemyHealth() {
        this.enemyHealthElement.textContent = `HP: ${this.currentEnemy.hp}/${this.currentEnemy.maxHp}`;
        const healthPercentage = (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100;
        this.enemyHealthBar.style.width = `${healthPercentage}%`;
    }
    
    // Update enemy intent display
    updateEnemyIntent() {
        if (this.currentEnemy && this.currentEnemy.nextMove) {
            this.enemyIntentElement.textContent = `Intent: ${this.currentEnemy.nextMove.description}`;
        } else {
            this.enemyIntentElement.textContent = "Intent: Unknown";
        }
    }
    
    // Update player stats display
    updatePlayerStats() {
        this.playerHealthElement.textContent = `HP: ${this.playerHp}/${this.playerMaxHp}`;
        const healthPercentage = (this.playerHp / this.playerMaxHp) * 100;
        this.playerHealthBar.style.width = `${healthPercentage}%`;
        
        this.playerEnergyElement.textContent = `Energy: ${this.playerEnergy}/${this.playerMaxEnergy}`;
        this.playerBlockElement.textContent = `Block: ${this.playerBlock}`;
    }
    
    // Update card piles display
    updateCardPiles() {
        // Update draw pile count
        this.deckPile.querySelector('.pile-count').textContent = this.drawPile.length;
        
        // Update discard pile count
        this.discardPileElement.querySelector('.pile-count').textContent = this.discardPile.length;
    }
    
    // Shuffle draw pile
    shuffleDrawPile() {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
    }
    
    // Draw cards from draw pile
    drawCards(count) {
        for (let i = 0; i < count; i++) {
            if (this.drawPile.length === 0) {
                // If draw pile is empty, shuffle discard pile into draw pile
                if (this.discardPile.length === 0) {
                    // If both piles are empty, can't draw more cards
                    break;
                }
                this.drawPile = [...this.discardPile];
                this.discardPile = [];
                this.shuffleDrawPile();
                this.updateCardPiles();
            }
            
            // Draw a card and add to hand
            const card = this.drawPile.pop();
            this.hand.push(card);
        }
        
        // Update hand display
        this.updateHandDisplay();
        this.updateCardPiles();
    }
    
    // Update hand display
    updateHandDisplay() {
        // Clear hand container
        this.handContainer.innerHTML = '';
        
        // Add cards to hand
        this.hand.forEach(card => {
            const cardElement = card.createCardElement();
            
            // Check if card is playable (enough energy)
            if (!this.canPlayCard(card)) {
                cardElement.classList.add('not-playable');
            }
            
            this.handContainer.appendChild(cardElement);
        });
    }
    
    // Check if a card can be played
    canPlayCard(card) {
        return this.playerEnergy >= card.cost && this.battleActive;
    }
    
    // Play a card from hand
    playCard(card) {
        if (!this.canPlayCard(card)) return;
        
        // Find the card in hand
        const cardIndex = this.hand.findIndex(c => c.id === card.id);
        if (cardIndex === -1) return;
        
        // Remove the card from hand
        const playedCard = this.hand.splice(cardIndex, 1)[0];
        
        // Find the card element and apply animation
        const cardElements = this.handContainer.querySelectorAll('.card');
        const cardElement = Array.from(cardElements).find(elem => elem.dataset.cardId == playedCard.id);
        
        if (cardElement) {
            // Get enemy element position for attack animation target
            const enemyRect = this.enemyImageElement.getBoundingClientRect();
            const targetX = enemyRect.left + enemyRect.width / 2;
            const targetY = enemyRect.top + enemyRect.height / 2;
            
            // Animate card being played
            animateCardPlayed(cardElement, targetX, targetY);
        }
        
        // Pay energy cost
        this.playerEnergy -= playedCard.cost;
        
        // Execute card effect
        playedCard.effect(this);
        
        // Add card to discard pile
        this.discardPile.push(playedCard);
        
        // Add to battle log
        this.addToBattleLog(`You played ${playedCard.name}.`);
        
        // Update UI
        this.updateHandDisplay();
        this.updatePlayerStats();
        this.updateCardPiles();
        this.updateEnemyHealth();
        
        // Check for battle end
        this.checkBattleEnd();
        
        this.cardsPlayedThisTurn++;
        this.checkAchievements();
    }
    
    // Deal damage to the enemy
    dealDamageToEnemy(amount) {
        // Apply strength if player has it
        if (this.playerStatuses.strength > 0) {
            amount += this.playerStatuses.strength;
        }
        
        // Apply enemy damage
        const result = this.currentEnemy.takeDamage(amount);
        
        // Create floating damage text
        this.createFloatingText(result.damage, 'damage-text', this.enemyImageElement);
        
        // Update battle log
        if (result.block > 0) {
            this.addToBattleLog(`You dealt ${amount} damage. Enemy blocked ${result.block} damage. ${result.damage} damage dealt to enemy.`);
        } else {
            this.addToBattleLog(`You dealt ${amount} damage to the enemy.`);
        }
        
        // Update enemy health display
        this.updateEnemyHealth();
        
        // Animate enemy taking damage
        const enemyElement = document.getElementById('enemy-display');
        enemyElement.classList.add('shake');
        setTimeout(() => {
            enemyElement.classList.remove('shake');
        }, 500);
    }
    
    // Deal damage to the player
    dealDamageToPlayer(amount) {
        // Apply enemy strength if they have it
        if (this.currentEnemy.statuses.strength > 0) {
            amount += this.currentEnemy.statuses.strength;
        }
        
        // Apply weak status effect
        if (this.currentEnemy.statuses.weak > 0) {
            amount = Math.floor(amount * 0.75);
        }
        
        // Apply player vulnerable status
        if (this.playerStatuses.vulnerable > 0) {
            amount = Math.floor(amount * 1.5);
        }
        
        // Check player block
        let damageToHp = amount;
        let blockAbsorbed = 0;
        
        if (this.playerBlock >= amount) {
            this.playerBlock -= amount;
            blockAbsorbed = amount;
            damageToHp = 0;
        } else {
            damageToHp = amount - this.playerBlock;
            blockAbsorbed = this.playerBlock;
            this.playerBlock = 0;
        }
        
        // Apply damage to player hp
        if (damageToHp > 0) {
            this.playerHp -= damageToHp;
            if (this.playerHp < 0) this.playerHp = 0;
            
            // Create floating damage text
            this.createFloatingText(damageToHp, 'damage-text', document.getElementById('player-stats'));
            
            // Animate player taking damage
            const playerSection = document.getElementById('player-section');
            playerSection.classList.add('shake');
            setTimeout(() => {
                playerSection.classList.remove('shake');
            }, 500);
        }
        
        // Update battle log
        if (blockAbsorbed > 0) {
            this.addToBattleLog(`Enemy dealt ${amount} damage. You blocked ${blockAbsorbed} damage. ${damageToHp} damage taken.`);
        } else {
            this.addToBattleLog(`Enemy dealt ${amount} damage to you.`);
        }
        
        // Update player stats display
        this.updatePlayerStats();
    }
    
    // Gain block for player
    gainBlock(amount) {
        this.playerBlock += amount;
        this.createFloatingText(amount, 'block-text', document.getElementById('player-stats'));
        this.addToBattleLog(`You gained ${amount} Block.`);
        this.updatePlayerStats();
    }
    
    // Gain energy for player
    gainEnergy(amount) {
        this.playerEnergy += amount;
        this.addToBattleLog(`You gained ${amount} Energy.`);
        this.updatePlayerStats();
    }
    
    // Apply status effect to player
    applyPlayerStatus(status, value) {
        if (!this.playerStatuses[status]) {
            this.playerStatuses[status] = 0;
        }
        this.playerStatuses[status] += value;
        this.addToBattleLog(`You gained ${value} ${status}.`);
    }
    
    // Apply status effect to enemy
    applyEnemyStatus(status, value) {
        this.currentEnemy.applyStatus(status, value);
        this.addToBattleLog(`Enemy gained ${value} ${status}.`);
    }
    
    // Create floating text animation
    createFloatingText(value, className, targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const textElement = document.createElement('div');
        textElement.className = className;
        textElement.textContent = value;
        textElement.style.left = `${rect.left + rect.width / 2}px`;
        textElement.style.top = `${rect.top + rect.height / 2}px`;
        document.body.appendChild(textElement);
        
        setTimeout(() => {
            textElement.remove();
        }, 1000);
    }
    
    // End player turn
    endPlayerTurn() {
        if (!this.battleActive) return;
        
        // Apply end of turn effects
        this.applyEndOfTurnEffects();
        
        // Move all cards from hand to discard pile
        while (this.hand.length > 0) {
            this.discardPile.push(this.hand.pop());
        }
        
        // Enemy turn
        this.executeEnemyTurn();
        
        // Check if battle ends after enemy turn
        if (this.checkBattleEnd()) return;
        
        // Start new player turn
        this.startNewPlayerTurn();
    }
    
    // Apply end of turn effects
    applyEndOfTurnEffects() {
        // Apply metallicize if player has it
        if (this.playerStatuses.metallicize > 0) {
            this.gainBlock(this.playerStatuses.metallicize);
        }
        
        // Decrease player status durations
        for (const status in this.playerStatuses) {
            if (this.playerStatuses[status] > 0 && status !== 'strength' && status !== 'metallicize') {
                this.playerStatuses[status]--;
            }
        }
    }
    
    // Execute enemy turn
    executeEnemyTurn() {
        if (!this.currentEnemy || this.currentEnemy.isDead()) return;
        
        // Execute enemy move
        const moveName = this.currentEnemy.executeMove(this);
        this.addToBattleLog(`Enemy used ${moveName}.`);
        
        // Decrease enemy status effects
        this.currentEnemy.decreaseStatuses();
        
        // Choose next move
        this.currentEnemy.chooseNextMove();
        this.updateEnemyIntent();
    }
    
    // Start new player turn
    startNewPlayerTurn() {
        // Reset energy
        this.playerEnergy = this.playerMaxEnergy;
        
        // Apply start of turn effects
        this.applyStartOfTurnEffects();
        
        // Draw new hand
        this.drawCards(5);
        
        // Update UI
        this.updatePlayerStats();
        this.updateCardPiles();
        
        this.addToBattleLog("Your turn begins.");
        
        this.cardsPlayedThisTurn = 0;
    }
    
    // Apply start of turn effects
    applyStartOfTurnEffects() {
        // Apply demon form if player has it
        if (this.playerStatuses.demon_form > 0) {
            this.applyPlayerStatus('strength', 2);
        }
    }
    
    // Check if battle has ended
    checkBattleEnd() {
        // Check if enemy is defeated
        if (this.currentEnemy.isDead()) {
            this.battleActive = false;
            this.enemiesDefeated++;
            this.addToBattleLog(`You defeated the ${this.currentEnemy.name}!`);
            
            // Show reward screen
            setTimeout(() => {
                this.showRewardScreen();
            }, 1000);
            
            return true;
        }
        
        // Check if player is defeated
        if (this.playerHp <= 0) {
            this.battleActive = false;
            this.addToBattleLog("You were defeated!");
            
            // Show game over screen
            setTimeout(() => {
                this.showGameOverScreen();
            }, 1000);
            
            return true;
        }
        
        return false;
    }
    
    // Show reward screen with card rewards
    showRewardScreen() {
        this.gameScreen.classList.add('hidden');
        this.rewardScreen.classList.remove('hidden');
        
        // Generate 3 random card rewards
        const rewardCards = getRewardCards();
        this.rewardCardsContainer.innerHTML = '';
        
        rewardCards.forEach(card => {
            const cardElement = card.createCardElement();
            
            // Add click event to add card to deck
            cardElement.addEventListener('click', () => {
                this.addCardToDeck(card);
                this.startNextBattle();
            });
            
            this.rewardCardsContainer.appendChild(cardElement);
        });
    }
    
    // Add a card to player's deck
    addCardToDeck(card) {
        this.deck.push(card);
        this.addToBattleLog(`Added ${card.name} to your deck.`);
    }
    
    // Start the next battle
    startNextBattle() {
        this.rewardScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.startNewBattle();
    }
    
    // Show game over screen
    showGameOverScreen() {
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        
        document.getElementById('final-score').textContent = `You defeated ${this.enemiesDefeated} enemies.`;
    }
    
    // Reset game for play again
    resetGame() {
        this.gameOverScreen.classList.add('hidden');
        this.titleScreen.classList.remove('hidden');
    }
    
    // Add message to battle log
    addToBattleLog(message) {
        this.battleLog.push(message);
        
        // Update battle log display
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        this.battleLogElement.appendChild(logEntry);
        
        // Scroll to bottom
        this.battleLogElement.scrollTop = this.battleLogElement.scrollHeight;
        
        // Keep only the last 20 messages
        if (this.battleLog.length > 20) {
            this.battleLog.shift();
            if (this.battleLogElement.firstChild) {
                this.battleLogElement.removeChild(this.battleLogElement.firstChild);
            }
        }
    }
    
    // Clear battle log
    clearBattleLog() {
        this.battleLog = [];
        this.battleLogElement.innerHTML = '';
    }
    
    // Show trading screen
    showTradingScreen() {
        const tradingScreen = document.getElementById('trading-screen');
        tradingScreen.classList.remove('hidden');
        this.updateTradingOptions();
    }
    
    // Update trading options
    updateTradingOptions() {
        const playerTradeCards = document.getElementById('player-trade-cards');
        const merchantTradeCards = document.getElementById('merchant-trade-cards');
        
        playerTradeCards.innerHTML = '';
        this.deck.forEach(card => {
            const cardElement = card.createCardElement();
            cardElement.addEventListener('click', () => this.tradeCard(card));
            playerTradeCards.appendChild(cardElement);
        });
        
        merchantTradeCards.innerHTML = '';
        const tradeOptions = getRandomTradeOptions();
        tradeOptions.forEach(card => {
            const cardElement = card.createCardElement();
            merchantTradeCards.appendChild(cardElement);
        });
    }
    
    // Trade a card from player's deck
    tradeCard(playerCard) {
        const merchantCards = document.querySelectorAll('#merchant-trade-cards .card');
        merchantCards.forEach(merchantCardElement => {
            merchantCardElement.addEventListener('click', () => {
                const merchantCardId = parseInt(merchantCardElement.dataset.cardId);
                const merchantCard = getCardById(merchantCardId);
                
                // Remove player's card and add merchant's card
                this.deck = this.deck.filter(c => c.id !== playerCard.id);
                this.deck.push(merchantCard);
                
                this.tradesCompleted++;
                this.updateTradingOptions();
                
                // Check trading achievement
                this.checkAchievements();
            });
        });
    }
    
    // Show achievement screen
    showAchievementScreen() {
        const achievementScreen = document.getElementById('achievement-screen');
        const achievementList = document.getElementById('achievement-list');
        
        achievementList.innerHTML = '';
        this.achievements.forEach(achievement => {
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement-item ${achievement.unlocked ? 'unlocked' : ''}`;
            achievementElement.innerHTML = `
                <img src="images/achievement_icon.png" alt="Achievement">
                <div>
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                </div>
            `;
            achievementList.appendChild(achievementElement);
        });
        
        achievementScreen.classList.remove('hidden');
    }
    
    // Show achievement notification
    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievement-notification');
        notification.querySelector('h3').textContent = achievement.name;
        notification.querySelector('p').textContent = achievement.description;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
    
    // Check achievements
    checkAchievements() {
        this.achievements.forEach(achievement => achievement.check(this));
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new CardGame();
});