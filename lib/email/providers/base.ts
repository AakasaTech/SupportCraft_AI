import type { OutboundEmailMessage, SendResult, ProviderConfig } from "../types";

export interface EmailProvider {
  name: string;
  send(message: OutboundEmailMessage): Promise<SendResult>;
  verifyConnection?(): Promise<boolean>;
}

export abstract class BaseEmailProvider implements EmailProvider {
  abstract name: string;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract send(message: OutboundEmailMessage): Promise<SendResult>;

  protected formatAddress(addr: { address: string; name?: string }): string {
    return addr.name ? `${addr.name} <${addr.address}>` : addr.address;
  }

  protected formatAddresses(addrs: { address: string; name?: string }[]): string {
    return addrs.map(a => this.formatAddress(a)).join(", ");
  }

  async verifyConnection(): Promise<boolean> {
    return true;
  }
}
