import { NetworkInfo } from 'dockerode'

export interface ContainerNetwork {
  name: string
  networkID: string
  endpointID: string
  gateway: string
  ipAddress: string
  ipPrefixLen: number
  macAddress: string
}

export function mapContainerNetworks(
  networks: { [networkType: string]: NetworkInfo } | undefined,
): ContainerNetwork[] {
  return Object.entries(networks || {}).map(([name, net]) => ({
    name,
    networkID: net.NetworkID || '',
    endpointID: net.EndpointID || '',
    gateway: net.Gateway || '',
    ipAddress: net.IPAddress || '',
    ipPrefixLen: net.IPPrefixLen || 0,
    macAddress: net.MacAddress || '',
  }))
}
