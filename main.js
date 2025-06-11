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
    }

    create() {
        this.hpText = this.add.text(10, 10, 'HP: ' + this.playerHP, { fontSize: '16px', color: '#fff' });
        this.energyText = this.add.text(10, 30, 'Énergie: ' + this.playerEnergy, { fontSize: '16px', color: '#fff' });
        this.enemyText = this.add.text(10, 50, 'HP Ennemi: ' + this.enemyHP, { fontSize: '16px', color: '#fff' });

        this.endTurnButton = this.add.text(700, 550, 'Fin du tour', { fontSize: '24px', backgroundColor: '#333', padding: 10 })
            .setInteractive();
        this.endTurnButton.on('pointerdown', () => this.endPlayerTurn());

        this.hand = ['Attaque', 'Défense', 'Sort'];
        this.displayHand();
    }

    displayHand() {
        if (this.handGroup) {
            this.handGroup.clear(true, true);
        }
        this.handGroup = this.add.group();
        this.hand.forEach((card, index) => {
            const cardText = this.add.text(200 + index * 120, 500, card, {
                fontSize: '20px',
                backgroundColor: '#222',
                padding: 10
            }).setInteractive();
            cardText.on('pointerdown', () => this.playCard(card, cardText));
            this.handGroup.add(cardText);
        });
    }

    playCard(card, cardText) {
        if (this.playerEnergy <= 0) return;
        this.playerEnergy -= 1;
        this.energyText.setText('Énergie: ' + this.playerEnergy);
        cardText.destroy();
        if (card === 'Attaque') {
            this.enemyHP -= 5;
            this.enemyText.setText('HP Ennemi: ' + this.enemyHP);
        }
        // Handle other card types later
    }

    endPlayerTurn() {
        this.enemyAction();
        if (this.playerHP <= 0) {
            this.add.text(400, 300, 'Défaite!', { fontSize: '32px', color: '#f00' }).setOrigin(0.5);
            this.scene.pause();
            return;
        }
        if (this.enemyHP <= 0) {
            this.add.text(400, 300, 'Victoire!', { fontSize: '32px', color: '#0f0' }).setOrigin(0.5);
            this.scene.pause();
            return;
        }
        this.playerEnergy = 3;
        this.energyText.setText('Énergie: ' + this.playerEnergy);
        this.displayHand();
    }

    enemyAction() {
        this.playerHP -= 3;
        this.hpText.setText('HP: ' + this.playerHP);
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
