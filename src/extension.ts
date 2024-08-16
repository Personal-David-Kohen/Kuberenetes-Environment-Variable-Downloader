import * as vscode from "vscode";
import { DotEnv } from "./utilities/dotenv.utility";
import { ACTIONS } from "./constants/actions.constant";
import { MESSAGES } from "./constants/messages.constant";
import { Kubernetes } from "./utilities/kubectl.utility";
import { WindowWrapper } from "./utilities/window.utility";

export const activate = (context: vscode.ExtensionContext) => {
  const disposable = vscode.commands.registerCommand(
    ACTIONS.DOWNLOAD_REMOTE,
    async () => {
      const isKubectlInstalled = await Kubernetes.isInstalled();

      if (!isKubectlInstalled) {
        WindowWrapper.error(MESSAGES.ERROR.KUBECTL_NOT_INSTALLED);
        return;
      }

      const clusterNames = Kubernetes.getClusters();

      const selectedCluster = await WindowWrapper.dropdownAsync(clusterNames, {
        title: MESSAGES.SELECT.CLUSTER,
        loadingMessage: MESSAGES.LOADING.CLUSTERS,
      });

      await Kubernetes.setCluster(selectedCluster);

      const namespaces = Kubernetes.getNamespaces();

      const selectedNamespace = await WindowWrapper.dropdownAsync(namespaces, {
        title: MESSAGES.SELECT.NAMESPACE,
        loadingMessage: MESSAGES.LOADING.NAMESPACES,
      });

      const deployments = Kubernetes.getDeployments(selectedNamespace);

      const selectedDeployment = await WindowWrapper.dropdownAsync(
        deployments,
        {
          title: MESSAGES.SELECT.DEPLOYMENT,
          loadingMessage: MESSAGES.LOADING.DEPLOYMENTS,
        }
      );

      const environmentVariables =
        await Kubernetes.getAllEnvironmentVariablesFromDeployment(
          selectedNamespace,
          selectedDeployment
        );

      const success = await DotEnv.upsertDotEnvFile(environmentVariables);

      if (success) {
        WindowWrapper.success(MESSAGES.SUCCESS.ENVIRONMENT_VARIABLES);
      }
    }
  );

  context.subscriptions.push(disposable);
};

export const deactivate = () => {};
