<?php
require __DIR__ . '/inc/lock.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$ip = client_ip();
$blocked = is_blocked($ip);
$l3 = has_l3();
$existing = get_detective_name($ip);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($blocked) {
        set_lock_cookie();
    }
    echo json_encode([
        'ok' => false,
        'blocked' => $blocked,
        'l3' => $l3,
        'name' => $existing,
        'hasName' => $existing !== '',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'blocked' => $blocked, 'l3' => $l3]);
    exit;
}

if ($blocked) {
    set_lock_cookie();
    echo json_encode(['ok' => false, 'blocked' => true, 'name' => '']);
    exit;
}

if (!$l3) {
    echo json_encode(['ok' => false, 'blocked' => false, 'need' => true, 'name' => '']);
    exit;
}

if ($existing !== '') {
    echo json_encode(['ok' => true, 'blocked' => false, 'name' => $existing, 'hasName' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$name = save_detective_name($ip, $in['name'] ?? '');
if ($name === '') {
    echo json_encode(['ok' => false, 'blocked' => false, 'err' => 'name', 'name' => '']);
    exit;
}

echo json_encode(['ok' => true, 'blocked' => false, 'name' => $name, 'hasName' => true], JSON_UNESCAPED_UNICODE);
