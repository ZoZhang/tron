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
                    { label: 'violet', value: '#4A148C' }
                ]
            },

            // initialise les paramètres du HTML et les valeus par défaut et les events.
            initialized: function() {

                tron.initializParams();

                tron.initializValues();

                tron.initializCouter();

                tron.initializEvents();

                tron.initializWebSocket();
            },

            // initialise les paramètres du HTML
            initializParams: function() {

                // buttons
                tron.params.ButtonStart = $('#commencer');
                tron.params.ButtonStop = $('#quitte');

                // form
                tron.params.MainForm = $('#main-form');

                // input
                tron.params.InputPesudo = $('#pesudo');

                //alert
                tron.params.InputAlert = $('#input-alert');

                // layout
                tron.params.LayoutPesudo = $('#layout-pesudo');
                tron.params.LayoutJeu = $('#layout-jeu');
                tron.params.LayoutAttente = $('#layout-attente');
                tron.params.LayoutPlateau = $('#layout-plateau');

                // block
                tron.params.BlockInputPesudo = $('#block-input-pesudo');
                tron.params.BlockShowPesudo = $('#block-show-pesudo');

            },

            // initialise les valeurs d'objet ou html
            initializValues: function() {

                // initialise la valeur pesudo par LocalStorage
                if (!window.localStorage) {
                    tron.params.BlockInputPesudo.removeClass('d-none');
                    console.log('cette navigateur ne support pas LocalStorage !');
                    return;
                }

                tron.params.LocalStorage = window.localStorage;

                tron.params.localPesudo = tron.params.LocalStorage.getItem('pesudo');
                if (tron.params.localPesudo) {
                   tron.params.InputPesudo.val(tron.params.localPesudo);
                   tron.params.BlockInputPesudo.addClass('d-none');
                   tron.params.BlockShowPesudo.find('span').text(tron.params.localPesudo).end().removeClass('d-none');
                   tron.params.LayoutPesudo.removeClass('d-none');
                } else {
                    tron.params.BlockInputPesudo.removeClass('d-none');
                    tron.params.LayoutPesudo.removeClass('d-none');
                }

                tron.params.localCouleur = JSON.parse(tron.params.LocalStorage.getItem('couleur'));
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
                tron.params.ButtonStop.click(tron.stop);
            },

            // initialise connexion websocket
            initializWebSocket: function() {

                const host = 'ws://127.0.0.1:8899';
                tron.params.socket = io(host, {transports: ['websocket', 'polling', 'flashsocket']});

                tron.params.socket.on('connect', () => {
                  console.log('WebSocket Client Connecté:', host);
                });

                tron.params.socket.on('updateListAttente', (res) => {

                    console.log(res);

                    tron.listAttenteUpdate(res);
                });
            },

            // validate la disponibilité du pesudo
            initialiseData: function(e) {

               e.preventDefault();

               tron.params.localPesudo = tron.params.InputPesudo.val();

                if (!tron.params.localPesudo) {
                 tron.params.InputPesudo.attr('placeholder', 'Vous devez saissir votre pesudo !');
                 return false;
               }

               const random = Math.floor(Math.random() * tron.params.couleurs.length);
               tron.params.localCouleur = tron.params.couleurs[random];

               tron.params.userData = {
                   pesudo: tron.params.localPesudo,
                   couleur: tron.params.localCouleur
               };

               tron.params.socket.emit('initialiseData', tron.params.userData, function(res){
                   console.log(res);

                   if (res.success) {
                        tron.params.InputAlert.addClass('d-none');
                        tron.params.LocalStorage.setItem('pesudo', tron.params.localPesudo);
                        tron.params.LocalStorage.setItem('couleur', JSON.stringify(tron.params.localCouleur));
                        tron.listAttenteStart();
                    } else {
                        tron.params.InputAlert.text(res.message).removeClass('d-none');
                    }
               });

               return false;
            },

            // initialise les layout différents dans le HTML
            listAttenteStart: function() {
               // layout
               tron.params.ListAttenteCounter = window.setInterval(function(){
                   tron.params.LayoutAttente.find('ul li:last-child span').text(tron.params.ListAttenteCounterVal++);
               }, 1000);

               tron.params.LayoutPesudo.addClass('d-none');
               tron.params.LayoutJeu.removeClass('d-none');
               tron.params.LayoutAttente.find('ul li:first-child').css('background-color', tron.params.localCouleur.value).children('span').text(tron.params.localPesudo).end().end().removeClass('d-none');;
            },

            // update la list d'attent
            listAttenteUpdate: function(res) {

               if (!res) {
                return false;
               }

               // layout
               tron.initializCouter();
               tron.params.LayoutAttente.find('ul li:last-child').css('background-color', res.couleur.value).html('<span>'+res.pesudo+'</span> - Prêt').removeClass('d-none');;

               console.log(res);
            },

            // initialise les layouts par défauts et les valeurs par défauts
            stop: function() {

                tron.initializValues();

                tron.initializCouter();

                tron.params.LayoutPesudo.removeClass('d-none');
                tron.params.LayoutJeu.addClass('d-none');
                tron.params.LayoutAttente.addClass('d-none');
            },

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
