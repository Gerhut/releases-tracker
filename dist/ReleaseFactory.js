"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const GitHubRelease_1 = __importDefault(require("./releases/GitHubRelease"));
const NpmRelease_1 = __importDefault(require("./releases/NpmRelease"));
exports.default = {
    build(name) {
        const [type] = name.split(":", 1);
        const releaseName = name.slice(type.length + 1);
        switch (type) {
            case "github":
                return new GitHubRelease_1.default(releaseName);
            case "npm":
                return new NpmRelease_1.default(releaseName);
            default:
                throw new SyntaxError(`Invalid release name: ${type}`);
        }
    },
};
