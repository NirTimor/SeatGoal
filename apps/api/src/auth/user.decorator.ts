import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If data is 'userId', return the userId, otherwise return the requested field or entire user
    if (data === 'userId' && user?.userId) {
      return user.userId;
    }

    return data ? user?.[data] : user;
  },
);
