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
        
        this.deck = []; // Player's active deck
        this.collection = []; // All owned cards
        this.minDeckSize = 10;
        this.maxDeckSize = 20;
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
        this.inMerchantRoom = false;
        this.pendingAmbush = false;
        this.eventCardForSale = null;
        this.eventCardCost = 0;

        // Track gold at the start of each battle
        this.goldAtBattleStart = this.gold;

        // Pending rewards or damage to apply when the player continues
        this.pendingGold = 0;
        this.pendingHp = 0;

        this.loadSounds();

        this.initializeGame();
        this.questPool = this.initializeQuestPool();
        this.activeQuests = [];
        this.damageThisTurn = 0;
        this.blockThisTurn = 0;
        this.turnCounter = 0;
        this.attackCardsThisBattle = 0;
        this.defenseCardPlayed = false;
        this.damageTakenThisBattle = 0;
    }
    
    // Initialize game elements and event listeners
    initializeGame() {
        // Initialize DOM elements
        this.gameContainer = document.getElementById('game-container');
        this.titleScreen = document.getElementById('title-screen');
        this.tutorialScreen = document.getElementById('tutorial-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.dungeonScreen = document.getElementById('dungeon-screen');
        this.eventScreen = document.getElementById('event-screen');
        this.rewardScreen = document.getElementById('reward-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.merchantScreen = document.getElementById('merchant-screen');
        this.packScreen = document.getElementById('pack-screen');
        this.restScreen = document.getElementById('rest-screen');
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
        this.questContainer = document.getElementById('quest-container');
        this.enemyTurnIndicator = document.getElementById('enemy-turn-indicator');

        this.goldDisplay = document.getElementById('gold-display');
        this.hpDisplay = document.getElementById('hp-display');
        this.playerSection = document.getElementById('player-section');

        this.roomOptionsElement = document.getElementById('room-options');
        this.upcoming1Element = document.getElementById('upcoming-set1');
        this.upcoming2Element = document.getElementById('upcoming-set2');
        this.eventTextElement = document.getElementById('event-text');
        
        this.endTurnButton = document.getElementById('end-turn-button');
        this.rewardTextElement = document.getElementById('reward-text');
        this.deckButton = document.getElementById('deck-button');
        this.deckScreen = document.getElementById('deck-screen');
        this.drawPileScreen = document.getElementById('draw-pile-screen');
        this.discardPileScreen = document.getElementById('discard-pile-screen');
        this.achievementsButton = document.getElementById('achievements-button');
        
        // Initialize buttons
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('how-to-play').addEventListener('click', () => this.showTutorial());
        document.getElementById('tutorial-back').addEventListener('click', () => this.showTitleScreen());
        this.endTurnButton.addEventListener('click', () => this.endPlayerTurn());
        document.getElementById('reward-continue').addEventListener('click', () => this.startNextRoom());
        document.getElementById('event-continue').addEventListener('click', () => {
            if (this.pendingGold !== 0) {
                this.addGold(this.pendingGold);
                this.pendingGold = 0;
            }
            if (this.pendingHp !== 0) {
                const change = this.pendingHp;
                this.pendingHp = 0;
                this.playerHp = Math.max(0, Math.min(this.playerHp + change, this.playerMaxHp));
                this.updatePlayerStats();
            }

            this.eventScreen.classList.add('hidden');
            if (this.pendingAmbush) {
                this.pendingAmbush = false;
                this.gameScreen.classList.remove('hidden');
                this.startNewBattle();
            } else {
                this.showDungeonScreen();
            }
        });
        document.getElementById('event-buy').addEventListener('click', () => {
            if (this.gold >= this.eventCardCost && this.eventCardForSale) {
                this.addGold(-this.eventCardCost);
                this.addCardToDeck(this.eventCardForSale);
                this.updateDeckCount();
            }
            this.hideEventButtons();
            this.eventScreen.classList.add('hidden');
            this.showDungeonScreen();
        });
        document.getElementById('event-skip').addEventListener('click', () => {
            this.hideEventButtons();
            this.eventScreen.classList.add('hidden');
            this.showDungeonScreen();
        });
        document.getElementById('play-again').addEventListener('click', () => this.resetGame());
        this.deckButton.addEventListener('click', () => this.showDeckScreen());
        this.deckPile.addEventListener('click', () => this.showDrawPileScreen());
        this.discardPileElement.addEventListener('click', () => this.showDiscardPileScreen());
        this.achievementsButton.addEventListener('click', () => this.showAchievementScreen());
        const deckBackdrop = document.querySelector('.card-backdrop');
        document.getElementById('close-deck').addEventListener('click', () => {
            this.deckScreen.classList.add('hidden');
            deckBackdrop.classList.remove('active');
        });
        document.getElementById('close-draw-pile').addEventListener('click', () => {
            this.drawPileScreen.classList.add('hidden');
            deckBackdrop.classList.remove('active');
        });
        document.getElementById('close-discard-pile').addEventListener('click', () => {
            this.discardPileScreen.classList.add('hidden');
            deckBackdrop.classList.remove('active');
        });
        deckBackdrop.addEventListener('click', () => {
            this.deckScreen.classList.add('hidden');
            this.drawPileScreen.classList.add('hidden');
            this.discardPileScreen.classList.add('hidden');
            deckBackdrop.classList.remove('active');
        });
        document.getElementById('close-merchant').addEventListener('click', () => {
            this.merchantScreen.classList.add('hidden');
            if (this.inMerchantRoom) {
                this.inMerchantRoom = false;
                this.showDungeonScreen();
            }
        });
        document.getElementById('pack-continue').addEventListener('click', () => {
            const deckBackdrop = document.querySelector('.card-backdrop');
            this.packScreen.classList.add('hidden');
            deckBackdrop.classList.remove('active');
            if (this.inMerchantRoom) {
                // Preserve merchant context so the player can exit correctly
                this.showMerchantScreen(true);
            } else {
                this.showDungeonScreen();
            }
        });
        document.getElementById('rest-continue').addEventListener('click', () => {
            if (this.pendingHp !== 0) {
                const change = this.pendingHp;
                this.pendingHp = 0;
                this.playerHp = Math.max(0, Math.min(this.playerHp + change, this.playerMaxHp));
                this.updatePlayerStats();
            }
            this.restScreen.classList.add('hidden');
            this.showDungeonScreen();
        });
        document.getElementById('close-achievements').addEventListener('click', () => {
            document.getElementById('achievement-screen').classList.add('hidden');
            if (this.battleActive) {
                this.playerSection.classList.remove('hidden');
            }
        });
        
        // Show title screen
        this.showTitleScreen();
    }
    
    // Show title screen
    showTitleScreen() {
        this.titleScreen.classList.remove('hidden');
        this.tutorialScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.dungeonScreen.classList.add('hidden');
        this.eventScreen.classList.add('hidden');
        this.rewardScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.achievementScreen.classList.add('hidden');
        this.goldDisplay.classList.add('hidden');
        this.hpDisplay.classList.add('hidden');
        this.playerSection.classList.add('hidden');
        this.deckButton.classList.add('hidden');
        this.battleLogElement.classList.add('hidden');
        this.questContainer.classList.add('hidden');
        this.enemyTurnIndicator.classList.add('hidden');
        this.deckScreen.classList.add('hidden');
        this.drawPileScreen.classList.add('hidden');
        this.discardPileScreen.classList.add('hidden');
        document.getElementById('card-index-button').classList.remove('hidden');
    }
    
    // Show tutorial screen
    showTutorial() {
        this.titleScreen.classList.add('hidden');
        this.tutorialScreen.classList.remove('hidden');
    }
    
    // Start new game
    startGame() {
        // Initialize player deck and collection
        this.collection = createStarterDeck();
        this.deck = [...this.collection];
        this.playerHp = this.playerMaxHp;
        this.enemiesDefeated = 0;
        this.gold = 100;
        this.pendingGold = 0;
        this.pendingHp = 0;
        this.goldAtBattleStart = this.gold;
        this.updateGoldDisplay();
        
        this.titleScreen.classList.add('hidden');
        this.goldDisplay.classList.remove('hidden');
        this.hpDisplay.classList.remove('hidden');
        this.questContainer.classList.remove('hidden');
        this.enemyTurnIndicator.classList.add('hidden');
        this.playerSection.classList.add('hidden');
        this.deckButton.classList.remove('hidden');
        document.getElementById('card-index-button').classList.add('hidden');
        this.updateHpDisplay();
        this.updateDeckCount();

        this.renderQuests();

        this.initializeRoomQueue();
        this.showDungeonScreen();
    }

    // Initialize room queue with 9 rooms
    initializeRoomQueue() {
        this.roomQueue = [];
        for (let i = 0; i < 9; i++) {
            this.roomQueue.push(this.generateRandomRoom());
        }
        this.updateGoldDisplay();
    }

    // Generate a random room type
    generateRandomRoom() {
        const roll = Math.random();
        if (roll < 0.6) return 'combat';
        if (roll < 0.8) return 'event';
        if (roll < 0.9) return 'merchant';
        return 'rest';
    }

    // Show dungeon screen with room options
    showDungeonScreen() {
        this.gameScreen.classList.add('hidden');
        this.rewardScreen.classList.add('hidden');
        this.eventScreen.classList.add('hidden');
        this.dungeonScreen.classList.remove('hidden');
        this.battleLogElement.classList.add('hidden');
        this.deckButton.classList.remove('hidden');
        this.playerSection.classList.add('hidden');
        this.enemyTurnIndicator.classList.add('hidden');
        this.dungeonScreen.style.background = "url('images/Choose_room.png') no-repeat center / cover";

        const doorIds = ['leftDoor', 'midDoor', 'rightDoor'];
        for (let i = 0; i < 3; i++) {
            const type = this.roomQueue[i];
            const door = document.getElementById(doorIds[i]);
            if (door) {
                door.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                door.onclick = () => this.enterRoom(i);
            }
        }

        const set1 = this.roomQueue.slice(3, 6).map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ');
        const set2 = this.roomQueue.slice(6, 9).map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ');
        this.upcoming1Element.textContent = set1;
        this.upcoming2Element.textContent = set2;
    }

    // Enter selected room
    enterRoom(index) {
        // Get the room type the player selected from the first set of options
        const room = this.roomQueue[index];

        // Remove the entire current set of options so the next two sets remain
        // exactly as previewed to the player
        this.roomQueue.splice(0, 3);

        // Replenish the queue with three new random rooms to keep nine rooms in
        // the queue at all times
        while (this.roomQueue.length < 9) {
            this.roomQueue.push(this.generateRandomRoom());
        }

        if (room === 'combat') {
            this.dungeonScreen.classList.add('hidden');
            this.gameScreen.classList.remove('hidden');
            this.startNewBattle();
        } else if (room === 'event') {
            this.dungeonScreen.classList.add('hidden');
            this.startRandomEvent();
        } else if (room === 'merchant') {
            this.dungeonScreen.classList.add('hidden');
            this.showMerchantScreen(true);
        } else if (room === 'rest') {
            this.dungeonScreen.classList.add('hidden');
            this.showRestScreen();
        }
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

        // Track gold gained during this battle
        this.goldAtBattleStart = this.gold;
        
        // Get a random enemy
        this.currentEnemy = getRandomEnemy();
        
        // Set up enemy display
        this.enemyNameElement.textContent = this.currentEnemy.name;
        this.updateEnemyHealth();
        
        // Set enemy image based on name
        const enemyImageName = this.currentEnemy.name.toLowerCase().replace(' ', '_');
        this.enemyImageElement.src = `images/enemy_${enemyImageName}.png`;

        this.gameScreen.style.background = "url('images/rooms/room_combat.png') no-repeat center / cover";
        
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
        this.battleLogElement.classList.remove('hidden');
        this.deckButton.classList.add('hidden');
        this.playerSection.classList.remove('hidden');

        this.battleActive = true;
        this.checkQuestProgress('battle_start');
    }

    // Start a random event
    startRandomEvent() {
        this.eventScreen.classList.remove('hidden');
        this.battleLogElement.classList.add('hidden');
        this.deckButton.classList.remove('hidden');
        this.playerSection.classList.add('hidden');
        this.pendingAmbush = false;
        this.pendingGold = 0;
        this.pendingHp = 0;
        const roll = Math.random();
        if (roll < 0.4) {
            const gold = 10 + Math.floor(Math.random() * 11);
            this.pendingGold = gold;
            this.eventTextElement.textContent = `You found a treasure chest with ${gold} gold!`;
            this.eventScreen.style.background = "url('images/rooms/room_event_chest.png') no-repeat center / cover";
            this.playSound('chest');
        } else if (roll < 0.7) {
            const damage = 5 + Math.floor(Math.random() * 6);
            this.pendingHp = -damage;
            this.eventTextElement.textContent = `A trap deals ${damage} damage!`;
            this.eventScreen.style.background = "url('images/rooms/room_event_trap.png') no-repeat center / cover";
        } else if (roll < 0.9) {
            this.eventCardCost = 20;
            this.eventCardForSale = getRandomCard();
            if (this.gold >= this.eventCardCost) {
                this.eventTextElement.textContent = `A dealer offers ${this.eventCardForSale.name} for ${this.eventCardCost} gold.`;
                this.showEventButtons();
            } else {
                this.eventTextElement.textContent = `A dealer offers ${this.eventCardForSale.name} for ${this.eventCardCost} gold, but you can't afford it.`;
            }
            this.eventScreen.style.background = "url('images/rooms/room_event_card.png') no-repeat center / cover";
        } else if (roll < 0.95) {
            this.startQuestOffer();
        } else {
            this.pendingAmbush = true;
            this.eventTextElement.textContent = 'You are ambushed by an enemy!';
            this.eventScreen.style.background = "url('images/rooms/room_combat.png') no-repeat center / cover";
        }
    }

    showEventButtons() {
        document.getElementById('event-continue').classList.add('hidden');
        document.getElementById('event-buy').classList.remove('hidden');
        document.getElementById('event-skip').classList.remove('hidden');
    }

    hideEventButtons() {
        document.getElementById('event-continue').classList.remove('hidden');
        document.getElementById('event-buy').classList.add('hidden');
        document.getElementById('event-skip').classList.add('hidden');
        document.getElementById('event-quest1').classList.add('hidden');
        document.getElementById('event-quest2').classList.add('hidden');
        document.getElementById('event-quest3').classList.add('hidden');
        document.getElementById('event-quest-skip').classList.add('hidden');
        document.getElementById('event-cancel1').classList.add('hidden');
        document.getElementById('event-cancel2').classList.add('hidden');
        this.eventCardForSale = null;
        this.eventCardCost = 0;
    }

    startQuestOffer() {
        this.eventTextElement.textContent = 'A traveler offers you a quest:';
        const buttons = [
            document.getElementById('event-quest1'),
            document.getElementById('event-quest2'),
            document.getElementById('event-quest3')
        ];
        const skipBtn = document.getElementById('event-quest-skip');
        const quests = this.getRandomQuests(3);
        buttons.forEach((btn, i) => {
            const q = quests[i];
            if (q) {
                btn.textContent = q.description;
                btn.onclick = () => { this.acceptQuest(q); this.hideEventButtons(); this.eventScreen.classList.add('hidden'); this.showDungeonScreen(); };
                btn.classList.remove('hidden');
            }
        });
        skipBtn.onclick = () => { this.hideEventButtons(); this.eventScreen.classList.add('hidden'); this.showDungeonScreen(); };
        skipBtn.classList.remove('hidden');
        const cancelButtons = [document.getElementById('event-cancel1'), document.getElementById('event-cancel2')];
        this.activeQuests.forEach((aq, idx) => {
            if (cancelButtons[idx]) {
                cancelButtons[idx].textContent = `Abandon ${aq.description}`;
                cancelButtons[idx].onclick = () => { this.cancelQuest(aq); this.hideEventButtons(); this.eventScreen.classList.add('hidden'); this.showDungeonScreen(); };
                cancelButtons[idx].classList.remove('hidden');
            }
        });
        document.getElementById('event-continue').classList.add('hidden');
        document.getElementById('event-buy').classList.add('hidden');
        document.getElementById('event-skip').classList.add('hidden');
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
        this.updateHpDisplay();
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
        
        // Play attack sound before applying effects
        if (playedCard.type === 'attack') {
            if (playedCard.cost >= 2) {
                this.playSound('heavyAttack');
            } else {
                this.playSound('attack');
            }
        }

        // Pay energy cost
        this.playerEnergy -= playedCard.cost;
        
        // Execute card effect
        playedCard.effect(this);

        this.checkQuestProgress('card_played', {card: playedCard});
        
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

    // Convert a defensive card to gold instead of gaining block
    convertBlockCardToGold(card) {
        if (!this.canPlayCard(card) || card.block <= 0) return;

        // Find the card in hand
        const cardIndex = this.hand.findIndex(c => c.id === card.id);
        if (cardIndex === -1) return;

        // Remove from hand
        const playedCard = this.hand.splice(cardIndex, 1)[0];

        // Find the card element in the hand for animation
        const cardElements = this.handContainer.querySelectorAll('.card');
        const cardElement = Array.from(cardElements).find(elem => elem.dataset.cardId == playedCard.id);

        // Animate the card moving toward the gold display (to the left)
        if (cardElement && this.goldDisplay) {
            const goldRect = this.goldDisplay.getBoundingClientRect();
            const targetX = goldRect.left + goldRect.width / 2;
            const targetY = goldRect.top + goldRect.height / 2;
            animateCardPlayed(cardElement, targetX, targetY);
        }

        // Pay energy cost
        this.playerEnergy -= playedCard.cost;

        // Add gold instead of block
        this.addGold(playedCard.block);
        this.addToBattleLog(`Converted ${playedCard.name} into ${playedCard.block} gold.`);

        this.checkQuestProgress('card_played', {card: playedCard});

        // Discard the card
        this.discardPile.push(playedCard);

        // Update UI
        this.updateHandDisplay();
        this.updatePlayerStats();
        this.updateCardPiles();

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

        this.checkQuestProgress('damage_dealt', {amount: result.damage});
    }
    
    // Deal damage to the player
    dealDamageToPlayer(amount) {
        this.playSound('heavyAttack');
        if (this.currentEnemy) {
            // Apply enemy strength if they have it
            if (this.currentEnemy.statuses.strength > 0) {
                amount += this.currentEnemy.statuses.strength;
            }

            // Apply weak status effect
            if (this.currentEnemy.statuses.weak > 0) {
                amount = Math.floor(amount * 0.75);
            }
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

        this.checkQuestProgress('damage_taken', {amount: damageToHp});

        // Update player stats display
        this.updatePlayerStats();
    }
    
    // Gain block for player
    gainBlock(amount) {
        this.playerBlock += amount;
        this.createFloatingText(amount, 'block-text', document.getElementById('player-stats'));
        this.addToBattleLog(`You gained ${amount} Block.`);
        this.playSound('block');
        this.checkQuestProgress('block_gained', {amount});
        this.updatePlayerStats();
    }
    
    // Gain energy for player
    gainEnergy(amount) {
        this.playerEnergy += amount;
        this.addToBattleLog(`You gained ${amount} Energy.`);
        this.updatePlayerStats();
    }

    // Add or subtract gold with animation
    addGold(amount) {
        this.gold += amount;
        this.updateGoldDisplay();
        if (amount > 0) {
            this.playSound('gainGold');
        } else if (amount < 0) {
            this.playSound('spendGold');
        }

        if (this.goldDisplay) {
            const cls = amount >= 0 ? 'gold-text' : 'gold-loss-text';
            const prefix = amount >= 0 ? '+' : '';
            this.createFloatingText(`${prefix}${amount}`, cls, this.goldDisplay);
        }
        this.checkQuestProgress('gold_change', {amount});
    }

    updateGoldDisplay() {
        if (this.goldDisplay) {
            const amt = this.goldDisplay.querySelector('#gold-amount');
            if (amt) amt.textContent = this.gold;
        }
    }

    updateHpDisplay() {
        if (this.hpDisplay) {
            const txt = this.hpDisplay.querySelector('#hp-bar-text');
            const bar = this.hpDisplay.querySelector('#hp-bar');
            const percent = (this.playerHp / this.playerMaxHp) * 100;
            if (txt) txt.textContent = `${this.playerHp}/${this.playerMaxHp}`;
            if (bar) bar.style.width = `${percent}%`;
        }
    }

    updateDeckCount() {
        const deckCountEl = document.getElementById('deck-count');
        if (deckCountEl) {
            deckCountEl.textContent = `${this.deck.length}/${this.maxDeckSize}`;
        }
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

    // Load audio files for various actions
    loadSounds() {
        this.sounds = {
            attack: new Audio('audio/Atk_RR1_v2.ogg'),
            heavyAttack: new Audio('audio/HeavyAtk_v2.ogg'),
            block: new Audio('audio/GainDefense_RR1_v3.ogg'),
            gainGold: new Audio('audio/Gold_RR1_v3.ogg'),
            spendGold: new Audio('audio/CashRegister.ogg'),
            chest: new Audio('audio/ChestOpen_v2.ogg'),
            cardDeal: new Audio('audio/STS_SFX_CardDeal8_v1.ogg'),
            uiHover: new Audio('audio/UIHover_v2.wav'),
            viewDeck: new Audio('audio/ViewDeck_v1.ogg'),
            newUnlock: new Audio('audio/NewUnlock_v1.ogg')
        };
    }

    // Play a sound by key
    playSound(name) {
        if (this.sounds && this.sounds[name]) {
            const snd = this.sounds[name];
            snd.currentTime = 0;
            snd.play();
        }
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
        this.checkQuestProgress('end_turn');
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

        // Visual and sound cue for enemy turn
        this.enemyTurnIndicator.classList.add('enemy-turn-show');
        this.playSound('uiHover');
        setTimeout(() => {
            this.enemyTurnIndicator.classList.remove('enemy-turn-show');
        }, 1000);

        // Execute enemy move
        const moveName = this.currentEnemy.executeMove(this);
        this.playSound('heavyAttack');
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
        this.checkQuestProgress('start_turn');
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
            this.checkQuestProgress('battle_end', {win: true});
            
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
            this.checkQuestProgress('battle_end', {win: false});
            
            // Show game over screen
            setTimeout(() => {
                this.showGameOverScreen();
            }, 1000);
            
            return true;
        }
        
        return false;
    }
    
    // Show reward screen with gold reward
    showRewardScreen() {
        this.gameScreen.classList.add('hidden');
        this.rewardScreen.classList.remove('hidden');
        this.battleLogElement.classList.add('hidden');
        this.deckButton.classList.remove('hidden');
        this.playerSection.classList.add('hidden');
        this.pendingGold = 0;
        this.pendingHp = 0;
        const goldGained = this.gold - this.goldAtBattleStart;
        this.rewardTextElement.textContent = `Gold gained: ${goldGained}`;
    }
    
    // Add a card to player's collection and deck if space allows
    addCardToDeck(card) {
        const addedToDeck = this.deck.length < this.maxDeckSize;
        if (addedToDeck) {
            this.deck.push(card);
        }
        this.collection.push(card);
        const location = addedToDeck ? 'deck' : 'collection';
        this.addToBattleLog(`Added ${card.name} to your ${location}.`);
    }
    
    // Start the next battle
    startNextRoom() {
        if (this.pendingGold !== 0) {
            this.addGold(this.pendingGold);
            this.pendingGold = 0;
        }
        if (this.pendingHp !== 0) {
            const change = this.pendingHp;
            this.pendingHp = 0;
            if (change > 0) {
                this.playerHp = Math.min(this.playerHp + change, this.playerMaxHp);
            } else {
                this.playerHp = Math.max(0, this.playerHp + change);
            }
            this.updatePlayerStats();
        }
        this.rewardScreen.classList.add('hidden');
        this.showDungeonScreen();
    }
    
    // Show game over screen
    showGameOverScreen() {
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        this.battleLogElement.classList.add('hidden');
        this.deckButton.classList.remove('hidden');
        this.playerSection.classList.add('hidden');

        document.getElementById('final-score').textContent = `You defeated ${this.enemiesDefeated} enemies.`;
    }
    
    // Reset game for play again
    resetGame() {
        this.gameOverScreen.classList.add('hidden');
        this.showTitleScreen();
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
    showTradingScreen(fromMerchant = false) {
        this.inMerchantRoom = fromMerchant;
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
            const cardElement = card.createCardElement(false);
            cardElement.addEventListener('click', () => this.tradeCard(card));
            playerTradeCards.appendChild(cardElement);
        });
        
        merchantTradeCards.innerHTML = '';
        const tradeOptions = getRandomTradeOptions();
        tradeOptions.forEach(card => {
            const cardElement = card.createCardElement(false);
            merchantTradeCards.appendChild(cardElement);
        });

        this.updateDeckCount();
    }
    
    // Trade a card from player's deck
    tradeCard(playerCard) {
        const merchantCards = document.querySelectorAll('#merchant-trade-cards .card');
        merchantCards.forEach(merchantCardElement => {
            merchantCardElement.addEventListener('click', () => {
                const merchantCardId = parseInt(merchantCardElement.dataset.cardId);
                const merchantCard = getCardById(merchantCardId);
                
                // Remove player's card and add merchant's card
                this.deck = this.deck.filter(c => c !== playerCard);
                this.collection = this.collection.filter(c => c !== playerCard);
                this.deck.push(merchantCard);
                this.collection.push(merchantCard);
                this.updateDeckCount();
                
                this.tradesCompleted++;
                this.updateTradingOptions();
                
                // Check trading achievement
                this.checkAchievements();
            });
        });
    }

    // Show merchant screen with card packs
    showMerchantScreen(fromDungeon = false) {
        this.inMerchantRoom = fromDungeon;
        this.merchantScreen.classList.remove('hidden');
        this.battleLogElement.classList.add('hidden');
        this.deckButton.classList.remove('hidden');
        this.playerSection.classList.add('hidden');
        this.merchantScreen.style.background = "url('images/rooms/room_merchant.png') no-repeat center / cover";
        this.updatePackOptions();
    }

    // Generate pack options
    updatePackOptions() {
        const container = document.getElementById('pack-options');
        container.innerHTML = '';
        const packs = [
            { name: 'Small Pack', size: 2, price: 20 },
            { name: 'Medium Pack', size: 3, price: 35 },
            { name: 'Large Pack', size: 5, price: 60 }
        ];
        packs.forEach(pack => {
            const btn = document.createElement('button');
            btn.className = 'pack-button';
            btn.textContent = `${pack.name} - ${pack.price} gold`;
            btn.addEventListener('click', () => this.purchasePack(pack));
            container.appendChild(btn);
        });
    }

    // Purchase a pack of cards
    purchasePack(pack) {
        if (this.gold < pack.price) return;
        this.addGold(-pack.price);
        const cards = [];
        for (let i = 0; i < pack.size; i++) {
            cards.push(getRandomCard());
        }

        const packCardsDiv = document.getElementById('pack-cards');
        packCardsDiv.innerHTML = '';

        cards.forEach(card => {
            const isNew = !this.collection.some(c => c.id === card.id);
            this.addCardToDeck(card);

            const flipCard = document.createElement('div');
            flipCard.className = 'flip-card';

            const inner = document.createElement('div');
            inner.className = 'flip-card-inner';

            const back = document.createElement('div');
            back.className = 'flip-card-back';

            const frontWrapper = document.createElement('div');
            frontWrapper.className = 'flip-card-front';
            const frontCard = card.createCardElement(false);
            frontWrapper.appendChild(frontCard);

            inner.appendChild(back);
            inner.appendChild(frontWrapper);
            flipCard.appendChild(inner);

            const label = document.createElement('div');
            label.className = 'card-new-label';
            flipCard.appendChild(label);

            flipCard.addEventListener('click', () => {
                if (flipCard.classList.contains('flipped')) return;
                this.playSound('cardDeal');
                flipCard.classList.add('flipped');
                label.textContent = isNew ? 'New Card!' : '';
                if (isNew) {
                    frontCard.classList.add('card-glow');
                    setTimeout(() => this.playSound('newUnlock'), 300);
                }
            });

            packCardsDiv.appendChild(flipCard);
        });

        this.updateDeckCount();
        const deckBackdrop = document.querySelector('.card-backdrop');
        this.packScreen.classList.remove('hidden');
        deckBackdrop.classList.add('active');
    }

    // Show deck management screen
    showDeckScreen() {
        this.playSound('viewDeck');
        const deckContainer = document.getElementById('deck-cards');
        const collectionContainer = document.getElementById('collection-cards');
        deckContainer.innerHTML = '';
        collectionContainer.innerHTML = '';
        this.updateDeckCount();

        this.deck.forEach(card => {
            const el = card.createCardElement(false);
            el.addEventListener('click', () => {
                if (this.deck.length > this.minDeckSize) {
                    this.deck.splice(this.deck.indexOf(card), 1);
                    this.updateDeckCount();
                    this.showDeckScreen();
                }
            });
            deckContainer.appendChild(el);
        });

        this.collection.forEach(card => {
            if (!this.deck.includes(card)) {
                const el = card.createCardElement(false);
                el.addEventListener('click', () => {
                    if (this.deck.length < this.maxDeckSize) {
                        this.deck.push(card);
                        this.updateDeckCount();
                        this.showDeckScreen();
                    }
                });
                collectionContainer.appendChild(el);
            }
        });

        const deckBackdrop = document.querySelector('.card-backdrop');
        this.deckScreen.classList.remove('hidden');
        deckBackdrop.classList.add('active');
    }

    // Show draw pile contents
    showDrawPileScreen() {
        const container = document.getElementById('draw-pile-cards');
        container.innerHTML = '';
        this.drawPile.forEach(card => {
            const el = card.createCardElement(false);
            container.appendChild(el);
        });
        const deckBackdrop = document.querySelector('.card-backdrop');
        this.drawPileScreen.classList.remove('hidden');
        deckBackdrop.classList.add('active');
    }

    // Show discard pile contents
    showDiscardPileScreen() {
        const container = document.getElementById('discard-pile-cards');
        container.innerHTML = '';
        this.discardPile.forEach(card => {
            const el = card.createCardElement(false);
            container.appendChild(el);
        });
        const deckBackdrop = document.querySelector('.card-backdrop');
        this.discardPileScreen.classList.remove('hidden');
        deckBackdrop.classList.add('active');
    }

    // Show rest screen and heal player
    showRestScreen() {
        const heal = Math.ceil(this.playerHp * 0.3);
        this.pendingHp = heal;
        document.getElementById('rest-text').textContent = `You recovered ${heal} HP.`;
        this.restScreen.classList.remove('hidden');
        this.battleLogElement.classList.add('hidden');
        this.deckButton.classList.remove('hidden');
        this.playerSection.classList.add('hidden');
        this.restScreen.style.background = "url('images/rooms/room_rest.png') no-repeat center / cover";
        this.checkQuestProgress('rest');
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
        this.playerSection.classList.add('hidden');
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

    // Quest System
    initializeQuestPool() {
        return [
            { id: 1, description: 'Win 5 battles without resting', reward: { type: 'gold', amount: 120 }, check: (game, e, d, q) => {
                if (e === 'battle_end' && d.win) { q.progress = (q.progress||0) + 1; if (q.progress >= 5) return true; }
                if (e === 'rest') { q.progress = 0; }
            }},
            { id: 2, description: 'Deal 25 damage in one turn', reward: { type: 'gold', amount: 80 }, check: (game, e, d, q) => {
                if (e === 'damage_dealt') { game.damageThisTurn += d.amount; }
                if (e === 'end_turn') { if (game.damageThisTurn >= 25) return true; game.damageThisTurn = 0; }
                if (e === 'start_turn') { game.damageThisTurn = 0; }
            }},
            { id: 3, description: 'Win a battle without playing defense cards', reward: { type: 'gold', amount: 80 }, check: (game, e, d, q) => {
                if (e === 'card_played' && d.card.block > 0) { game.defenseCardPlayed = true; }
                if (e === 'battle_end' && d.win) { if (!game.defenseCardPlayed) return true; }
                if (e === 'battle_start') { game.defenseCardPlayed = false; }
            }},
            { id: 4, description: 'Defeat an enemy in 3 turns', reward: { type: 'gold', amount: 80 }, check: (game, e, d, q) => {
                if (e === 'battle_start') { game.turnCounter = 0; }
                if (e === 'end_turn') { game.turnCounter++; }
                if (e === 'battle_end' && d.win) { if (game.turnCounter <= 3) return true; }
            }},
            { id: 5, description: 'Win a battle without taking damage', reward: { type: 'gold', amount: 60 }, check: (game, e, d, q) => {
                if (e === 'damage_taken') { game.damageTakenThisBattle += d.amount; }
                if (e === 'battle_start') { game.damageTakenThisBattle = 0; }
                if (e === 'battle_end' && d.win) { if (game.damageTakenThisBattle === 0) return true; }
            }},
            { id: 6, description: 'Play 10 attacks in one battle', reward: { type: 'gold', amount: 60 }, check: (game, e, d, q) => {
                if (e === 'card_played' && d.card.type === 'attack') { game.attackCardsThisBattle++; }
                if (e === 'battle_start') { game.attackCardsThisBattle = 0; }
                if (e === 'battle_end' && d.win) { if (game.attackCardsThisBattle >= 10) return true; }
            }},
            { id: 7, description: 'Gain 20 block in one turn', reward: { type: 'gold', amount: 60 }, check: (game, e, d, q) => {
                if (e === 'block_gained') { game.blockThisTurn += d.amount; }
                if (e === 'end_turn') { if (game.blockThisTurn >= 20) return true; game.blockThisTurn = 0; }
                if (e === 'start_turn') { game.blockThisTurn = 0; }
            }},
            { id: 8, description: 'Spend 50 gold at merchants', reward: { type: 'card' }, check: (game, e, d, q) => {
                if (e === 'gold_change' && d.amount < 0) { q.progress = (q.progress||0) - d.amount; if (q.progress >= 50) return true; }
            }},
            { id: 9, description: 'Reach 150 gold', reward: { type: 'gold', amount: 60 }, check: (game, e, d, q) => {
                if (game.gold >= 150) return true; }
            }
        ];
    }

    getRandomQuests(n) {
        const available = this.questPool.filter(q => !this.activeQuests.find(a => a.id === q.id));
        const shuffled = available.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, n).map(q => ({...q, progress:0, completed:false, claimed:false}));
    }

    acceptQuest(q) {
        if (this.activeQuests.length >= 2) return;
        this.activeQuests.push(q);
        this.renderQuests();
    }

    cancelQuest(q) {
        const idx = this.activeQuests.indexOf(q);
        if (idx !== -1) {
            // Simple penalty: lose 30 HP
            this.playerHp = Math.max(0, this.playerHp - 30);
            this.activeQuests.splice(idx, 1);
            this.updatePlayerStats();
            this.renderQuests();
        }
    }

    claimQuestReward(q) {
        if (this.battleActive) return;
        if (q.reward.type === 'gold') {
            this.addGold(q.reward.amount);
        } else if (q.reward.type === 'card') {
            this.addCardToDeck(getRandomCard());
        }
        q.claimed = true;
        const idx = this.activeQuests.indexOf(q);
        if (idx !== -1) this.activeQuests.splice(idx,1);
        this.renderQuests();
    }

    renderQuests() {
        this.questContainer.innerHTML = '';
        this.activeQuests.forEach(q => {
            const div = document.createElement('div');
            div.className = 'quest-entry' + (q.completed ? ' completed' : '');
            div.textContent = q.description;
            if (q.completed && !q.claimed && !this.battleActive) {
                const btn = document.createElement('button');
                btn.textContent = 'Claim';
                btn.onclick = () => this.claimQuestReward(q);
                div.appendChild(btn);
            }
            this.questContainer.appendChild(div);
        });
    }

    checkQuestProgress(event, data={}) {
        this.activeQuests.forEach(q => {
            if (!q.completed && q.check(this, event, data, q)) {
                q.completed = true;
            }
        });
        this.renderQuests();
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new CardGame();
});
