<?php
    include '../settings/settings.php';

    session_start();

   // $_SESSION['userGoogleId'] = '104253245844866214670';
    // compare Auth header with xsrf token from cookie-based session

//    if (isset($_SERVER['HTTP_AUTHORIZATION']) && isset($_SESSION['xsrfToken']) && $_SERVER['HTTP_AUTHORIZATION'] === $_SESSION['xsrfToken']) {
        include 'connect2db.php';
//    }
//    else {
//        session_destroy();
//        header("HTTP/1.0 401 Unauthorized", true, 401);
//        echo 'You have logged out on other browser tab.\n\n The page will be reloaded.';
//        die;
//    }



    // CORS

    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
    }

    // Access-Control headers are received during OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
            header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, HEAD, DELETE, OPTIONS");
        }

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
        }

        exit(0);
    }



    header('Content-Type: application/json');

