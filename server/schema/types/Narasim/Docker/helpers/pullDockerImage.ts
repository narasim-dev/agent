import Docker from 'dockerode'
import { DockerImage } from '../DockerImage/types'

export async function pullDockerImage(
  docker: Docker,
  image: string,
): Promise<DockerImage> {
  return new Promise((resolve, reject) => {
    docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
      if (err) {
        reject(err)
        return
      }

      docker.modem.followProgress(
        stream,
        async (err: Error | null) => {
          if (err) {
            reject(err)
            return
          }

          try {
            const imageInfo = docker.getImage(image)
            const inspectData = await imageInfo.inspect()

            resolve({
              id: inspectData.Id,
              repoTags: inspectData.RepoTags,
              repoDigests: inspectData.RepoDigests,
              created: new Date(inspectData.Created),
              size: inspectData.Size,
              virtualSize: inspectData.VirtualSize,
              labels: inspectData.Config?.Labels ?? null,
            })
          } catch (inspectErr) {
            reject(inspectErr)
          }
        },
        (event: { status: string }) => {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('pullDockerImage progress:', event.status)
          }
        },
      )
    })
  })
}
