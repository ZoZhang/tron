/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
;(function($){

    // object gloabl du jeu
    let tron = {};

    // dom ready jquery
    $(function() {

       tron = {

            // paramètres globaux du jeu
            params: {
                couleurs : [
                    { label: 'green', value: '#2E7D32' },
                    { label: 'greenblue', value: '#00BCD4' },
                    { label: 'pink', value: '#E91E63' },
                    { label: 'purple', value: '#B71C1C' },
                ]
            },

            // initialise les paramètres du HTML et les valeus par défaut et les events.
            initialized: function() {

                tron.initializParams();

                tron.initializValues();

                tron.initializCouter();

                tron.initializEvents();

                tron.initializWebSocket();

                // debugs
                //tron.startJeux();
            },

            // initialise les variables d'element du HTML
            initializParams: function() {

                // buttons
                tron.params.ButtonStart = $('#commencer');
                tron.params.ButtonStop = $('#quitte');

                // form
                tron.params.MainForm = $('#main-form');

                // canvas
                tron.params.MainCanvas = document.getElementById('main-canvas');
                tron.params.MainCtx = tron.params.MainCanvas.getContext('2d')

                // input
                tron.params.InputPesudo = $('#pseudo');

                //alert
                tron.params.AlertSuccess = $('.alert-success');
                tron.params.AlertWarning = $('.alert-warning');

                // layout
                tron.params.LayoutPesudo = $('#layout-pseudo');
                tron.params.LayoutJeu = $('#layout-jeu');
                tron.params.LayoutAttente = $('#layout-attente');
                tron.params.LayoutPlateau = $('#layout-plateau');

                // block
                tron.params.BlockInputPesudo = $('#block-input-pseudo');
                tron.params.BlockShowPesudo = $('#block-show-pseudo');

                if(!tron.params.MainCanvas.getContext) {
                    tron.params.AlertWarning.text('Votre navigateur ne prend pas en charge le canevas !').removeClass('d-none');
                    return false;
                }
            },

            // initialise les valeurs d'objet ou html
            initializValues: function() {

                // initialise la valeur pseudo par LocalStorage
                if (!window.localStorage) {
                    tron.params.BlockInputPesudo.removeClass('d-none');
                    console.log('cette navigateur ne support pas LocalStorage !');
                    return;
                }

                tron.params.LocalStorage = window.localStorage;

                tron.params.LocalPesudo = tron.params.LocalStorage.getItem('pseudo');
                if (tron.params.LocalPesudo) {
                   tron.params.InputPesudo.val(tron.params.LocalPesudo);
                    tron.params.BlockInputPesudo.removeClass('d-none');
                    tron.params.LayoutPesudo.removeClass('d-none');
                }
            },

            // initialise la valeur du couteur
            initializCouter: function() {

                // initialise la valeur du counteur
                tron.params.ListAttenteCounterVal = 1;

                if (tron.params.ListAttenteCounter) {
                   tron.params.LayoutAttente.find('ul li:last-child span').text(0);
                   clearInterval(tron.params.ListAttenteCounter);
                }
            },

            // initialise les events du HTML(input、button) pour manipuler le jeu
            initializEvents: function() {

                // form
                tron.params.MainForm.submit(tron.initialiseData);

                // button
                // tron.params.ButtonStart.click(tron.start);
                tron.params.ButtonStop.click(tron.stopJeux);
            },

            // initialise connexion websocket
            initializWebSocket: function() {

                const host = 'ws://127.0.0.1:8899';
                tron.params.socket = io(host, {transports: ['websocket', 'polling', 'flashsocket']});

                tron.params.socket.on('connect', () => {
                  console.log('WebSocket Client Connecté:', host);
                });

                // mise a jour la liste d'attente du jouer
                tron.params.socket.on('updateListAttente', (res) => {
                    tron.listAttenteUpdate(res);
                });

                // mise a jour les positions du jouer de distance.
                tron.params.socket.on('updateJoeurMatchsPosition', (res) => {
                    console.log(res);
                });
                
            },

            // validate la disponibilité du pseudo
            initialiseData: function(e) {

               e.preventDefault();

               tron.params.LocalPesudo = tron.params.InputPesudo.val();

               if (!tron.params.LocalPesudo) {
                 tron.params.InputPesudo.attr('placeholder', 'Vous devez saissir votre pseudo !');
                 return false;
               }

               tron.params.userData = {
                   pseudo: tron.params.LocalPesudo,
                   direction: null,
                   position: [
                       {
                           x: 26,
                           y: 40
                       }
                   ]
               };

               tron.params.socket.emit('initialiseData', tron.params.userData, function(res) {
                   if (res.success) {
                        tron.params.AlertWarning.addClass('d-none');
                        tron.params.LocalStorage.setItem('pseudo', res.joueur.pseudo);
                        tron.params.LocalStorage.setItem('couleur', res.joueur.couleur);

                         // layout
                        tron.params.ListAttenteCounter = window.setInterval(function(){
                           tron.params.LayoutAttente.find('ul li:last-child span').text(tron.params.ListAttenteCounterVal++);
                        }, 1000);

                        tron.params.LayoutPesudo.addClass('d-none');
                        tron.params.LayoutJeu.removeClass('d-none');
                        tron.params.LayoutAttente.find('ul li:first-child').css('background-color', res.joueur.couleur).children('span').text(res.joueur.pseudo).end().end().removeClass('d-none');;

                    } else {
                        tron.params.AlertWarning.text(res.message).removeClass('d-none');
                    }
               });

               return false;
            },

            // initialise les layout différents dans le HTML
            listAttenteStart: function() {

            },

            // update la list d'attent
            listAttenteUpdate: function(joueur) {

               // donee
               if (!joueur || !Array.isArray(joueur)) {
                  tron.params.AlertWarning.text('Il y a un erreur du serveur, veuillez recommencer le jeux!').removeClass('d-none');
                  return false;
               }

               // layout
               tron.initializCouter();
               tron.params.JoueurMatchs = joueur;
               tron.params.LayoutAttente.find('ul li:last-child').css('background-color', tron.params.JoueurMatchs[1].couleur).html('<span>'+tron.params.JoueurMatchs[1].pseudo+'</span> - Prêt').removeClass('d-none');;

               // commence le jeux dans 3 second.
               let startJeuxCount = 3;
               const alertSuccess = '<p class="count-start-jeux">le jeu démarrera automatiquement après un compte à rebours de <span>'+startJeuxCount+'</span> secondes !</p>';

               tron.params.LayoutAttente.find('.header').addClass('d-none');
               tron.params.AlertSuccess.html(alertSuccess).removeClass('d-none');

               const StartJeuxCountInterval = setInterval(function(){
                   $('.count-start-jeux', tron.params.AlertSuccess).find('span').text(--startJeuxCount);
                   if (--startJeuxCount <= 0) {
                       tron.startJeux();
                       clearInterval(StartJeuxCountInterval);
                   }
               }, 1000)
            },

            // initialise le plateu du jeux
            startJeux: function() {

               // debug donées
               // tron.params.JoueurMatchs = [
               //     {
               //         pseudo: 'test1',
               //         couleur: '#B71C1C',
               //         direction: '',
               //         position: [
               //             {
               //                 x: 26,
               //                 y: 40
               //             }
               //         ]
               //     },
               //
               //     {
               //         pseudo: 'test2',
               //         couleur: '#2E7D32',
               //         direction: '',
               //         position: [
               //             {
               //                 x: 26,
               //                 y: 0
               //             }
               //         ]
               //     }
               // ];

               if (!tron.params.JoueurMatchs || !Array.isArray(tron.params.JoueurMatchs)) {
                   tron.params.AlertWarning.text('Il y a un erreur du serveur, veuillez recommencer le jeux!').removeClass('d-none');
                   return false;
               }

               console.log(tron.params.JoueurMatchs);

               // update joueur pseudo
               for(let i=0;i<tron.params.JoueurMatchs.length;i++) {
                   tron.params.LayoutPlateau.find('.joeur'+ (i+1) +' p > span:first-child').text(tron.params.JoueurMatchs[i].pseudo).css('color', tron.params.JoueurMatchs[i].couleur);
               }

               //mise a jour la position du jouer distance par defaut.
               tron.params.JoueurMatchs[1].position[0].y = 0;

               // initialise canvas
               tron.initialiseCanvas();

               // layout
               tron.params.LayoutJeu.removeClass('d-none');
               tron.params.LayoutAttente.addClass('d-none');
               tron.params.LayoutPlateau.removeClass('d-none');
           },

           // initialise les layouts par défauts et les valeurs par défauts
           stopJeux: function() {

               tron.initializValues();
               tron.initializCouter();

               tron.params.LayoutPesudo.removeClass('d-none');
               tron.params.LayoutJeu.addClass('d-none');
               tron.params.LayoutAttente.addClass('d-none');
               tron.params.LayoutPlateau.addClass('d-none');

               tron.params.socket.emit('deconnexion', function(res){
                   console.log(res);
               });

               return false;
           },

           // initialise le canvas
           initialiseCanvas: function() {

                // le size de cellule "tron"
                tron.params.MainCanvas.cw = 10;

                if(typeof tron.params.MainCanvas.gameLoop != "undefined"){
                   clearInterval(tron.params.MainCanvas.gameLoop);
                }

                tron.params.MainCtx.clearRect(0,0, tron.params.MainCanvas.width, tron.params.MainCanvas.height);

                //Dessin éléments de grille sur l'écran
                tron.params.MainCtx.strokeStyle = "#eee";
                tron.params.MainCtx.stroke();
                tron.params.MainCanvas.gameLoop = setInterval(tron.draw, 200); //--Vitesse de "tron"

                //Gestion des direction avec les boutons du clavier
                $(document).keydown(function(e) {
                   var key = e.which;
                   if(key == "37" && tron.params.MainCanvas.direction!= "right") tron.params.JoueurMatchs[0].direction = "left";
                   else if(key == "39" && tron.params.MainCanvas.direction!= "left") tron.params.JoueurMatchs[0].direction = "right";
               });
            },

            // Le algorithme de jeu
            draw: function() {
                var headTron; //le cellule qui contient les coordonnées du futur tete(moto) du tron

                // création les motos du tron avec les données des jouers.
                for(let i = 0;i<tron.params.JoueurMatchs.length;i++) {

                    for(let j = 0; j < tron.params.JoueurMatchs[i].position.length; j++) {

                        //l'obtention de la position actuelle de la tete(moto) du tron
                        var nx = tron.params.JoueurMatchs[i].position[j].x,
                            ny = tron.params.JoueurMatchs[i].position[j].y;

                        //on change la direction du tron en fonction de la valeur de la variable de "direction"(left|right|up|down)
                        switch(tron.params.JoueurMatchs[i].direction) {
                            case 'left':
                                  nx--;
                                  ny++;
                                  tron.params.JoueurMatchs[i].direction = '';
                                break;
                            case 'right':
                                  nx++;
                                  ny++;
                                  tron.params.JoueurMatchs[i].direction = '';
                                break;
                        }

                        // avancement automatiquement par les deux directions ( haut et bas ).
                        if (i == 0) {
                            ny--;
                        } else {
                            ny++;
                        }

                        //vérifions la collision du Tron avec lui-même ou avec les taille de la grille de canvas
                        if (nx == -1 || nx == tron.params.MainCanvas.width / tron.params.MainCanvas.cw || ny == -1 || ny == tron.params.MainCanvas.height / tron.params.MainCanvas.cw || tron.checkCollision(nx, ny, tron.params.JoueurMatchs[i].position)) {
                            //tron.initialiseCanvas();
                            //return;
                        } else {
                            //Si il y n'avait pas, créons une nouvelle cellule avec les nouvelles coordonnées
                            headTron = {x: nx, y: ny}
                            headTron.x = nx;
                            headTron.y = ny;

                            //Ajoute de cellule "headTron" au début de la tableaux joueur matchs
                            tron.params.JoueurMatchs[i].position.unshift(headTron);
                        }

                        // nettoye les anciennes cellules dans les cellules actuelles du jouer actuelle
                        if (i == 0 ) {
                            break;
                        }
                    }

                    if (i == 0 ) {
                        tron.params.socket.emit('synchroniseJoueurMatchsPosition', tron.params.JoueurMatchs[i]);
                    }

                    //dessin de trajectoire de tron
                    for(let k = 0; k < tron.params.JoueurMatchs[i].position.length; k++){
                        let cell = tron.params.JoueurMatchs[i].position[k];
                        tron.params.MainCtx.fillStyle = tron.params.JoueurMatchs[i].couleur; //-- couleur de tron
                        tron.params.MainCtx.fillRect(cell.x*tron.params.MainCanvas.cw, cell.y*tron.params.MainCanvas.cw, tron.params.MainCanvas.cw, tron.params.MainCanvas.cw);
                    }
                }

                //la direction du tron
                //tron.params.MainCanvas.direction = 'down';

                //console.log(tron.params.MainCanvas.width);
            },

            //vérification les zones de collision
            checkCollision: function(x,y,array){
               for(var i = 0; i<array.length; i++){
                   if(array[i].x == x && array[i].y == y) return true;
               }
               return false;
            }
       };

       if (typeof cordova != 'undefined') {
            // Wait for the deviceready event before using any of Cordova's device APIs.
           // See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
           document.addEventListener('deviceready', tron.initialized, false);
       } else {
           tron.initialized();
       }

    });
})(jQuery);
