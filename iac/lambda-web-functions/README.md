# Lambda Web Functions Terraform

Uses native `hashicorp/awscc` resources for the Web Function, immutable revision and HTTPS endpoint. The standard AWS provider manages the supporting S3 bucket, execution role and CloudWatch log group. Provider versions are locked. Resources are split into files by type; state remains local and separate from Amplify.

## Package the shared app

Prerequisites: Terraform 1.7+, Docker with Linux ARM64 support, Python 3, and AWS credentials for the eventual deployment. The code bucket's region must be supported by Web Functions and cannot be an opt-in region. The existing `app.auto.tfvars` selects `us-east-1`.

From this directory:

```sh
bash scripts/package.sh
terraform init
terraform fmt -check -recursive
terraform validate
terraform plan -out=web-functions.tfplan
# Review before deploying:
terraform apply web-functions.tfplan
```

The package script copies app build inputs into a temporary directory, installs dependencies and builds using Node 24 in Linux ARM64, and produces `build/application.zip`. It leaves the running local app and its dependencies alone. The Docker image is `node:24-bookworm`; pin its digest if comparing reproducible build environments. The zip includes standalone server dependencies and static assets, plus a small `index.js` that maps Lambda's HTTP endpoint variable to the host and port Next.js expects. There is no event-handler adapter.

Build before planning; alternatively set `artifact_path` to an existing Linux ARM64 zip containing the same entry point. The file hash drives code updates. The zip should contain `index.js`, `server.js`, `.next`, and `node_modules` at its root. Do not package macOS node_modules.

## What Terraform creates

- One named Web Function, a Node 24 revision, and a HomeRegion endpoint routing 100% of traffic to it.
- A dedicated private, encrypted, versioned S3 bucket and code object. Lambda read access is scoped to this function's revision ARNs. The revision pins the exact object version.
- A logging-only execution role and a CloudWatch log group retained for seven days.
- An endpoint limit of two concurrent environments and 100 requests/second; each environment permits 16 concurrent requests. This is a small demo configuration, not a cost guarantee.

`ApplicationManaged` means the application handles authentication: this fictional shop has no login, so applying the configuration makes it public. It still uses the public demo receipt-signing key. Use fictional orders only.

## Updates, verification and cleanup

Rebuild the zip and plan/apply to publish new code. The immutable revision uses `create_before_destroy`, letting the endpoint move to the new revision before Terraform removes the old one. Updating the stable S3 key creates a new version; no lifecycle expiry deletes bytes needed by running revisions. This does not provide a retained rollback history of old revisions.

After applying, inspect `terraform output -raw url`, visit the homepage and dish routes, and complete checkout. Confirm personalised order HTML, cookie isolation and streamed progress. AWS resource state alone does not prove the HTTP server started. Use the `log_group` output to diagnose startup failures.

```sh
BASE_URL="$(terraform output -raw url)" node ../../app/scripts/smoke.mjs
```

The local smoke script currently checks that anonymous receipt requests return 404 and that the stream has a delayed second chunk. Run it against each platform and record any buffering differences. Compare the same application commit. This initial Web Functions setup uses its direct endpoint, with no CloudFront distribution, custom domain or WAF; account for that difference from Amplify in performance comparisons. Node runtime versions also differ (Amplify build Node 22, Web Functions Node 24).

`terraform destroy` removes the endpoint, revision, function and supporting resources. The dedicated bucket has `force_destroy = true`: destroying this demo also deletes all packaged code versions. The execution role cannot read application data or modify other AWS resources. The deploying identity needs AWS Cloud Control/resource management permissions, IAM PassRole, and S3 code read/write permissions.

## Validation scope

Use `terraform validate`, review a real AWS plan, and run the application smoke checks after deployment. Provider validation alone does not establish AWS region availability, deployment authorization, successful runtime startup or measured performance.

Sources:
- [AWSCC Web Function](https://github.com/hashicorp/terraform-provider-awscc/blob/main/docs/resources/lambda_web_function.md)
- [AWSCC revision](https://github.com/hashicorp/terraform-provider-awscc/blob/main/docs/resources/lambda_web_function_revision.md)
- [AWSCC endpoint](https://github.com/hashicorp/terraform-provider-awscc/blob/main/docs/resources/lambda_web_function_endpoint.md)
- [AWS code packaging and S3 permissions](https://docs.aws.amazon.com/lambda/latest/dg/web-functions-code-s3.html)
- [AWS execution permissions](https://docs.aws.amazon.com/lambda/latest/dg/web-functions-permissions.html)
