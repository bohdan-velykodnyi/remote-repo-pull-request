import { users } from "./config";
import { getService } from "./service";

(async function main() {
  try {
    const args = process.argv.slice(2);

    const package_name = args[0];
    const package_version = args[1];

    if (!package_name || !package_version) {
      throw new Error("Please send package name and package version as args");
    }

    for await (const { access_token, repository_name } of users) {
      const {
        getPackageJson,
        generateNewPackageJson,
        createCommitInNewBranch,
        createPullRequest,
      } = getService(repository_name, access_token);

      const old_package_json = await getPackageJson();
      const new_package_json = generateNewPackageJson(
        old_package_json,
        package_name,
        package_version
      );
      await createCommitInNewBranch(JSON.stringify(new_package_json, null, 2));
      await createPullRequest();

      console.log(`Pull request successfully created for repository ${repository_name}`);
    }
  } catch (e) {
    throw new Error(e);
  }
})();
