<?php

/**
 * PHP Websocket Exemple
 *
 * @author Zhao ZHANG
 * @email  <zo.zhang@gmail.com>
 * @package https://github.com/hoaproject/Websocket
 */
require_once './vendor/autoload.php';

class websocket  {

    protected static $websocket = null;

    public static function run()
    {
        self::getWebsocket()->on('open', function (Hoa\Event\Bucket $bucket) {

            echo 'new connection', "\n";

            $bucket->getSource()->send('Bienvenue mec !');

        });

        self::getWebsocket()->on('message', function (Hoa\Event\Bucket $bucket) {
            $data = $bucket->getData();
            echo '> message ', $data['message'], "\n";
            $bucket->getSource()->send($data['message']);
        });

        self::getWebsocket()->on('close', function (Hoa\Event\Bucket $bucket) {
            echo 'connection closed', "\n";
        });

        self::getWebsocket()->run();
    }

    public static function getWebsocket()
    {
        if (is_null(self::$websocket)) {

            self::$websocket = new Hoa\Websocket\Server(
                new Hoa\Socket\Server('ws://0.0.0.0:8889')
            );
        }
        return self::$websocket;
    }
}

websocket::run();
