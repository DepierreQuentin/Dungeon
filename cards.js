// Card definitions and related functionality
import { gsap } from 'gsap';

// Card class to create new cards
class Card {
    constructor(id, name, type, cost, description, effect, rarity = 'common', block = 0) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.cost = cost;
        this.description = description;
        this.effect = effect;
        this.rarity = rarity;
        this.block = block; // Amount of block the card would normally grant
    }

    // Create HTML element for the card
    createCardElement(interactive = true) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${this.type} ${this.rarity}`;
        cardElement.dataset.cardId = this.id;
        cardElement.dataset.cardName = this.name;

        const nameElement = document.createElement('div');
        nameElement.className = 'card-name';
        nameElement.textContent = this.name;
        
        const costElement = document.createElement('div');
        costElement.className = 'card-cost';
        costElement.textContent = this.cost;

        const descriptionElement = document.createElement('div');
        descriptionElement.className = 'card-description';
        descriptionElement.textContent = this.description;

        const typeElement = document.createElement('div');
        typeElement.className = 'card-type';
        typeElement.textContent = this.type.charAt(0).toUpperCase() + this.type.slice(1);

        cardElement.appendChild(nameElement);
        cardElement.appendChild(costElement);
        cardElement.appendChild(descriptionElement);
        cardElement.appendChild(typeElement);

        if (interactive) {
            // Left click: play the card normally
            cardElement.addEventListener('click', () => {
                if (game.canPlayCard(this)) {
                    game.playCard(this);
                }
            });

            // Right click: convert block to gold if applicable
            cardElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (this.block > 0 && game.canPlayCard(this)) {
                    game.convertBlockCardToGold(this);
                }
            });
        }

        // Play hover sound when the mouse enters the card
        cardElement.addEventListener('mouseenter', () => {
            if (window.game && typeof game.playSound === 'function') {
                game.playSound('uiHover');
            }
        });

        return cardElement;
    }
}

// Updated card collection with rarities and enhanced effects
const cardCollection = [
    // Common cards
    new Card(1, "Strike", "attack", 1, "Deal 6 damage.", (game) => {
        game.dealDamageToEnemy(6);
    }, 'common'),
    
    new Card(2, "Heavy Blow", "attack", 2, "Deal 10 damage.", (game) => {
        game.dealDamageToEnemy(10);
    }, 'common'),
    
    // Uncommon cards
    new Card(3, "Quick Slash", "attack", 1, "Deal 4 damage. Draw 1 card.", (game) => {
        game.dealDamageToEnemy(4);
        game.drawCards(1);
    }, 'uncommon'),
    
    new Card(4, "Cleave", "attack", 1, "Deal 8 damage and apply 1 Weak.", (game) => {
        game.dealDamageToEnemy(8);
        game.applyEnemyStatus('weak', 1);
    }, 'uncommon'),
    
    new Card(5, "Bash", "attack", 2, "Deal 8 damage and apply 2 Vulnerable.", (game) => {
        game.dealDamageToEnemy(8);
        game.applyEnemyStatus('vulnerable', 2);
    }, 'uncommon'),
    
    // Common defensive cards
    new Card(6, "Defend", "skill", 1, "Gain 5 Block.", (game) => {
        game.gainBlock(5);
    }, 'common', 5),
    
    new Card(7, "Dodge", "skill", 1, "Gain 8 Block.", (game) => {
        game.gainBlock(8);
    }, 'common', 8),
    
    // Uncommon defensive cards
    new Card(8, "Second Wind", "skill", 1, "Gain 6 Block. Draw 1 card.", (game) => {
        game.gainBlock(6);
        game.drawCards(1);
    }, 'uncommon', 6),
    
    new Card(9, "Backflip", "skill", 2, "Gain 10 Block. Draw 2 cards.", (game) => {
        game.gainBlock(10);
        game.drawCards(2);
    }, 'uncommon', 10),
    
    // Rare defensive card
    new Card(10, "Barricade", "skill", 3, "Gain 15 Block. Block doesn't expire this turn.", (game) => {
        game.gainBlock(15);
        game.applyPlayerStatus('barricade', 1);
    }, 'rare', 15),
    
    // Rare power cards
    new Card(11, "Inflame", "power", 1, "Gain 2 Strength permanently.", (game) => {
        game.applyPlayerStatus('strength', 2);
    }, 'rare'),
    
    new Card(12, "Demon Form", "power", 3, "At the start of your turn, gain 2 Strength.", (game) => {
        game.applyPlayerStatus('demon_form', 1);
    }, 'rare'),
    
    new Card(13, "Metallicize", "power", 1, "At the end of your turn, gain 3 Block.", (game) => {
        game.applyPlayerStatus('metallicize', 3);
    }, 'rare'),
    
    new Card(14, "Energize", "power", 2, "Gain 2 Energy and draw 2 cards.", (game) => {
        game.gainEnergy(2);
        game.drawCards(2);
    }, 'rare'),
    
    new Card(15, "Battle Trance", "power", 0, "Draw 3 cards. Cannot draw additional cards this turn.", (game) => {
        game.drawCards(3);
        game.applyPlayerStatus('no_draw', 1);
    }, 'uncommon'),
    
    new Card(16, "Fire Blast", "attack", 2, "Deal 14 damage. Apply 2 burn.", (game) => {
        game.dealDamageToEnemy(14);
        game.applyEnemyStatus('burn', 2);
    }, 'rare'),
    
    new Card(17, "Ice Shield", "skill", 2, "Gain 12 Block. Next turn gain 6 Block.", (game) => {
        game.gainBlock(12);
        game.applyPlayerStatus('next_turn_block', 6);
    }, 'rare', 12),
    
    new Card(18, "Thunder Strike", "attack", 3, "Deal 10 damage 3 times.", (game) => {
        for (let i = 0; i < 3; i++) {
            game.dealDamageToEnemy(10);
        }
    }, 'rare'),
    
    new Card(19, "Vampiric Strike", "attack", 2, "Deal 8 damage. Heal for unblocked damage dealt.", (game) => {
        const damage = game.dealDamageToEnemy(8);
        if (damage.damage > 0) {
            game.healPlayer(damage.damage);
        }
    }, 'rare'),
    
    new Card(20, "Whirlwind", "attack", 0, "Deal 5 damage to enemy X times.", (game) => {
        for (let i = 0; i < game.playerEnergy; i++) {
            game.dealDamageToEnemy(5);
        }
        game.playerEnergy = 0;
    }, 'uncommon'),
    
    new Card(21, "Berserk", "power", 2, "Gain 1 Energy at the start of each turn. Take 5 damage.", (game) => {
        game.applyPlayerStatus('berserk', 1);
        game.dealDamageToPlayer(5);
    }, 'rare'),
    
    new Card(22, "Meditation", "skill", 1, "Heal 6 HP. Shuffle your discard pile into your draw pile.", (game) => {
        game.healPlayer(6);
        game.shuffleDiscardIntoDraw();
    }, 'uncommon'),
    
    new Card(23, "Trade Master", "skill", 1, "Add a copy of your lowest cost card in hand to your hand.", (game) => {
        if (game.hand.length > 0) {
            let lowestCostCard = game.hand[0];
            game.hand.forEach(card => {
                if (card.cost < lowestCostCard.cost) {
                    lowestCostCard = card;
                }
            });
            const cardCopy = getCardById(lowestCostCard.id);
            game.hand.push(cardCopy);
            game.updateHandDisplay();
        }
    }, 'uncommon'),
    
    new Card(24, "Battle Flow", "power", 2, "Whenever you play 3 cards in a row, draw 1 card.", (game) => {
        game.applyPlayerStatus('battle_flow', 1);
    }, 'rare')
];

// Create starting deck
function createStarterDeck() {
    return [
        // Add multiple copies of basic cards
        ...Array(4).fill().map(() => getCardById(1)), // 4 Strikes
        ...Array(4).fill().map(() => getCardById(6)), // 4 Defends
        getCardById(3), // 1 Quick Slash
        getCardById(8)  // 1 Second Wind
    ];
}

// Get card by ID
function getCardById(id) {
    const cardTemplate = cardCollection.find(card => card.id === id);
    const newCard = new Card(
        cardTemplate.id,
        cardTemplate.name,
        cardTemplate.type,
        cardTemplate.cost,
        cardTemplate.description,
        cardTemplate.effect,
        cardTemplate.rarity,
        cardTemplate.block
    );
    return newCard;
}

// Get random card from collection
function getRandomCard() {
    const randomIndex = Math.floor(Math.random() * cardCollection.length);
    const cardTemplate = cardCollection[randomIndex];
    return new Card(
        cardTemplate.id,
        cardTemplate.name,
        cardTemplate.type,
        cardTemplate.cost,
        cardTemplate.description,
        cardTemplate.effect,
        cardTemplate.rarity,
        cardTemplate.block
    );
}

// Get random reward cards (3 different cards)
function getRewardCards() {
    let rewardCards = [];
    
    // Guaranteed at least one uncommon or rare card
    const rareRoll = Math.random();
    if (rareRoll < 0.2) { // 20% chance for rare
        rewardCards.push(getRandomCardByRarity('rare'));
    } else { // 80% chance for uncommon
        rewardCards.push(getRandomCardByRarity('uncommon'));
    }
    
    // Two more random cards, weighted towards common
    for (let i = 0; i < 2; i++) {
        const roll = Math.random();
        if (roll < 0.7) { // 70% common
            rewardCards.push(getRandomCardByRarity('common'));
        } else if (roll < 0.9) { // 20% uncommon
            rewardCards.push(getRandomCardByRarity('uncommon'));
        } else { // 10% rare
            rewardCards.push(getRandomCardByRarity('rare'));
        }
    }
    
    return rewardCards;
}

// Helper function to get random card by rarity
function getRandomCardByRarity(rarity) {
    const cardsOfRarity = cardCollection.filter(card => card.rarity === rarity);
    const randomIndex = Math.floor(Math.random() * cardsOfRarity.length);
    const cardTemplate = cardsOfRarity[randomIndex];
    return new Card(
        cardTemplate.id,
        cardTemplate.name,
        cardTemplate.type,
        cardTemplate.cost,
        cardTemplate.description,
        cardTemplate.effect,
        cardTemplate.rarity,
        cardTemplate.block
    );
}

// Animate card being played
function animateCardPlayed(cardElement, targetX, targetY) {
    const rect = cardElement.getBoundingClientRect();
    const startX = rect.left;
    const startY = rect.top;
    
    // Clone the card for animation
    const cardClone = cardElement.cloneNode(true);
    cardClone.style.position = 'fixed';
    cardClone.style.left = startX + 'px';
    cardClone.style.top = startY + 'px';
    cardClone.style.zIndex = '1000';
    document.body.appendChild(cardClone);
    
    // Remove original card
    cardElement.remove();
    
    gsap.to(cardClone, {
        left: targetX,
        top: targetY,
        scale: 1.5,
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            cardClone.remove();
        }
    });
}

// Initialize card index
function initializeCardIndex() {
    const cardIndexButton = document.getElementById('card-index-button');
    const cardIndexScreen = document.getElementById('card-index-screen');
    const cardIndexClose = document.getElementById('card-index-close');
    const cardBackdrop = document.querySelector('.card-backdrop');
    const cardIndexContent = document.getElementById('card-index-content');

    // Show card index
    cardIndexButton.addEventListener('click', () => {
        cardIndexScreen.classList.add('active');
        cardBackdrop.classList.add('active');
        
        // Clear and populate card index
        cardIndexContent.innerHTML = '';
        cardCollection.forEach(card => {
            const cardElement = card.createCardElement(false);
            cardIndexContent.appendChild(cardElement);
        });
    });

    // Close card index
    cardIndexClose.addEventListener('click', () => {
        cardIndexScreen.classList.remove('active');
        cardBackdrop.classList.remove('active');
    });

    cardBackdrop.addEventListener('click', () => {
        cardIndexScreen.classList.remove('active');
        cardBackdrop.classList.remove('active');
    });
}

window.addEventListener('DOMContentLoaded', () => {
    initializeCardIndex();
});

// Add trading functionality
export function getRandomTradeOptions() {
    const cards = [];
    for (let i = 0; i < 3; i++) {
        const roll = Math.random();
        if (roll < 0.6) {
            cards.push(getRandomCardByRarity('uncommon'));
        } else {
            cards.push(getRandomCardByRarity('rare'));
        }
    }
    return cards;
}

export { Card, createStarterDeck, getCardById, getRandomCard, getRewardCards, animateCardPlayed };