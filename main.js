// Лабораторна робота №5 – Коміт 3
// Базова структура CLI + HTTP-сервер (без логіки кешування)

const http = require("http");
const { Command } = require("commander");
const path = require("path");

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
// Стартовий сервер (без логіки)
// --------------------

const server = http.createServer((req, res) => {
    res.writeHead(501, { "Content-Type": "text/plain" });
    res.end("Not Implemented");
});

server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
});
