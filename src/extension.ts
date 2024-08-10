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
      const loader = WindowWrapper.showLoader(MESSAGES.LOADING.GENERAL);
      const isKubectlInstalled = await Kubernetes.isInstalled();

      if (!isKubectlInstalled) {
        WindowWrapper.error(MESSAGES.ERROR.KUBECTL_NOT_INSTALLED);
        return;
      }

      const clusterNames = await Kubernetes.getClusters();
      loader.hide();

      const selectedCluster = await WindowWrapper.dropdown(
        clusterNames,
        MESSAGES.SELECT.CLUSTER
      );

      loader.text = MESSAGES.LOADING.NAMESPACES;
      loader.show();

      await Kubernetes.setCluster(selectedCluster);

      const isAbleToConnect = await Kubernetes.isAbleToConnect();

      if (!isAbleToConnect) {
        return;
      }

      const namespaces = await Kubernetes.getNamespaces();
      loader.hide();

      const selectedNamespace = await WindowWrapper.dropdown(
        namespaces,
        MESSAGES.SELECT.NAMESPACE
      );

      loader.text = MESSAGES.LOADING.DEPLOYMENTS;
      loader.show();

      const deployments = await Kubernetes.getDeployments(selectedNamespace);

      loader.hide();
      const selectedDeployment = await WindowWrapper.dropdown(
        deployments,
        MESSAGES.SELECT.DEPLOYMENT
      );

      loader.text = MESSAGES.LOADING.ENVIRONMENT_VARIABLES;
      loader.show();

      const environmentVariables =
        await Kubernetes.getAllEnvironmentVariablesFromDeployment(
          selectedNamespace,
          selectedDeployment
        );

      loader.hide();

      const success = await DotEnv.upsertDotEnvFile(environmentVariables);

      if (success) {
        WindowWrapper.success(MESSAGES.SUCCESS.ENVIRONMENT_VARIABLES);
      }
    }
  );

  context.subscriptions.push(disposable);
};

export const deactivate = () => {};
