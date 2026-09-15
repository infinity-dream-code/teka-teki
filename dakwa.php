<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function client_ip() {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function ip_hash($ip) {
    return hash('sha256', 'mtr19|' . $ip);
}

function blocked_path() {
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir . '/blocked.json';
}

function cookie_blocked() {
    return !empty($_COOKIE['mtr19_lock']);
}

function set_lock_cookie() {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? '; Secure' : '';
    header('Set-Cookie: mtr19_lock=1; Path=/; Max-Age=315360000; HttpOnly; SameSite=Lax' . $secure, false);
}

function file_blocked($ip) {
    $file = blocked_path();
    if (!is_file($file)) {
        return false;
    }
    $data = json_decode(@file_get_contents($file), true);
    return is_array($data) && isset($data[ip_hash($ip)]);
}

function is_blocked($ip) {
    return cookie_blocked() || file_blocked($ip);
}

function block_ip($ip) {
    set_lock_cookie();
    $file = blocked_path();
    $fp = @fopen($file, 'c+');
    if (!$fp) {
        return;
    }
    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        $data = [];
    }
    $data[ip_hash($ip)] = time();
    rewind($fp);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($data));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

$ip = client_ip();
$blocked = is_blocked($ip);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($blocked) {
        set_lock_cookie();
    }
    echo json_encode(['ok' => false, 'blocked' => $blocked]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'blocked' => $blocked]);
    exit;
}

if ($blocked) {
    set_lock_cookie();
    echo json_encode(['ok' => false, 'blocked' => true, 'html' => '']);
    exit;
}

$in = json_decode(file_get_contents('php://input'), true) ?: [];
$who = $in['who'] ?? '';
$ok = ($who === 'yoga');
$html = '';
if ($ok) {
    $html = <<<'HTML'
<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Yoga Soerjo.</h3>
    <p>Pintu terkunci dari dalam karena Arief sendiri yang memutar kuncinya, sesudah suntik insulin, seperti setiap malam. Tidak ada orang di ruang itu ketika jantungnya berhenti. Daun di toples sudah ada sebelumnya.</p>
    <p>Kadar kalium 6,9. Uji FPIA untuk digoksin positif, uji LC-MS negatif, dan digoksin tidak ada dalam resep. Helai daun hijau di permukaan toples bereaksi sama dengan darahnya. Daun itu bukan dari piring makan dan bukan dari insulin. Di pagar belakang ada Nerium. Ia selalu menyeduh tehnya sendiri.</p>
    <p>Polis 184472 masih menunjuk Yoga sebagai ahli waris. Surat ganti ahli waris belum ditandatangani; janji di bank Senin pukul 10.30. Wasiat lama tidak memberinya apa-apa. Studio di draf Senin tidak membayar tunggakan BNI sebelum tanggal 20. Taksaka yang ia naiki berangkat pagi, bukan siang. Ia ke pengacara siang hari. Ia memotret pagar belakang pukul 17.51, padahal ia bilang tidak ke kebun karena nyamuk.</p>
    <p>Hana memotret draf wasiat lalu berbohong soal waktu adzan. Rina mengisi gula, memotong kamboja, dan memakai nama orang lain di jaminan bank. Mira sedang di kasir. Farhan salah menyangka serangan jantung. Lukman menelepon Bandung dari kebun yang sudah gelap. Itu perkara lain, bukan pembunuhan ini.</p>
    <p class="flag">flag{kamu_detektif_h3b4t}</p>
</div>
HTML;
} else {
    block_ip($ip);
}

echo json_encode(['ok' => $ok, 'blocked' => !$ok, 'html' => $html], JSON_UNESCAPED_UNICODE);
