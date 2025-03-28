import { createApiHandler } from '../../lib/api/handlers';

/**
 * Protected endpoint that requires authentication
 */
const handler = async (req, res) => {
  const { id, name, email } = req.user || {};
  
  console.log(`Protected endpoint accessed by user: ${id} (${email})`);
  
  return {
    message: 'This is a protected endpoint',
    user: { id, name, email },
  };
};

// Use the new API handler creator with authentication required
export default createApiHandler({
  methods: ['GET'],
  requireAuth: true,
  handler,
}); 