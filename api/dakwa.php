<?php
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
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
}
echo json_encode(['ok' => $ok, 'html' => $html], JSON_UNESCAPED_UNICODE);
