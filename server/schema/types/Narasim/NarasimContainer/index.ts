import { builder } from 'server/schema/builder'

export const NarasimContainer = builder.simpleObject('NarasimContainer', {
  fields: (t) => ({
    id: t.string({ nullable: false }),
  }),
})
