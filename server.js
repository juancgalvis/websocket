// chat-server.js

// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'chess-game';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('ws').server;
var http = require('http');

/**
 * Global variables
 */
// list of currently connected clients (users)
var clients = new Array();

function Game(gamera, gamerb){
    this.gamera = gamera;
    this.gamerb = gamerb;
}

var waiting = false;

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. To be honest I don't understand why.
    httpServer: server
});

// This callback function is called every time someone tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection
    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
    console.log((new Date()) + ' Connection from origin ' + connection.remoteAddress + '.');
    if(waiting === false){
        waiting = connection;
        connection.sendUTF("connected");
        console.log((new Date()) + ' Connection accepted. Gamer A');
    }else{
        console.log((new Date()) + ' Connection accepted. Gamer B');
        console.log((new Date()) + ' Game Created');
        clients.push(new Game(waiting, connection));
        waiting.sendUTF("gamera");
        connection.sendUTF("connected");
        connection.sendUTF("gamerb");
        waiting.sendUTF("gamecreated");
        connection.sendUTF("gamecreated");
        waiting = false;
    }

    

    // user sent some message
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text
            // log and broadcast the message
                
                if(message.utf8Data === 'disconnected' && connection === waiting){
                    waiting = false;
                }
                // broadcast message to all connected clients
                //var json = JSON.stringify(message.utf8Data);
                for (var i=0; i < clients.length; i++) {
                    if(clients[i].gamera === connection){
                        console.log((new Date()) + ' Gamer A send ' + message.utf8Data);
                        clients[i].gamerb.sendUTF(message.utf8Data);
                        if(message.utf8Data == 'disconnected'){
                            clients.splice(i, 1);
                        }
                    } else if(clients[i].gamerb === connection){
                        console.log((new Date()) + ' Gamer B send ' + message.utf8Data);
                        clients[i].gamera.sendUTF(message.utf8Data);                        
                        if(message.utf8Data == 'disconnected'){
                            clients.splice(i, 1);
                        }
                    }
                }
            
        }
    });
    // user disconnected
    connection.on('close', function(connection) {
        if(connection === waiting){
            waiting = false;
        }else{
            for (var i=0; i < clients.length; i++) {
                if(clients[i].gamera === connection){
                    clients[i].gamerb.sendUTF('disconnected');
                    clients.splice(i, 1);
                } else if(clients[i].gamerb === connection){
                    clients[i].gamera.sendUTF('disconnected');
                    clients.splice(i, 1);
                }
            }
        }
    });

});         