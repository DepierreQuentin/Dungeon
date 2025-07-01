# Dungeon

**Dungeon** est un jeu de deck building jouable directement dans un navigateur. Le joueur constitue un paquet de cartes et affronte des ennemis tour par tour tout en progressant dans un donjon.

## Principe du jeu

Au lancement, l'écran titre propose de commencer une partie, de consulter le tutoriel ou de voir la liste des succès obtenus. Une fois la partie démarrée, le joueur reçoit un deck de base et 100 pièces d'or. Chaque "run" se déroule en choisissant parmi plusieurs salles successives.

### Types de salles

- **Combat** : un affrontement contre un ennemi aléatoire. Le joueur pioche cinq cartes, dispose d'une réserve d'énergie pour les jouer et doit réduire les points de vie de l'adversaire à zéro. Les cartes se divisent en attaques, compétences défensives et pouvoirs permanents.
- **Événement** : divers événements octroient de l'or, infligent des dégâts ou permettent d'acheter une carte rare. Certains événements déclenchent une embuscade qui mène immédiatement à un combat.
- **Marchand** : permet d'acheter des packs de cartes (petit, moyen ou grand). Les cartes obtenues sont ajoutées à la collection et peuvent rejoindre le deck actif.
- **Repos** : soigne environ 30 % des points de vie manquants.

Après chaque combat, un écran de récompense apparaît : le joueur choisit une nouvelle carte parmi trois tirées aléatoirement et reçoit éventuellement de l'or supplémentaire. La progression continue jusqu'à épuisement des points de vie du joueur, moment où l'écran "Game Over" affiche le nombre d'ennemis vaincus.

## Gestion du deck

Le deck actif doit contenir entre 10 et 20 cartes. Depuis l'écran de gestion de deck, on peut retirer ou ajouter des cartes de la collection pour ajuster sa stratégie. Il existe trois raretés (commune, peu commune et rare) et chaque carte a un coût en énergie et un effet spécifique (dégâts, blocage, application d'altérations d'état, etc.). Un bouton séparé donne accès à un index listant toutes les cartes disponibles dans le jeu.

## Système de succès

Cinq succès sont implémentés, par exemple vaincre son premier ennemi ou terminer un combat avec beaucoup de bloc. Lorsqu'un succès est validé, une notification apparaît et une récompense (carte rare ou or) est octroyée. Le menu "Achievements" permet de consulter la progression.

## Lancer le jeu

Aucune installation n'est nécessaire : il suffit d'ouvrir `index.html` dans un navigateur moderne. Le projet ne contient pas de dépendances externes ni de système de build. Les images et les scripts JavaScript se trouvent respectivement dans les dossiers `images` et à la racine du dépôt.

