import GitHubRelease from "./releases/GitHubRelease";
import NpmRelease from "./releases/NpmRelease";

export default {
  build(name: string) {
    const [ type ] = name.split(":", 1);
    const releaseName = name.slice(type.length + 1);
    switch (type) {
      case "github":
        return new GitHubRelease(releaseName);
      case "npm":
        return new NpmRelease(releaseName);
      default:
        throw new SyntaxError(`Invalid release name: ${type}`);
    }
  },
};
