import debug from "debug";
import Koa from "koa";
import Release from "./Release";
import ReleaseFactory from "./ReleaseFactory";

const log = debug("releases-tracker");

const releaseNames = (process.env.RELEASES || "").split(" ");
const releases: Release[] = [];
for (const releaseName of releaseNames) {
  try {
    releases.push(ReleaseFactory.build(releaseName));
  } catch (e) {
    log(e);
  }
}

export const app = new Koa();

app.use(async (context) => {
  context.assert(context.method === "GET", 405);
  context.assert(context.url === "/", 404);

  const fetchPromises = releases.map((release) => release.fetch().catch(() => null));
  await Promise.all(fetchPromises);
  const atomString = Release.toAtomString(releases, { link: context.href });

  context.type = "atom";
  context.body = atomString;
});

if (require.main === module) {
    app.listen(process.env.PORT);
}
