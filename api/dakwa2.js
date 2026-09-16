import { blockIp, clientIp, cookieHas, isBlocked, parseBody, setCookies } from "../lib/lock.js";

const htmlOk = `<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Intan Kusuma.</h3>
    <p>Hartono mengunci ruang kerjanya sendiri malam Minggu, sesudah menolak dibawa ke rumah sakit. Bukan bunuh diri. Selembar di meja sama bunyinya dengan folio naskah yang sedang ia sunting.</p>
    <p>Minggu pagi Marni ke pasar. Intan merebus jamu di dapur belakang. Di kendi ada kunyit dan umbi bercabang dua. Sel mukosa lambung berhenti di metafase. Itu kolkisin, bukan glikosida jantung, bukan daun senna di kuah, bukan Nerium di pagar barat. Gloriosa superba tumbuh di pagar timur. Gejala mulai sore. Kematian dini hari Senin.</p>
    <p>Wulan di Taman Budaya. Jika Hartono mati sebelum akta Senin, ia mendapat semua; itu bukan bukti ia menuang. Bagas naik KA 10 Argo Wilis, Bandung 07.35–Yogyakarta 13.24, bukan Lodaya. Dina memasukkan daun senna. Raka menggadaikan keris. Marni membeli ubi kayu yang masih utuh. Eko mengambil lembar dari naskah. Galih memotret di ruang arsip.</p>
    <p>Intan bilang adzan kira-kira jam enam lewat. Maghrib Yogyakarta 13 September 2026 sekitar 17.38. Ia bilang tidak ke kebun. Gunting pagar timur basah sesudah maghrib. Anjing tetangga tidak menyalak pada orang yang sudah menginap sejak Jumat. Bulan sabit dua persen terbenam sekitar 19.22; tidak ada cahaya bulan pukul 21.00.</p>
    <p>Senin pukul 10.30 redaksi jurnal akan menanyakan kemiripan paragraf dengan disertasi Intan Kusuma tahun 2019. Pukul 20.04 ia menulis bahwa naskah itu tidak akan ke redaksi.</p>
</div>`;

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const ip = clientIp(req);
    const blocked = await isBlocked(req, ip);
    const l1 = cookieHas(req, "mtr19_l1");
    const l2 = cookieHas(req, "mtr19_l2");

    if (req.method === "GET") {
        if (blocked) {
            setCookies(res, ["mtr19_lock"]);
        }
        res.status(200).json({
            ok: false,
            blocked,
            l1,
            l2,
            html: l2 ? htmlOk : "",
            next: l2
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

    if (!l1) {
        res.status(200).json({ ok: false, blocked: false, need: true, html: "" });
        return;
    }

    const who = parseBody(req).who || "";
    if (who === "intan") {
        setCookies(res, ["mtr19_l2"]);
        res.status(200).json({ ok: true, blocked: false, next: true, html: htmlOk });
        return;
    }

    await blockIp(ip);
    setCookies(res, ["mtr19_lock"]);
    res.status(200).json({ ok: false, blocked: true, html: "" });
}
