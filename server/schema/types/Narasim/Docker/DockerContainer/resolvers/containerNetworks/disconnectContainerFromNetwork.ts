import { builder } from 'server/schema/builder'

export const disconnectContainerFromNetworkResolver = builder.mutationField(
  'disconnectContainerFromNetwork',
  (t) =>
    t.field({
      type: 'Boolean',
      args: {
        containerId: t.arg.string({ required: true }),
        network: t.arg.string({
          required: true,
          description: 'Network name or ID',
        }),
        force: t.arg.boolean({
          description: 'Force disconnect even if container is running',
        }),
      },
      async resolve(_, { containerId, network: networkNameOrId, force }, ctx) {
        const { dockerClient } = ctx
        const docker = dockerClient.getDockerClient()

        const network = docker.getNetwork(networkNameOrId)
        await network.disconnect({
          Container: containerId,
          Force: force ?? false,
        })

        return true
      },
    }),
)
