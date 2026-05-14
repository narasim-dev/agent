import { builder } from 'server/schema/builder'

export const DockerImage = builder.simpleObject('DockerImage', {
  fields: (t) => ({
    id: t.string({
      nullable: false,
    }),
    repoTags: t.stringList({
      nullable: true,
    }),
    repoDigests: t.stringList({
      nullable: true,
    }),
    created: t.field({ type: 'DateTime', nullable: false }),
    size: t.float({ nullable: false }),
    virtualSize: t.float({ nullable: true }),
    labels: t.field({
      type: 'Json',
      nullable: true,
    }),
  }),
})

export type DockerImage = typeof DockerImage.$inferType
