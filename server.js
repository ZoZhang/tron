// socket.io websocket services

const port = 8899;
const clients = {
    joueurs: {},
    attentes: []
};

const io = require('socket.io')(port);

io.on('connection', socket => {

  const socketId = socket.id;

  // effacer les données au joueur actuelle
  socket.on('disconnect', (data) => {

        delete clients.joueurs[socketId];
        clients.attentes = arrayRemove(clients.attentes, socketId);

        console.log(clients.attentes);
  });

  // validation la disponibilité du pesudo et couleur
  socket.on('initialiseData', (joueur, callback) => {

        // initialise les donées du joueurs
        if (!clients.joueurs[socketId]) {
            clients.joueurs[socketId] = joueur;
            clients.attentes.push(socketId);
            callback({success: true, message: 'Votre pesudo est disponible.'});
        } else {
            callback({success: false, message: 'Votre pesudo n\'est plus disponible !'});
        }

        // gere les joueurs dans la liste d'attente.
        if (clients.attentes.length > 1) {

        console.log(clients.attentes);

            for(let idx in clients.attentes) {
                const clientSocketId = clients.attentes[idx];

                // exclure le joueur actuel
                if (socketId == clientSocketId) {
                    continue;
                }

                // vérifiez si l'utilisateur en file d'attente existe
                if (!clients.joueurs[clientSocketId]) {
                    clients.attentes = arrayRemove(clients.attentes, clientSocketId);
                } else {
                    // envoyer d'autres jouerus du données au client actuel
                    console.log('update list attent..');
                    socket.emit('updateListAttente', clients.joueurs[clientSocketId]);
                }
            }
        }
  });


});

function arrayRemove(arr, idx) {
    const idxOf = arr.indexOf(idx);
    return arr.splice(idxOf, 1);
}