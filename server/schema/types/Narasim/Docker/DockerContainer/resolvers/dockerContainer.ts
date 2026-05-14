import { builder } from 'server/schema/builder'
import { DockerContainer } from '../types'

export const dockerContainerResolver = builder.queryField(
  'dockerContainer',
  (t) =>
    t.field({
      type: DockerContainer,
      nullable: true,
      args: {
        id: t.arg.string({ required: true }),
      },
      async resolve(_, { id }, ctx) {
        const { dockerClient } = ctx

        const container = dockerClient.getDockerClient().getContainer(id)
        const info = await container.inspect()

        return {
          id: info.Id,
          names: [info.Name],
          command: info.Config.Cmd,
          created: new Date(info.Created),
          image: info.Config.Image,
          imageID: info.Image,
          state: info.State.Status,
          status: info.State.Status,
          labels: info.Config.Labels,
        }
      },
    }),
)
