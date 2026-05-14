import { builder } from 'server/schema/builder'

export const removeDockerContainerResolver = builder.mutationField(
  'removeDockerContainer',
  (t) =>
    t.boolean({
      args: {
        id: t.arg.string({ required: true }),
        force: t.arg.boolean(),
        removeVolumes: t.arg.boolean(),
      },
      async resolve(_, { id, force, removeVolumes }, ctx) {
        const { dockerClient } = ctx

        await dockerClient
          .getDockerClient()
          .getContainer(id)
          .remove({
            force: force ?? undefined,
            v: removeVolumes ?? undefined,
          })

        return true
      },
    }),
)
