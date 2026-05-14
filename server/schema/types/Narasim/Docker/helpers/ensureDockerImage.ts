import Docker from 'dockerode'
import { pullDockerImage } from './pullDockerImage'

export async function ensureDockerImage(
  docker: Docker,
  image: string,
): Promise<void> {
  try {
    const imageInfo = docker.getImage(image)
    await imageInfo.inspect()
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode === 404) {
      await pullDockerImage(docker, image)
    } else {
      throw err
    }
  }
}
