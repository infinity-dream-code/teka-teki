<?php
require __DIR__ . '/inc/lock.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$html_ok = <<<'HTML'
<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Yusuf Rahman.</h3>
    <p>Bukan dokter lodge, bukan kolumnis Jack, bukan bidan, bukan jagal. Ia meniru 1888 di peta yang ia ukur sendiri. Tiga puluh satu Agustus pukul 03.40, delapan September pukul 05.55, lalu malam lima belas September: yang ketiga terhenti di halaman, yang keempat di pelataran pukul 01.44, ginjal kiri diambil. Seratus tiga puluh delapan tahun sesudah 1888. Surat Dear Boss dan From Hell mengikuti jeda yang sama dengan tahun itu, hanya dipadatkan.</p>
    <p>Pamflet yard dari Spitalfields, origin di bekas menara (4,10), satu kotak seratus meter, tanpa rotasi. Empat titik korban cocok. Titik kelima (4,9) adalah Gang Palang 13. Perintah kerja 25 Oktober 10.45 ada di nama Maryam. Matriks di makalah Anton memutar peta ke lodge dan ke kios daging; itu teori pentagram, bukan jejak ini.</p>
    <p>Alat TS-07 tercatat di setiap titik pada menit yang sama. Laporan hilang ditulis tinta yang sama dengan buku lapangan, sesudah jam yang ia sebut pencurian. Wira keluar lodge ke barat. Joko hanya menerima surat. Laras menemukan jenazah kedua. Budi berlumur darah hewan. Rudi menagih sewa. Hanif di gerbang selatan.</p>
</div>
HTML;

$ip = client_ip();
$blocked = is_blocked($ip);
$l2 = has_l2();
$l3 = has_l3();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($blocked) {
        set_lock_cookie();
    }
    echo json_encode([
        'ok' => false,
        'blocked' => $blocked,
        'l2' => $l2,
        'l3' => $l3,
        'html' => $l3 ? $html_ok : '',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'blocked' => $blocked, 'l2' => $l2]);
    exit;
}

if ($blocked) {
    set_lock_cookie();
    echo json_encode(['ok' => false, 'blocked' => true, 'html' => '']);
    exit;
}

if (!$l2) {
    echo json_encode(['ok' => false, 'blocked' => false, 'need' => true, 'html' => '']);
    exit;
}

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$who = $in['who'] ?? '';
$ok = ($who === 'yusuf');
if ($ok) {
    set_named_cookie('mtr19_l3');
    echo json_encode(['ok' => true, 'blocked' => false, 'html' => $html_ok], JSON_UNESCAPED_UNICODE);
    exit;
}

$used = bump_level_try($ip, 'l3', 3);
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
