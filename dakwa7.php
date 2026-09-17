<?php
require __DIR__ . '/inc/lock.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$flag = 'flag{red_john_still_smiles}';

$html_ok = <<<'HTML'
<div class="doc">
    <div class="stamp">Terungkap</div>
    <h3>Nina Kartika.</h3>
    <p>RED JOHN tertangkap—lalu menghilang di asap. Catatan itu masih ada.</p>
</div>
HTML;

$ip = client_ip();
$blocked = is_blocked($ip);
$l6 = has_l6();
$l7 = has_l7();
$name = get_detective_name($ip);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($blocked) {
        set_lock_cookie();
    }
    echo json_encode([
        'ok' => false,
        'blocked' => $blocked,
        'l6' => $l6,
        'l7' => $l7,
        'name' => $name,
        'hasName' => $name !== '',
        'html' => $l7 ? $html_ok : '',
        'flag' => $l7 ? $flag : '',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'blocked' => $blocked, 'l6' => $l6]);
    exit;
}

if ($blocked) {
    set_lock_cookie();
    echo json_encode(['ok' => false, 'blocked' => true, 'html' => '']);
    exit;
}

if (!$l6 || $name === '') {
    echo json_encode(['ok' => false, 'blocked' => false, 'need' => true, 'html' => '']);
    exit;
}

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$who = strtolower((string) ($in['who'] ?? ''));
if ($who === 'nina') {
    set_named_cookie('mtr19_l7');
    echo json_encode([
        'ok' => true,
        'blocked' => false,
        'html' => $html_ok,
        'flag' => $flag,
        'name' => $name,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

block_ip($ip);
echo json_encode(['ok' => false, 'blocked' => true, 'html' => ''], JSON_UNESCAPED_UNICODE);
