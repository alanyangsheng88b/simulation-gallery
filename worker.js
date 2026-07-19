export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      // Serve static assets from the deployed bundle
      return await env.ASSETS.fetch(request);
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  }
}
