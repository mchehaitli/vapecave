import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function createRepository() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Get the authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    // Create a new repository
    const repoName = 'my-replit-app';
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: 'My Replit app exported to GitHub',
      private: false,
      auto_init: false
    });
    
    console.log('\n✅ Repository created successfully!');
    console.log(`Repository URL: ${repo.html_url}`);
    console.log(`Clone URL: ${repo.clone_url}`);
    console.log(`Git URL: ${repo.git_url}`);
    
    console.log('\n📋 Next steps to push your code:');
    console.log('1. Open the Shell tab in Replit');
    console.log('2. Run the following commands:\n');
    console.log('   git remote add origin ' + repo.clone_url);
    console.log('   git branch -M main');
    console.log('   git push -u origin main\n');
    console.log('3. Your code will be pushed to GitHub');
    console.log('4. Clone the repository to your local machine to use with GitHub Copilot\n');
    
  } catch (error: any) {
    if (error.status === 422) {
      console.error('❌ Error: Repository name already exists. Please choose a different name or delete the existing repository.');
    } else {
      console.error('❌ Error creating repository:', error.message);
    }
    process.exit(1);
  }
}

createRepository();
