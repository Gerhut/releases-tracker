import debug from "debug";
import xmlbuilder from "xmlbuilder";

const log = debug("releases-tracker");

export default abstract class Release {

  public static toAtomString(releases: Release[], {
      link = "https://github.com/Gerhut/releases-tracker",
      title = "Releases Tracker",
    } = {}) {
    const feedElement = xmlbuilder.create("feed", { encoding: "utf-8" });
    feedElement.attribute("xmlns", "http://www.w3.org/2005/Atom");
    feedElement.element("id")
      .text(link);
    feedElement.element("title")
      .text(title);
    feedElement.element("link")
      .attribute("rel", "self")
      .attribute("type", "application/atom+xml")
      .attribute("href", link);

    const sortedReleases = releases.filter((release) => release.id !== undefined);
    sortedReleases.sort((a, b) => (b.updated || 0).valueOf() - (a.updated || 0).valueOf());

    const latestRelease = sortedReleases[0];
    if (latestRelease !== undefined && latestRelease.updated !== undefined) {
      feedElement.element("updated")
        .text(latestRelease.updated.toISOString());
    } else {
      feedElement.element("updated")
        .text(new Date().toISOString());
    }

    for (const release of sortedReleases) {
      feedElement.importDocument(release.toAtomEntryElement());
    }

    return feedElement.end({
      pretty: process.env.NODE_ENV !== "production",
    });
  }

  protected name: string;
  protected id?: string;
  protected title?: string;
  protected author?: string;
  protected link?: string;
  protected updated?: Date;

  private fetchPromise?: Promise<void>;

  public constructor(name: string) {
    this.name = name;
  }

  public async fetch() {
    if (this.fetchPromise === undefined) {
      this.log("Fetch start");
      this.fetchPromise = this._fetch();
      this.fetchPromise.then(() => {
        this.log("Fetch successfully");
        this.fetchPromise = undefined;
      },                     (error) => {
        this.log("Fetch failed", error);
        this.id = this.title = this.author = this.link = this.updated = undefined;
        this.fetchPromise = undefined;
      });
    } else {
      this.log("Fetch processing");
    }

    return this.fetchPromise;
  }

  public toAtomEntryElement() {
    if (this.id === undefined) {
      throw new TypeError(`${this}'s id is undefined.`);
    }
    if (this.title === undefined) {
      throw new TypeError(`${this}'s title is undefined.`);
    }
    if (this.author === undefined) {
      throw new TypeError(`${this}'s author is undefined.`);
    }
    if (this.link === undefined) {
      throw new TypeError(`${this}'s link is undefined.`);
    }
    if (this.updated === undefined) {
      throw new TypeError(`${this}'s updated is undefined.`);
    }

    const entryElement = xmlbuilder.create("entry");
    entryElement.element("id")
      .text(this.id);
    entryElement.element("title")
      .text(this.title);
    entryElement.element("author")
      .element("name")
        .text(this.author);
    entryElement.element("link")
      .attribute("rel", "alternate")
      .attribute("type", "text/html")
      .attribute("href", this.link);
    entryElement.element("updated")
      .text(this.updated.toISOString());
    entryElement.element("content")
      .text(this.title);

    return entryElement;
  }

  public toString() {
    return `[object ${this.constructor.name} ${this.name}]`;
  }

  protected log(...args: string[]) {
    log(this.toString(), ...args);
  }

  protected abstract _fetch(): Promise<void>;
}
