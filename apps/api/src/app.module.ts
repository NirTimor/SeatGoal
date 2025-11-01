import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { SeatsModule } from './seats/seats.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { UserProfileModule } from './user-profile/user-profile.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { TransfersModule } from './transfers/transfers.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    EventsModule,
    SeatsModule,
    CartModule,
    CheckoutModule,
    WebhooksModule,
    UserProfileModule,
    SubscriptionsModule,
    LoyaltyModule,
    TransfersModule,
    PaymentMethodsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
