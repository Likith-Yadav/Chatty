import { app } from './app';

export default {
  async fetch(request, env, ctx) {
    return app.handle(request).catch(err => {
      console.error('Error:', err);
      return new Response('Internal Server Error', { status: 500 });
    });
  },
  async scheduled(event, env, ctx) {
    // Handle any scheduled events
    console.log('Scheduled event:', event.cron);
  }
};
