<?php
require __DIR__ . '/inc/lock.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$html_ok = <<<'HTML'
<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Nama panggung terdengar.</h3>
    <p>Cain tetap diam di ruang interogasi. Ia bukan dalang. Rekaman di laci suara memuat sandi titik-garis. Setelah dibaca: RED JOHN.</p>
    <p>Itu nama panggung orang di balik jaringan. Bukan nama di KTP. Cain menolak menyebutnya. Berkas berikutnya menelusuri jejaknya.</p>
</div>
HTML;

function normalize_code($s) {
    $s = strtoupper((string) $s);
    return preg_replace('/[^A-Z]/', '', $s);
}

function code_matches($code) {
    $secret = 'REDJOHN';
    if ($code === '') {
        return false;
    }
    if ($code === $secret) {
        return true;
    }
    if (abs(strlen($code) - strlen($secret)) > 2) {
        return false;
    }
    return levenshtein($code, $secret) <= 2;
}

$ip = client_ip();
$blocked = is_blocked($ip);
$l4 = has_l4();
$l5 = has_l5();
$name = get_detective_name($ip);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($blocked) {
        set_lock_cookie();
    }
    echo json_encode([
        'ok' => false,
        'blocked' => $blocked,
        'l4' => $l4,
        'l5' => $l5,
        'name' => $name,
        'hasName' => $name !== '',
        'html' => $l5 ? $html_ok : '',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'blocked' => $blocked, 'l4' => $l4]);
    exit;
}

if ($blocked) {
    set_lock_cookie();
    echo json_encode(['ok' => false, 'blocked' => true, 'html' => '']);
    exit;
}

if (!$l4 || $name === '') {
    echo json_encode(['ok' => false, 'blocked' => false, 'need' => true, 'html' => '']);
    exit;
}

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$code = normalize_code($in['code'] ?? ($in['who'] ?? ''));
if (code_matches($code)) {
    set_named_cookie('mtr19_l5');
    echo json_encode(['ok' => true, 'blocked' => false, 'html' => $html_ok, 'next' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

block_ip($ip);
echo json_encode(['ok' => false, 'blocked' => true, 'html' => ''], JSON_UNESCAPED_UNICODE);
