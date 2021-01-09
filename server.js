// socket.io websocket services

const port = 8899;
const servers = {
    couleurs : [
        '#35af3d', '#a832c5', '#bfba1b', '#2d69b3'
    ],
    data: {
        currentSockId: null, // l'id du websocket dont le client connecté.
        joueurs: {} // tout les donées des joueurs en ligne.
    },
    attentes: {
        intervalId: null, // l'id d'interval d'event du matchs list d'attente.
        joueurs: [], // les ids des joueurs dans la liste d'attente
        matchs: [], // les deux ids sur les joueurs dans la liste matchs.
    },
};

const io = require('socket.io')(port);

io.sockets.on('connection', socket => {

    socket.id = socket.id;
    console.log('nouveau joueur connecté:' + socket.id);

    // effacer les données au joueur quitté
    socket.on('disconnect', cleanJoueursQuitte);
    socket.on('deconnexion', cleanJoueursQuitte);

    // validation la disponibilité du pseudo et couleur
    socket.on('initialiseData', (joueur, callback) => {

        joueur = verifieDonees(joueur);
        if (joueur) {
            // initialise les donées du joueurs
            if (!servers.data.joueurs[socket.id]) {
                joueur.socketId = socket.id;
                servers.data.joueurs[socket.id] = joueur;
                servers.attentes.joueurs.push(socket.id);
            }

            callback({success: true, joueur, message: 'Votre pseudo est disponible.'});
        } else {
            callback({success: false, joueur, message: 'Votre pseudo n\'est plus disponible !'});
        }

       console.log('tous les joueurs:', servers.data.joueurs);
    });

    // validation la disponibilité du pseudo et couleur
    socket.on('synchroniseJoueurMatchsPosition', (joueur) => {

        if (servers.attentes.matchs.length <= 0) {
            return false;
        }

        let MatchJoueurScoketId;

        // cacule l'id socket du jouer sous la list matchs
        for(let i=0;i<servers.attentes.matchs.length;i++) {

            const CurrentMatchsListJouers = servers.attentes.matchs[i];
            const indexCurrentJoueurMatch = CurrentMatchsListJouers.indexOf(joueur.socketId);

            if(indexCurrentJoueurMatch != -1) {
                MatchJoueurScoketId = indexCurrentJoueurMatch <= 0 ? CurrentMatchsListJouers[1] : CurrentMatchsListJouers[0];
                break;
            }
        }

        if (MatchJoueurScoketId) {
            io.to(MatchJoueurScoketId).emit('updateJoeurMatchsPosition', joueur);
        }
    });

    // mise à jour la list d'attente.
    servers.attentes.intervalId = setInterval(updateListAttente, 500);

    // mise à jour les doneées à la list d'attente
    function updateListAttente() {

        // gere les joueurs dans la liste d'attente.
        if (servers.attentes.joueurs.length <= 1) {
            return;
        }

        // mettre les deux joueurs matchs dans une même liste.
        for(let i=0;i<servers.attentes.joueurs.length;i++) {
            // recupere les deux premiere joueurs
            const firstClientSocketId = servers.attentes.joueurs[i];
            const nextClientSocketId = servers.attentes.joueurs.splice(i+1, 1).toString();

            if (!nextClientSocketId) {
                continue;
            }

            // clean list d'attente
            servers.attentes.joueurs.remove(firstClientSocketId);
            servers.attentes.joueurs.remove(nextClientSocketId);

            // match les deux joueurs dans la même liste
            servers.attentes.matchs.push([firstClientSocketId, nextClientSocketId]);
        }

        updateListJoeurMatchs();
    }

    // mise à jour les doneées à la list joueur du matchs
    function updateListJoeurMatchs() {

        console.log('list matchs', servers.attentes.matchs);

        for(let i=0;i<servers.attentes.matchs.length;i++) {
            let joeurUserData;

            const firstJoueurSocketId =  servers.attentes.matchs[i][0];
            const lastJoueurSocketId =  servers.attentes.matchs[i][1];

            const firstJoeurUserData = servers.data.joueurs[lastJoueurSocketId];
            if (!firstJoeurUserData) {
                // console.log('exception user data du match', lastJoueurSocketId);
                continue;
            }

            const lastJoeurUserData = servers.data.joueurs[firstJoueurSocketId];
            if (!lastJoeurUserData) {
                // console.log('exception user data du match', firstJoueurSocketId);
                continue;
            }

            io.to(firstJoueurSocketId).emit('updateListAttente', [lastJoeurUserData, firstJoeurUserData]);
            io.to(lastJoueurSocketId).emit('updateListAttente', [firstJoeurUserData, lastJoeurUserData]);
        }
    }

    // nettoye list du joueurs quittés
    function cleanJoueursQuitte()
    {
        console.log("client déconnectée:" + socket.id);

        delete servers.data.joueurs[socket.id];
        servers.attentes.joueurs.remove(socket.id);

        // update les joueurs dans la liste d'attente match.
        for(let i=0;i<servers.attentes.matchs.length;i++) {
            for(let j=0;j<servers.attentes.matchs[i].length;j++) {

                if (servers.attentes.matchs[i][j] !== socket.id) {
                    continue;
                }

                servers.attentes.matchs[i].remove(socket.id);
                servers.attentes.joueurs.push(servers.attentes.matchs[i].pop().toString());
            }
            return;
        }
    }

    // vérifie les données doublés
    function verifieDonees(joueur)
    {
        try {
            // initialise couleur du joueur
            if (!joueur.couleur) {
                joueur.couleur = getCouleur();
            }

            for(let idx in servers.data.joueurs) {
                const joueurOnline = servers.data.joueurs[idx];

                if (joueurOnline.couleur == joueur.couleur) {
                    joueur.couleur = getCouleur();
                    return verifieDonees(joueur);
                }

                if (joueurOnline.pseudo.toUpperCase() == joueur.pseudo.toUpperCase()) {
                    return false;
                }
            }
        } catch(e) {
            console.log('Exception validation data', joueur);
            return false;
        }

        return joueur;
    }

    // recupere un couleur aléatoire
    function getCouleur()
    {
        const random = Math.floor(Math.random() * servers.couleurs.length);
        return servers.couleurs[random];
    }
});

// remove un element sur un table par son valeur.
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
