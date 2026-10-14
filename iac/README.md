# Hosting comparison infrastructure

| Terraform root | Target | Status |
| --- | --- | --- |
| `amplify/` | Amplify Hosting SSR | Resource definitions ready; not deployed |
| `lambda-web-functions/` | AWS Lambda Web Functions | Resource definitions ready; not deployed |

Both roots use `../app` relative to this directory. Keep their state and deployment lifecycles separate so either hosting environment can be created or removed independently. Nothing has been deployed.

Amplify has resource definitions and a build specification. Web Functions uses the AWS Cloud Control provider, with separate IAM, logging and versioned code storage resources, plus a Linux ARM64 packaging script. Both roots use separate local state for this demo. Compare the same application commit and use fictional checkout details. The app's public demo receipt key is not a production security boundary.
