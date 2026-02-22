# GitOps Pipeline Setup Guide 🚀

A complete step-by-step guide to building a production-ready GitOps pipeline with Kubernetes, Docker, GitHub Actions, and ArgoCD.

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Docker Desktop installed and running
- [ ] kubectl installed (`kubectl version --client`)
- [ ] Minikube or Kind installed
- [ ] Git installed
- [ ] A GitHub account
- [ ] A Docker Hub account
- [ ] Node.js installed (for local testing)

---

## 🎯 Phase 1: Local Environment Setup

### Step 1: Start Kubernetes Cluster

**Option A: Using Minikube**
```bash
# Start Minikube
minikube start --cpus=2 --memory=4096

# Verify cluster is running
kubectl cluster-info
kubectl get nodes
```

**Option B: Using Kind**
```bash
# Create cluster
kind create cluster --name gitops-demo

# Verify cluster
kubectl cluster-info
kubectl get nodes
```

---

## 📦 Phase 2: Create Application Repository (CI Repo)

### Step 2: Create GitHub Repository #1

1. Go to GitHub → New Repository
2. Name: `gitops-nodejs-app`
3. Visibility: Public
4. Initialize with README: ✅
5. Click **Create repository**


### Step 3: Clone and Setup Application Code

```bash
# Clone repository
cd ~/Documents
git clone https://github.com/YOUR_USERNAME/gitops-nodejs-app.git
cd gitops-nodejs-app

# Create folder structure
mkdir -p src
mkdir -p .github/workflows
```

### Step 4: Create Application Files

**Create `src/app.js`:**
```bash
cat > src/app.js << 'EOF'
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('GitOps Pipeline Working 🚀 Version: ' + (process.env.VERSION || '1.0'));
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
EOF
```

**Create `package.json`:**
```bash
cat > package.json << 'EOF'
{
  "name": "gitops-app",
  "version": "1.0.0",
  "description": "GitOps Demo Application",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "test": "echo \"No tests yet\" && exit 0"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "author": "Your Name",
  "license": "MIT"
}
EOF
```

**Create `Dockerfile`:**
```bash
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY src/ ./src/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run application
CMD ["npm", "start"]
EOF
```

**Create `.dockerignore`:**
```bash
cat > .dockerignore << 'EOF'
node_modules
.git
.github
*.md
.env
EOF
```

### Step 5: Test Application Locally (Optional but Recommended)

```bash
# Install dependencies
npm install

# Run locally
npm start

# In another terminal, test it
curl http://localhost:3000
# Should see: GitOps Pipeline Working 🚀 Version: 1.0

# Press Ctrl+C to stop
```

### Step 6: Test Docker Build Locally

```bash
# Build image
docker build -t gitops-app:test .

# Run container
docker run -d -p 3000:3000 --name gitops-test gitops-app:test

# Test it
curl http://localhost:3000

# Clean up
docker stop gitops-test
docker rm gitops-test
```

### Step 7: Create GitHub Actions CI Pipeline

**Create `.github/workflows/ci.yml`:**
```bash
cat > .github/workflows/ci.yml << 'EOF'
name: Build & Push Docker Image

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  DOCKER_IMAGE: ${{ secrets.DOCKER_USERNAME }}/gitops-app

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.DOCKER_IMAGE }}
          tags: |
            type=sha,prefix=,format=short
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Image digest
        run: echo "Image pushed with tags - ${{ steps.meta.outputs.tags }}"
EOF
```

### Step 8: Configure GitHub Secrets

1. Go to your `gitops-nodejs-app` repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

   **Secret 1:**
   - Name: `DOCKER_USERNAME`
   - Value: `your-dockerhub-username`

   **Secret 2:**
   - Name: `DOCKER_PASSWORD`
   - Value: `your-dockerhub-password` (or access token - recommended)

> 💡 **Pro Tip:** Use Docker Hub Access Token instead of password:
> - Go to Docker Hub → Account Settings → Security → New Access Token
> - Use the token as `DOCKER_PASSWORD`

### Step 9: Push Code to Trigger CI

```bash
# Create README
cat > README.md << 'EOF'
# GitOps Node.js Application

A simple Node.js application demonstrating GitOps CI/CD pipeline.

## Tech Stack
- Node.js + Express
- Docker
- GitHub Actions
- Kubernetes
- ArgoCD

## Local Development
```bash
npm install
npm start
```

Visit http://localhost:3000
EOF

# Commit and push
git add .
git commit -m "Initial application setup with CI pipeline"
git push origin main
```

### Step 10: Verify CI Pipeline

1. Go to GitHub → Your repository → **Actions** tab
2. You should see the workflow running
3. Wait for it to complete (green checkmark)
4. Go to Docker Hub and verify your image was pushed

---

## 🏗️ Phase 3: Create Manifests Repository (GitOps Repo)

### Step 11: Create GitHub Repository #2

1. Go to GitHub → New Repository
2. Name: `gitops-nodejs-manifests`
3. Visibility: Public
4. Initialize with README: ✅
5. Click **Create repository**

### Step 12: Clone and Setup Manifests

```bash
# Clone repository
cd ~/Documents
git clone https://github.com/YOUR_USERNAME/gitops-nodejs-manifests.git
cd gitops-nodejs-manifests

# Create folder structure
mkdir -p base
```

### Step 13: Create Kubernetes Manifests

**Create `base/namespace.yaml`:**
```bash
cat > base/namespace.yaml << 'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: gitops-app
  labels:
    name: gitops-app
    environment: production
EOF
```

**Create `base/deployment.yaml`:**
```bash
cat > base/deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitops-app
  namespace: gitops-app
  labels:
    app: gitops-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gitops-app
  template:
    metadata:
      labels:
        app: gitops-app
    spec:
      containers:
        - name: gitops-app
          image: YOUR_DOCKERHUB_USERNAME/gitops-app:latest
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
EOF
```

> ⚠️ **Important:** Replace `YOUR_DOCKERHUB_USERNAME` with your actual Docker Hub username!

**Create `base/service.yaml`:**
```bash
cat > base/service.yaml << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: gitops-service
  namespace: gitops-app
  labels:
    app: gitops-app
spec:
  type: NodePort
  selector:
    app: gitops-app
  ports:
    - name: http
      port: 80
      targetPort: 3000
      nodePort: 30080
EOF
```

### Step 14: Update README

```bash
cat > README.md << 'EOF'
# GitOps Kubernetes Manifests

Kubernetes manifests for the GitOps Node.js application.

## Structure
```
base/
├── namespace.yaml   # Application namespace
├── deployment.yaml  # Application deployment
└── service.yaml     # Application service
```

## Deployment
This repository is monitored by ArgoCD for automatic deployment.

## Manual Deployment (for testing)
```bash
kubectl apply -f base/
```

## Access Application
```bash
# Get service URL (Minikube)
minikube service gitops-service -n gitops-app

# Or port-forward
kubectl port-forward -n gitops-app svc/gitops-service 8080:80
```
EOF
```

### Step 15: Push Manifests to GitHub

```bash
git add .
git commit -m "Initial Kubernetes manifests"
git push origin main
```

### Step 16: Test Manifests Manually (Optional)

```bash
# Apply manifests
kubectl apply -f base/

# Check deployment
kubectl get all -n gitops-app

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=gitops-app -n gitops-app --timeout=120s

# Test the application
# For Minikube:
minikube service gitops-service -n gitops-app

# For Kind:
kubectl port-forward -n gitops-app svc/gitops-service 8080:80
# Then visit http://localhost:8080
```

---

## 🔄 Phase 4: Install and Configure ArgoCD

### Step 17: Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready (this may take 2-3 minutes)
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

# Verify installation
kubectl get pods -n argocd
```

### Step 18: Access ArgoCD UI

```bash
# Port forward ArgoCD server
kubectl port-forward svc/argocd-server -n argocd 8080:443 &

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo ""

# Copy the password (you'll need it next)
```

**Access ArgoCD:**
1. Open browser: https://localhost:8080
2. Accept the self-signed certificate warning
3. Username: `admin`
4. Password: (the password you just copied)

### Step 19: Install ArgoCD CLI (Optional but Recommended)

**For Linux:**
```bash
curl -sSL -o /tmp/argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 /tmp/argocd-linux-amd64 /usr/local/bin/argocd
rm /tmp/argocd-linux-amd64

# Verify installation
argocd version --client
```

**Login via CLI:**
```bash
# Login (password from step 18)
argocd login localhost:8080 --username admin --insecure

# Change admin password (recommended)
argocd account update-password
```

### Step 20: Create ArgoCD Application (via UI)

1. In ArgoCD UI, click **+ NEW APP**
2. Fill in the form:

   **GENERAL:**
   - Application Name: `gitops-nodejs-app`
   - Project: `default`
   - Sync Policy: `Automatic`
   - Check: ✅ `PRUNE RESOURCES`
   - Check: ✅ `SELF HEAL`

   **SOURCE:**
   - Repository URL: `https://github.com/YOUR_USERNAME/gitops-nodejs-manifests`
   - Revision: `HEAD`
   - Path: `base`

   **DESTINATION:**
   - Cluster URL: `https://kubernetes.default.svc`
   - Namespace: `gitops-app`

3. Click **CREATE**

### Step 21: Create ArgoCD Application (via CLI Alternative)

```bash
argocd app create gitops-nodejs-app \
  --repo https://github.com/YOUR_USERNAME/gitops-nodejs-manifests.git \
  --path base \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace gitops-app \
  --sync-policy automated \
  --self-heal \
  --auto-prune
```

### Step 22: Verify Deployment

```bash
# Check ArgoCD application status
argocd app get gitops-nodejs-app

# Check Kubernetes resources
kubectl get all -n gitops-app

# Check application logs
kubectl logs -n gitops-app -l app=gitops-app --tail=50
```

### Step 23: Access Your Application

**For Minikube:**
```bash
minikube service gitops-service -n gitops-app
```

**For Kind:**
```bash
kubectl port-forward -n gitops-app svc/gitops-service 8081:80
# Visit http://localhost:8081
```

You should see: **GitOps Pipeline Working 🚀**

---

## 🧪 Phase 5: Test the Complete GitOps Flow

### Step 24: Make a Change and Watch GitOps in Action

```bash
# Go to application repo
cd ~/Documents/gitops-nodejs-app

# Update the app
cat > src/app.js << 'EOF'
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('GitOps Pipeline Working 🚀🔥 Version: 2.0 - Updated!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', version: '2.0' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000 - Version 2.0');
});
EOF

# Commit and push
git add src/app.js
git commit -m "Update app to version 2.0"
git push origin main
```

### Step 25: Watch the Pipeline

1. **GitHub Actions**: Go to Actions tab and watch the build
2. **Docker Hub**: Check for new image with new tag
3. **Update Manifest**: Once image is built, update the manifests repo

```bash
# Go to manifests repo
cd ~/Documents/gitops-nodejs-manifests

# Get the new image tag from Docker Hub (it will be a commit SHA)
# For now, we'll use 'latest' but in production you'd use the SHA

# Update deployment.yaml (already using latest, so ArgoCD will detect the change)
# If you want to force-pull, you can add imagePullPolicy

git add .
git commit -m "Trigger redeployment" --allow-empty
git push origin main
```

4. **ArgoCD**: Watch ArgoCD UI - it should detect the change and sync automatically
5. **Test**: Refresh your application in the browser - you should see version 2.0!

---

## 🎯 Phase 6: Advanced - Auto-Update Image Tag in Manifests

This is the **true GitOps automation** that impresses in interviews!

### Step 26: Add Manifest Update Job to CI Pipeline

```bash
cd ~/Documents/gitops-nodejs-app

# Update .github/workflows/ci.yml
cat > .github/workflows/ci.yml << 'EOF'
name: Build & Push Docker Image

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  DOCKER_IMAGE: ${{ secrets.DOCKER_USERNAME }}/gitops-app

jobs:
  build:
    runs-on: ubuntu-latest
    
    outputs:
      image-tag: ${{ steps.image-tag.outputs.tag }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set image tag
        id: image-tag
        run: echo "tag=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ${{ env.DOCKER_IMAGE }}:${{ steps.image-tag.outputs.tag }}
            ${{ env.DOCKER_IMAGE }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Image digest
        run: echo "Image pushed with tag ${{ steps.image-tag.outputs.tag }}"

  update-manifest:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout manifests repo
        uses: actions/checkout@v3
        with:
          repository: ${{ secrets.MANIFEST_REPO }}
          token: ${{ secrets.GH_PAT }}
          ref: main

      - name: Update image tag in deployment
        run: |
          sed -i "s|image: ${{ secrets.DOCKER_USERNAME }}/gitops-app:.*|image: ${{ secrets.DOCKER_USERNAME }}/gitops-app:${{ needs.build.outputs.image-tag }}|g" base/deployment.yaml
          cat base/deployment.yaml

      - name: Commit and push changes
        run: |
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          git add base/deployment.yaml
          git diff-index --quiet HEAD || git commit -m "Update image to ${{ needs.build.outputs.image-tag }}"
          git push origin main
EOF
```

### Step 27: Add New GitHub Secrets

1. Go to `gitops-nodejs-app` repository → Settings → Secrets
2. Add these new secrets:

   **Secret 3:**
   - Name: `MANIFEST_REPO`
   - Value: `YOUR_USERNAME/gitops-nodejs-manifests`

   **Secret 4:**
   - Name: `GH_PAT` (GitHub Personal Access Token)
   - Value: Create a token:
     1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
     2. Generate new token (classic)
     3. Name: `GitOps Manifest Update`
     4. Select scopes: `repo` (all)
     5. Generate and copy the token

### Step 28: Update Deployment to Use Specific Tags

```bash
cd ~/Documents/gitops-nodejs-manifests

# Update deployment.yaml to include image pull policy
cat > base/deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitops-app
  namespace: gitops-app
  labels:
    app: gitops-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gitops-app
  template:
    metadata:
      labels:
        app: gitops-app
    spec:
      containers:
        - name: gitops-app
          image: YOUR_DOCKERHUB_USERNAME/gitops-app:latest
          imagePullPolicy: Always
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
EOF

git add base/deployment.yaml
git commit -m "Add imagePullPolicy for automated updates"
git push origin main
```

### Step 29: Test Full Automation

```bash
cd ~/Documents/gitops-nodejs-app

# Make a change
cat > src/app.js << 'EOF'
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('🎉 FULLY AUTOMATED GitOps Pipeline! 🎉 Version: 3.0');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', version: '3.0', automated: true });
});

app.listen(3000, () => {
  console.log('Server running - FULL AUTOMATION ENABLED!');
});
EOF

# Push and watch the magic!
git add src/app.js
git commit -m "Test full GitOps automation - v3.0"
git push origin main
```

**Now watch:**
1. GitHub Actions builds and pushes image
2. GitHub Actions updates manifest repo with new image tag
3. ArgoCD detects change in manifest repo
4. ArgoCD syncs to cluster
5. Application automatically updates! 🎉

---

## 📊 Phase 7: Monitoring and Observability

### Step 30: View Logs and Metrics

```bash
# View application logs
kubectl logs -n gitops-app -l app=gitops-app -f

# View ArgoCD application status
argocd app get gitops-nodejs-app

# View sync history
argocd app history gitops-nodejs-app

# View application details in ArgoCD UI
# The UI shows a beautiful graph of all resources!
```

---

## 🎓 What You've Built

✅ **Two-repository GitOps architecture**
✅ **Automated CI/CD pipeline with GitHub Actions**
✅ **Containerized application with Docker**
✅ **Kubernetes deployment with proper health checks**
✅ **ArgoCD for GitOps continuous delivery**
✅ **Automatic manifest updates (advanced)**
✅ **Self-healing deployments**
✅ **Production-ready resource management**

---

## 📝 Resume Bullet Points

Copy these to your resume:

```
• Implemented production GitOps CI/CD pipeline using GitHub Actions, Docker, Kubernetes, and ArgoCD
• Designed two-repository architecture separating application code from infrastructure manifests
• Automated Docker image builds and pushes to Docker Hub with SHA-based tagging strategy
• Configured ArgoCD for declarative, self-healing Kubernetes deployments with automatic sync
• Implemented automated manifest updates using GitHub Actions to propagate image changes
• Deployed containerized Node.js microservice with health checks, resource limits, and high availability
• Achieved zero-downtime deployments with rolling update strategy and readiness probes
```

---

## 🚀 Next Steps & Enhancements

### Option 1: Multi-Environment Setup (Dev → Staging → Prod)
- Create separate folders: `dev/`, `staging/`, `prod/`
- Use Kustomize overlays
- Different replica counts and resources per environment

### Option 2: Add Helm Charts
- Convert manifests to Helm templates
- Use values.yaml for configuration
- Deploy using ArgoCD with Helm

### Option 3: Add Monitoring Stack
- Deploy Prometheus + Grafana
- Add application metrics
- Create dashboards for observability

### Option 4: Deploy to Cloud (AWS EKS, GKE, AKS)
- Setup cloud Kubernetes cluster
- Configure external LoadBalancer
- Add Ingress controller with SSL/TLS

### Option 5: Advanced GitOps Features
- Add preview environments for PRs
- Implement blue-green deployments
- Add canary releases with Flagger
- Integrate with Slack notifications

---

## 🐛 Troubleshooting

### ArgoCD Not Syncing
```bash
# Check ArgoCD application status
argocd app get gitops-nodejs-app

# Force sync
argocd app sync gitops-nodejs-app

# Check ArgoCD logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server
```

### Pods Not Starting
```bash
# Check pod status
kubectl get pods -n gitops-app

# Describe pod
kubectl describe pod -n gitops-app -l app=gitops-app

# Check logs
kubectl logs -n gitops-app -l app=gitops-app
```

### Image Pull Errors
```bash
# Check events
kubectl get events -n gitops-app --sort-by='.lastTimestamp'

# Verify image exists on Docker Hub
# Make sure image name matches exactly (case-sensitive!)
```

### GitHub Actions Failing
- Check secrets are set correctly
- Verify Docker Hub credentials
- Check workflow logs in Actions tab
- Ensure GitHub PAT has correct permissions

---

## 🎯 Interview Tips

When discussing this project:

1. **Explain the "Why":**
   - "I used GitOps because it provides declarative infrastructure, version control for all changes, and automatic reconciliation"

2. **Show understanding of concepts:**
   - Difference between CI and CD
   - Pull-based vs push-based deployments
   - Declarative vs imperative configuration

3. **Discuss trade-offs:**
   - "Two-repo model separates concerns but requires coordination"
   - "ArgoCD pull model is more secure but adds latency"

4. **Mention production considerations:**
   - Secret management (sealed secrets, external secrets operator)
   - RBAC and security
   - Disaster recovery
   - Monitoring and alerting

5. **Be ready to extend:**
   - "I could add a staging environment using Kustomize overlays"
   - "For production, I'd add centralized logging with ELK/EFK stack"

---

## 📚 Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitOps Principles](https://opengitops.dev/)

---

**Congratulations! 🎉** You now have a production-ready GitOps pipeline that will impress recruiters and interviewers!
