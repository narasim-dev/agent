import { builder } from 'server/schema/builder'

export const connectContainerToNetworkResolver = builder.mutationField(
  'connectContainerToNetwork',
  (t) =>
    t.field({
      type: 'Boolean',
      args: {
        containerId: t.arg.string({ required: true }),
        network: t.arg.string({
          required: true,
          description: 'Network name or ID',
        }),
      },
      async resolve(_, { containerId, network: networkNameOrId }, ctx) {
        const { dockerClient } = ctx
        const docker = dockerClient.getDockerClient()

        const network = docker.getNetwork(networkNameOrId)
        await network.connect({ Container: containerId })

        return true
      },
    }),
)
