import { builder } from 'server/schema/builder'
import { PORJECTS_ROOT_DIR } from '../../interfaces'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { DockerContainer } from '../../Docker/DockerContainer/types'

export const buildAndRunProjectResolver = builder.mutationField(
  'buildAndRunProject',
  (t) =>
    t.field({
      type: DockerContainer,
      nullable: true,
      args: {
        projectName: t.arg.string({
          required: true,
          description: 'Name of the project directory',
        }),
        imageName: t.arg.string({
          description: 'Custom image name (default: project name)',
        }),
      },
      async resolve(_, { projectName, imageName }, ctx) {
        const { currentUser, dockerClient } = ctx

        if (!currentUser) {
          throw new Error('Not authorized')
        }

        const projectPath = resolve(
          PORJECTS_ROOT_DIR,
          currentUser.id,
          'projects',
          projectName,
        )

        const dockerfilePath = resolve(projectPath, 'Dockerfile')

        if (!existsSync(dockerfilePath)) {
          throw new Error(`Dockerfile not found in project: ${projectName}`)
        }

        const docker = dockerClient.getDockerClient()
        const finalImageName = imageName ?? `narasim-project-${projectName}`

        const buildStream = await docker.buildImage(
          {
            context: projectPath,
            src: ['.'],
          },
          {
            t: finalImageName,
          },
        )

        await new Promise<void>((resolve, reject) => {
          docker.modem.followProgress(
            buildStream,
            (err: Error | null) => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            },
            (event: { stream?: string }) => {
              if (event.stream) {
                process.stdout.write(event.stream)
              }
            },
          )
        })

        const container = await docker.createContainer({
          Image: finalImageName,
          AttachStdin: false,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true,
          OpenStdin: false,
          StdinOnce: false,
          HostConfig: {
            Privileged: true,
          },
          Labels: {
            'narasim.project': projectName,
            'narasim.user': currentUser.id,
          },
        })

        await container.start()
        const containerInfo = await container.inspect()

        return {
          id: containerInfo.Id,
          names: [containerInfo.Name],
          command: containerInfo.Config.Cmd ?? [],
          created: new Date(containerInfo.Created),
          image: containerInfo.Config.Image,
          imageID: containerInfo.Image,
          state: containerInfo.State.Status,
          status: containerInfo.State.Status,
          labels: containerInfo.Config.Labels,
        }
      },
    }),
)
