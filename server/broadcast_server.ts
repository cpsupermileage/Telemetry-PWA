import { DurableObject } from 'cloudflare:workers';

// Durable Object
export class WebSocketBroadcastServer extends DurableObject {
	// eslint-disable-next-line @typescript-eslint/require-await
	async fetch(): Promise<Response> {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		this.ctx.acceptWebSocket(server);

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	public broadcastMessage(message: object[]) {
		const messageStr = JSON.stringify(message);
		this.ctx.getWebSockets().forEach((ws) => ws.send(messageStr));
	}

	webSocketClose(ws: WebSocket, code: number, reason: string) {
		ws.close(code, reason);
	}
}
