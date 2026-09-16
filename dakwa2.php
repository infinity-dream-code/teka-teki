<?php
require __DIR__ . '/inc/lock.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$html_ok = <<<'HTML'
<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Intan Kusuma.</h3>
    <p>Hartono mengunci ruang kerjanya sendiri malam Minggu, sesudah menolak dibawa ke rumah sakit. Bukan bunuh diri. Selembar di meja sama bunyinya dengan folio naskah yang sedang ia sunting.</p>
    <p>Minggu pagi Marni ke pasar. Intan merebus jamu di dapur belakang. Di kendi ada kunyit dan umbi bercabang dua. Sel mukosa lambung berhenti di metafase. Itu kolkisin, bukan glikosida jantung, bukan daun senna di kuah, bukan Nerium di pagar barat. Gloriosa superba tumbuh di pagar timur. Gejala mulai sore. Kematian dini hari Senin.</p>
    <p>Wulan di Taman Budaya. Jika Hartono mati sebelum akta Senin, ia mendapat semua; itu bukan bukti ia menuang. Bagas naik KA 10 Argo Wilis, Bandung 07.35–Yogyakarta 13.24, bukan Lodaya malam. Dina memasukkan daun senna. Raka menggadaikan keris. Marni membeli ubi kayu yang masih utuh. Eko mengambil lembar dari naskah. Galih memotret di ruang arsip.</p>
    <p>Intan bilang adzan kira-kira jam enam lewat. Maghrib Yogyakarta 13 September 2026 sekitar 17.38. Ia bilang tidak ke kebun. Gunting pagar timur basah sesudah maghrib. Anjing tetangga tidak menyalak pada orang yang sudah menginap sejak Jumat. Bulan sabit dua persen terbenam sekitar 19.22; tidak ada cahaya bulan pukul 21.00.</p>
    <p>Senin pukul 10.30 redaksi jurnal akan menanyakan kemiripan paragraf dengan disertasi Intan Kusuma tahun 2019. Pukul 20.04 ia menulis bahwa naskah itu tidak akan ke redaksi.</p>
    <p class="flag">flag{kamu_detektif_h3b4t}</p>
</div>
HTML;

$ip = client_ip();
$blocked = is_blocked($ip);
$l1 = has_l1();
$l2 = has_l2();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($blocked) {
        set_lock_cookie();
    }
    echo json_encode([
        'ok' => false,
        'blocked' => $blocked,
        'l1' => $l1,
        'l2' => $l2,
        'html' => $l2 ? $html_ok : '',
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

if (!$l1) {
    echo json_encode(['ok' => false, 'blocked' => false, 'need' => true, 'html' => '']);
    exit;
}

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$who = $in['who'] ?? '';
$ok = ($who === 'intan');
if ($ok) {
    set_named_cookie('mtr19_l2');
    echo json_encode(['ok' => true, 'blocked' => false, 'html' => $html_ok], JSON_UNESCAPED_UNICODE);
    exit;
}

block_ip($ip);
echo json_encode(['ok' => false, 'blocked' => true, 'html' => ''], JSON_UNESCAPED_UNICODE);
