"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const GitHubRelease_1 = __importDefault(require("./releases/GitHubRelease"));
const NpmRelease_1 = __importDefault(require("./releases/NpmRelease"));
const PypiRelease_1 = __importDefault(require("./releases/PypiRelease"));
exports.default = {
    build(uriString) {
        const url = new url_1.URL(uriString);
        switch (url.protocol) {
            case "github:":
                return new GitHubRelease_1.default(url.pathname);
            case "npm:":
                return new NpmRelease_1.default(url.pathname);
            case "pypi:":
                return new PypiRelease_1.default(url.pathname);
            default:
                throw new SyntaxError(`Invalid release name: ${uriString}`);
        }
    },
};
