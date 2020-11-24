// Node.js WebSocket server script
const http = require('http');
const WebSocketServer = require('websocket').server;

const port = 8899;
const server = http.createServer();

server.listen(port);

const wsServer = new WebSocketServer({
    httpServer: server
});


wsServer.on('request', function(request) {

    const connection = request.accept(null, request.origin);

    connection.sendUTF('Bienvenu mec !');

    connection.on('message', function(message) {

 		if (message.type === 'utf8') {

            console.log('Message reçu: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);

        } else  if (message.type === 'binary') {
            console.log('Message binaire reçu de ' + message.binaryData.length + ' Octets');
            connection.sendBytes(message.binaryData);
        }

    });

    connection.on('close', function(reasonCode, description) {
     	console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' déconnecté.');
    });
});

console.log("websocket server démarré, vous pouvez vous connecter au websocket avec l'adresse ws://127.0.0.1:%s", port)