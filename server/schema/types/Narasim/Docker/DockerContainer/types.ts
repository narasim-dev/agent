import { builder } from 'server/schema/builder'
import {
  ContainerNetwork,
  mapContainerNetworks,
} from '../helpers/mapContainerNetworks'

export const DockerContainerStateEnum = builder.enumType(
  'DockerContainerState',
  {
    values: [
      'created',
      'restarting',
      'running',
      'removing',
      'paused',
      'exited',
      'dead',
    ] as const,
  },
)

export const DockerContainerNetwork = builder.simpleObject(
  'DockerContainerNetwork',
  {
    fields: (t) => ({
      name: t.string({ nullable: false }),
      networkID: t.string({ nullable: false }),
      endpointID: t.string({ nullable: false }),
      gateway: t.string({ nullable: false }),
      ipAddress: t.string({ nullable: false }),
      ipPrefixLen: t.int({ nullable: false }),
      macAddress: t.string({ nullable: false }),
    }),
  },
)

export interface DockerContainerShape {
  id: string
  names: string[]
  image: string
  imageID: string
  command: string[]
  created: Date
  state: string
  status: string
  labels: Record<string, string>
}

export const DockerContainerRef =
  builder.objectRef<DockerContainerShape>('DockerContainer')

export const DockerContainer = DockerContainerRef.implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    names: t.exposeStringList('names'),
    image: t.exposeString('image'),
    imageID: t.exposeString('imageID'),
    command: t.exposeStringList('command'),
    created: t.expose('created', { type: 'DateTime' }),
    state: t.exposeString('state'),
    status: t.exposeString('status'),
    labels: t.expose('labels', { type: 'Json' }),
    networks: t.field({
      type: [DockerContainerNetwork],
      resolve: async (parent, _, ctx): Promise<ContainerNetwork[]> => {
        const { dockerClient } = ctx
        const container = dockerClient.getDockerClient().getContainer(parent.id)
        const info = await container.inspect()
        return mapContainerNetworks(info.NetworkSettings.Networks)
      },
    }),
  }),
})

export type DockerContainer = typeof DockerContainer.$inferType

// interface ContainerInfo {
//     Id: string;
//     Names: string[];
//     Image: string;
//     ImageID: string;
//     Command: string;
//     Created: number;
//     Ports: Port[];
//     Labels: { [label: string]: string };
//     State: string;
//     Status: string;
//     HostConfig: {
//         NetworkMode: string;
//     };
//     NetworkSettings: {
//         Networks: { [networkType: string]: NetworkInfo };
//     };
//     Mounts: Array<{
//         Name?: string | undefined;
//         Type: string;
//         Source: string;
//         Destination: string;
//         Driver?: string | undefined;
//         Mode: string;
//         RW: boolean;
//         Propagation: string;
//     }>;
// }
