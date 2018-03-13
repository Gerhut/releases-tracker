import fetch from "node-fetch";
import Release from "../Release";

export default class GitHubRelease extends Release {

  protected async _fetch() {
    const url = `https://api.github.com/repos/${this.name}/releases/latest`;
    const response = await fetch(url);
    const object = await response.json();

    this.id = object.html_url;
    this.title = `${this.repositoryName} ${object.name}`;
    this.author = object.author.login;
    this.link = object.html_url;
    this.updated = new Date(object.published_at);
  }

  protected get repositoryName(): string {
    return this.name.split("/", 2)[1];
  }
}
