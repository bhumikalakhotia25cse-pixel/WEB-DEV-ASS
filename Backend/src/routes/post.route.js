import { Router } from 'express';
import { getPosts, getPost, createPost, updatePost, deletePost } from '../controllers/post.controller.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get(['/getPosts', '/'], getPosts);
router.post(['/create', '/'], requireAuth, createPost);
router.param('id', (req, res, next, id) => {
  if (!/^[a-f\d]{24}$/i.test(id)) return res.status(400).json({ message: 'Invalid post ID' });
  next();
});
router.get('/:id', getPost);
router.patch(['/update/:id', '/:id'], requireAuth, updatePost);
router.delete(['/delete/:id', '/:id'], requireAuth, deletePost);
export default router;
