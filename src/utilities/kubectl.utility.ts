import { Base64 } from "./base64.utility";
import { CommandLine } from "./command.utility";
import { WindowWrapper } from "./window.utility";
import { MESSAGES } from "../constants/messages.constant";

export class Kubernetes {
  private static formatRefName(input: string) {
    return input.replace(/["']/g, "");
  }

  private static async handleException(error: unknown) {
    if (String(error).includes("credentials")) {
      WindowWrapper.error(MESSAGES.ERROR.CREDENTIALS);
      return false;
    }

    WindowWrapper.error(MESSAGES.ERROR.CONNECTION);
    return false;
  }

  public static async isInstalled(): Promise<boolean> {
    const isKubectlInstalled = await CommandLine.checkIfCommandExists(
      "kubectl"
    );

    return isKubectlInstalled;
  }

  public static async getClusters(): Promise<string[]> {
    try {
      const clusters = await CommandLine.execute(
        "kubectl config get-contexts -o name"
      );

      const clusterNames = clusters
        .split("\n")
        .filter((cluster) => cluster.length > 0);

      return clusterNames;
    } catch (error) {
      this.handleException(error);
      return [];
    }
  }

  public static async setCluster(clusterName: string): Promise<void> {
    try {
      await CommandLine.execute(`kubectl config use-context ${clusterName}`);
    } catch (error) {
      this.handleException(error);
    }
  }

  public static async getNamespaces(): Promise<string[]> {
    try {
      const namespaces = await CommandLine.execute(
        "kubectl get namespaces -o jsonpath='{.items[*].metadata.name}' --request-timeout 10s"
      );

      const namespaceNames = namespaces
        .split(" ")
        .map((namespace) => this.formatRefName(namespace));

      return namespaceNames;
    } catch (error) {
      this.handleException(error);
      return [];
    }
  }

  public static async getDeployments(namespace: string): Promise<string[]> {
    try {
      const deployments = await CommandLine.execute(
        `kubectl get deployments -n ${namespace} -o jsonpath='{.items[*].metadata.name}'`
      );

      const deploymentNames = deployments
        .split(" ")
        .map((deployment) => this.formatRefName(deployment));

      return deploymentNames;
    } catch (error) {
      this.handleException(error);
      return [];
    }
  }

  public static async getSecretRefsFromDeployment(
    namespace: string,
    deployment: string
  ): Promise<string[]> {
    try {
      const secrets = await CommandLine.execute(
        `kubectl get deployment ${deployment} -n ${namespace} -o jsonpath='{.spec.template.spec.containers[*].envFrom[*].secretRef.name}'`
      );

      const secretNames = secrets
        .split(" ")
        .filter((secret) => secret.length > 0)
        .map((secret) => this.formatRefName(secret));

      return secretNames;
    } catch (error) {
      this.handleException(error);
      return [];
    }
  }

  public static async getSecretData(
    namespace: string,
    secretName: string
  ): Promise<Record<string, string>> {
    try {
      const secretData = await CommandLine.execute(
        `kubectl get secret ${secretName} -n ${namespace} -o json`
      );

      if (!secretData) {
        return {};
      }

      const parsed = JSON.parse(secretData);
      const encoded = parsed.data;

      const decoded: Record<string, string> = {};

      Object.keys(encoded).forEach((key) => {
        decoded[key] = Base64.decode(encoded[key]);
      });

      return decoded;
    } catch (error) {
      this.handleException(error);
      return {};
    }
  }

  public static async getConfigMapRefsFromDeployment(
    namespace: string,
    deployment: string
  ): Promise<string[]> {
    try {
      const configMaps = await CommandLine.execute(
        `kubectl get deployments ${deployment} -n ${namespace} -o jsonpath='{.spec.template.spec.containers[*].envFrom[*].configMapRef.name}'`
      );

      const configMapNames = configMaps
        .split(" ")
        .filter((configMap) => configMap.length > 0)
        .map((configMap) => this.formatRefName(configMap));

      return configMapNames;
    } catch (error) {
      this.handleException(error);
      return [];
    }
  }

  public static async getConfigMapData(
    namespace: string,
    configMapName: string
  ): Promise<Record<string, string>> {
    try {
      const configMapData = await CommandLine.execute(
        `kubectl get configmap ${configMapName} -n ${namespace} -o json`
      );

      if (!configMapData) {
        return {};
      }

      const parsed = JSON.parse(configMapData);

      return parsed?.data || {};
    } catch (error) {
      this.handleException(error);
      return {};
    }
  }

  public static async getAllEnvironmentVariablesFromDeployment(
    namespace: string,
    deployment: string
  ): Promise<{ [key: string]: string }> {
    const secretRefs = await this.getSecretRefsFromDeployment(
      namespace,
      deployment
    );

    const configMapRefs = await this.getConfigMapRefsFromDeployment(
      namespace,
      deployment
    );

    const secretData = await Promise.all(
      secretRefs.map((secret) => this.getSecretData(namespace, secret))
    );

    const configMapData = await Promise.all(
      configMapRefs.map((configMap) =>
        this.getConfigMapData(namespace, configMap)
      )
    );

    const environmentVariables: { [key: string]: string } = {};

    secretData.forEach((secret) => {
      Object.keys(secret).forEach((key) => {
        environmentVariables[key] = secret[key];
      });
    });

    configMapData.forEach((configMap) => {
      Object.keys(configMap).forEach((key) => {
        environmentVariables[key] = configMap[key];
      });
    });

    return environmentVariables;
  }
}
