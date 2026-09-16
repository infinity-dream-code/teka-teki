import { blockIp, clientIp, cookieHas, isBlocked, parseBody, setCookies } from "../lib/lock.js";

const htmlOk = `<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Yusuf Rahman.</h3>
    <p>Bukan dokter lodge, bukan kolumnis Jack, bukan bidan, bukan jagal. Ia meniru 1888 di peta yang ia ukur sendiri. Tiga puluh satu Agustus pukul 03.40, delapan September pukul 05.55, lalu malam lima belas September: yang ketiga terhenti di halaman, yang keempat di pelataran pukul 01.44, ginjal kiri diambil. Seratus tiga puluh delapan tahun sesudah 1888. Surat Dear Boss dan From Hell mengikuti jeda yang sama dengan tahun itu, hanya dipadatkan.</p>
    <p>Pamflet yard dari Spitalfields, origin di bekas menara (4,10), satu kotak seratus meter, tanpa rotasi. Empat titik jenazah cocok. Titik kelima (4,9) adalah Gang Palang 13. Perintah kerja 25 Oktober 10.45 ada di nama Maryam. Matriks di makalah Anton memutar peta ke lodge dan ke kios daging; itu teori pentagram, bukan jejak ini.</p>
    <p>Alat TS-07 tercatat di setiap titik pada menit yang sama. Laporan hilang ditulis tinta yang sama dengan buku lapangan, sesudah jam yang ia sebut pencurian. Wira keluar lodge ke barat. Joko hanya menerima surat. Laras menemukan jenazah kedua. Budi berlumur darah hewan. Rudi menagih sewa. Hanif di gerbang selatan.</p>
    <p class="flag">flag{kamu_detektif_h3b4t}</p>
</div>`;

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const ip = clientIp(req);
    const blocked = await isBlocked(req, ip);
    const l2 = cookieHas(req, "mtr19_l2");
    const l3 = cookieHas(req, "mtr19_l3");

    if (req.method === "GET") {
        if (blocked) {
            setCookies(res, ["mtr19_lock"]);
        }
        res.status(200).json({
            ok: false,
            blocked,
            l2,
            l3,
            html: l3 ? htmlOk : ""
        });
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ ok: false, blocked, l2 });
        return;
    }

    if (blocked) {
        setCookies(res, ["mtr19_lock"]);
        res.status(200).json({ ok: false, blocked: true, html: "" });
        return;
    }

    if (!l2) {
        res.status(200).json({ ok: false, blocked: false, need: true, html: "" });
        return;
    }

    const who = parseBody(req).who || "";
    if (who === "yusuf") {
        setCookies(res, ["mtr19_l3"]);
        res.status(200).json({ ok: true, blocked: false, html: htmlOk });
        return;
    }

    await blockIp(ip);
    setCookies(res, ["mtr19_lock"]);
    res.status(200).json({ ok: false, blocked: true, html: "" });
}
