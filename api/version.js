// Tells the app how many commits the GitHub repo has, for the version number in the header (v1.<commits>).
// Runs on Vercel. It uses the repo details Vercel already knows; nothing to set up for a public repo.
// For a private repo, add a GITHUB_TOKEN environment variable in Vercel (a read-only token), or it just shows v1.
module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  var owner = process.env.VERCEL_GIT_REPO_OWNER, repo = process.env.VERCEL_GIT_REPO_SLUG, sha = process.env.VERCEL_GIT_COMMIT_SHA || '';
  if (!owner || !repo) { res.statusCode = 200; res.end(JSON.stringify({ count: null })); return; }
  try {
    var h = { 'User-Agent': 'gaf-grocery-grabber', Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) h.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
    var r = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/commits?per_page=1' + (sha ? '&sha=' + sha : ''), { headers: h });
    if (!r.ok) throw new Error('github ' + r.status);
    var link = r.headers.get('link') || '', m = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
    var count = m ? +m[1] : (await r.json()).length;
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400');
    res.statusCode = 200; res.end(JSON.stringify({ count: count, sha: sha.slice(0, 7) }));
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=60');
    res.statusCode = 200; res.end(JSON.stringify({ count: null }));
  }
};
