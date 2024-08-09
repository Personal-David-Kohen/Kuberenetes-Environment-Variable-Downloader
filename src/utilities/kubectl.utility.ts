import { Base64 } from "./base64.utility";
import { CommandLine } from "./command.utility";
import { WindowWrapper } from "./window.utility";

export class Kubernetes {
  private static formatRefName(input: string) {
    return input.replace(/["']/g, "");
  }

  public static async isInstalled(): Promise<boolean> {
    const isKubectlInstalled = await CommandLine.checkIfCommandExists(
      "kubectl"
    );

    return isKubectlInstalled;
  }

  public static async isAbleToConnect(): Promise<boolean> {
    return CommandLine.execute("kubectl get namespaces --request-timeout 10s")
      .then(() => true)
      .catch((err) => {
        console.error(err, typeof err);
        if (err.toString().includes("credentials")) {
          WindowWrapper.alert(
            "Invalid credentials, please try running the login command"
          );
          return false;
        }

        WindowWrapper.alert(
          "Unable to connect to cluster. Check your Internet/VPN"
        );
        return false;
      });
  }

  public static async getClusters(): Promise<string[]> {
    const clusters = await CommandLine.execute(
      "kubectl config get-contexts -o name"
    );

    const clusterNames = clusters
      .split("\n")
      .filter((cluster) => cluster.length > 0);

    return clusterNames;
  }

  public static async setCluster(clusterName: string): Promise<void> {
    await CommandLine.execute(`kubectl config use-context ${clusterName}`);
  }

  public static async getNamespaces(): Promise<string[]> {
    const namespaces = await CommandLine.execute("kubectl get namespaces");

    const namespaceNames = namespaces
      .split("\n")
      .filter((namespace) => namespace.length > 0)
      .map((namespace) => namespace.split(" ")[0]);

    return namespaceNames;
  }

  public static async getDeployments(namespace: string): Promise<string[]> {
    const deployments = await CommandLine.execute(
      `kubectl get deployments -n ${namespace}`
    );

    const deploymentNames = deployments
      .split("\n")
      .filter((deployment) => deployment.length > 0)
      .map((deployment) => deployment.split(" ")[0]);

    return deploymentNames;
  }

  public static async getSecretRefsFromDeployment(
    namespace: string,
    deployment: string
  ): Promise<string[]> {
    const secrets = await CommandLine.execute(
      `kubectl get deployment ${deployment} -n ${namespace} -o jsonpath='{.spec.template.spec.containers[*].envFrom[*].secretRef.name}'`
    );

    console.log(secrets);

    const secretNames = secrets
      .split(" ")
      .filter((secret) => secret.length > 0)
      .map((secret) => this.formatRefName(secret));

    return secretNames;
  }

  public static async getSecretData(
    namespace: string,
    secretName: string
  ): Promise<Record<string, string>> {
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
  }

  public static async getConfigMapRefsFromDeployment(
    namespace: string,
    deployment: string
  ): Promise<string[]> {
    const configMaps = await CommandLine.execute(
      `kubectl get deployments ${deployment} -n ${namespace} -o jsonpath='{.spec.template.spec.containers[*].envFrom[*].configMapRef.name}'`
    );

    console.log(configMaps);

    const configMapNames = configMaps
      .split(" ")
      .filter((configMap) => configMap.length > 0)
      .map((configMap) => this.formatRefName(configMap));

    return configMapNames;
  }

  public static async getConfigMapData(
    namespace: string,
    configMapName: string
  ): Promise<Record<string, string>> {
    const configMapData = await CommandLine.execute(
      `kubectl get configmap ${configMapName} -n ${namespace} -o json`
    );

    if (!configMapData) {
      return {};
    }

    const parsed = JSON.parse(configMapData);

    return parsed?.data || {};
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
