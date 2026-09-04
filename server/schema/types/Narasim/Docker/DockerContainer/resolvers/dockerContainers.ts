/* eslint-disable no-console */
// import { execAsync } from 'server/helpers/execAsync'
import { builder } from 'server/schema/builder'
import { DockerContainer, DockerContainerStateEnum } from '../types'

// export const dockerContainersResolver = builder.queryField(
//   'dockerContainers',
//   (t) =>
//     t.field({
//       type: 'Json',
//       async resolve() {
//         // await execAsync(`docker inspect ${containerName}`)

//         const response = await execAsync(`docker ps`)

//         console.log('response', response)

//         return { response }
//       },
//     }),
// )

export const dockerContainersResolver = builder.queryField(
  'dockerContainers',
  (t) =>
    t.field({
      type: [DockerContainer],
      args: {
        name: t.arg.string({
          description: 'Filter by container name (partial match supported)',
        }),
        labels: t.arg({
          type: 'Json',
          description:
            'Filter by labels in object format { key: value }. Returns containers where all specified labels match',
        }),
        state: t.arg({
          type: DockerContainerStateEnum,
        }),
        image: t.arg.string({
          description: 'Filter by image name (ancestor)',
        }),
        limit: t.arg.int({
          description:
            'Maximum number of containers to return (last created, including stopped)',
        }),
        size: t.arg.boolean({
          description:
            'Return container size in SizeRw and SizeRootFs fields. Default false',
        }),
        all: t.arg.boolean({
          description: 'Return all containers. Default false — only running',
        }),
      },
      async resolve(_, { name, labels, state, image, limit, size, all }, ctx) {
        const { dockerClient } = ctx

        const filters: { [key: string]: string[] } = {}

        if (name) {
          filters['name'] = [name]
        }
        if (state) {
          filters['status'] = [state]
        }
        if (image) {
          filters['ancestor'] = [image]
        }
        if (labels && typeof labels === 'object') {
          for (const [key, value] of Object.entries(labels)) {
            if (value) {
              filters['label'] = filters['label'] || []
              filters['label'].push(`${key}=${value}`)
            }
          }
        }

        const containers = await dockerClient.getDockerClient().listContainers({
          filters,
          limit: limit ?? undefined,
          size: size ?? undefined,
          all: all ?? undefined,
        })

        console.log('Список контейнеров:')
        const result: DockerContainer[] = containers.map((container) => {
          console.log(`ID: ${container.Id}`)
          console.log(`Название: ${container.Names[0]}`)
          console.log(`Статус: ${container.State}`)
          console.log(`Образ: ${container.Image}`)
          console.log(`Команды: ${container.Command}`)
          console.log(`Время запуска: ${container.Created}`)
          console.log(`container.Labels`, container.Labels)
          console.log(`---`)

          return {
            id: container.Id,
            names: container.Names,
            command: [container.Command],
            created: new Date(container.Created * 1000),
            image: container.Image,
            imageID: container.ImageID,
            state: container.State,
            status: container.Status,
            labels: container.Labels,
          }
        })

        return result
      },
    }),
)
