// socket.io websocket services

const port = 8899;
const clients = {
    joueurs: {},
    attentes: {
        intervalId: null,
        joueurs: []
    },
};

const io = require('socket.io')(port);

io.sockets.on('connection', socket => {

    // effacer les données au joueur actuelle
    socket.on('disconnect', () => {

       delete clients.joueurs[socket.id];
       clients.attentes.joueurs.remove(socket.id);

       console.log("client déconnectée:" + socket.id, clients);
    });

    // validation la disponibilité du pesudo et couleur
    socket.on('initialiseData', (joueur, callback) => {

        // initialise les donées du joueurs
        if (!clients.joueurs[socket.id]) {
            clients.joueurs[socket.id] = joueur;

            clients.attentes.joueurs.push(socket.id);

            callback({success: true, message: 'Votre pesudo est disponible.'});
        } else {
            callback({success: false, message: 'Votre pesudo n\'est plus disponible !'});
        }

    });

    // mise à jour la list d'attente.
    clients.attentes.intervalId = setInterval(updateListAttente, 1000);

    // mise à jour les doneées à la list d'attente
    function updateListAttente() {

        // gere les joueurs dans la liste d'attente.
        if (clients.attentes.joueurs.length <= 1) {
            return;
        }

        for(let idx in clients.attentes.joueurs) {
            const clientSocketId = clients.attentes.joueurs[idx];

            // exclure le joueur actuel
            if (socket.id == clientSocketId) {
                continue;
            }

            // vérifiez si l'utilisateur en file d'attente existe
            if (typeof clients.joueurs[clientSocketId] == "undefined") {
                clients.attentes.joueurs.remove(clientSocketId);
            } else {
                io.to(socket.id).emit('updateListAttente', clients.joueurs[clientSocketId]);
            }
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
