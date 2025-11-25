// Лабораторна робота №5 – Коміт 5
// Повна реалізація GET + PUT + DELETE (кешуючий проксі-сервер)

const http = require("http");
const fs = require("fs");
const path = require("path");
const { Command } = require("commander");
const superagent = require("superagent");

// CLI
const program = new Command();

program
    .requiredOption("-h, --host <host>", "server host")
    .requiredOption("-p, --port <port>", "server port")
    .requiredOption("-c, --cache <dir>", "cache directory");

program.parse(process.argv);
const opts = program.opts();

const HOST = opts.host;
const PORT = Number(opts.port);
const CACHE_DIR = path.resolve(opts.cache);

async function ensureCache() {
    await fs.promises.mkdir(CACHE_DIR, { recursive: true });
}

function cachePath(code) {
    return path.join(CACHE_DIR, `${code}.jpg`);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", chunk => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

// GET
async function handleGet(code, filePath, res) {
    try {
        const data = await fs.promises.readFile(filePath);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        return res.end(data);
    } catch (_) {}

    try {
        const response = await superagent
            .get(`https://http.cat/${code}`)
            .buffer(true)
            .parse((r, cb) => {
                const arr = [];
                r.on("data", c => arr.push(c));
                r.on("end", () => cb(null, Buffer.concat(arr)));
            });

        const img = response.body;
        await fs.promises.writeFile(filePath, img);

        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(img);
    } catch (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
}

// PUT
async function handlePut(filePath, req, res) {
    const body = await readBody(req);
    if (!body.length) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Bad Request");
    }

    await fs.promises.writeFile(filePath, body);
    res.writeHead(201, { "Content-Type": "text/plain" });
    res.end("Created");
}

// DELETE
async function handleDelete(filePath, res) {
    try {
        await fs.promises.unlink(filePath);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
    } catch (err) {
        if (err.code === "ENOENT") {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
        } else {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error");
        }
    }
}

// server
async function start() {
    await ensureCache();

    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://${HOST}:${PORT}`);
        const code = url.pathname.replace("/", "");
        const file = cachePath(code);

        if (req.method === "GET") return handleGet(code, file, res);
        if (req.method === "PUT") return handlePut(file, req, res);
        if (req.method === "DELETE") return handleDelete(file, res);

        res.writeHead(405, { Allow: "GET, PUT, DELETE" });
        res.end("Method Not Allowed");
    });

    server.listen(PORT, HOST, () => {
        console.log(`Proxy running at http://${HOST}:${PORT}`);
    });
}

start();
