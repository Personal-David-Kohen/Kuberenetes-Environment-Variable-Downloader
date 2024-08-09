export class Base64 {
  public static decode(encodedString: string): string {
    return Buffer.from(encodedString, "base64").toString("utf-8");
  }

  public static encode(string: string): string {
    return Buffer.from(string).toString("base64");
  }
}
