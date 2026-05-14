// var Docker = require('dockerode');

import Docker from 'dockerode'

class DockerClient {
  docker: Docker | undefined

  getDockerClient() {
    if (!this.docker) {
      this.docker = new Docker({ socketPath: '/var/run/docker.sock' })
    }

    return this.docker
  }
}

export const dockerClient = new DockerClient()
