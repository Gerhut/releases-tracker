"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const Release_1 = __importDefault(require("../Release"));
class NpmRelease extends Release_1.default {
    async _fetch() {
        const url = `http://registry.npmjs.org/${this.name.replace(/\//g, "%2F")}`;
        const response = await node_fetch_1.default(url);
        const object = await response.json();
        const version = object["dist-tags"].latest;
        this.title = `${object.name} ${version}`;
        this.author = object.author ? object.author.name : object.maintainers[0].name;
        this.link = `https://www.npmjs.com/package/${object.name}`;
        this.id = `${this.link}#${version}`;
        this.updated = new Date(object.time[version]);
    }
}
exports.default = NpmRelease;
