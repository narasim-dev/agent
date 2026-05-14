import { builder } from 'server/schema/builder'
import { pullDockerImage } from '../../helpers/pullDockerImage'
import { DockerImage } from '../types'

export const pullDockerImageResolver = builder.mutationField(
  'pullDockerImage',
  (t) =>
    t.field({
      type: DockerImage,
      nullable: true,
      args: {
        image: t.arg.string({ required: true }),
      },
      async resolve(_, { image }, ctx) {
        const { dockerClient } = ctx
        const docker = dockerClient.getDockerClient()

        return pullDockerImage(docker, image)
      },
    }),
)
