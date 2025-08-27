// Function to load header and footer components
document.addEventListener('DOMContentLoaded', function() {
    // Load Header
    fetch('./components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('site-header').innerHTML = data;
            // Initialize mobile menu after header is loaded
            initMobileMenu();
            // Update active link based on current page
            updateActiveLink();
        })
        .catch(error => console.error('Error loading header:', error));

    // Load Footer if the element exists
    const footerElement = document.getElementById('site-footer');
    if (footerElement) {
        fetch('./components/footer.html')
            .then(response => response.text())
            .then(data => {
                footerElement.innerHTML = data;
            })
            .catch(error => console.error('Error loading footer:', error));
    }
});

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });

        // Close menu when clicking on a nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }
}

// Update active link in navigation
function updateActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // Remove 'active' class from all links
        link.classList.remove('active');
        
        // Add 'active' class to current page link
        if (linkHref === currentPage || 
            (currentPage === '' && linkHref === 'index.html') ||
            (currentPage.includes(linkHref.replace('.html', '')) && linkHref !== 'index.html')) {
            link.classList.add('active');
        }
    });
}
