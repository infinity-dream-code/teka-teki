import { blockIp, clientIp, cookieHas, getDetectiveName, isBlocked, parseBody, saveDetectiveName, setCookies } from "../lib/lock.js";

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    const ip = clientIp(req);
    const blocked = await isBlocked(req, ip);
    const l3 = cookieHas(req, "mtr19_l3");
    const existing = await getDetectiveName(req, ip);

    if (req.method === "GET") {
        if (blocked) setCookies(res, ["mtr19_lock"]);
        res.status(200).json({
            ok: false,
            blocked,
            l3,
            name: existing,
            hasName: Boolean(existing)
        });
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ ok: false, blocked, l3 });
        return;
    }

    if (blocked) {
        setCookies(res, ["mtr19_lock"]);
        res.status(200).json({ ok: false, blocked: true, name: "" });
        return;
    }

    if (!l3) {
        res.status(200).json({ ok: false, blocked: false, need: true, name: "" });
        return;
    }

    if (existing) {
        res.status(200).json({ ok: true, blocked: false, name: existing, hasName: true });
        return;
    }

    const raw = parseBody(req).name || "";
    const name = await saveDetectiveName(req, res, ip, raw);
    if (!name) {
        res.status(200).json({ ok: false, blocked: false, err: "name", name: "" });
        return;
    }

    res.status(200).json({ ok: true, blocked: false, name, hasName: true });
}
