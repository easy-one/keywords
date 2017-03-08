<?php
    include '../settings/settings.php';

    session_start();

    // compare Auth header with xsrf token from cookie-based session

    if (isset($_SERVER['HTTP_AUTHORIZATION']) && isset($_SESSION['xsrfToken']) && $_SERVER['HTTP_AUTHORIZATION'] === $_SESSION['xsrfToken']) {
        // then connect to db
        $link = mysql_connect($db_host, $db_user, $db_pass);
        if (!$link || !mysql_select_db($db_name)) {
            header("HTTP/1.0 500 Internal Server Error", true, 500);
            if ($error_reporting_level !== 0) {
                echo mysql_error();
            }
            die;
        }
    }
    else {
        session_destroy();
        header("HTTP/1.0 401 Unauthorized", true, 401);
        echo 'You have logged out on other browser tab.\n\n The page will be reloaded.';
        die;
    }



if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        // may also be using PUT, PATCH, HEAD etc
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    }

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }

    exit(0);
}

header('Content-Type: application/json');



    function esc ($str) {
        return '"'.mysql_real_escape_string($str).'"';
    }