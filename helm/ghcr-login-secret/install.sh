#!/bin/bash
set -e

echo "Please enter the below credentials to create a Kubernetes Secret for accessing GHCR registry"
read -p "GitHub username: " github_username
read -p "GitHub email: " github_email
read -sp "GitHub personal access token (classs): " github_personal_access_token
kubectl create secret docker-registry ghcr-login-secret \
  --docker-server=https://ghcr.io \
  --docker-username=$github_username \
  --docker-email=$github_email \
  --docker-password=$github_personal_access_token \
  -n applications