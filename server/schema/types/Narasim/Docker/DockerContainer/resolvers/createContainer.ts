import { Container } from 'dockerode'
import { builder } from 'server/schema/builder'
import { ensureDockerImage } from '../../helpers/ensureDockerImage'
import { DockerContainer } from '../types'

export const createDockerContainerResolver = builder.mutationField(
  'createDockerContainer',
  (t) =>
    t.field({
      type: DockerContainer,
      nullable: true,
      args: {
        image: t.arg.string({ required: true }),
        labels: t.arg({ type: 'Json' }),
        cmd: t.arg.stringList(),
      },
      async resolve(_, { image, labels, cmd }, ctx) {
        const { dockerClient } = ctx
        const docker = dockerClient.getDockerClient()

        await ensureDockerImage(docker, image)

        let auxContainer: Container | undefined

        return docker
          .createContainer({
            Image: image,
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Cmd: cmd ?? undefined,
            OpenStdin: false,
            StdinOnce: false,
            Labels:
              typeof labels === 'object'
                ? (labels as Record<string, string>)
                : undefined,
          })
          .then(async function (container) {
            auxContainer = container

            return auxContainer.start()
          })
          .then(function () {
            return auxContainer?.inspect()
          })
          .then(function (containerInfo): DockerContainer | null {
            return containerInfo
              ? {
                  id: containerInfo.Id,
                  names: [containerInfo.Name],
                  command: containerInfo.Config.Cmd,
                  created: new Date(containerInfo.Created),
                  image: containerInfo.Config.Image,
                  imageID: containerInfo.Image,
                  state: containerInfo.State.Status,
                  status: containerInfo.State.Status,
                  labels: containerInfo.Config.Labels,
                }
              : null
          })
      },
    }),
)
