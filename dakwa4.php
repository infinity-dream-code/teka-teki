<?php
require __DIR__ . '/inc/lock.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$html_ok = <<<'HTML'
<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Cain Wibowo.</h3>
    <p>Bukan bunuh diri. Ada orang kedua di tangga sesudah pukul 05.50. Surat di meja fotokopi lama. Ren kurir pesan; ia hampir berbicara.</p>
    <p>Foto laci 08 menyimpan ciphertext di metadata. Kunci Vigenère dari indeks logam dan stempel kusen. Pesannya meminta Cain dan bukunya.</p>
    <p>Cain masuk 05.20, keluar 05.55, surat auditnya tidak terdaftar. Ia memegang utas ke jaringan yang lebih besar. Ia belum mengaku siapa yang memberi perintah. Berkas berikutnya menanyainya.</p>
</div>
HTML;

$ip = client_ip();
$blocked = is_blocked($ip);
$l3 = has_l3();
$l4 = has_l4();
$name = get_detective_name($ip);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($blocked) {
        set_lock_cookie();
    }
    echo json_encode([
        'ok' => false,
        'blocked' => $blocked,
        'l3' => $l3,
        'l4' => $l4,
        'name' => $name,
        'hasName' => $name !== '',
        'html' => $l4 ? $html_ok : '',
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
    echo json_encode(['ok' => false, 'blocked' => true, 'html' => '']);
    exit;
}

if (!$l3 || $name === '') {
    echo json_encode(['ok' => false, 'blocked' => false, 'need' => true, 'html' => '']);
    exit;
}

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$who = $in['who'] ?? '';
$ok = ($who === 'cain');
if ($ok) {
    set_named_cookie('mtr19_l4');
    echo json_encode(['ok' => true, 'blocked' => false, 'html' => $html_ok, 'next' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

$used = bump_level_try($ip, 'l4', 3);
$left = max(0, 3 - $used);
if ($left > 0) {
    echo json_encode([
        'ok' => false,
        'blocked' => false,
        'retry' => true,
        'tries' => $used,
        'left' => $left,
        'msg' => 'Salah. Sisa ' . $left . ' kesempatan.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

block_ip($ip);
echo json_encode(['ok' => false, 'blocked' => true, 'html' => ''], JSON_UNESCAPED_UNICODE);
