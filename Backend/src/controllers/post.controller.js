import { Post } from '../models/post.model.js';
import { fail } from '../middleware/errors.js';
function postFields(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'A JSON object is required');
  const fields = {};
  for (const key of ['title', 'content']) {
    if (partial && body[key] === undefined) continue;
    if (typeof body[key] !== 'string' || !body[key].trim()) fail(400, `${key} must be a non-empty string`);
    fields[key] = body[key].trim();
  }
  if (!Object.keys(fields).length) fail(400, 'Provide title or content');
  return fields;
}
export async function createPost(req, res) {
  const post = await Post.create({ ...postFields(req.body), author: req.userId });
  res.status(201).json({ post });
}
export async function getPosts(req, res) {
  const posts = await Post.find().sort({ createdAt: -1 }).limit(100).populate('author', 'username');
  res.json({ posts });
}
export async function getPost(req, res) {
  const post = await Post.findById(req.params.id).populate('author', 'username');
  if (!post) fail(404, 'Post not found');
  res.json({ post });
}
async function ownedPost(req) {
  const post = await Post.findById(req.params.id);
  if (!post) fail(404, 'Post not found');
  if (String(post.author) !== String(req.userId)) fail(403, 'Only the author can change this post');
  return post;
}
export async function updatePost(req, res) {
  const fields = postFields(req.body, true);
  const post = await ownedPost(req);
  Object.assign(post, fields);
  await post.save();
  res.json({ post });
}
export async function deletePost(req, res) {
  const post = await ownedPost(req);
  await post.deleteOne();
  res.json({ message: 'Post deleted' });
}
