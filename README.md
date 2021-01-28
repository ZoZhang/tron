## Projet Tron
Un simple jeux du Tron base en HTML、Css、Javascipt avec Websocket.

#### Lance websocket serveur
Il faut installer d'abord les packages dépendants `npm install ` et lance le serveur websocket par la commande `node server.js`;

#### Lance sur un navigateur
Ouvrirez `www/index.html` dans votre navigateur. 

**Attention :** C'est un jeu en ligne, il faut deux client du navigateur pour commencer à jouer.
#### Lance sur un émulateur du Cordova
Si vous voulez jouer avec `Cordova`. il faut d'abord installer l'environnement du `Cordova`.

Pour lancer dans le navigateur il faut utiliser les commandes :
`cordova platform add browser —save`
`cordova prepare`
`cordova run browser`

Pour lancer sur l’émulateur il faut utiliser les commandes :
`cordova platform add android —save`
`cordova build`
`cordova run android`

### Structure du donnée
```
const servers = {
    couleurs : [
        '#35af3d', '#a832c5', '#bfba1b', '#2d69b3'
    ],
    data: {
        currentSockId: null, // l'id du websocket dont le client connecté.
        joueurs: { // tout les donées des joueurs en ligne.
        'QKl_obCpCj4zFmo-AAAH': {
            pseudo: 'test',
            score: 0,
            direction: null,
            position: [ 
                [x:0, y: 0] 
            ],
            couleur: '#2d69b3',
            socketId: 'QKl_obCpCj4zFmo-AAAH'
          }
        ....
        } 
    },
    attentes: {
        intervalId: null, // l'id d'interval d'event du matchs list d'attente.
        joueurs: [], // les ids des joueurs dans la liste d'attente
        matchs: [], // les deux ids sur les joueurs dans la liste matchs.
    },
};
```

## Fonctionnalités accomplis

#### Frontend
* [x] Enregistrer par localStorage
* [x] Single Page Bootstrap en JavaScript
* [x] Page list d'attente
* [x] Notification lors qu'il y a des messages
* [x] Création les bocks d'obstacles
* [x] Synchronisation les données au l'autre client web
* [x] Calcule le score
* [x] Avec 2 flèches directionnelles (gauche/droit) pour contrôler la direction du Tron 

#### Backend
* [x] Validation pseudo && Génération un couleur unique.
* [x] Match les deux joueurs dans une même liste.
* [x] Synchronisation les données au client web.
* [x] Nettoie les données lorsque le client quitté.

### Bibliothèque
* [x] [jQuery](https://jquery.com/) - une bibliothèque JavaScript
* [x] [Bootstrap](https://getbootstrap.com/) - CSS Framework
* [x] [Socket.io](https://socket.io/) - une bibliothèque JavaScript websocket.
* [x] [Cordova](https://cordova.apache.org/) - Cordova permet de créer des applications “hybrides” avec HTML, CSS et JavaScript.

### Diagramme du processus 
<img style="margin:0 auto;width:40%;" src="https://i.imgur.com/M8Wm10P.png"/>
<br/>

### Démonstration
#### Page d'accueil
<img style="margin-right:10px;width:40%;" src="https://i.imgur.com/fsCsgoF.jpg"/>

<br/>

#### List d'attente
<img style="margin-right:10px;width:40%;" src="https://i.imgur.com/AzPwvJK.jpg"/>

#### Liste d'attente au match avec l'autre jouer en distance
<img style="margin:0;width:40%;" src="https://i.imgur.com/QySAwmR.jpg"/>

<br/>
 
#### Le joueur1 a gagné le jeux

<img style="margin-right:10px;width:40%;" src="https://i.imgur.com/iV96k9B.jpg"/>

#### Le joueur2 a perdu le jeux
<img style="margin:0 auto;width:40%;" src="https://i.imgur.com/Imw4Cuq.jpg"/>


