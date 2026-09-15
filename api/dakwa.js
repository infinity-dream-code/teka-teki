import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const mem = new Set();
const storeFile = join(tmpdir(), "teka-mtr19-blocked.json");

const htmlOk = `<div class="doc">
    <div class="stamp">Dilimpahkan</div>
    <h3>Yoga Soerjo.</h3>
    <p>Pintu terkunci dari dalam karena Arief sendiri yang memutar kuncinya, sesudah suntik insulin, seperti setiap malam. Tidak ada orang di ruang itu ketika jantungnya berhenti. Daun di toples sudah ada sebelumnya.</p>
    <p>Kadar kalium 6,9. Uji FPIA untuk digoksin positif, uji LC-MS negatif, dan digoksin tidak ada dalam resep. Helai daun hijau di permukaan toples bereaksi sama dengan darahnya. Daun itu bukan dari piring makan dan bukan dari insulin. Di pagar belakang ada Nerium. Ia selalu menyeduh tehnya sendiri.</p>
    <p>Polis 184472 masih menunjuk Yoga sebagai ahli waris. Surat ganti ahli waris belum ditandatangani; janji di bank Senin pukul 10.30. Wasiat lama tidak memberinya apa-apa. Studio di draf Senin tidak membayar tunggakan BNI sebelum tanggal 20. Taksaka yang ia naiki berangkat pagi, bukan siang. Ia ke pengacara siang hari. Ia memotret pagar belakang pukul 17.51, padahal ia bilang tidak ke kebun karena nyamuk.</p>
    <p>Hana memotret draf wasiat lalu berbohong soal waktu adzan. Rina mengisi gula, memotong kamboja, dan memakai nama orang lain di jaminan bank. Mira sedang di kasir. Farhan salah menyangka serangan jantung. Lukman menelepon Bandung dari kebun yang sudah gelap. Itu perkara lain, bukan pembunuhan ini.</p>
    <p class="flag">flag{kamu_detektif_h3b4t}</p>
</div>`;

function hashIp(ip) {
    return createHash("sha256").update("mtr19|" + ip).digest("hex");
}

function clientIp(req) {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.trim()) {
        return xff.split(",")[0].trim();
    }
    const real = req.headers["x-real-ip"];
    if (typeof real === "string" && real.trim()) {
        return real.trim();
    }
    return (req.socket && req.socket.remoteAddress) || "0.0.0.0";
}

function cookieBlocked(req) {
    const raw = req.headers.cookie || "";
    return /(?:^|;\s*)mtr19_lock=1(?:;|$)/.test(raw);
}

function setLockCookie(res) {
    const secure = process.env.VERCEL ? "; Secure" : "";
    res.setHeader(
        "Set-Cookie",
        "mtr19_lock=1; Path=/; Max-Age=315360000; HttpOnly; SameSite=Lax" + secure
    );
}

function loadFile() {
    try {
        if (!existsSync(storeFile)) {
            return {};
        }
        const data = JSON.parse(readFileSync(storeFile, "utf8"));
        return data && typeof data === "object" ? data : {};
    } catch {
        return {};
    }
}

function saveFile(map) {
    try {
        writeFileSync(storeFile, JSON.stringify(map));
    } catch {
        /* /tmp may be unavailable */
    }
}

async function kvGet(key) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
        return false;
    }
    try {
        const res = await fetch(`${url}/get/teka:blk:${key}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
            return false;
        }
        const data = await res.json();
        return data.result != null && data.result !== "";
    } catch {
        return false;
    }
}

async function kvSet(key) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
        return;
    }
    try {
        await fetch(`${url}/set/teka:blk:${key}/1`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch {
        /* optional store */
    }
}

async function isBlocked(req, ip) {
    if (cookieBlocked(req)) {
        return true;
    }
    const h = hashIp(ip);
    if (mem.has(h)) {
        return true;
    }
    const map = loadFile();
    if (map[h]) {
        mem.add(h);
        return true;
    }
    if (await kvGet(h)) {
        mem.add(h);
        return true;
    }
    return false;
}

async function blockIp(ip) {
    const h = hashIp(ip);
    mem.add(h);
    const map = loadFile();
    map[h] = Date.now();
    saveFile(map);
    await kvSet(h);
}

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const ip = clientIp(req);
    const blocked = await isBlocked(req, ip);

    if (req.method === "GET") {
        if (blocked) {
            setLockCookie(res);
        }
        res.status(200).json({ ok: false, blocked });
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ ok: false, blocked });
        return;
    }

    if (blocked) {
        setLockCookie(res);
        res.status(200).json({ ok: false, blocked: true, html: "" });
        return;
    }

    let body = req.body;
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch {
            body = {};
        }
    }
    const who = (body && body.who) || "";
    if (who === "yoga") {
        res.status(200).json({ ok: true, blocked: false, html: htmlOk });
        return;
    }

    await blockIp(ip);
    setLockCookie(res);
    res.status(200).json({ ok: false, blocked: true, html: "" });
}
