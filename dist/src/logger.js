"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pino_1 = __importDefault(require("pino"));
const logDirectory = path_1.default.join(process.cwd(), "logs");
if (!fs_1.default.existsSync(logDirectory)) {
    fs_1.default.mkdirSync(logDirectory, {
        recursive: true
    });
}
const logFile = path_1.default.join(logDirectory, "app.log");
const destination = pino_1.default.destination({
    dest: logFile,
    sync: false
});
exports.logger = (0, pino_1.default)({
    level: "info"
}, destination);
