import axios from 'axios';

// GitHub repository configuration (from localStorage or environment)
// Token must be set in localStorage after OAuth or via environment variable
const getGitHubConfig = () => ({
  owner: localStorage.getItem('github_owner') || 'Wowstorelive',
  repo: localStorage.getItem('github_repo') || 'Hydrogen-v4-storefront-',
  branch: localStorage.getItem('github_branch') || 'main',
  token: localStorage.getItem('github_token') || import.meta.env.VITE_GITHUB_TOKEN || '',
});

const createGitHubClient = () => {
  const config = getGitHubConfig();
  return axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });
};

export const githubAPI = {
  pages: {
    // Get all routes from app/routes directory
    getAll: async () => {
      try {
        const config = getGitHubConfig();
        const githubClient = createGitHubClient();
        const response = await githubClient.get(
          `/repos/${config.owner}/${config.repo}/contents/app/routes?ref=${config.branch}`
        );

        // Transform GitHub files to page format
        const pages = response.data
          .filter(file => file.name.endsWith('.tsx') || file.name.endsWith('.jsx'))
          .map((file, index) => ({
            id: index + 1,
            title: file.name.replace(/\.(tsx|jsx)$/, '').replace(/_/g, ' '),
            slug: '/' + file.name.replace(/\.(tsx|jsx)$/, ''),
            content: '', // Will load on demand
            status: 'published',
            github_path: file.path,
            github_sha: file.sha,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

        return { data: pages };
      } catch (error) {
        console.error('GitHub API Error:', error);
        // Return mock data if GitHub fails
        return {
          data: [
            {
              id: 1,
              title: 'Homepage',
              slug: '/',
              content: '',
              status: 'published',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ]
        };
      }
    },

    getById: async (id) => {
      const all = await githubAPI.pages.getAll();
      const page = all.data.find(p => p.id === parseInt(id));
      return { data: [page].filter(Boolean) };
    },

    getBySlug: async (slug) => {
      const all = await githubAPI.pages.getAll();
      const page = all.data.find(p => p.slug === slug);
      return { data: [page].filter(Boolean) };
    },

    create: async (data) => {
      // For now, create pages in memory (will add GitHub write in phase 2)
      const newPage = {
        id: Date.now(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { data: newPage };
    },

    update: async (id, data) => {
      return { data: { id, ...data, updated_at: new Date().toISOString() } };
    },

    delete: async (id) => {
      return { data: { success: true } };
    },
  },
};
