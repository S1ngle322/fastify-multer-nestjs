import { CallHandler, ExecutionContext, Inject, mixin, NestInterceptor, Optional, Type, } from '@nestjs/common'
import multer from 'fastify-multer'
import { MULTER_MODULE_OPTIONS } from '../files.constants'
import { MulterModuleOptions, MulterOptions } from '../interfaces'
import { transformException } from '../multer'

type MulterInstance = ReturnType<typeof multer['default']>;

export function FilesInterceptor(
  fieldName: string,
  maxCount?: number,
  localOptions?: MulterOptions
): Type<NestInterceptor> {
  class MixinInterceptor implements NestInterceptor {
    protected multer: MulterInstance

    constructor(
      @Optional()
      @Inject(MULTER_MODULE_OPTIONS)
      options: MulterModuleOptions = {}
    ) {
      this.multer = multer({
        ...options,
        ...localOptions,
      })
    }

    async intercept(
      context: ExecutionContext,
      next: CallHandler
    ) {
      const ctx = context.switchToHttp()

      await new Promise<void>((resolve, reject) =>
        // @ts-expect-errornot using method as pre-handler, so signature is different
        this.multer.array(fieldName, maxCount)(
          ctx.getRequest(),
          ctx.getResponse(),
          (err: Error) => {
            if (err) {
              const error = transformException(err)
              return reject(error)
            }
            resolve()
          }
        )
      )
      return next.handle()
    }
  }

  return mixin(MixinInterceptor)
}
