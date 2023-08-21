import axios from "axios";
import { URL_PREFIX, WORKSPACE, NEW_BRANCH_NAME } from "./config";
import { BaseObject, BitbucketRequestDto, GetServiceType } from "./types";

export const getService = (repository_name: string, access_token: string): GetServiceType => {
  const REPO_SLUG = repository_name;
  const ACCESS_TOKEN = access_token;

  const getPackageJson = async (): Promise<BaseObject> => {
    const repo_source = await bitbucketRequest({
      url: `${URL_PREFIX}/repositories/${WORKSPACE}/${REPO_SLUG}/src`,
      method: "GET",
    });

    const package_json_link = repo_source.values.find(
      (file) => file.path === "package.json"
    ).links.self.href;

    if (!package_json_link) {
        throw new Error('package.json not exist in the repository');
    }

    const package_json = await bitbucketRequest({
      url: package_json_link,
      method: "GET",
    });

    return package_json;
  };

  const generateNewPackageJson = (
    old_package_json: BaseObject,
    package_name: string,
    package_version: string
  ): BaseObject => {
    const new_package_json = { ...old_package_json };

    if (old_package_json.dependencies?.[package_name]) {
        new_package_json.dependencies[package_name] = package_version;
    } else if (old_package_json.devDependencies?.[package_name]) {
        new_package_json.devDependencies[package_name] = package_version;
    } else {
        throw new Error('This package not exist in the repository');
    }

    return new_package_json
  };

  const createCommitInNewBranch = async (
    new_package_json: string
  ): Promise<void> => {
    const commitData = {
      message: "Update package.json",
      branch: NEW_BRANCH_NAME,
      "package.json": new_package_json,
    };

    await bitbucketRequest({
      url: `${URL_PREFIX}/repositories/${WORKSPACE}/${REPO_SLUG}/src`,
      method: "POST",
      data: commitData,
    });
  };

  const createPullRequest = async (): Promise<void> => {
    const pullRequestData = {
      title: "Update package.json",
      source: {
        branch: {
          name: NEW_BRANCH_NAME,
        },
      },
      destination: {
        branch: {
          name: "master",
        },
      },
    };

    await bitbucketRequest({
      url: `${URL_PREFIX}/repositories/${WORKSPACE}/${REPO_SLUG}/pullrequests`,
      method: "POST",
      data: pullRequestData,
      custom_headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const bitbucketRequest = async ({
    url,
    method,
    data,
    custom_headers,
  }: BitbucketRequestDto): Promise<BaseObject> => {
    try {
      const headers = {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      };
  
      const res = await axios({
        url,
        method,
        data,
        headers: {
          ...headers,
          ...custom_headers,
        },
      });
  
      return res.data;
    } catch (e) {
      throw new Error(e.response.data.error.message);
    }
  };

  return {
    createPullRequest,
    createCommitInNewBranch,
    generateNewPackageJson,
    getPackageJson,
  };
};
