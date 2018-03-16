import fetch from "node-fetch";
import Release from "../Release";

export default class GitHubRelease extends Release {

  protected async _fetch() {
    const url = `http://registry.npmjs.org/${this.name.replace(/\//g, "%2F")}`;
    const response = await fetch(url);
    const object = await response.json();

    const version: string = object["dist-tags"].latest;

    this.title = `${object.name} ${version}`;
    this.author = object.author.name;
    this.link = `https://www.npmjs.com/package/${object.name}`;
    this.id = `${this.link}#${version}`;
    this.updated = new Date(object.time.modified);
  }

  protected get repositoryName(): string {
    return this.name.split("/", 2)[1];
  }
}
