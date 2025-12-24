import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Filter,
  ChevronLeft,
  ChevronRight,
  Tag,
  Folder,
  MessageCircle,
  Calendar,
  Clock,
  Heart,
  RefreshCw,
  X,
  Save,
  Image,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const STATUS_STYLES = {
  published: 'bg-green-500/10 text-green-400 border-green-500/30',
  draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  archived: 'bg-gray-500/10 text-gray-400 border-gray-500/30'
};

const BlogManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    loadData();
  }, [activeTab, currentPage, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'posts') {
        const params = { page: currentPage, per_page: 10, admin: true };
        if (statusFilter) params.status = statusFilter;
        if (searchTerm) params.search = searchTerm;

        const response = await api.get('/api/blog/admin/posts', { params });
        setPosts(response.data.posts || []);
        setPagination(response.data.pagination || {});
      } else if (activeTab === 'categories') {
        const response = await api.get('/api/blog/categories');
        setCategories(response.data.categories || []);
      } else if (activeTab === 'tags') {
        const response = await api.get('/api/blog/tags');
        setTags(response.data.tags || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/api/blog/admin/posts/${postId}`);
      toast.success('Post deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleToggleFeatured = async (post) => {
    try {
      await api.put(`/api/blog/admin/posts/${post.id}`, {
        is_featured: !post.is_featured
      });
      toast.success(post.is_featured ? 'Removed from featured' : 'Added to featured');
      loadData();
    } catch (error) {
      toast.error('Failed to update post');
    }
  };

  const handleToggleStatus = async (post, newStatus) => {
    try {
      await api.put(`/api/blog/admin/posts/${post.id}`, {
        status: newStatus
      });
      toast.success(`Post ${newStatus}`);
      loadData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="h-7 w-7 text-indigo-400" />
            Blog Management
          </h1>
          <p className="text-gray-400 mt-1">Manage blog posts, categories, and tags</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'posts') {
              setEditingPost(null);
              setShowPostModal(true);
            } else if (activeTab === 'categories') {
              setEditingCategory(null);
              setShowCategoryModal(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium"
        >
          <Plus className="h-5 w-5" />
          Add {activeTab === 'posts' ? 'Post' : activeTab === 'categories' ? 'Category' : 'Tag'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg mb-6 w-fit">
        {[
          { key: 'posts', label: 'Posts', icon: FileText },
          { key: 'categories', label: 'Categories', icon: Folder },
          { key: 'tags', label: 'Tags', icon: Tag }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              </div>
            </form>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Posts Table */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posts found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50 border-b border-gray-700">
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Post</th>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Status</th>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Stats</th>
                    <th className="text-left px-6 py-3 text-gray-400 font-medium">Date</th>
                    <th className="text-right px-6 py-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {post.featured_image ? (
                            <img
                              src={post.featured_image}
                              alt=""
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Image className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-white font-medium line-clamp-1">{post.title}</h3>
                            <p className="text-gray-500 text-sm line-clamp-1">{post.slug}</p>
                          </div>
                          {post.is_featured && (
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_STYLES[post.status] || STATUS_STYLES.draft}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-gray-400 text-sm">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {post.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.comment_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-400 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(post.published_at || post.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleFeatured(post)}
                            className={`p-2 rounded-lg ${
                              post.is_featured
                                ? 'bg-yellow-500/10 text-yellow-400'
                                : 'bg-gray-700 text-gray-400 hover:text-yellow-400'
                            }`}
                            title={post.is_featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <Star className={`h-4 w-4 ${post.is_featured ? 'fill-current' : ''}`} />
                          </button>
                          {post.status === 'draft' ? (
                            <button
                              onClick={() => handleToggleStatus(post, 'published')}
                              className="p-2 bg-gray-700 rounded-lg text-gray-400 hover:text-green-400"
                              title="Publish"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          ) : post.status === 'published' && (
                            <button
                              onClick={() => handleToggleStatus(post, 'draft')}
                              className="p-2 bg-gray-700 rounded-lg text-gray-400 hover:text-yellow-400"
                              title="Unpublish"
                            >
                              <EyeOff className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingPost(post);
                              setShowPostModal(true);
                            }}
                            className="p-2 bg-gray-700 rounded-lg text-gray-400 hover:text-indigo-400"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 bg-gray-700 rounded-lg text-gray-400 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-gray-400 text-sm">
                Page {currentPage} of {pagination.pages} ({pagination.total} posts)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchParams({ page: currentPage - 1 })}
                  disabled={!pagination.has_prev}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded-lg text-gray-300 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={() => setSearchParams({ page: currentPage + 1 })}
                  disabled={!pagination.has_next}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded-lg text-gray-300 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No categories found</p>
            </div>
          ) : (
            categories.map(category => (
              <div
                key={category.id}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-medium">{category.name}</h3>
                    <p className="text-gray-500 text-sm">{category.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowCategoryModal(true);
                      }}
                      className="p-2 bg-gray-700 rounded-lg text-gray-400 hover:text-indigo-400"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-gray-700 rounded-lg text-gray-400 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{category.description}</p>
                )}
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <FileText className="h-4 w-4" />
                  {category.post_count || 0} posts
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tags found</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-full group"
                >
                  <span className="text-gray-300">{tag.name}</span>
                  <span className="text-gray-500 text-sm">({tag.post_count || 0})</span>
                  <button className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Modal */}
      {showPostModal && (
        <PostModal
          post={editingPost}
          categories={categories}
          onClose={() => {
            setShowPostModal(false);
            setEditingPost(null);
          }}
          onSave={() => {
            setShowPostModal(false);
            setEditingPost(null);
            loadData();
          }}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Post Create/Edit Modal
const PostModal = ({ post, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    featured_image: post?.featured_image || '',
    status: post?.status || 'draft',
    is_featured: post?.is_featured || false,
    category_ids: post?.categories?.map(c => c.id) || [],
    tags: post?.tags?.map(t => t.name).join(', ') || '',
    meta_title: post?.meta_title || '',
    meta_description: post?.meta_description || '',
    reading_time: post?.reading_time || 5
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (post) {
        await api.put(`/api/blog/admin/posts/${post.id}`, payload);
        toast.success('Post updated successfully');
      } else {
        await api.post('/api/blog/admin/posts', payload);
        toast.success('Post created successfully');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData({ ...formData, slug });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {post ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Slug</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <button
                  type="button"
                  onClick={generateSlug}
                  className="px-3 py-2 bg-gray-600 rounded-lg text-gray-300 hover:bg-gray-500"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white h-64"
              required
            />
            <p className="text-gray-500 text-xs mt-1">HTML content is supported</p>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white h-24"
            />
          </div>

          {/* Featured Image & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Featured Image URL</label>
              <input
                type="url"
                value={formData.featured_image}
                onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Categories & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Categories</label>
              <select
                multiple
                value={formData.category_ids}
                onChange={(e) => setFormData({
                  ...formData,
                  category_ids: Array.from(e.target.selectedOptions, opt => parseInt(opt.value))
                })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-24"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="trading, forex, strategy"
              />
            </div>
          </div>

          {/* SEO Fields */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-white font-medium mb-4">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Meta Title</label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Meta Description</label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white h-20"
                  maxLength={160}
                />
                <p className="text-gray-500 text-xs mt-1">
                  {formData.meta_description.length}/160 characters
                </p>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-gray-300">Featured Post</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm">Reading Time (min):</label>
              <input
                type="number"
                value={formData.reading_time}
                onChange={(e) => setFormData({ ...formData, reading_time: parseInt(e.target.value) || 5 })}
                className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center"
                min={1}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded-lg text-white font-medium"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {post ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Category Create/Edit Modal
const CategoryModal = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (category) {
        await api.put(`/api/blog/admin/categories/${category.id}`, formData);
        toast.success('Category updated');
      } else {
        await api.post('/api/blog/admin/categories', formData);
        toast.success('Category created');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {category ? 'Edit Category' : 'Create Category'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white h-24"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 rounded-lg text-white font-medium"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogManagementPage;
