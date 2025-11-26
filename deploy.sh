#!/bin/bash
set -e

echo "🚀 Deploying CMS Admin Dashboard to Kubernetes..."
echo "================================================="
echo ""

PROJECT_ID="wowstore-ai-media-agent"
IMAGE_NAME="cms-admin-dashboard"
IMAGE_TAG="v$(date +%Y%m%d-%H%M%S)"

echo "📦 Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG .
docker tag gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG gcr.io/$PROJECT_ID/$IMAGE_NAME:latest

echo ""
echo "⬆️  Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$IMAGE_TAG
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:latest

echo ""
echo "☸️  Deploying to Kubernetes..."
kubectl apply -f k8s-deployment.yaml

echo ""
echo "⏳ Waiting for deployment..."
kubectl rollout status deployment/cms-admin-dashboard -n production --timeout=300s

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
kubectl get pods -n production -l app=cms-admin-dashboard
echo ""
kubectl get ingress -n production cms-admin-dashboard
echo ""
echo "🌐 Your CMS Admin will be available at: https://cms.wowstore.live"
echo "📝 Note: Update DNS to point cms.wowstore.live to the ingress IP above"
