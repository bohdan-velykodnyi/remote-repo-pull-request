export type BaseObject = { [name: string]: any };

export interface BitbucketRequestDto {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  data?: BaseObject;
  custom_headers?: BaseObject;
}

export interface GetServiceType {
  createPullRequest: () => Promise<void>;
  createCommitInNewBranch: (new_package_json: string) => Promise<void>;
  generateNewPackageJson: (
    old_package_json: BaseObject,
    package_name: string,
    package_version: string
  ) => BaseObject;
  getPackageJson: () => Promise<BaseObject>;
}

export interface RepositoryInfo {
  access_token: string;
  repository_name: string;
}