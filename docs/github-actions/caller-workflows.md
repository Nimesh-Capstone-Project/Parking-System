# Reusable CI/CD Caller Workflows

These reusable workflows live in this repository:

- `.github/workflows/reusable-ci.yaml`
- `.github/workflows/reusable-ci-frontend.yaml`
- `.github/workflows/reusable-release.yaml`

Use the backend caller for:

- `auth-service`
- `booking-service`
- `notification-service`
- `parking-service`
- `payment-service`
- `scheduler-service`

Use the frontend caller for:

- `frontend`

## Required secrets in every service repo

- `SONAR_TOKEN`
- `SONAR_URL`
- `SNYK_TOKEN`
- `TOKEN`
- `EMAIL_USERNAME` (optional)
- `EMAIL_PASSWORD` (optional)

`TOKEN` must be a PAT that can:

- push packages to GHCR
- push commits to `Nimesh-Capstone-Project/Parking-System`

## Backend `ci.yaml`

This sample uses `auth-service` as the placeholder.
Replace every service-specific value before pasting it into another repo:

- `service_name`
- `image_name`
- `helm_values_key`
- `dev_manifest_path`
- `prod_manifest_path`
- `sonar_key`

```yaml
name: Service CI/CD

on:
  pull_request:
    branches:
      - master
  push:
    branches:
      - master
  workflow_dispatch:
    inputs:
      release_tag:
        description: Release tag in the format service-name-vX.Y.Z
        required: true
        type: string

jobs:
  ci:
    if: github.event_name != 'workflow_dispatch'
    uses: Nimesh-Capstone-Project/Parking-System/.github/workflows/reusable-ci.yaml@master
    with:
      trigger_event: ${{ github.event_name }}
      source_sha: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || github.sha }}
      service_name: auth-service
      image_name: auth-service
      helm_values_key: authService
      dev_manifest_path: infra/argocd/dev/auth-service.yaml
      sonar_key: auth-service
      docker_context: .
      dockerfile_path: ./Dockerfile
      working_directory: .
    secrets:
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      SONAR_URL: ${{ secrets.SONAR_URL }}
      SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      TOKEN: ${{ secrets.TOKEN }}
      EMAIL_USERNAME: ${{ secrets.EMAIL_USERNAME }}
      EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}

  release:
    if: github.event_name == 'workflow_dispatch'
    uses: Nimesh-Capstone-Project/Parking-System/.github/workflows/reusable-release.yaml@master
    with:
      release_tag: ${{ inputs.release_tag }}
      service_name: auth-service
      image_name: auth-service
      helm_values_key: authService
      dev_manifest_path: infra/argocd/dev/auth-service.yaml
      prod_manifest_path: infra/argocd/prod/auth-service.yaml
    secrets:
      TOKEN: ${{ secrets.TOKEN }}
      EMAIL_USERNAME: ${{ secrets.EMAIL_USERNAME }}
      EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}
```

## Exact `notification-service` `ci.yaml`

```yaml
name: Notification Service CI/CD

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main
  workflow_dispatch:
    inputs:
      release_tag:
        description: Release tag in the format notification-service-vX.Y.Z
        required: true
        type: string

jobs:
  ci:
    if: github.event_name != 'workflow_dispatch'
    uses: Nimesh-Capstone-Project/Parking-System/.github/workflows/reusable-ci.yaml@master
    with:
      trigger_event: ${{ github.event_name }}
      source_sha: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || github.sha }}
      service_name: notification-service
      image_name: notification-service
      helm_values_key: notificationService
      dev_manifest_path: infra/argocd/dev/notification-service.yaml
      sonar_key: notification-service
      docker_context: .
      dockerfile_path: ./Dockerfile
      working_directory: .
    secrets:
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      SONAR_URL: ${{ secrets.SONAR_URL }}
      SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      TOKEN: ${{ secrets.TOKEN }}
      EMAIL_USERNAME: ${{ secrets.EMAIL_USERNAME }}
      EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}

  release:
    if: github.event_name == 'workflow_dispatch'
    uses: Nimesh-Capstone-Project/Parking-System/.github/workflows/reusable-release.yaml@master
    with:
      release_tag: ${{ inputs.release_tag }}
      service_name: notification-service
      image_name: notification-service
      helm_values_key: notificationService
      dev_manifest_path: infra/argocd/dev/notification-service.yaml
      prod_manifest_path: infra/argocd/prod/notification-service.yaml
    secrets:
      TOKEN: ${{ secrets.TOKEN }}
      EMAIL_USERNAME: ${{ secrets.EMAIL_USERNAME }}
      EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}
```

## Frontend `ci.yaml`

```yaml
name: Frontend CI/CD

on:
  pull_request:
    branches:
      - master
  push:
    branches:
      - master
  workflow_dispatch:
    inputs:
      release_tag:
        description: Release tag in the format frontend-vX.Y.Z
        required: true
        type: string

jobs:
  ci:
    if: github.event_name != 'workflow_dispatch'
    uses: Nimesh-Capstone-Project/Parking-System/.github/workflows/reusable-ci-frontend.yaml@master
    with:
      trigger_event: ${{ github.event_name }}
      source_sha: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || github.sha }}
      service_name: frontend
      image_name: frontend
      helm_values_key: frontend
      dev_manifest_path: infra/argocd/dev/frontend.yaml
      sonar_key: frontend
      docker_context: .
      dockerfile_path: ./Dockerfile
      working_directory: .
    secrets:
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      SONAR_URL: ${{ secrets.SONAR_URL }}
      SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      TOKEN: ${{ secrets.TOKEN }}
      EMAIL_USERNAME: ${{ secrets.EMAIL_USERNAME }}
      EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}

  release:
    if: github.event_name == 'workflow_dispatch'
    uses: Nimesh-Capstone-Project/Parking-System/.github/workflows/reusable-release.yaml@master
    with:
      release_tag: ${{ inputs.release_tag }}
      service_name: frontend
      image_name: frontend
      helm_values_key: frontend
      dev_manifest_path: infra/argocd/dev/frontend.yaml
      prod_manifest_path: infra/argocd/prod/frontend.yaml
    secrets:
      TOKEN: ${{ secrets.TOKEN }}
      EMAIL_USERNAME: ${{ secrets.EMAIL_USERNAME }}
      EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}
```

## Service values to replace in `ci.yaml`

| Repo | `service_name` | `image_name` | `helm_values_key` | `dev_manifest_path` | `prod_manifest_path` | `sonar_key` |
| --- | --- | --- | --- | --- | --- | --- |
| `auth-service` | `auth-service` | `auth-service` | `authService` | `infra/argocd/dev/auth-service.yaml` | `infra/argocd/prod/auth-service.yaml` | `auth-service` |
| `booking-service` | `booking-service` | `booking-service` | `bookingService` | `infra/argocd/dev/booking-service.yaml` | `infra/argocd/prod/booking-service.yaml` | `booking-service` |
| `notification-service` | `notification-service` | `notification-service` | `notificationService` | `infra/argocd/dev/notification-service.yaml` | `infra/argocd/prod/notification-service.yaml` | `notification-service` |
| `parking-service` | `parking-service` | `parking-service` | `parkingService` | `infra/argocd/dev/parking-service.yaml` | `infra/argocd/prod/parking-service.yaml` | `parking-service` |
| `payment-service` | `payment-service` | `payment-service` | `paymentService` | `infra/argocd/dev/payment-service.yaml` | `infra/argocd/prod/payment-service.yaml` | `payment-service` |
| `scheduler-service` | `scheduler-service` | `scheduler-service` | `schedulerService` | `infra/argocd/dev/scheduler-service.yaml` | `infra/argocd/prod/scheduler-service.yaml` | `scheduler-service` |
| `frontend` | `frontend` | `frontend` | `frontend` | `infra/argocd/dev/frontend.yaml` | `infra/argocd/prod/frontend.yaml` | `frontend` |

## Manual release examples

- `auth-service-v1.1.0`
- `booking-service-v1.1.0`
- `payment-service-v1.1.0`
- `frontend-v1.1.0`
