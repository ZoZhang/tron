// socket.io websocket services

const port = 8899;
const clients = {
    data: {
        currentSockId: null,
        joueurs: {}
        
    },
    attentes: {
        intervalId: null,
        joueurs: [],
        matchs: [],
    },
};

const io = require('socket.io')(port);

io.sockets.on('connection', socket => {

    clients.currentSockId = socket.id;
    console.log('nouveau joueur connecté:' + clients.currentSockId);

    // effacer les données au joueur quitté
    socket.on('disconnect', cleanJoueursQuitte);
    socket.on('deconnexion', cleanJoueursQuitte);

    // validation la disponibilité du pesudo et couleur
    socket.on('initialiseData', (joueur, callback) => {

        // initialise les donées du joueurs
        if (!clients.data.joueurs[clients.currentSockId]) {
            clients.data.joueurs[clients.currentSockId] = joueur;
            clients.attentes.joueurs.push(clients.currentSockId);
            callback({success: true, message: 'Votre pesudo est disponible.'});
        } else {
            callback({success: false, message: 'Votre pesudo n\'est plus disponible !'});
        }

        console.log('tous les joueurs:', clients.data.joueurs);
    });

    // mise à jour la list d'attente.
    clients.attentes.intervalId = setInterval(updateListAttente, 1000);

    // mise à jour les doneées à la list d'attente
    function updateListAttente() {

        // gere les joueurs dans la liste d'attente.
        if (clients.attentes.joueurs.length <= 1) {
            return;
        }

        // mettre les deux joueurs matchs dans une même liste.
        for(let i=0;i<clients.attentes.joueurs.length;i++) {
            // recupere les deux premiere joueurs
            const firstClientSocketId = clients.attentes.joueurs[i];
            const nextClientSocketId = clients.attentes.joueurs.splice(i+1, 1).toString();

            if (!nextClientSocketId) {
                continue;
            }

            // clean list d'attente
            clients.attentes.joueurs.remove(firstClientSocketId);
            clients.attentes.joueurs.remove(nextClientSocketId);

            // match les deux joueurs dans la même liste
            clients.attentes.matchs.push([firstClientSocketId, nextClientSocketId]);
        }

        updateListJoeurMatchs();
    }

    // mise à jour les doneées à la list joueur du matchs
    function updateListJoeurMatchs() {

        for(let i=0;i<clients.attentes.matchs.length;i++) {
            let joeurUserData;

            const firstJoueurSocketId =  clients.attentes.matchs[i].shift();
            const lastJoueurSocketId =  clients.attentes.matchs[i].pop();

            const firstJoeurUserData = clients.data.joueurs[lastJoueurSocketId];
            if (!firstJoeurUserData) {
                console.log('exception user data du match', lastJoueurSocketId);
                continue;
            }

            const lastJoeurUserData = clients.data.joueurs[firstJoueurSocketId];
            if (!lastJoeurUserData) {
                console.log('exception user data du match', firstJoueurSocketId);
                continue;
            }

            io.to(firstJoueurSocketId).emit('updateListAttente', firstJoeurUserData);
            io.to(lastJoueurSocketId).emit('updateListAttente', lastJoeurUserData);
        }
    }

    // nettoye list du joueurs quittés
    function cleanJoueursQuitte()
    {
        console.log("client déconnectée:" + socket.id);

        delete clients.data.joueurs[socket.id];
        clients.attentes.joueurs.remove(socket.id);

        // update les joueurs dans la liste d'attente match.
        updateListMatchs();
    }

    // update les joueurs dans la liste d'attente match.
    function updateListMatchs()
    {
        for(let i=0;i<clients.attentes.matchs.length;i++) {
            for(let j=0;j<clients.attentes.matchs[i].length;j++) {

                if (clients.attentes.matchs[i][j] !== socket.id) {
                    continue;
                }

                clients.attentes.matchs[i].remove(socket.id);
                clients.attentes.joueurs.push(clients.attentes.matchs[i].pop().toString());
            }
            return;
        }
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
