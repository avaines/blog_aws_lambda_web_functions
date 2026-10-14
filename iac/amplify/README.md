# Amplify Hosting Terraform

Defines an SSR-capable Amplify app, a repository branch, and a service role with CloudWatch logging permissions. Resources are split by type; shared locals stay in `locals.tf`. Uses separate local state, as intended for this demo. No remote backend is needed.

Defaults use this repository, the `main` branch, and the region in your existing `app.auto.tfvars`. The application is built from `app/` using Node 22, `npm ci`, lint and `next build`. The build artifact is `.next`; standalone configuration remains available for the Web Functions deployment. No SPA fallback rewrites are installed.

## Plan and deploy

Use the AWS credential chain, for example `AWS_PROFILE`. Supply an authorized GitHub token through `TF_VAR_github_access_token` for every Terraform plan and apply. Amplify app updates require a non-empty token; omitting it can make Terraform try to clear the existing repository credential. If GitHub CLI is authenticated, load its token without putting it in a file or command history:

```sh
export TF_VAR_github_access_token="$(gh auth token)"
```

The GitHub organization/repository may also require installation or authorization of AWS Amplify's GitHub App.

Do not commit credentials. Terraform's `sensitive` flag hides displayed values but does not guarantee exclusion from local state or saved plans. Protect those files; they are ignored by Git.

From this directory:

```sh
terraform init
terraform fmt -check
terraform validate
export TF_VAR_github_access_token="$(gh auth token)"
terraform plan -out=amplify.tfplan
# Review the plan before deploying:
terraform apply amplify.tfplan
```

Terraform creates the hosting configuration; it does not push local application code or launch the first build. Commit and push the intended application revision before starting a release. Automatic builds default to **off** for reproducible comparison runs; opt in with `enable_auto_build = true`.

After infrastructure is applied and the code is pushed:

```sh
aws amplify start-job \
  --app-id "$(terraform output -raw app_id)" \
  --branch-name "$(terraform output -raw branch_name)" \
  --job-type RELEASE \
  --region us-east-1
```

Use your configured region if different. Inspect the returned job in Amplify; the `url` output becomes usable after successful deployment. A root-level `amplify.yml`, if later added to the repository, overrides these Terraform-managed build settings.

## Verification and limits

Check `/`, `/menu/flakes`, unknown-route 404s, checkout, and the cookie-specific `/orders/[id]` page. Confirm order HTML is personalised and not shared between browsers. Compare the same commit on both platforms. Streaming is a comparison target, not assumed parity: Amplify's documented Next.js limitations include streaming.

The app still uses its public demo receipt key and fictional orders; no real customer data or payments. No application AWS SDK calls are made, so an SSR compute role is unnecessary. The service role is limited to log discovery and writes under `/aws/amplify/` in this account/region.

Clean up with `terraform destroy` after reviewing its plan. GitHub connection artifacts and service-created CloudWatch log groups may require separate inspection/cleanup; they are not separate resources in this Terraform state.

Sources:
- [Terraform Amplify app](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/amplify_app)
- [AWS monorepo settings](https://docs.aws.amazon.com/amplify/latest/userguide/monorepo-configuration.html)
- [SSR logging permissions](https://docs.aws.amazon.com/amplify/latest/userguide/cloudwatch-logs-role.html)
- [Next.js feature support](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html)
