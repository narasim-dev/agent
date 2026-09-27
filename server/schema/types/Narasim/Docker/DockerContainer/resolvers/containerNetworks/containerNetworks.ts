import { builder } from 'server/schema/builder'
import { mapContainerNetworks } from '../../../helpers/mapContainerNetworks'
import { DockerContainerNetwork } from '../../types'

export const containerNetworksResolver = builder.queryField(
  'containerNetworks',
  (t) =>
    t.field({
      type: [DockerContainerNetwork],
      args: {
        containerId: t.arg.string({ required: true }),
      },
      async resolve(_, { containerId }, ctx) {
        const { dockerClient } = ctx
        const docker = dockerClient.getDockerClient()

        const container = docker.getContainer(containerId)
        const info = await container.inspect()

        return mapContainerNetworks(info.NetworkSettings.Networks)
      },
    }),
)
