import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    // OptionalAuthGuard 클래스는 부모 클래스인 AuthGuard 클래스를 확장
    // handleRequest 메서드를 오버라이드하여 로그인하지 않은 사용자도 허용
    return user;
  }
}
