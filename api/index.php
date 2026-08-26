<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

// 1. BIG / SMALL Calculation
function calcBigSmall($period) {
    $step1 = bcadd(bcmul((string)$period, "23"), "17");
    $step2 = bcmul($step1, $step1);
    $mod100 = bcmod($step2, "100");
    $value = (int)bcmod($mod100, "10");

    return ($value >= 5) ? "BIG" : "SMALL";
}

// 2. Number Calculation
function calcNumber($prediction) {
    $bigNumbers = [8.6, 9.5, 7.8, 6.5, 5.7];
    $smallNumbers = [1.3, 2.4, 3.4, 4.1, 0.2];
    $randomIndex = rand(0, 4);

    return ($prediction === "BIG") ? $bigNumbers[$randomIndex] : $smallNumbers[$randomIndex];
}

// API Handler
if (isset($_GET['period']) && is_numeric($_GET['period'])) {
    $period = $_GET['period'];
    $bigSmall = calcBigSmall($period);
    $number = calcNumber($bigSmall);

    echo json_encode([
        "status" => "success",
        "period" => (string)$period,
        "prediction" => $bigSmall,
        "number" => $number
    ], JSON_PRETTY_PRINT);
} else {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Valid period parameter is required. Example: /?period=1001"
    ], JSON_PRETTY_PRINT);
}
?>
