import * as vscode from "vscode";
import { Kubernetes } from "./utilities/kubectl.utility";
import { WindowWrapper } from "./utilities/window.utility";

export const activate = (context: vscode.ExtensionContext) => {
  console.log('Loaded extension "kubernetes-environment-variable-downloader"');

  const disposable = vscode.commands.registerCommand(
    "kubernetes-environment-variable-downloader.downloadRemote",
    async () => {
      const isKubectlInstalled = await Kubernetes.isInstalled();

      if (!isKubectlInstalled) {
        WindowWrapper.alert(
          "kubectl is not installed. Please install kubectl and try again."
        );
        return;
      }

      const clusterNames = await Kubernetes.getClusters();

      const selectedCluster = await WindowWrapper.dropdown(clusterNames);

      await Kubernetes.setCluster(selectedCluster);

      const isAbleToConnect = await Kubernetes.isAbleToConnect();

      if (!isAbleToConnect) {
        return;
      }

      const namespaces = await Kubernetes.getNamespaces();

      const selectedNamespace = await WindowWrapper.dropdown(namespaces);

      const deployments = await Kubernetes.getDeployments(selectedNamespace);

      const selectedDeployment = await WindowWrapper.dropdown(deployments);

      const environmentVariables =
        await Kubernetes.getAllEnvironmentVariablesFromDeployment(
          selectedNamespace,
          selectedDeployment
        );

      const fileContent = Object.entries(environmentVariables)
        .map(([key, value]) => {
          return `${key}="${value}"`;
        })
        .join("\n");

      WindowWrapper.createFileInProjectDirectory(".env", fileContent);
    }
  );

  context.subscriptions.push(disposable);
};

export const deactivate = () => {};
