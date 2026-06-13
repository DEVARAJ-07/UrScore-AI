# GitHub Webhook Integration Guide

UrScore AI supports automated profile re-scoring when developers push code updates to their repositories. This document details how to configure GitHub Webhooks to integrate with the backend server.

---

## 1. Webhook Architecture Overview

When a push event occurs in a candidate's GitHub repository, GitHub sends a POST payload containing details of the commit, repository, and author to the registered webhook endpoint.

```
┌────────────────┐      git push       ┌─────────────────┐
│ Developer Page │  ────────────────>  │ GitHub Server   │
└────────────────┘                     └────────┬────────┘
                                                │
                                                │ POST Webhook Request
                                                ▼
┌────────────────┐                     ┌─────────────────┐
│ Competency     │  <────────────────  │ UrScore Express │
│ Scoring Worker │    Trigger Rescore  │ Backend Gateway │
└────────────────┘                     └─────────────────┘
```

---

## 2. Webhook Setup Instructions

To configure a GitHub repository to notify the UrScore AI gateway:

1. **Navigate to Repository Settings**:
   Go to your repository page on GitHub -> Click on the **Settings** tab -> select **Webhooks** from the left-hand menu.

2. **Add a New Webhook**:
   Click the **Add webhook** button on the top right.

3. **Configure the Parameters**:
   - **Payload URL**: Enter the address of your deployed UrScore AI gateway:
     `http://<your-server-domain>/api/webhooks/github`
     *(For local testing, you can use a tunneling service like `ngrok` or `localtunnel` to create a public URL: e.g., `http://xxxx.ngrok-free.app/api/webhooks/github`)*
   - **Content type**: Choose `application/json`.
   - **Secret**: *(Optional)* Enter a security secret string to verify the payload signature.
   - **SSL verification**: Leave enabled if using a production HTTPS address.

4. **Select Webhook Events**:
   - Select **Just the push event**.

5. **Register Webhook**:
   - Click the green **Add webhook** button. GitHub will send a test ping request to verify.

---

## 3. Webhook Route Details

The API Gateway listens at:
`POST /api/webhooks/github`

### Sample Push Payload (JSON)
The handler expects standard GitHub JSON webhook headers and a payload containing the repository details and owner login:

```json
{
  "ref": "refs/heads/main",
  "repository": {
    "name": "competency-scanner-demo",
    "full_name": "octocat/competency-scanner-demo",
    "owner": {
      "login": "octocat",
      "name": "octocat"
    },
    "html_url": "https://github.com/octocat/competency-scanner-demo"
  },
  "pusher": {
    "name": "octocat",
    "email": "octocat@github.com"
  }
}
```

### Response Codes
- **`202 Accepted`**: Re-scoring job triggered successfully. Returns:
  ```json
  {
    "message": "Automatic re-score triggered successfully via Webhook",
    "scanId": "generated-uuid",
    "github_username": "octocat",
    "triggered_by_repo": "competency-scanner-demo"
  }
  ```
- **`400 Bad Request`**: Webhook payload is missing repository owner login parameters.
- **`404 Not Found`**: Received push event, but no matching historical scan record exists for this developer username. Webhook bypassed to prevent spam.
- **`500 Internal Error`**: Backend server error during processing.
