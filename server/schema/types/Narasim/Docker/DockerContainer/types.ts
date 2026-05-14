import { builder } from 'server/schema/builder'

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

export const DockerContainer = builder.simpleObject('DockerContainer', {
  fields: (t) => ({
    id: t.string({
      nullable: false,
    }),
    names: t.stringList({
      nullable: false,
    }),
    image: t.string({ nullable: false }),
    imageID: t.string({ nullable: false }),
    command: t.stringList({ nullable: false }),
    created: t.field({ type: 'DateTime', nullable: false }),
    state: t.string({ nullable: false }),
    status: t.string({ nullable: false }),
    labels: t.field({
      type: 'Json',
      nullable: false,
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
