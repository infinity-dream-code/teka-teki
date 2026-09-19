<?php
require __DIR__ . '/inc/lock.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$html_ok = <<<'HTML'
<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Yoga Soerjo.</h3>
    <p>Pintu terkunci dari dalam karena Arief sendiri yang memutar kuncinya, sesudah suntik insulin, seperti setiap malam. Tidak ada orang di ruang itu ketika jantungnya berhenti. Daun di toples sudah ada sebelumnya.</p>
    <p>Kadar kalium 6,9. Uji FPIA untuk digoksin positif, uji LC-MS negatif, dan digoksin tidak ada dalam resep. Helai daun hijau di permukaan toples bereaksi sama dengan darahnya. Daun itu bukan dari piring makan dan bukan dari insulin. Di pagar belakang ada Nerium. Ia selalu menyeduh tehnya sendiri.</p>
    <p>Polis 184472 masih menunjuk Yoga sebagai ahli waris. Surat ganti ahli waris belum ditandatangani; janji di bank Senin pukul 10.30. Wasiat lama tidak memberinya apa-apa. Studio di draf Senin tidak membayar tunggakan BNI sebelum tanggal 20. Taksaka yang ia naiki berangkat pagi, bukan siang. Ia ke pengacara siang hari. Ia memotret pagar belakang pukul 17.51, padahal ia bilang tidak ke kebun karena nyamuk.</p>
    <p>Hana memotret draf wasiat lalu berbohong soal waktu adzan. Rina mengisi gula, memotong kamboja, dan memakai nama orang lain di jaminan bank. Mira sedang di kasir. Farhan salah menyangka serangan jantung. Lukman menelepon Bandung dari kebun yang sudah gelap. Itu perkara lain, bukan pembunuhan ini.</p>
</div>
HTML;

$ip = client_ip();
$blocked = is_blocked($ip);
$l1 = has_l1();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($blocked) {
        set_lock_cookie();
    }
    echo json_encode([
        'ok' => false,
        'blocked' => $blocked,
        'l1' => $l1,
        'html' => $l1 ? $html_ok : '',
        'next' => $l1,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'blocked' => $blocked, 'l1' => $l1]);
    exit;
}

if ($blocked) {
    set_lock_cookie();
    echo json_encode(['ok' => false, 'blocked' => true, 'l1' => $l1, 'html' => '']);
    exit;
}

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$who = $in['who'] ?? '';
$ok = ($who === 'yoga');
if ($ok) {
    set_named_cookie('mtr19_l1');
    echo json_encode(['ok' => true, 'blocked' => false, 'l1' => true, 'next' => true, 'html' => $html_ok], JSON_UNESCAPED_UNICODE);
    exit;
}

$used = bump_level_try($ip, 'l1', 3);
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
echo json_encode(['ok' => false, 'blocked' => true, 'l1' => false, 'html' => ''], JSON_UNESCAPED_UNICODE);
