import { builder } from 'server/schema/builder'
import { DockerContainer } from '../types'

export const stopDockerContainerResolver = builder.mutationField(
  'stopDockerContainer',
  (t) =>
    t.field({
      type: DockerContainer,
      nullable: true,
      args: {
        id: t.arg.string({ required: true }),
        timeout: t.arg.int(),
      },
      async resolve(_, { id, timeout }, ctx) {
        const { dockerClient } = ctx

        const container = dockerClient.getDockerClient().getContainer(id)
        await container.stop({ t: timeout ?? undefined })
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
