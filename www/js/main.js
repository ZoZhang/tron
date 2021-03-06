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
                debug: false,
                blockMort: true
            },

            // initialise les paramètres du HTML et les valeus par défaut et les events.
            initialized: function() {

                tron.initializParams();

                tron.initializValues();

                tron.initializCouter();

                tron.initializEvents();

                tron.initializWebSocket();

                // debug
                if (tron.params.debug) {
                    tron.startJeux();
                }
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
                tron.params.AlertDanger = $('.alert-danger');
                tron.params.AlertSuccess = $('.alert-success');
                tron.params.AlertWarning = $('.alert-warning');

                // layout
                tron.params.LayoutPesudo = $('#layout-pseudo');
                tron.params.LayoutJeu = $('#layout-jeu');
                tron.params.LayoutAttente = $('#layout-attente');
                tron.params.LayoutPlateau = $('#layout-plateau');

                // layer
                tron.params.LayerPlateauResultat = $('#layer-result');

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

                // interval position
                tron.params.PositionInterval = null;

                // l'étatu du jeux
                tron.params.JeuxTermine = false;

                // reverse block mort distance
                tron.params.ReverseBlockMortAdded = false;

                //initialisation les positions miroir
                tron.params.MainCanvas.PosMapping = {
                    x: [],
                    y: []
                };

                //initialisation les obstacles dans le plateu
                tron.params.MainCanvas.PosBlockMort = {
                    couleur: '#ffffff',
                    position: []
                };

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
                tron.params.ButtonStop.click(tron.quitteJeux);
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

                // mise a jour les positions du jouer de match.
                tron.params.socket.on('updateJoeurMatchsPosition', (joueur) => {

                    if (!joueur) {
                        return false;
                    }

                    // création les blocks morts miroir au jouer match(distance)
                    if (!tron.params.ReverseBlockMortAdded) {
                        tron.initialseBlockMort(true);
                        tron.params.ReverseBlockMortAdded = true;
                    }

                    // mise a jour le score du jeux.
                    tron.updateScore(2, joueur.score);

                    // création les positions miroir au jouer match(distance) && ajoute les positions block morts.
                    const reversePos = tron.reversePositions(joueur.position);
                    for(let i=0;i<reversePos.length;i++) {
                        tron.params.MainCanvas.PosBlockMort.position.push(reversePos[i]);
                    }
                    tron.drawCells(joueur.couleur, reversePos);

                    // validation le jouer distance. TODO
                    if(tron.checkCollision(joueur.position[0].x, joueur.position[0].y)) {
                        console.log('collision check', joueur.position);
                        tron.stopJeux();
                        return ;
                    }
                });

                // mise a jour les notifications.
                tron.params.socket.on('showResult', (res) => {

                    if (res.notification) {
                        tron.showResult(true);
                        tron.stopJeux();
                    }
                    return false;
                });

            },

            // validate la disponibilité du pseudo
            initialiseData: function(e) {

               e.preventDefault();

               if (!tron.params.socket.connected) {
                   tron.params.AlertDanger.text('Le service websocket est indisponible !').removeClass('d-none');
                   return false;
               }

               tron.params.LocalPesudo = tron.params.InputPesudo.val();

               if (!tron.params.LocalPesudo) {
                 tron.params.InputPesudo.attr('placeholder', 'Vous devez saissir votre pseudo !');
                 return false;
               }

               tron.params.joueurData = {
                   pseudo: tron.params.LocalPesudo,
                   score: 0,
                   direction: null,
                   position: [
                       {
                           x: 27,
                           y: 40
                       }
                   ]
               };

               tron.params.socket.emit('initialiseData', tron.params.joueurData, function(res) {
                   if (res.success) {
                        tron.params.AlertSuccess.addClass('d-none');
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

            // update la list d'attent
            listAttenteUpdate: function(joueur) {

               // donee
               if (!joueur || !Array.isArray(joueur)) {
                  tron.params.AlertWarning.text('Il y a un erreur du serveur, veuillez recommencer le jeux!').removeClass('d-none');
                  return false;
               }

               tron.params.AlertWarning.addClass('d-none');
               tron.params.AlertDanger.addClass('d-none');

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
                if (tron.params.debug) {
                    tron.params.JoueurMatchs = [
                        {
                            pseudo: 'test1',
                            score: 0,
                            couleur: '#B71C1C',
                            direction: '',
                            position: [
                                {
                                    x: 27,
                                    y: 40
                                }
                            ]
                        },

                        {
                            pseudo: 'test2',
                            score: 0,
                            couleur: '#2E7D32',
                            direction: '',
                            position: [
                                {
                                    x: 27,
                                    y: 0
                                }
                            ]
                        }
                    ];
                }

               if (!tron.params.JoueurMatchs || !Array.isArray(tron.params.JoueurMatchs)) {
                   tron.params.AlertWarning.text('Il y a un erreur du serveur, veuillez recommencer le jeux!').removeClass('d-none');
                   return false;
               }

               console.log('List matchs deux joueurs: ', tron.params.JoueurMatchs);

               // update joueur pseudo
               for(let i=0;i<tron.params.JoueurMatchs.length;i++) {
                   tron.params.LayoutPlateau.find('.joeur'+ (i+1) +' p > span:first-child').text(tron.params.JoueurMatchs[i].pseudo).css('color', tron.params.JoueurMatchs[i].couleur);
               }

               //mise a jour le score.
               tron.updateScore(1, 0);
               tron.updateScore(2, 0);

               //mise a jour la position du jouer distance par defaut.
               tron.params.JoueurMatchs[1].position[0].x = 20;
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

               // nettoye la création position interval
               clearInterval(tron.params.PositionInterval);

               let data = {};

               // notifie le resultat lors qu'il y a un vainqueur
               if (tron.params.JeuxTermine) {
                   // affiche le resultat
                   tron.showResult();

                   // synchronisation l'état au serveur
                   data.notification = true;

                   // envoye un signale au serveur.
                   tron.params.socket.emit('deconnexion', data, function(res){
                       console.log(res);
                   });
               }

               console.log('le jeux termine.');
               return false;
           },

           // quitter le jeux du plateau.
           quitteJeux: function() {
               window.location.reload();
           },

           // mise a jour les scores du jeux.
           updateScore: function(jouer, score) {
               tron.params.LayoutPlateau.find('.joeur'+jouer+' p > span:last-child').text(score);
           },

           // afficher le resultat du jeux
           showResult: function(win) {

                let html = '<div><h2>###TEXT###</h2></div>';

                if (win) {
                    html = html.replace('###TEXT###', 'Vous avez gagné !');
                } else {
                    html = html.replace('###TEXT###', 'Vous avez perdu !');
                }

               tron.params.LayerPlateauResultat.html(html).removeClass('d-none');
           },

           // initialise le canvas
           initialiseCanvas: function() {

               // le size de cellule "tron"
               tron.params.MainCanvas.cw = 10;
               tron.params.MainCtx.clearRect(0,0, tron.params.MainCanvas.width, tron.params.MainCanvas.height);

               //Dessin éléments de grille sur l'écran
               tron.params.MainCtx.strokeStyle = "#eee";
               tron.params.MainCtx.stroke();

               //initialisation les obstacles dans le plateu
               tron.initialseBlockMort();

               // géneration les positions miroir.
               for(let i=0,j = tron.params.MainCanvas.width / tron.params.MainCanvas.cw; j >= 0; i++, j--) {
                   tron.params.MainCanvas.PosMapping.x[i] = j;
               }

               for(let i=0,j = tron.params.MainCanvas.height / tron.params.MainCanvas.cw; j >= 0; i++, j--) {
                   tron.params.MainCanvas.PosMapping.y[i] = j;
               }

               // démarrage un interval du tron.
               tron.params.PositionInterval = setInterval(tron.createPosition, 400); //--Vitesse de "tron"

               // keyboard
               $(document).keydown(function(e) {
                   var key = e.which;
                   if(key == "37" ) tron.params.JoueurMatchs[0].direction = "left";
                   else if(key == "39") tron.params.JoueurMatchs[0].direction = "right";
               });
           },

           // crée les obstacles dans le plateu
           initialseBlockMort: function(revere) {

               // initialise les positions block morts
               if (tron.params.blockMort && tron.params.MainCanvas.PosBlockMort.position.length == 0) {
                   tron.params.MainCanvas.PosBlockMort.position = [
                       // left
                       {x: 13, y: 35},
                       {x: 15, y: 29},
                       {x: 19, y: 34},
                       {x: 10, y: 30},
                       {x: 8, y: 37},
                       {x: 3, y: 36},
                       {x: 4, y: 30},
                       {x: 21, y: 37},
                       {x: 22, y: 28},
                       {x: 23, y: 34},

                       // middle
                       {x: 25, y: 25},
                       {x: 27, y: 32},
                       {x: 28, y: 28},

                       // right
                       {x: 29, y: 37},
                       {x: 31, y: 35},
                       {x: 31, y: 31},
                       {x: 34, y: 38},
                       {x: 36, y: 33},
                       {x: 42, y: 37},
                       {x: 48, y: 38},
                       {x: 44, y: 32},
                       {x: 50, y: 35}
                   ];

                   for(let i=0;i<tron.params.MainCanvas.PosBlockMort.position.length;i++) {
                       tron.drawCells(tron.params.MainCanvas.PosBlockMort.couleur, tron.params.MainCanvas.PosBlockMort.position);
                   }
               }

               // création les positions block morts mirroirs.
               if (revere) {
                   const reversePos = tron.reversePositions(tron.params.MainCanvas.PosBlockMort.position);
                   for(let i=0;i<reversePos.length;i++) {
                       tron.params.MainCanvas.PosBlockMort.position.push(reversePos[i]);
                       tron.drawCells(tron.params.MainCanvas.PosBlockMort.couleur, reversePos);
                   }
               }
           },

           // Le algorithme position du jeux
           createPosition: function() {
               let headTron; //le cellule qui contient les coordonnées du futur tete(moto) du tron

               // cacule le position du premirer jouer.
               for(let i = 0;i < tron.params.JoueurMatchs[0].position.length; i++) {

                   //l'obtention de la position actuelle de la tete(moto) du tron
                   let nx = tron.params.JoueurMatchs[0].position[i].x,
                       ny = tron.params.JoueurMatchs[0].position[i].y;

                   //on change la direction du tron en fonction de la valeur de la variable de "direction"(left|right|up|down)
                   switch(tron.params.JoueurMatchs[0].direction) {
                       case 'left':
                           nx--;
                           ny++;
                           tron.params.JoueurMatchs[0].score += 50;
                           tron.params.JoueurMatchs[0].direction = '';
                           break;
                       case 'right':
                           nx++;
                           ny++;
                           tron.params.JoueurMatchs[0].score += 50;
                           tron.params.JoueurMatchs[0].direction = '';
                           break;
                   }

                   // avancement automatiquement par les deux directions ( haut et bas ).
                   if (i == 0) {
                       ny--;
                   } else {
                       ny++;
                   }

                   //vérifions la collision du Tron avec lui-même ou avec les taille de la grille de canvas
                   if (tron.checkCollision(nx, ny)) {
                       tron.params.JeuxTermine = true;
                       tron.stopJeux();
                       return;
                   } else {
                       //Si il y n'avait pas, créons une nouvelle cellule avec les nouvelles coordonnées
                       headTron = {x: nx, y: ny}
                       headTron.x = nx;
                       headTron.y = ny;

                       //Ajoute de cellule "headTron" au début de la tableaux joueur matchs
                       tron.params.JoueurMatchs[0].position.unshift(headTron);

                       //Mise à jour les scores.
                       tron.params.JoueurMatchs[0].score += 50;
                   }

                   // nettoye les anciennes cellules dans les cellules actuelles du jouer actuelle
                   if (i >= 0 ) {
                       break;
                   }
               }

               // mise a jour le score du jeux.
               tron.updateScore(1, tron.params.JoueurMatchs[0].score);

               // synchronisation les positions du joueur matchs
               tron.params.socket.emit('synchroniseJoueurMatchsPosition', tron.params.JoueurMatchs[0]);

               // création les trajectoires du tron
               tron.drawCells(tron.params.JoueurMatchs[0].couleur, tron.params.JoueurMatchs[0].position);
           },

           //création les trajectoires du tron
           drawCells: function (couleur, position){
               //dessin de trajectoire de tron
               for(let k = 0; k < position.length; k++){
                   let cell = position[k];
                   tron.params.MainCtx.fillStyle = couleur; //-- couleur de tron
                   tron.params.MainCtx.fillRect(cell.x*tron.params.MainCanvas.cw, cell.y*tron.params.MainCanvas.cw, tron.params.MainCanvas.cw, tron.params.MainCanvas.cw);
               }
           },

           //création les trajectoires miroir du tron
           reversePositions: function(position) {

               let reversePos = [];
               for(let i = 0; i< position.length; i++) {
                   reversePos[i] = {};
                   reversePos[i].x = tron.params.MainCanvas.PosMapping.x[position[i].x];
                   reversePos[i].y = tron.params.MainCanvas.PosMapping.y[position[i].y];
               }

               return reversePos;
           },

           //vérification les zones de collision
           checkCollision: function(x, y) {

               if (x == -1 || y == -1) {
                   return true;
               }

               // validation les positions block morts.
               for(let i=0;i<tron.params.MainCanvas.PosBlockMort.position.length;i++) {
                   const blockMorts = tron.params.MainCanvas.PosBlockMort.position[i];
                   if ((x == blockMorts.x && y == blockMorts.y)) {
                       return true;
                   }
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
