import { URL } from "url";
import GitHubRelease from "./releases/GitHubRelease";
import NpmRelease from "./releases/NpmRelease";
import PypiRelease from './releases/PypiRelease';

export default {
  build(uriString: string) {
    const url = new URL(uriString);
    switch (url.protocol) {
      case "github:":
        return new GitHubRelease(url.pathname);
      case "npm:":
        return new NpmRelease(url.pathname);
      case "pypi:":
        return new PypiRelease(url.pathname);
      default:
        throw new SyntaxError(`Invalid release name: ${uriString}`);
    }
  },
};
