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

export function setCookies(res, names) {
    const list = names.map(cookiePair);
    res.setHeader("Set-Cookie", list.length === 1 ? list[0] : list);
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
