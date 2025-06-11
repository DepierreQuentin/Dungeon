class MenuScene extends Phaser.Scene {
    constructor() {
        super('Menu');
    }

    preload() {
        // Preload assets if any
    }

    create() {
        this.add.text(400, 100, 'Dungeon Deckbuilder', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);

        const playButton = this.add.text(400, 200, 'Jouer', { fontSize: '24px', backgroundColor: '#333', padding: 10 })
            .setOrigin(0.5)
            .setInteractive();
        const settingsButton = this.add.text(400, 260, 'Paramètres', { fontSize: '24px', backgroundColor: '#333', padding: 10 })
            .setOrigin(0.5)
            .setInteractive();
        const quitButton = this.add.text(400, 320, 'Quitter', { fontSize: '24px', backgroundColor: '#333', padding: 10 })
            .setOrigin(0.5)
            .setInteractive();

        playButton.on('pointerdown', () => {
            this.scene.start('Game');
        });

        settingsButton.on('pointerdown', () => {
            // Future settings
        });

        quitButton.on('pointerdown', () => {
            this.game.destroy(true);
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
        this.playerEnergy = 3;
        this.playerHP = 30;
        this.enemyHP = 20;
        this.gold = 0;
        this.deck = [
            { name: 'Attaque', type: 'attack', damage: 5 },
            { name: 'Défense', type: 'defense' },
            { name: 'Sort', type: 'attack', damage: 8 }
        ];
        this.hand = [];
        this.roomCount = 0;
        this.maxRooms = 5;
    }

    create() {
        this.hpText = this.add.text(10, 10, 'HP: ' + this.playerHP, { fontSize: '16px', color: '#fff' });
        this.energyText = this.add.text(10, 30, 'Énergie: ' + this.playerEnergy, { fontSize: '16px', color: '#fff' });
        this.goldText = this.add.text(10, 50, 'Or: ' + this.gold, { fontSize: '16px', color: '#fff' });
        this.enemyText = this.add.text(10, 70, '', { fontSize: '16px', color: '#fff' });

        this.endTurnButton = this.add.text(700, 550, 'Fin du tour', { fontSize: '24px', backgroundColor: '#333', padding: 10 })
            .setInteractive();
        this.endTurnButton.on('pointerdown', () => this.endPlayerTurn());

        this.startNextRoom();
    }

    displayHand() {
        if (this.handGroup) {
            this.handGroup.clear(true, true);
        }
        this.handGroup = this.add.group();
        this.hand.forEach((card, index) => {
            const container = this.add.container(200 + index * 120, 430);
            const rect = this.add.rectangle(0, 0, 100, 150, 0x444444).setOrigin(0.5, 0);
            rect.setStrokeStyle(2, 0xffffff);
            const label = this.add.text(-40, 10, card.name, { fontSize: '16px', color: '#fff' });
            container.add([rect, label]);
            container.setSize(100, 150);
            container.setInteractive(new Phaser.Geom.Rectangle(-50, 0, 100, 150), Phaser.Geom.Rectangle.Contains);
            container.on('pointerdown', () => this.playCard(card, container));
            this.handGroup.add(container);
        });
    }

    playCard(card, cardDisplay) {
        if (this.playerEnergy <= 0) return;
        this.playerEnergy -= 1;
        this.energyText.setText('Énergie: ' + this.playerEnergy);
        cardDisplay.destroy();
        if (card.type === 'attack') {
            this.enemyHP -= card.damage;
            this.enemyText.setText('HP Ennemi: ' + this.enemyHP);
        }
        if (card.type === 'defense') {
            this.playerHP += 2;
            this.hpText.setText('HP: ' + this.playerHP);
        }
        // Handle other card types later
    }

    endPlayerTurn() {
        if (this.currentRoomType === 'combat') {
            this.enemyAction();
            if (this.playerHP <= 0) {
                this.add.text(400, 300, 'Défaite!', { fontSize: '32px', color: '#f00' }).setOrigin(0.5);
                this.scene.pause();
                return;
            }
            if (this.enemyHP <= 0) {
                this.add.text(400, 300, 'Victoire!', { fontSize: '32px', color: '#0f0' }).setOrigin(0.5);
                this.gold += 10;
                this.goldText.setText('Or: ' + this.gold);
                this.time.delayedCall(1500, () => this.startNextRoom());
                return;
            }
        }
        this.playerEnergy = 3;
        this.energyText.setText('Énergie: ' + this.playerEnergy);
        this.displayHand();
    }

    enemyAction() {
        this.playerHP -= 3;
        this.hpText.setText('HP: ' + this.playerHP);
    }

    startNextRoom() {
        this.clearRoom();
        this.roomCount += 1;
        if (this.roomCount > this.maxRooms) {
            this.add.text(400, 300, 'Donjon terminé!', { fontSize: '32px', color: '#0f0' }).setOrigin(0.5);
            this.scene.pause();
            return;
        }
        const types = ['combat', 'event', 'merchant'];
        this.currentRoomType = Phaser.Utils.Array.GetRandom(types);
        if (this.currentRoomType === 'combat') {
            this.initCombat();
        } else if (this.currentRoomType === 'merchant') {
            this.openMerchant();
        } else {
            this.showEvent();
        }
    }

    clearRoom() {
        if (this.handGroup) {
            this.handGroup.clear(true, true);
        }
        if (this.enemySprite) this.enemySprite.destroy();
        this.enemyText.setText('');
    }

    initCombat() {
        this.enemyHP = 20;
        this.playerEnergy = 3;
        this.enemyText.setText('HP Ennemi: ' + this.enemyHP);
        this.drawHand();
    }

    drawHand() {
        this.hand = Phaser.Utils.Array.Shuffle(this.deck).slice(0, 3);
        this.displayHand();
    }

    openMerchant() {
        const offer = { name: 'Super Attaque', type: 'attack', damage: 8 };
        const text = this.add.text(400, 300, 'Acheter "' + offer.name + '" pour 10 or', { fontSize: '20px', backgroundColor: '#333', padding: 10 })
            .setOrigin(0.5)
            .setInteractive();
        text.on('pointerdown', () => {
            if (this.gold >= 10) {
                this.gold -= 10;
                this.goldText.setText('Or: ' + this.gold);
                this.deck.push(offer);
                text.destroy();
                this.startNextRoom();
            }
        });
    }

    showEvent() {
        const reward = Phaser.Math.Between(5, 15);
        const text = this.add.text(400, 300, 'Événement! Vous trouvez ' + reward + ' or.', { fontSize: '20px', backgroundColor: '#333', padding: 10 })
            .setOrigin(0.5)
            .setInteractive();
        text.on('pointerdown', () => {
            this.gold += reward;
            this.goldText.setText('Or: ' + this.gold);
            text.destroy();
            this.startNextRoom();
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    scene: [MenuScene, GameScene]
};

new Phaser.Game(config);
