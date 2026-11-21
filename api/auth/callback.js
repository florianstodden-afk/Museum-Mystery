import { handle } from '../_runtime.js';
export default { fetch: request => handle(request, '/auth/callback') };
