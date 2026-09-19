import { blockIp, bumpLevelTry, clientIp, cookieHas, getDetectiveName, isBlocked, parseBody, setCookies } from "../lib/lock.js";

const htmlOk = `<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Cain Wibowo.</h3>
    <p>Bukan bunuh diri. Ada orang kedua di tangga sesudah pukul 05.50. Surat di meja fotokopi lama. Ren kurir pesan; ia hampir berbicara.</p>
    <p>Foto laci 08 menyimpan ciphertext di metadata. Kunci Vigenère dari indeks logam dan stempel kusen. Pesannya meminta Cain dan bukunya.</p>
    <p>Cain masuk 05.20, keluar 05.55, surat auditnya tidak terdaftar. Ia memegang utas ke jaringan yang lebih besar. Ia belum mengaku siapa yang memberi perintah. Berkas berikutnya menanyainya.</p>
</div>`;

const MAX_TRIES = 3;

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const ip = clientIp(req);
    const blocked = await isBlocked(req, ip);
    const l3 = cookieHas(req, "mtr19_l3");
    const l4 = cookieHas(req, "mtr19_l4");
    const name = await getDetectiveName(req, ip);

    if (req.method === "GET") {
        if (blocked) setCookies(res, ["mtr19_lock"]);
        res.status(200).json({
            ok: false,
            blocked,
            l3,
            l4,
            name,
            hasName: Boolean(name),
            html: l4 ? htmlOk : ""
        });
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ ok: false, blocked, l3 });
        return;
    }

    if (blocked) {
        setCookies(res, ["mtr19_lock"]);
        res.status(200).json({ ok: false, blocked: true, html: "" });
        return;
    }

    if (!l3 || !name) {
        res.status(200).json({ ok: false, blocked: false, need: true, html: "" });
        return;
    }

    const who = parseBody(req).who || "";
    if (who === "cain") {
        setCookies(res, ["mtr19_l4"]);
        res.status(200).json({ ok: true, blocked: false, html: htmlOk, next: true });
        return;
    }

    const used = bumpLevelTry(req, res, ip, "l4", MAX_TRIES);
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
    res.status(200).json({ ok: false, blocked: true, html: "" });
}
