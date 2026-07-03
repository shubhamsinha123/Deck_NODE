# Docker Commands

Use the following Docker commands for building and managing the application image.

```bash
# List available Docker images
docker images

# Build the Docker image
docker build -t <image-name> .
```

---

# OpenAPI Documentation

For creating or validating the OpenAPI (Swagger) specification, refer to:

- Swagger Editor: http://editor.swagger.io/
- Jira Story: https://deck-digital.atlassian.net/browse/DD-72

> **Note:** You can either get API spec from docs folder from `master` repo or from the jira comments.
> **Note:** Open and copy the API spec as its there as `.yaml` file and check more details by pasting it over `swagger editor` app.

> **Note:** Ensure the OpenAPI specification is updated whenever new APIs are added or existing APIs are modified. Keep the documentation in sync with the application code.
