import { builder } from 'server/schema/builder'

import './resolvers/createNarasimProjectDir'
import './resolvers/buildAndRunProject'

export const NarasimProjectDir = builder.simpleObject('NarasimProjectDir', {
  fields: (t) => ({
    path: t.string({
      nullable: false,
    }),
  }),
})
