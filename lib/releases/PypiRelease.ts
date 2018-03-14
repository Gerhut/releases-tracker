import fetch from "node-fetch";
import Release from "../Release";

export default class PypiRelease extends Release {

  protected async _fetch() {
    const url = `https://pypi.python.org/pypi/${this.name}/json`;
    const response = await fetch(url);
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
