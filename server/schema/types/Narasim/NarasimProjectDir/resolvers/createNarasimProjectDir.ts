import { builder } from 'server/schema/builder'
import { PORJECTS_ROOT_DIR } from '../../interfaces'
import { resolve } from 'path'
import { createDirectoriesRecursive } from 'server/helpers/createDirectoriesRecursive'

export const createNarasimProjectDirResolver = builder.mutationField(
  'createNarasimProjectDir',
  (t) =>
    t.field({
      type: 'String',
      args: {
        dirName: t.arg.string({
          required: true,
        }),
      },
      async resolve(_, { dirName }, ctx) {
        // TODO Сейчас я беру текущего пользователя, но надо будет командный доступ проработать,
        // чтобы агент мог вести проекты пользователя
        const { currentUser } = ctx

        if (!currentUser) {
          throw new Error('Not authorized')
        }

        const path = resolve(
          PORJECTS_ROOT_DIR,
          currentUser.id,
          'projects',
          dirName,
        )

        // TODO Сейчас у нас просто создание директории без каких-либо проверок
        await createDirectoriesRecursive(path)

        return ''
      },
    }),
)
