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
                couleurs : ["blue", "green", "slateblue", "yellowgreen", "lightcoral", "turquoise", "tomato", "teal"]
            },

            // initialise les paramètres du HTML et les valeus par défaut et les events.
            initialized: function() {

                tron.initializParams();

                tron.initializValues();

                tron.initializEvents();

            },

            // initialise les paramètres du HTML
            initializParams: function() {

                // buttons
                tron.params.ButtonStart = $('#commencer');
                tron.params.ButtonStop = $('#quitte');

                // input
                tron.params.InputPesudo = $('#pesudo');

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

                // initialise la valeur du counteur
                tron.params.ListAttenteCounterVal = 1;

                if (tron.params.ListAttenteCounter) {
                   tron.params.LayoutAttente.find('ul li:last-child span').text(0);
                   clearInterval(tron.params.ListAttenteCounter);
                }

                // initialise la valeur pesudo par LocalStorage
                if (!window.localStorage) {
                    tron.params.BlockInputPesudo.removeClass('d-none');
                    console.log('cette navigateur ne support pas LocalStorage !');
                    return;
                }

                tron.params.LocalStorage = window.localStorage;

                tron.params.localPesudo = tron.params.LocalStorage.getItem('pesudo');
                if (tron.params.localPesudo) {
                   tron.params.LayoutPesudo.val(tron.params.localPesudo);
                   tron.params.BlockInputPesudo.addClass('d-none');
                   tron.params.BlockShowPesudo.find('span').text(tron.params.localPesudo).end().removeClass('d-none');
                } else {
                    tron.params.BlockInputPesudo.removeClass('d-none');
                }

                tron.params.localCouleur = tron.params.LocalStorage.getItem('couleur');

            },

            // initialise les events du HTML(input、button) pour manipuler le jeu
            initializEvents: function() {

                // input pesudo
                tron.params.InputPesudo.change(function(){
                  tron.params.localPesudo = this.value;

                  const random = Math.floor(Math.random() * tron.params.couleurs.length);
                  tron.params.localCouleur = tron.params.couleurs[random];

                  tron.params.LocalStorage.setItem('pesudo', tron.params.localPesudo);
                  tron.params.LocalStorage.setItem('couleur', tron.params.localCouleur);
                });

                // button
                tron.params.ButtonStart.click(tron.start);
                tron.params.ButtonStop.click(tron.stop);

            },

            // initialise les layout différents dans le HTML
            start: function() {

                // layout
                tron.params.ListAttenteCounter = window.setInterval(function(){
                     tron.params.LayoutAttente.find('ul li:last-child span').text(tron.params.ListAttenteCounterVal++);
                 }, 1000);

                tron.params.LayoutPesudo.addClass('d-none');
                tron.params.LayoutJeu.removeClass('d-none');
                tron.params.LayoutAttente.find('ul li:first-child').css('background-color', tron.params.localCouleur).children('span').text(tron.params.localPesudo).end().end().removeClass('d-none');;
            },

            // initialise les layouts par défauts et les valeurs par défauts
            stop: function() {

                tron.initializValues();

                tron.params.LayoutPesudo.removeClass('d-none');
                tron.params.LayoutJeu.addClass('d-none');
                tron.params.LayoutAttente.addClass('d-none');

            },

       };

       // Wait for the deviceready event before using any of Cordova's device APIs.
       // See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
       document.addEventListener('deviceready', tron.initialized, false);

    });
})(jQuery);