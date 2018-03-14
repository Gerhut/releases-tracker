"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const Release_1 = __importDefault(require("../Release"));
class PypiRelease extends Release_1.default {
    async _fetch() {
        const url = `https://pypi.python.org/pypi/${this.name}/json`;
        const response = await node_fetch_1.default(url);
        const object = await response.json();
        const name = object.info.name;
        const version = object.info.version;
        this.title = `${name} ${version}`;
        this.author = object.info.author;
        this.link = `https://pypi.python.org/pypi/${name}/${version}`;
        this.id = `${this.link}`;
        this.updated = new Date(object.releases[version][0].upload_time);
    }
}
exports.default = PypiRelease;
