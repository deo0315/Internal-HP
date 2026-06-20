// ページロード完了時の処理
document.addEventListener('DOMContentLoaded', function() {
  console.log('社内ホームページが読み込まれました');
  
  // スムーススクロール
  const navLinks = document.querySelectorAll('.nav-list a');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
  
  // ニュースアイテムのホバー効果
  const newsItems = document.querySelectorAll('.news-item');
  newsItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
      this.style.backgroundColor = '#f0f0f0';
    });
    item.addEventListener('mouseleave', function() {
      this.style.backgroundColor = '#f9f9f9';
    });
  });

  // 社内資料サブメニューの開閉
  const submenuToggles = document.querySelectorAll('.submenu-toggle');
  const lastClickTimes = new Map(); // クリック時刻を記録
  const doubleClickThreshold = 300; // ダブルクリック判定の閾値（ミリ秒）

  submenuToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      const href = this.getAttribute('href') || '';
      const parent = this.closest('.has-submenu');
      const isOpen = parent.classList.contains('open');

      // ダブルクリック判定
      const now = Date.now();
      const lastClickTime = lastClickTimes.get(this) || 0;
      const isDoubleClick = now - lastClickTime < doubleClickThreshold;
      lastClickTimes.set(this, now);

      if (isDoubleClick) {
        e.preventDefault();
        return; // ダブルクリックの場合は処理をスキップ
      }

      if (href === '#') {
        e.preventDefault();
        parent.classList.toggle('open');
        return;
      }

      // 実URLリンクのタブは、初回クリックでサブメニューを開いてから遷移できるようにする
      if (!isOpen) {
        e.preventDefault();
        parent.classList.add('open');
      }
    });
  });

  // クリックで外側を閉じる
  document.addEventListener('click', function(e) {
    document.querySelectorAll('.has-submenu.open').forEach(openEl => {
      if (!openEl.contains(e.target)) openEl.classList.remove('open');
    });
  });

  initNewsPostForm();
  renderPostedNewsList();
  renderTopLatestNewsBanner();
  
  // PDF.jsの読み込み完了を待ってプレビューを描画
  if (typeof pdfjsLib !== 'undefined') {
    renderNewsletterPreviews();
  } else {
    // PDF.jsが遅延読み込みされる場合への対応
    setTimeout(() => {
      if (typeof pdfjsLib !== 'undefined') {
        renderNewsletterPreviews();
      }
    }, 500);
  }
});

// スクロール位置に応じたナビゲーション背景色変更
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 100) {
    navbar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});

const NEWS_STORAGE_KEY = 'internal-news-posts';

function formatTodayJP() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

function loadNewsPosts() {
  try {
    const raw = localStorage.getItem(NEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('投稿データの読み込みに失敗しました', error);
    return [];
  }
}

function saveNewsPosts(posts) {
  localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(posts));
}

function createNewsArticle(post, isLatest = false) {
  const article = document.createElement('article');
  article.className = 'news-post';

  const inner = document.createElement('div');
  inner.className = 'news-post-inner';

  const date = document.createElement('div');
  date.className = 'news-post-date';
  date.textContent = post.date;

  // 最新バッジとカテゴリをラップするコンテナ
  const categoryContainer = document.createElement('div');
  categoryContainer.className = 'news-post-category-container';

  // 最新バッジを追加（左側）
  if (isLatest) {
    const badge = document.createElement('span');
    badge.className = 'news-latest-badge';
    badge.textContent = '最新';
    categoryContainer.appendChild(badge);
  }

  const category = document.createElement('div');
  category.className = 'news-post-category';
  category.textContent = post.category;
  categoryContainer.appendChild(category);

  const title = document.createElement('h2');
  title.className = 'news-post-title';
  title.textContent = post.title;

  const content = document.createElement('div');
  content.className = 'news-post-content';
  content.textContent = post.content;

  inner.appendChild(date);
  inner.appendChild(categoryContainer);
  inner.appendChild(title);
  inner.appendChild(content);
  article.appendChild(inner);

  return article;
}

function initNewsPostForm() {
  const form = document.getElementById('newsPostForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const title = form.title.value.trim();
    const category = form.category.value.trim();
    const content = form.content.value.trim();

    if (!title || !category || !content) {
      alert('タイトル・分類・内容をすべて入力してください。');
      return;
    }

    const posts = loadNewsPosts();
    posts.unshift({
      id: Date.now(),
      title,
      category,
      content,
      date: formatTodayJP()
    });
    saveNewsPosts(posts);

    window.location.href = 'news.html';
  });
}

function renderPostedNewsList() {
  const list = document.getElementById('newsList');
  if (!list) return;

  const posts = loadNewsPosts();
  posts.forEach((post, index) => {
    const isLatest = index === 0;
    list.insertBefore(createNewsArticle(post, isLatest), list.firstChild);
  });
}

function renderTopLatestNewsBanner() {
  let banner = document.getElementById('topLatestNewsBanner');
  let titleEl = document.getElementById('topLatestNewsTitle');

  // 万一HTML上に存在しない場合でも表示できるように動的生成
  if (!banner) {
    banner = document.createElement('a');
    banner.id = 'topLatestNewsBanner';
    banner.className = 'top-latest-news-banner';
    banner.href = 'news.html';
    banner.setAttribute('aria-label', '最新Newsへ移動');

    const label = document.createElement('span');
    label.className = 'top-latest-news-label';
    label.textContent = '最新News';

    titleEl = document.createElement('span');
    titleEl.className = 'top-latest-news-title';
    titleEl.id = 'topLatestNewsTitle';

    banner.appendChild(label);
    banner.appendChild(titleEl);
    document.body.appendChild(banner);
  }

  if (!titleEl) {
    titleEl = document.createElement('span');
    titleEl.className = 'top-latest-news-title';
    titleEl.id = 'topLatestNewsTitle';
    banner.appendChild(titleEl);
  }

  // CSSが反映されない場合に備え、表示位置をJSでフォールバック指定
  banner.style.position = 'fixed';
  banner.style.right = '2.25rem';
  banner.style.bottom = '2.25rem';
  banner.style.zIndex = '9999';
  banner.style.display = 'flex';
  banner.style.flexDirection = 'column';
  banner.style.gap = '0.4rem';
  banner.style.maxWidth = 'min(460px, calc(100vw - 2rem))';
  banner.style.padding = '0.85rem 1rem';
  banner.style.borderRadius = '12px';
  banner.style.background = 'rgba(255,255,255,0.96)';
  banner.style.border = '1px solid rgba(15,31,58,0.15)';
  banner.style.boxShadow = '0 12px 26px rgba(0,0,0,0.22)';
  banner.style.textDecoration = 'none';
  banner.style.pointerEvents = 'auto';

  const posts = loadNewsPosts();
  if (posts.length === 0) {
    titleEl.textContent = 'まだ投稿はありません';
    banner.classList.add('is-empty');
    return;
  }

  titleEl.textContent = posts[0].title;
  banner.classList.remove('is-empty');
}

// PDFプレビュー表示機能
async function renderNewsletterPreviews() {
  // PDF.jsの設定
  if (typeof pdfjsLib === 'undefined') {
    console.warn('PDF.jsライブラリが読み込まれていません');
    return;
  }
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const items = document.querySelectorAll('.newsletter-item[data-pdf-url]');
  
  items.forEach(async (item) => {
    const pdfUrl = item.getAttribute('data-pdf-url');
    const canvas = item.querySelector('.newsletter-item-canvas');
    
    if (!canvas) return;

    try {
      // PDFを読み込んで最初のページをcanvasに描画
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const page = await pdf.getPage(1);
      
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      console.log(`PDF preview loaded: ${pdfUrl}`);
    } catch (error) {
      console.error(`PDF読み込みエラー (${pdfUrl}):`, error);
      // プレビューエリアにフォールバック表示
      canvas.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #999; font-size: 0.9rem;';
      fallback.textContent = 'プレビュー読み込み中...';
      canvas.parentElement.appendChild(fallback);
    }
  });
}

