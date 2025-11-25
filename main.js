// Лабораторна робота №5 – Коміт 4
// Додано GET + кешування через fs.promises і superagent

const http = require("http");
const fs = require("fs");
const path = require("path");
const { Command } = require("commander");
const superagent = require("superagent");

// --------------------
// CLI
// --------------------

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

// --------------------
// Ensure cache dir
// --------------------

async function ensureCache() {
    await fs.promises.mkdir(CACHE_DIR, { recursive: true });
}

function cachePath(code) {
    return path.join(CACHE_DIR, `${code}.jpg`);
}

// --------------------
// Обробка GET
// --------------------

async function handleGet(code, filePath, res) {
    try {
        const data = await fs.promises.readFile(filePath);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(data);
        return;
    } catch (_) {}

    try {
        const response = await superagent
            .get(`https://http.cat/${code}`)
            .buffer(true)
            .parse((r, cb) => {
                const chunks = [];
                r.on("data", chunk => chunks.push(chunk));
                r.on("end", () => cb(null, Buffer.concat(chunks)));
            });

        const img = response.body;

        await fs.promises.writeFile(filePath, img);

        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(img);
    } catch (e) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
}

// --------------------
// Сервер (поки тільки GET)
// --------------------

async function start() {
    await ensureCache();

    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://${HOST}:${PORT}`);
        const code = url.pathname.replace("/", "");

        if (req.method === "GET") {
            return handleGet(code, cachePath(code), res);
        }

        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method Not Allowed");
    });

    server.listen(PORT, HOST, () => {
        console.log(`Server running at http://${HOST}:${PORT}`);
    });
}

start();
