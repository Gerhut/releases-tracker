"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const koa_1 = __importDefault(require("koa"));
const Release_1 = __importDefault(require("./Release"));
const ReleaseFactory_1 = __importDefault(require("./ReleaseFactory"));
const log = debug_1.default("releases-tracker");
const releaseNames = (process.env.RELEASES || "").split(" ");
const releases = [];
for (const releaseName of releaseNames) {
    try {
        releases.push(ReleaseFactory_1.default.build(releaseName));
    }
    catch (e) {
        log(e);
    }
}
exports.app = new koa_1.default();
exports.app.use(async (context) => {
    context.assert(context.method === "GET", 405);
    context.assert(context.url === "/", 404);
    const fetchPromises = releases.map((release) => release.fetch());
    await Promise.all(fetchPromises);
    const atomString = Release_1.default.toAtomString(releases, { link: context.href });
    context.type = "atom";
    context.body = atomString;
});
if (require.main === module) {
    exports.app.listen(process.env.PORT);
}
