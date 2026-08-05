/* ===========================================================================
   EPOREX — Dynamic WordPress Blog Posts Loader with Skeleton Shimmer UI
   ---------------------------------------------------------------------------
   Renders animated skeleton loader cards while fetching latest blog posts
   from WordPress REST API (eporex.in/blog/wp-json), then populates exact theme UI.
   =========================================================================== */
(function () {
  'use strict';

  // Inject Skeleton CSS Styles into <head>
  function injectSkeletonCSS() {
    if (document.getElementById('epx-blog-skeleton-styles')) return;
    var css =
      '.epx-blog-skeleton{background:#fff;border-radius:20px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,0.04);border:1px solid #f0ede8;height:100%}' +
      '.epx-shimmer{background:linear-gradient(90deg,#f2efe9 25%,#faf8f5 50%,#f2efe9 75%);background-size:200% 100%;animation:epx-shimmer-anim 1.5s infinite linear;border-radius:8px}' +
      '@keyframes epx-shimmer-anim{0%{background-position:-200% 0}100%{background-position:200% 0}}' +
      '.epx-sk-img{height:220px;width:100%;border-radius:16px;margin-bottom:20px}' +
      '.epx-sk-meta{display:flex;gap:12px;margin-bottom:16px}' +
      '.epx-sk-pill{height:16px;width:90px;border-radius:20px}' +
      '.epx-sk-title{height:22px;width:100%;margin-bottom:10px;border-radius:6px}' +
      '.epx-sk-title.short{width:65%;margin-bottom:16px}' +
      '.epx-sk-text{height:14px;width:100%;margin-bottom:8px;border-radius:4px}' +
      '.epx-sk-btn{height:44px;width:130px;border-radius:30px;margin-top:18px}';

    var style = document.createElement('style');
    style.id = 'epx-blog-skeleton-styles';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function getSkeletonHTML(count) {
    var html = '';
    for (var i = 0; i < count; i++) {
      html +=
        '<div class="col-md-6 col-lg-4">' +
          '<div class="blog-item epx-blog-skeleton">' +
            '<div class="epx-sk-img epx-shimmer"></div>' +
            '<div class="epx-sk-meta">' +
              '<span class="epx-sk-pill epx-shimmer"></span>' +
              '<span class="epx-sk-pill epx-shimmer"></span>' +
            '</div>' +
            '<div class="epx-sk-title epx-shimmer"></div>' +
            '<div class="epx-sk-title short epx-shimmer"></div>' +
            '<div class="epx-sk-text epx-shimmer"></div>' +
            '<div class="epx-sk-text epx-shimmer"></div>' +
            '<div class="epx-sk-btn epx-shimmer"></div>' +
          '</div>' +
        '</div>';
    }
    return html;
  }

  function decodeEntities(html) {
    var txt = document.createElement('textarea');
    txt.innerHTML = html || '';
    return txt.value;
  }

  function stripHtml(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { day: '01', monthYear: 'Jan 26' };
    }
    var day = String(d.getDate()).padStart(2, '0');
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var month = monthNames[d.getMonth()];
    var year = String(d.getFullYear()).slice(-2);
    return { day: day, monthYear: month + ' ' + year };
  }

  function getFeaturedImage(post, index) {
    try {
      var media = post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0];
      if (media) {
        if (media.media_details && media.media_details.sizes) {
          var sizes = media.media_details.sizes;
          if (sizes.medium_large && sizes.medium_large.source_url) return sizes.medium_large.source_url;
          if (sizes.large && sizes.large.source_url) return sizes.large.source_url;
          if (sizes.medium && sizes.medium.source_url) return sizes.medium.source_url;
          if (sizes.full && sizes.full.source_url) return sizes.full.source_url;
        }
        if (media.source_url) return media.source_url;
      }
    } catch (e) {}
    var fallbackImages = ['assets/img/blog/01.jpg', 'assets/img/blog/02.jpg', 'assets/img/blog/03.jpg'];
    return fallbackImages[index % fallbackImages.length];
  }

  function getAuthor(post) {
    try {
      var author = post._embedded && post._embedded['author'] && post._embedded['author'][0];
      if (author && author.name && !author.code) {
        return author.name;
      }
    } catch (e) {}
    return 'EPOREX';
  }

  function getCategory(post) {
    try {
      var terms = post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][0];
      if (terms && terms.length > 0 && terms[0].name) {
        return terms[0].name;
      }
    } catch (e) {}
    return 'Blog';
  }

  function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '&hellip;';
  }

  function renderPostCard(post, index) {
    var title = decodeEntities(post.title ? post.title.rendered : 'Untitled');
    var rawExcerpt = stripHtml(post.excerpt ? post.excerpt.rendered : '');
    var excerpt = truncateText(rawExcerpt, 110);
    var link = post.link || 'https://www.eporex.in/blog/';
    var dateObj = formatDate(post.date);
    var imageUrl = getFeaturedImage(post, index);
    var author = getAuthor(post);
    var category = getCategory(post);
    var delay = (0.2 * ((index % 3) + 1)).toFixed(1) + 's';

    return '' +
      '<div class="col-md-6 col-lg-4">' +
        '<div class="blog-item wow fadeInUp" data-wow-delay="' + delay + '">' +
          '<div class="blog-date">' +
            '<span>' + dateObj.day + '</span>' +
            dateObj.monthYear +
          '</div>' +
          '<div class="blog-img">' +
            '<div class="ani-img">' +
              '<a href="' + link + '" target="_blank" rel="noopener"><img src="' + imageUrl + '" alt="' + title.replace(/"/g, '&quot;') + '" /></a>' +
            '</div>' +
          '</div>' +
          '<div class="blog-meta">' +
            '<ul>' +
              '<li>' +
                '<a href="' + link + '" target="_blank" rel="noopener"><i class="far fa-user-circle"></i> By ' + author + '</a>' +
              '</li>' +
              '<li>' +
                '<a href="' + link + '" target="_blank" rel="noopener"><i class="far fa-folder"></i> ' + category + '</a>' +
              '</li>' +
            '</ul>' +
          '</div>' +
          '<div class="blog-info">' +
            '<h4 class="blog-title">' +
              '<a href="' + link + '" target="_blank" rel="noopener">' + title + '</a>' +
            '</h4>' +
            '<p>' + excerpt + '</p>' +
            '<a class="theme-btn" href="' + link + '" target="_blank" rel="noopener">Read More<i class="fas fa-arrow-right"></i></a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function loadWPBlogs() {
    injectSkeletonCSS();

    var containers = document.querySelectorAll('#wp-latest-blogs');
    if (!containers.length) return;

    containers.forEach(function (container) {
      var count = parseInt(container.getAttribute('data-posts-count') || '3', 10);
      
      // Render skeleton loader immediately while fetching
      container.innerHTML = getSkeletonHTML(count);

      var apiUrl = 'https://www.eporex.in/blog/wp-json/wp/v2/posts?_embed&per_page=' + count;

      fetch(apiUrl)
        .then(function (response) {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        })
        .then(function (posts) {
          if (!Array.isArray(posts) || posts.length === 0) return;

          var html = '';
          for (var i = 0; i < posts.length; i++) {
            html += renderPostCard(posts[i], i);
          }
          container.innerHTML = html;

          if (typeof WOW !== 'undefined') {
            new WOW().init();
          }
        })
        .catch(function (error) {
          console.warn('Could not fetch WordPress posts dynamically:', error);
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWPBlogs);
  } else {
    loadWPBlogs();
  }
})();
