import { blockIp, clientIp, cookieHas, getDetectiveName, isBlocked, parseBody, setCookies } from "../lib/lock.js";

const FLAG = "flag{red_john_still_smiles}";

const htmlOk = `<div class="doc">
    <div class="stamp">Terungkap</div>
    <h3>Nugroho Kusuma.</h3>
    <p>RED JOHN tertangkap—lalu menghilang di asap. Catatan itu masih ada.</p>
</div>`;

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const ip = clientIp(req);
    const blocked = await isBlocked(req, ip);
    const l6 = cookieHas(req, "mtr19_l6");
    const l7 = cookieHas(req, "mtr19_l7");
    const name = await getDetectiveName(req, ip);

    if (req.method === "GET") {
        if (blocked) setCookies(res, ["mtr19_lock"]);
        res.status(200).json({
            ok: false,
            blocked,
            l6,
            l7,
            name,
            hasName: Boolean(name),
            html: l7 ? htmlOk : "",
            flag: l7 ? FLAG : ""
        });
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ ok: false, blocked, l6 });
        return;
    }

    if (blocked) {
        setCookies(res, ["mtr19_lock"]);
        res.status(200).json({ ok: false, blocked: true, html: "" });
        return;
    }

    if (!l6 || !name) {
        res.status(200).json({ ok: false, blocked: false, need: true, html: "" });
        return;
    }

    const body = parseBody(req);
    const who = String(body.who || "").toLowerCase();
    if (who === "nugroho") {
        setCookies(res, ["mtr19_l7"]);
        res.status(200).json({ ok: true, blocked: false, html: htmlOk, flag: FLAG, name });
        return;
    }

    await blockIp(ip);
    setCookies(res, ["mtr19_lock"]);
    res.status(200).json({ ok: false, blocked: true, html: "" });
}
