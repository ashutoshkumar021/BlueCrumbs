/* js/main.js
    Full site JS:
    - loads header/footer
    - sidebar open/close + submenu
    - search tabs
    - collection tabs
    - builders & testimonial carousels (FIXED: 3s timer, no text)
    - floating enquiry popup
    - newsletter & popup form submission with toaster
    - EMI calculator (if present)
*/

$(document).ready(function () {
    // --- Load header and footer templates ---
    function loadTemplates() {
        const headerLoaded = $('#header-placeholder').length ? 
            $.when($('#header-placeholder').load('templates/header.html')) : 
            $.Deferred().resolve();
            
        const footerLoaded = $('#footer-placeholder').length ? 
            $.when($('#footer-placeholder').load('templates/footer.html', function() {
                // update year dynamically
                $('#current-year').text(new Date().getFullYear());
            })) : 
            $.Deferred().resolve();
            
        // Initialize sidebar after templates are loaded
        $.when(headerLoaded, footerLoaded).then(function() {
            initializeSidebar();
        });
    }
    
    // Initialize mobile navigation on all pages
    function initializeMobileNav() {
        // Mobile menu toggle
        $('#mobile-menu-toggle').on('click', function(e) {
            e.stopPropagation();
            $('#mobile-nav').toggleClass('active');
            $('body').toggleClass('no-scroll');
        });
        
        // Close mobile menu when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#mobile-nav, #mobile-menu-toggle').length) {
                $('#mobile-nav').removeClass('active');
                $('body').removeClass('no-scroll');
            }
        });
        
        // Close mobile menu when clicking a link
        $('#mobile-nav a').on('click', function() {
            $('#mobile-nav').removeClass('active');
            $('body').removeClass('no-scroll');
        });
        
        // Close on ESC key
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape') {
                $('#mobile-nav').removeClass('active');
                $('body').removeClass('no-scroll');
            }
        });
        
        // Submenu toggle
        $('.mobile-nav .has-submenu > a').on('click', function(e) {
            e.preventDefault();
            $(this).siblings('.submenu').slideToggle();
            $(this).parent().toggleClass('open');
        });
    }
    
    // Load templates and initialize navigation
    loadTemplates();
    initializeMobileNav();

    // ================== SIDEBAR & HEADER ==================
    window.initializeSidebar = function() {
        // Remove any existing event handlers first to prevent duplicates
        $(document).off('click', '#sidebar-toggle');
        $(document).off('click', '#sidebar-close, .sidebar-overlay');
        $(document).off('click', '.submenu-toggle');
        
        // open sidebar
        $(document).on('click', '#sidebar-toggle', function () {
            $('#sidebar').addClass('active').attr('aria-hidden', 'false');
            $('.sidebar-overlay').addClass('active');
            $('#sidebar-toggle').attr('aria-expanded', 'true');
            $('body').css('overflow', 'hidden');
        });

        // close sidebar (close button or overlay)
        $(document).on('click', '#sidebar-close, .sidebar-overlay', function () {
            closeSidebar();
        });

        // ESC key closes sidebar
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape') {
                closeSidebar();
            }
        });

        // submenu toggle
        $(document).on('click', '.submenu-toggle', function (e) {
            e.preventDefault();
            const parent = $(this).closest('.has-submenu');
            parent.toggleClass('open');
            $(this).attr('aria-expanded', parent.hasClass('open') ? 'true' : 'false');
        });

        function closeSidebar() {
            $('#sidebar').removeClass('active').attr('aria-hidden', 'true');
            $('.sidebar-overlay').removeClass('active');
            $('#sidebar-toggle').attr('aria-expanded', 'false');
            $('body').css('overflow', '');
        }
    }

    // ================== SEARCH TABS ==================
    $(document).on('click', '.search-box .tab-link', function () {
        const tabId = $(this).data('tab');
        $('.search-box .tab-link').removeClass('active').attr('aria-selected', 'false');
        $(this).addClass('active').attr('aria-selected', 'true');
        $('.search-box .tab-content').removeClass('active').attr('aria-hidden', 'true');
        $('#' + tabId).addClass('active').attr('aria-hidden', 'false');
    });

    // ================== COLLECTION TABS ==================
    $(document).on('click', '.collection-tabs .tab-button', function () {
        const category = $(this).data('category');
        $('.collection-tabs .tab-button').removeClass('active');
        $(this).addClass('active');
        if (category === 'all') {
            $('.collection-grid [data-category]').show();
        } else {
            $('.collection-grid [data-category]').hide();
            $(`.collection-grid [data-category="${category}"]`).show();
        }
    });

    // ================== CAROUSELS (Owl) ==================
    function initHeroSlider() {
        if ($('.hero-slider').length && $.fn.owlCarousel) {
            $('.hero-slider').owlCarousel({
                items: 1,
                loop: true,
                nav: false,
                dots: true,
                autoplay: true,
                autoplayTimeout: 3000,
                autoplayHoverPause: true
            });
        }
    }

    function initBuildersCarousel() {
        if ($('.builders-carousel').length && $.fn.owlCarousel) {
            $('.builders-carousel').owlCarousel({
                loop: true,
                margin: 30,
                // Removed Nav (nav: false is implied unless explicitly set)
                dots: true, // ✅ Use dots for auto-play slider
                autoplay: true, // ✅ ENABLE AUTOPLAY
                autoplayTimeout: 3000, // ✅ 3 SECOND TIMER APPLIED
                autoplayHoverPause: true,
                responsive: { 0: { items: 2 }, 600: { items: 3 }, 1000: { items: 6 } } // Changed 5 to 6 to fit new priority list
            });
        }
    }

    function initTestimonials() {
        if ($('.testimonial-carousel').length && $.fn.owlCarousel) {
            $('.testimonial-carousel').owlCarousel({
                loop: true,
                margin: 20,
                nav: false,
                dots: true,
                autoplay: true,
                autoplayTimeout: 6000,
                responsive: { 0: { items: 1 }, 768: { items: 2 } }
            });
        }
    }

    // init after templates load
    setTimeout(function () {
        initHeroSlider();
        initBuildersCarousel();
        initTestimonials();
    }, 350);

    // ================== FLOATING ENQUIRY POPUP ==================
    const $popup = $('#quick-enquiry-popup');
    $(document).on('click', '#floating-enquiry-btn', function () {
        $popup.toggleClass('active');
        const isOpen = $popup.hasClass('active');
        $popup.attr('aria-hidden', !isOpen);
        if (isOpen) $popup.find('input[name="name"]').focus();
    });
    $(document).on('click', '#close-popup-btn', function () {
        $popup.removeClass('active').attr('aria-hidden', 'true');
    });

    // ================== FORM SUBMISSION ==================
    // Use .off() to remove any existing handlers before adding new one to prevent duplicates
    $(document).off('submit', '#popup-inquiry-form, #newsletter-form-main, #contact-form, #nri-enquiry-form, #careerForm')
        .on('submit', '#popup-inquiry-form, #newsletter-form-main, #contact-form, #nri-enquiry-form, #careerForm', function (event) {
        event.preventDefault();
        event.stopImmediatePropagation(); // Prevent duplicate handlers
        const form = $(this);
        const formId = form.attr('id');
        const isNewsletter = formId === 'newsletter-form-main';
        const isUrgent = formId === 'popup-inquiry-form'; // Call button form is urgent

        if (isNewsletter) {
            const email = form.find('input[type="email"]').val();
            const name = form.find('input[name="name"]').val() || '';
            
            if (!email || !email.includes('@')) {
                showToaster('Please enter a valid email.', 'error');
                return;
            }
            
            // Send newsletter subscription to server
            $.ajax({
                url: '/api/newsletter',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ email: email, name: name, source: 'Newsletter Form' }),
                success: function(response) {
                    showToaster(response.message || 'Thank you for subscribing!', 'success');
                    form[0].reset();
                },
                error: function(jqXHR) {
                    const msg = jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error
                        ? jqXHR.responseJSON.error
                        : 'Unable to subscribe. Please try again.';
                    showToaster(msg, 'error');
                }
            });
            return;
        }

        // Get form data
        const formData = {
            name: form.find('input[name="name"], #ownerName, input[placeholder*="Name"]').val()?.trim(),
            email: form.find('input[name="email"], input[type="email"]').val()?.trim(),
            phone: form.find('input[name="phone"], input[type="tel"], #contactNumber').val()?.trim(),
            message: form.find('textarea').val()?.trim() || 'General enquiry',
            source: form.find('input[name="source"]').val() || getFormSource(formId),
            urgent: isUrgent,
            timestamp: new Date().toISOString()
        };

        // Additional fields for specific forms
        if (formId === 'careerForm') {
            formData.position = form.find('select[name="position"]').val();
            formData.experience = form.find('input[name="experience"]').val() || 0;
            if (!formData.position) {
                showToaster('Please select a position.', 'error');
                return;
            }
        }

        if (formId === 'property-form') {
            formData.propertyType = form.find('#propertyType').val();
            formData.location = form.find('#location').val();
            formData.price = form.find('#price').val();
            formData.bedrooms = form.find('#bedrooms').val();
            formData.area = form.find('#area').val();
        }

        // Validate required fields
        if (!formData.name || formData.name.length < 2) {
            showToaster('Please enter a valid name (minimum 2 characters).', 'error');
            form.find('input[name="name"]').focus();
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            showToaster('Please enter a valid email address.', 'error');
            form.find('input[type="email"]').focus();
            return;
        }
        
        const phoneRegex = /^[6-9]\d{9}$/;
        const cleanPhone = formData.phone?.replace(/[\s\-\(\)]/g, '');
        if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
            showToaster('Please enter a valid 10-digit mobile number.', 'error');
            form.find('input[type="tel"]').focus();
            return;
        }
        formData.phone = cleanPhone; // Use cleaned phone number

        const $btn = form.find('button[type="submit"]');
        const prevText = $btn.text();
        $btn.prop('disabled', true).text('Sending...');

        // Use different endpoint for career form
        const apiUrl = formId === 'careerForm' ? '/api/career' : '/inquiry';

        if (formId === 'careerForm') {
            const fd = new FormData(form[0]);
            $.ajax({
                url: apiUrl,
                type: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                success: function (response) {
                    const msg = (response && response.message) ? response.message : 'Enquiry sent successfully.';
                    showToaster(msg, 'success');
                    form[0].reset();
                },
                error: function (jqXHR) {
                    const msg = jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error
                        ? jqXHR.responseJSON.error
                        : 'Unable to reach server. Please try again later.';
                    showToaster(msg, 'error');
                },
                complete: function () {
                    $btn.prop('disabled', false).text(prevText);
                }
            });
        } else {
            $.ajax({
                url: apiUrl,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function (response) {
                    const msg = (response && response.message) ? response.message : 'Enquiry sent successfully.';
                    showToaster(msg, 'success');
                    form[0].reset();
                    
                    if (formId === 'popup-inquiry-form') {
                        $('#quick-enquiry-popup').removeClass('active').attr('aria-hidden', 'true').hide();
                        $('body').css('overflow', '');
                    }
                    
                    const mainPopup = $('#main-enquiry-popup');
                    if (mainPopup.length && mainPopup.is(':visible')) {
                        mainPopup.attr('aria-hidden', 'true').hide();
                        $('body').css('overflow', '');
                    }
                },
                error: function (jqXHR) {
                    const msg = jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.error
                        ? jqXHR.responseJSON.error
                        : 'Unable to reach server. Please try again later.';
                    showToaster(msg, 'error');
                },
                complete: function () {
                    $btn.prop('disabled', false).text(prevText);
                }
            });
        }
    });

    // Helper function to get form source
    function getFormSource(formId) {
        const sources = {
            'popup-inquiry-form': 'Call Button (Urgent)',
            'contact-form': 'Contact Page',
            'nri-enquiry-form': 'NRI Corner',
            'careerForm': 'Career Page',
            'property-form': 'Post Property'
        };
        return sources[formId] || 'General Enquiry';
    }

    // ================== EMI CALCULATOR ==================
    const loanAmountInput = $('#loanAmount');
    if (loanAmountInput.length) {
        const interestRateInput = $('#interestRate');
        const loanTenureInput = $('#loanTenure');

        const calculateEMI = () => {
            const p = parseFloat(loanAmountInput.val()),
                r = parseFloat(interestRateInput.val()) / 1200,
                n = parseFloat(loanTenureInput.val()) * 12;

            if (p > 0 && r >= 0 && n > 0) {
                const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                const totalPayment = emi * n, totalInterest = totalPayment - p;

                const formatCurrency = (num) =>
                    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(num);

                $('#emiResult').text(formatCurrency(emi));
                $('#principalAmount').text(formatCurrency(p));
                $('#totalInterest').text(formatCurrency(totalInterest));
                $('#totalPayment').text(formatCurrency(totalPayment));
            }
        };

        calculateEMI();
        $('#loanAmount, #interestRate, #loanTenure').on('input', calculateEMI);
    }

    function initBuilderProjectsPage() {
        const grid = $('.projects-section .projects-grid');
        if (!grid.length) return;
        const hiddenBuilder = $('input[name="builder_name"]').first();
        if (!hiddenBuilder.length) return;
        const builderName = hiddenBuilder.val();
        if (!builderName) return;
        let sliders = [];

        function clearSliders() {
            sliders.forEach(function(id) { clearInterval(id); });
            sliders = [];
        }

        function renderBuilderProjects(projects) {
            clearSliders();
            grid.empty();
            if (!projects || !projects.length) {
                grid.html('<div style="text-align:center; padding:40px; color:#6b7280;"><i class="fa-solid fa-search" style="font-size:3rem; color:#d1d5db; margin-bottom:15px;"></i><h3>No projects found</h3><p>Currently there are no projects available for this builder.</p></div>');
                return;
            }
            projects.forEach(function(project) {
                const photos = Array.isArray(project.photos) && project.photos.length ? project.photos.slice(0, 3) : [];
                const fallbackImage = '../images/property-1.jpg';
                const imageSlides = photos.length ? photos : [fallbackImage];
                const badge = project.status_possession || project.project_type || '';
                const bhk = project.bhk || '';
                const size = project.size_sqft || '';
                let price = '';
                if (project.min_price && project.max_price) price = project.min_price + ' - ' + project.max_price;
                else if (project.min_price || project.max_price) price = project.min_price || project.max_price;
                const slidesHtml = imageSlides.map(function(url, index) {
                    const active = index === 0 ? ' active' : '';
                    return '<div class="project-image-slide' + active + '" style="background-image: url(\'' + url + '\')"></div>';
                }).join('');
                let features = '';
                if (bhk) features += '<span class="feature-item"> ' + bhk + '</span>';
                if (size) features += '<span class="feature-item">Size: ' + size + '</span>';
                if (project.project_type) features += '<span class="feature-item">Type: ' + project.project_type + '</span>';
                if (project.rera_number) features += '<span class="feature-item">RERA: ' + project.rera_number + '</span>';
                if (project.possession_date) features += '<span class="feature-item">Possession: ' + project.possession_date + '</span>';
                const priceHtml = price ? '₹ ' + price : '';
                const card = '' +
                    '<div class="project-card">' +
                      '<div class="project-image">' +
                        '<div class="project-image-inner">' +
                          slidesHtml +
                        '</div>' +
                        '<span class="project-badge">' + badge + '</span>' +
                      '</div>' +
                      '<div class="project-content">' +
                        '<h3>' + (project.project_name || '') + '</h3>' +
                        '<div class="project-location">' +
                          '<i class="fa-solid fa-location-dot"></i>' +
                          (project.location || '') +
                        '</div>' +
                        '<div class="project-features">' +
                          features +
                        '</div>' +
                        '<div class="project-price">' + priceHtml + '</div>' +
                        '<button class="project-btn" onclick="contactUs()">Enquiry Call</button>' +
                      '</div>' +
                    '</div>';
                grid.append(card);
            });
            grid.find('.project-image').each(function() {
                const container = $(this);
                const slides = container.find('.project-image-slide');
                if (slides.length <= 1) return;
                let index = 0;
                const intervalId = setInterval(function() {
                    slides.eq(index).removeClass('active');
                    index = (index + 1) % slides.length;
                    slides.eq(index).addClass('active');
                }, 3000);
                sliders.push(intervalId);
            });
        }

        $.ajax({
            url: '/api/projects/search',
            method: 'GET',
            data: { builder: builderName, includeUsers: true },
            success: function(projects) {
                renderBuilderProjects(Array.isArray(projects) ? projects : []);
            },
            error: function() {
                grid.empty().html('<div style="text-align:center; padding:40px; color:#6b7280;">Unable to load projects for this builder right now.</div>');
            }
        });
    }

    initBuilderProjectsPage();

});

// ================== TOASTER HELPER ==================
function showToaster(message, type = 'success') {
    const toaster = $('#toaster');
    // Clear any existing timer
    if (toaster.data('timer')) {
        clearTimeout(toaster.data('timer'));
    }
    // Remove all classes first, then add new ones
    toaster.removeClass('show success error').addClass(type + ' show').text(message);
    // Set new timer to hide after 2 seconds
    toaster.data('timer', setTimeout(() => {
        toaster.removeClass('show success error');
    }, 2000));
}