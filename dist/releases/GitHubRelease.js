"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const Release_1 = __importDefault(require("../Release"));
class GitHubRelease extends Release_1.default {
    async _fetch() {
        const url = `https://api.github.com/repos/${this.name}/releases/latest`;
        const response = await node_fetch_1.default(url);
        const object = await response.json();
        this.id = object.html_url;
        this.title = `${this.repositoryName} ${object.name}`;
        this.author = object.author.login;
        this.link = object.html_url;
        this.updated = new Date(object.published_at);
    }
    get repositoryName() {
        return this.name.split("/", 2)[1];
    }
}
exports.default = GitHubRelease;
