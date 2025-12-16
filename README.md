# Stress App - EKS Deployment Demo

A Node.js application demonstrating automated deployment to Amazon EKS using GitHub Actions pipelines. The application performs CPU-intensive Fibonacci calculations to test cluster scalability and autoscaling capabilities.

## Purpose

This project demonstrates:
- **Dual Pipeline CI/CD**: Separate GitHub Actions workflows for Docker image building and Helm chart deployment
- **EKS Deployment**: Automated deployment to Amazon EKS using Helm
- **Scalability Testing**: CPU-intensive Fibonacci calculations to trigger HPA (Horizontal Pod Autoscaler)

## How It Works

### Architecture

1. **Pipeline 1 - Image Build**: Builds Docker image and pushes to Amazon ECR
2. **Pipeline 2 - Helm Deployment**: Deploys application to EKS cluster using Helm charts
3. **Application**: Node.js server with `/api/cpu` endpoint that calculates Fibonacci numbers
4. **Autoscaling**: HPA monitors CPU/memory usage and scales pods based on load

### Application Features

- **Fibonacci Calculator**: `/api/cpu?index=<n>` endpoint calculates Fibonacci numbers (0-48)
- **Prometheus Metrics**: Exposes metrics at `/metrics` endpoint
- **Horizontal Pod Autoscaling**: Automatically scales pods based on CPU and memory utilization

## How to Use

### Prerequisites

- Node.js 22+
- Docker
- Kubernetes cluster (EKS)
- Helm 3.x
- AWS CLI configured
- GitHub Actions secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `EKS_CLUSTER_NAME`, `ECR_REPOSITORY_URI`

### Local Development

```bash
npm install
npm run dev
# Server runs on http://localhost:3000
```

### Deployment

**Automated (via GitHub Actions)**:
1. Push code to trigger image build pipeline
2. Image build pipeline creates and pushes Docker image to ECR
3. Helm deployment pipeline automatically deploys to EKS

**Manual**:
```bash
# Build and push image
docker build -t stressapp:latest .
docker tag stressapp:latest <ECR_URI>/stressapp:v0.1.13
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <ECR_URI>
docker push <ECR_URI>/stressapp:v0.1.13

# Deploy with Helm
helm upgrade --install stress-app ./helm/stress-app \
  --namespace <namespace> \
  --create-namespace
```

### Testing Scalability

Generate CPU load to trigger autoscaling:

```bash
# Single request
curl "http://<service-url>/api/cpu?index=45"

# Multiple concurrent requests
ab -n 1000 -c 10 "http://<service-url>/api/cpu?index=40"
```

Monitor autoscaling:
```bash
kubectl get hpa -n <namespace>
kubectl get pods -n <namespace> -w
```

## API Endpoints

- `GET /api/cpu?index=<n>` - Calculate nth Fibonacci number (0-48)
- `GET /metrics` - Prometheus metrics

## Configuration

Key settings in `helm/stress-app/values.yaml`:
- HPA: Min 2, Max 10 replicas, CPU target 70%, Memory target 80%
- Resources: CPU 100m-500m, Memory 128Mi-512Mi
