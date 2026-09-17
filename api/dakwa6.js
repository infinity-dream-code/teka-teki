import { blockIp, bumpCodeTry, clientIp, cookieHas, getCodeTries, getDetectiveName, isBlocked, parseBody, setCookies } from "../lib/lock.js";

const htmlOk = `<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Titik serah ketemu.</h3>
    <p>SEVEN FORK. Bukan nama orang. Itu kode gang tempat jaringan menaruh barang dan pesan. Cain hanya kurir. Nama panggung RED JOHN masih menutup wajah di KTP.</p>
    <p>Komandan membuka berkas dakwaan akhir. Satu nama. Satu kali. Salah: ditutup selamanya.</p>
</div>`;

const SECRET = "SEVENFORK";
const MAX_TRIES = 2;

function normalizeCode(s) {
    return String(s || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
}

function editDistance(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
    }
    return dp[m][n];
}

function codeMatches(code) {
    if (!code) return false;
    if (code === SECRET) return true;
    if (Math.abs(code.length - SECRET.length) > 2) return false;
    return editDistance(code, SECRET) <= 2;
}

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const ip = clientIp(req);
    const blocked = await isBlocked(req, ip);
    const l5 = cookieHas(req, "mtr19_l5");
    const l6 = cookieHas(req, "mtr19_l6");
    const name = await getDetectiveName(req, ip);
    const tries = getCodeTries(req, ip, "l6");

    if (req.method === "GET") {
        if (blocked) setCookies(res, ["mtr19_lock"]);
        res.status(200).json({
            ok: false,
            blocked,
            l5,
            l6,
            name,
            hasName: Boolean(name),
            tries,
            left: Math.max(0, MAX_TRIES - tries),
            html: l6 ? htmlOk : ""
        });
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ ok: false, blocked, l5 });
        return;
    }

    if (blocked) {
        setCookies(res, ["mtr19_lock"]);
        res.status(200).json({ ok: false, blocked: true, html: "" });
        return;
    }

    if (!l5 || !name) {
        res.status(200).json({ ok: false, blocked: false, need: true, html: "" });
        return;
    }

    const body = parseBody(req);
    const code = normalizeCode(body.code || body.who || "");
    if (codeMatches(code)) {
        setCookies(res, ["mtr19_l6"]);
        res.status(200).json({ ok: true, blocked: false, html: htmlOk, next: true });
        return;
    }

    const used = bumpCodeTry(req, res, ip, "l6");
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
