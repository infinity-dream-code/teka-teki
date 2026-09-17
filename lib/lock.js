import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const mem = new Set();
const storeFile = join(tmpdir(), "teka-mtr19-blocked.json");

export function hashIp(ip) {
    return createHash("sha256").update("mtr19|" + ip).digest("hex");
}

export function clientIp(req) {
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

export function cookieHas(req, name) {
    const raw = req.headers.cookie || "";
    const re = new RegExp("(?:^|;\\s*)" + name + "=1(?:;|$)");
    return re.test(raw);
}

export function cookiePair(name) {
    const secure = process.env.VERCEL ? "; Secure" : "";
    return name + "=1; Path=/; Max-Age=315360000; HttpOnly; SameSite=Lax" + secure;
}

export function cookiePairValue(name, value) {
    const secure = process.env.VERCEL ? "; Secure" : "";
    const enc = encodeURIComponent(String(value).slice(0, 64));
    return name + "=" + enc + "; Path=/; Max-Age=315360000; HttpOnly; SameSite=Lax" + secure;
}

export function cookieValue(req, name) {
    const raw = req.headers.cookie || "";
    const parts = raw.split(";");
    for (const part of parts) {
        const i = part.indexOf("=");
        if (i < 0) continue;
        const k = part.slice(0, i).trim();
        if (k !== name) continue;
        try {
            return decodeURIComponent(part.slice(i + 1).trim());
        } catch {
            return part.slice(i + 1).trim();
        }
    }
    return "";
}

export function setCookies(res, names) {
    const list = names.map(cookiePair);
    res.setHeader("Set-Cookie", list.length === 1 ? list[0] : list);
}

export function setCookieValues(res, pairs) {
    const list = pairs.map(([n, v]) => (v === "1" || v === 1 ? cookiePair(n) : cookiePairValue(n, v)));
    const existing = res.getHeader("Set-Cookie");
    if (!existing) {
        res.setHeader("Set-Cookie", list.length === 1 ? list[0] : list);
        return;
    }
    const prev = Array.isArray(existing) ? existing : [existing];
    res.setHeader("Set-Cookie", prev.concat(list));
}

const nameFile = join(tmpdir(), "teka-mtr19-names.json");

function loadNames() {
    try {
        if (!existsSync(nameFile)) return {};
        const data = JSON.parse(readFileSync(nameFile, "utf8"));
        return data && typeof data === "object" ? data : {};
    } catch {
        return {};
    }
}

function saveNames(map) {
    try {
        writeFileSync(nameFile, JSON.stringify(map));
    } catch {
        /* /tmp may be unavailable */
    }
}

async function kvGetName(key) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return "";
    try {
        const res = await fetch(`${url}/get/teka:name:${key}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return "";
        const data = await res.json();
        return data.result != null ? String(data.result) : "";
    } catch {
        return "";
    }
}

async function kvSetName(key, name) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) return;
    try {
        await fetch(`${url}/set/teka:name:${key}/${encodeURIComponent(name)}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch {
        /* optional */
    }
}

export async function getDetectiveName(req, ip) {
    const fromCookie = cookieValue(req, "mtr19_name");
    if (fromCookie) return fromCookie.slice(0, 64);
    const h = hashIp(ip);
    const map = loadNames();
    if (map[h]) return String(map[h]).slice(0, 64);
    const kv = await kvGetName(h);
    return kv ? kv.slice(0, 64) : "";
}

export async function saveDetectiveName(req, res, ip, name) {
    const clean = String(name || "")
        .replace(/[<>&"']/g, "")
        .trim()
        .slice(0, 64);
    if (!clean) return "";
    const h = hashIp(ip);
    const map = loadNames();
    map[h] = clean;
    saveNames(map);
    await kvSetName(h, clean);
    setCookieValues(res, [["mtr19_name", clean]]);
    return clean;
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

export async function isBlocked(req, ip) {
    if (cookieHas(req, "mtr19_lock")) {
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

export async function blockIp(ip) {
    const h = hashIp(ip);
    mem.add(h);
    const map = loadFile();
    map[h] = Date.now();
    saveFile(map);
    await kvSet(h);
}

const tryFile = join(tmpdir(), "teka-mtr19-tries.json");
const tryMem = Object.create(null);

function loadTries() {
    try {
        if (!existsSync(tryFile)) return {};
        const data = JSON.parse(readFileSync(tryFile, "utf8"));
        return data && typeof data === "object" ? data : {};
    } catch {
        return {};
    }
}

function saveTries(map) {
    try {
        writeFileSync(tryFile, JSON.stringify(map));
    } catch {
        /* /tmp may be unavailable */
    }
}

/** Wrong attempts used for a code level (l5|l6). Cookie + file, max of both. */
export function getCodeTries(req, ip, level) {
    const key = level === "l6" ? "mtr19_l6_try" : "mtr19_l5_try";
    const fromCookie = parseInt(cookieValue(req, key) || "0", 10) || 0;
    const h = hashIp(ip);
    const map = loadTries();
    const fromFile = (map[h] && map[h][level]) || tryMem[h + ":" + level] || 0;
    return Math.max(fromCookie, fromFile, 0);
}

/** Record one wrong attempt. Returns tries used after bump. */
export function bumpCodeTry(req, res, ip, level) {
    const key = level === "l6" ? "mtr19_l6_try" : "mtr19_l5_try";
    const h = hashIp(ip);
    const next = Math.min(2, getCodeTries(req, ip, level) + 1);
    const map = loadTries();
    if (!map[h] || typeof map[h] !== "object") map[h] = {};
    map[h][level] = next;
    tryMem[h + ":" + level] = next;
    saveTries(map);
    setCookieValues(res, [[key, String(next)]]);
    return next;
}

export function parseBody(req) {
    let body = req.body;
    if (typeof body === "string") {
        try {
            body = JSON.parse(body);
        } catch {
            body = {};
        }
    }
    return body && typeof body === "object" ? body : {};
}
