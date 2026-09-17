import { blockIp, clientIp, cookieHas, getDetectiveName, isBlocked, parseBody, setCookies } from "../lib/lock.js";

const htmlOk = `<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Nama panggung terdengar.</h3>
    <p>Cain tetap diam di ruang interogasi. Ia bukan dalang. Rekaman di laci suara memuat sandi titik-garis. Setelah dibaca: RED JOHN.</p>
    <p>Itu nama panggung orang di balik jaringan. Bukan nama di KTP. Cain menolak menyebutnya. Berkas berikutnya menelusuri jejaknya.</p>
</div>`;

const SECRET = "REDJOHN";

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
    const l4 = cookieHas(req, "mtr19_l4");
    const l5 = cookieHas(req, "mtr19_l5");
    const name = await getDetectiveName(req, ip);

    if (req.method === "GET") {
        if (blocked) setCookies(res, ["mtr19_lock"]);
        res.status(200).json({
            ok: false,
            blocked,
            l4,
            l5,
            name,
            hasName: Boolean(name),
            html: l5 ? htmlOk : ""
        });
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ ok: false, blocked, l4 });
        return;
    }

    if (blocked) {
        setCookies(res, ["mtr19_lock"]);
        res.status(200).json({ ok: false, blocked: true, html: "" });
        return;
    }

    if (!l4 || !name) {
        res.status(200).json({ ok: false, blocked: false, need: true, html: "" });
        return;
    }

    const body = parseBody(req);
    const code = normalizeCode(body.code || body.who || "");
    if (codeMatches(code)) {
        setCookies(res, ["mtr19_l5"]);
        res.status(200).json({ ok: true, blocked: false, html: htmlOk, next: true });
        return;
    }

    await blockIp(ip);
    setCookies(res, ["mtr19_lock"]);
    res.status(200).json({ ok: false, blocked: true, html: "" });
}
