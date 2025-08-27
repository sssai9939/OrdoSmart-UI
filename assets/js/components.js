// Dynamically load header and footer components and fix relative paths per page
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const normalizedPath = window.location.pathname.replace(/\\/g, '/');
    const isInPagesDir = normalizedPath.includes('/pages/');
    const basePath = isInPagesDir ? '../' : './';

    async function loadComponent(selector, url, basePath) {
      const container = document.querySelector(selector);
      if (!container) return;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
        const html = await res.text();
        const tmp = document.createElement('div');
        tmp.innerHTML = html.trim();

        // Adjust relative URLs inside the component
        tmp.querySelectorAll('[href], [src]').forEach(function(el) {
          ['href', 'src'].forEach(function(attr) {
            const val = el.getAttribute(attr);
            if (!val) return;
            if (val.startsWith('#') || val.startsWith('data:') || val.startsWith('mailto:') || val.startsWith('tel:')) return;
            if (/^[a-zA-Z]+:\/\//.test(val)) return; // absolute URL
            if (val.startsWith('/')) return; // root-relative (optional to keep)
            if (val.startsWith('./')) {
              el.setAttribute(attr, basePath + val.slice(2));
            } else {
              el.setAttribute(attr, basePath + val);
            }
          });
        });

        // Inject
        container.replaceWith(...tmp.childNodes);

        // If header, wire up interactions and cart badge
        if (selector === '#site-header') {
          // Set active nav link by current page
          try {
            const currentFile = (normalizedPath.split('/').pop() || 'index.html').toLowerCase();
            const links = document.querySelectorAll('.nav-menu .nav-link');
            links.forEach(function(a){ a.classList.remove('active'); });
            links.forEach(function(a){
              const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
              if (href === currentFile) a.classList.add('active');
            });
          } catch (e) {}

          const mobileMenuBtn = document.getElementById('mobile-menu-btn');
          const navMenu = document.querySelector('.nav-menu');
          const body = document.body;

          function toggleMobileMenu() {
            if (!mobileMenuBtn || !navMenu) return;
            mobileMenuBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
            body.classList.toggle('mobile-menu-open');
          }

          if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);

          document.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function() {
              if (window.innerWidth < 768 && navMenu && navMenu.classList.contains('active')) {
                toggleMobileMenu();
              }
            });
          });

          document.addEventListener('click', function(event) {
            if (
              window.innerWidth < 768 &&
              mobileMenuBtn && !mobileMenuBtn.contains(event.target) &&
              navMenu && !navMenu.contains(event.target) &&
              navMenu.classList.contains('active')
            ) {
              toggleMobileMenu();
            }
          });

          window.addEventListener('resize', function() {
            if (window.innerWidth >= 768 && navMenu && navMenu.classList.contains('active')) {
              mobileMenuBtn.classList.remove('active');
              navMenu.classList.remove('active');
              body.classList.remove('mobile-menu-open');
            }
          });

          // Update cart badge
          if (window.updateCartCounter) {
            try { window.updateCartCounter(); } catch (e) {}
          } else {
            function updateCartBadge() {
              const cart = JSON.parse(localStorage.getItem('cart') || '[]');
              const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
              
              const cartLink = document.querySelector('.cart-nav-link');
              if (!cartLink) return;
              
              // Remove existing badge
              let badge = cartLink.querySelector('.cart-badge');
              if (badge) {
                  badge.remove();
              }
              
              // Only show badge on cart page
              const isCartPage = document.querySelector('main.cart-page') !== null;
              
              // Add badge if there are items AND we're on the cart page
              if (totalItems > 0 && isCartPage) {
                  badge = document.createElement('span');
                  badge.className = 'cart-badge';
                  badge.textContent = totalItems;
                  cartLink.appendChild(badge);
              }
            }
            updateCartBadge();
          }
        }
      } catch (e) {
        console.error('Failed to load component', selector, e);
      }
    }

    loadComponent('#site-header', basePath + 'components/header.html', basePath);
    loadComponent('#site-footer', basePath + 'components/footer.html', basePath);
  });
})();
