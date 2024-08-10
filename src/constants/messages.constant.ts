import { USER_CHOICE } from "../utilities/window.utility";

export const MESSAGES = {
  LOADING: {
    GENERAL: "Setting up...",
    CLUSTERS: "Fetching clusters...",
    NAMESPACES: "Fetching namespaces...",
    DEPLOYMENTS: "Fetching deployments...",
    ENVIRONMENT_VARIABLES: "Fetching environment variables...",
  },
  SELECT: {
    CLUSTER: "Please select a cluster",
    NAMESPACE: "Please select a namespace",
    DEPLOYMENT: "Please select a deployment",
  },
  SUCCESS: {
    ENVIRONMENT_VARIABLES:
      "Environment variables have been successfully downloaded",
  },
  ERROR: {
    CREDENTIALS: "Invalid credentials, please try running the login command",
    CONNECTION: "Unable to connect to cluster. Check your Internet/VPN",
    KUBECTL_NOT_INSTALLED:
      "kubectl is not installed. Please install kubectl and try again.",
  },
};
