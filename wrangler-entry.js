import { serveStatic } from '@cloudflare/pages-forms';

export default {
  async fetch(request, env) {
    return serveStatic(request, env);
  }
}
