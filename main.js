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
        this.money = 0;
        this.enemyHP = 20;
        this.deck = ['Attaque', 'Attaque', 'Défense'];
        this.rooms = [];
        this.currentRoom = 0;
    }

    create() {
        this.activeUI = [];
        this.hpText = this.add.text(10, 10, 'HP: ' + this.playerHP, { fontSize: '16px', color: '#fff' });
        this.moneyText = this.add.text(10, 30, 'Or: ' + this.money, { fontSize: '16px', color: '#fff' });
        this.energyText = this.add.text(10, 50, '', { fontSize: '16px', color: '#fff' });
        this.generateRooms(6);
        this.nextRoom();
    }

    generateRooms(count) {
        const types = ['fight', 'event', 'shop'];
        for (let i = 0; i < count; i++) {
            this.rooms.push({ type: Phaser.Utils.Array.GetRandom(types) });
        }
    }

    clearUI() {
        if (this.handGroup) {
            this.handGroup.clear(true, true);
            this.handGroup = null;
        }
        this.activeUI.forEach(o => o.destroy());
        this.activeUI = [];
    }

    nextRoom() {
        this.clearUI();
        if (this.currentRoom >= this.rooms.length) {
            this.add.text(400, 300, 'Fin du donjon!', { fontSize: '32px', color: '#0f0' }).setOrigin(0.5);
            this.scene.pause();
            return;
        }
        const room = this.rooms[this.currentRoom++];
        if (room.type === 'fight') {
            this.startFight();
        } else if (room.type === 'shop') {
            this.startShop();
        } else {
            this.startEvent();
        }
    }

    startFight() {
        this.enemyHP = 20;
        this.playerEnergy = 3;
        this.energyText.setText('Énergie: ' + this.playerEnergy);
        this.enemyText = this.add.text(10, 70, 'HP Ennemi: ' + this.enemyHP, { fontSize: '16px', color: '#fff' });
        this.activeUI.push(this.enemyText);
        this.endTurnButton = this.add.text(650, 550, 'Fin du tour', { fontSize: '24px', backgroundColor: '#333', padding: 10 })
            .setInteractive();
        this.endTurnButton.on('pointerdown', () => this.endPlayerTurn());
        this.activeUI.push(this.endTurnButton);
        this.drawHand();
    }

    drawHand() {
        const shuffled = Phaser.Utils.Array.Shuffle([...this.deck]);
        this.hand = shuffled.slice(0, 3);
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
        } else if (card === 'Défense') {
            this.playerHP += 2;
            this.hpText.setText('HP: ' + this.playerHP);
        }
        if (this.enemyHP <= 0) {
            this.playerWin();
        }
    }

    endPlayerTurn() {
        this.enemyAction();
        if (this.playerHP <= 0) {
            this.add.text(400, 300, 'Défaite!', { fontSize: '32px', color: '#f00' }).setOrigin(0.5);
            this.scene.pause();
            return;
        }
        if (this.enemyHP <= 0) {
            this.playerWin();
            return;
        }
        this.playerEnergy = 3;
        this.energyText.setText('Énergie: ' + this.playerEnergy);
        this.drawHand();
    }

    enemyAction() {
        this.playerHP -= 3;
        this.hpText.setText('HP: ' + this.playerHP);
    }

    playerWin() {
        this.money += 10;
        this.moneyText.setText('Or: ' + this.money);
        const text = this.add.text(400, 300, 'Victoire! +10 or', { fontSize: '32px', color: '#0f0' }).setOrigin(0.5).setInteractive();
        this.activeUI.push(text);
        text.on('pointerdown', () => this.nextRoom());
    }

    startEvent() {
        const events = [
            () => { this.money += 5; this.moneyText.setText('Or: ' + this.money); return 'Vous trouvez 5 or'; },
            () => { this.playerHP = Math.max(1, this.playerHP - 5); this.hpText.setText('HP: ' + this.playerHP); return 'Un piège! -5 HP'; }
        ];
        const result = Phaser.Utils.Array.GetRandom(events)();
        const text = this.add.text(400, 300, result, { fontSize: '24px', color: '#fff', backgroundColor: '#333', padding: 10 }).setOrigin(0.5).setInteractive();
        this.activeUI.push(text);
        text.on('pointerdown', () => this.nextRoom());
    }

    startShop() {
        const title = this.add.text(400, 100, 'Marchand', { fontSize: '28px', color: '#fff' }).setOrigin(0.5);
        this.activeUI.push(title);
        const cards = ['Attaque', 'Défense'];
        cards.forEach((card, i) => {
            const option = this.add.text(300, 200 + i * 60, card + ' - 10 or', {
                fontSize: '20px', backgroundColor: '#222', padding: 10
            }).setInteractive();
            option.on('pointerdown', () => {
                if (this.money >= 10) {
                    this.money -= 10;
                    this.moneyText.setText('Or: ' + this.money);
                    this.deck.push(card);
                    option.destroy();
                }
            });
            this.activeUI.push(option);
        });
        const cont = this.add.text(400, 500, 'Continuer', { fontSize: '24px', backgroundColor: '#333', padding: 10 })
            .setOrigin(0.5).setInteractive();
        cont.on('pointerdown', () => this.nextRoom());
        this.activeUI.push(cont);
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
