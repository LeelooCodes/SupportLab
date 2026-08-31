import fs from "fs";
import path from "path";
import pino from "pino";

const logDirectory = path.join(process.cwd(), "logs");

if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, {
        recursive: true
    });
}

const logFile = path.join(
    logDirectory,
    "app.log"
);

const destination = pino.destination({
    dest: logFile,
    sync: false
});

export const logger = pino(
    {
        level: "info"
    },
    destination
);