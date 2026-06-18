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

