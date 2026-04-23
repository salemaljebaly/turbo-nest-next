import {
  Module,
  Global,
  Injectable,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createDbConnection,
  type Database,
  type DatabaseConnection,
} from '@repo/db';

export const DATABASE_TOKEN = Symbol('DATABASE');

@Injectable()
class DatabaseProvider implements OnApplicationShutdown {
  private readonly connection: DatabaseConnection;

  readonly db: Database;

  constructor(config: ConfigService) {
    this.connection = createDbConnection(
      config.getOrThrow<string>('DATABASE_URL'),
    );
    this.db = this.connection.db;
  }

  async onApplicationShutdown() {
    await this.connection.close();
  }
}

@Global()
@Module({
  providers: [
    DatabaseProvider,
    {
      provide: DATABASE_TOKEN,
      inject: [DatabaseProvider],
      useFactory: (provider: DatabaseProvider): Database => provider.db,
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
