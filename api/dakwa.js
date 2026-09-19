import { blockIp, bumpLevelTry, clientIp, cookieHas, isBlocked, parseBody, setCookies } from "../lib/lock.js";

const htmlOk = `<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Yoga Soerjo.</h3>
    <p>Pintu terkunci dari dalam karena Arief sendiri yang memutar kuncinya, sesudah suntik insulin, seperti setiap malam. Tidak ada orang di ruang itu ketika jantungnya berhenti. Daun di toples sudah ada sebelumnya.</p>
    <p>Kadar kalium 6,9. Uji FPIA untuk digoksin positif, uji LC-MS negatif, dan digoksin tidak ada dalam resep. Helai daun hijau di permukaan toples bereaksi sama dengan darahnya. Daun itu bukan dari piring makan dan bukan dari insulin. Di pagar belakang ada Nerium. Ia selalu menyeduh tehnya sendiri.</p>
    <p>Polis 184472 masih menunjuk Yoga sebagai ahli waris. Surat ganti ahli waris belum ditandatangani; janji di bank Senin pukul 10.30. Wasiat lama tidak memberinya apa-apa. Studio di draf Senin tidak membayar tunggakan BNI sebelum tanggal 20. Taksaka yang ia naiki berangkat pagi, bukan siang. Ia ke pengacara siang hari. Ia memotret pagar belakang pukul 17.51, padahal ia bilang tidak ke kebun karena nyamuk.</p>
    <p>Hana memotret draf wasiat lalu berbohong soal waktu adzan. Rina mengisi gula, memotong kamboja, dan memakai nama orang lain di jaminan bank. Mira sedang di kasir. Farhan salah menyangka serangan jantung. Lukman menelepon Bandung dari kebun yang sudah gelap. Itu perkara lain, bukan pembunuhan ini.</p>
</div>`;

const MAX_TRIES = 3;

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const ip = clientIp(req);
    const blocked = await isBlocked(req, ip);
    const l1 = cookieHas(req, "mtr19_l1");

    if (req.method === "GET") {
        if (blocked) {
            setCookies(res, ["mtr19_lock"]);
        }
        res.status(200).json({
            ok: false,
            blocked,
            l1,
            html: l1 ? htmlOk : "",
            next: l1
        });
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ ok: false, blocked, l1 });
        return;
    }

    if (blocked) {
        setCookies(res, ["mtr19_lock"]);
        res.status(200).json({ ok: false, blocked: true, l1, html: "" });
        return;
    }

    const who = parseBody(req).who || "";
    if (who === "yoga") {
        setCookies(res, ["mtr19_l1"]);
        res.status(200).json({ ok: true, blocked: false, l1: true, next: true, html: htmlOk });
        return;
    }

    const used = bumpLevelTry(req, res, ip, "l1", MAX_TRIES);
    const left = Math.max(0, MAX_TRIES - used);
    if (left > 0) {
        res.status(200).json({
            ok: false,
            blocked: false,
            retry: true,
            tries: used,
            left,
            msg: "Salah. Sisa " + left + " kesempatan."
        });
        return;
    }

    await blockIp(ip);
    setCookies(res, ["mtr19_lock"]);
    res.status(200).json({ ok: false, blocked: true, l1: false, html: "" });
}
