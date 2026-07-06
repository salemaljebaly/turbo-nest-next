import { Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { fromNodeHeaders } from 'better-auth/node';
import type { Server, Socket } from 'socket.io';
import { AUTH_TOKEN, type Auth } from '../auth/auth.js';
import { RealtimeService } from './realtime.service.js';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(AUTH_TOKEN) private readonly auth: Auth,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: Server) {
    this.realtime.bind(server);
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(client.handshake.headers),
    });
    if (!session) {
      client.disconnect(true);
      return;
    }
    await client.join(`user:${session.user.id}`);
    if (session.session.activeOrganizationId) {
      await client.join(`org:${session.session.activeOrganizationId}`);
    }
    this.logger.debug(`Realtime client connected for user ${session.user.id}`);
  }
}
