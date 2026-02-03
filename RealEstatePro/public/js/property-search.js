// Property Search Functionality
$(document).ready(function() {
    $('#main-search-form').on('submit', function(e) {
        e.preventDefault();
        performSearch();
    });
    
    $('#location-search-form').on('submit', function(e) {
        e.preventDefault();
        performLocationSearch();
    });
    
    $('#name-search-form').on('submit', function(e) {
        e.preventDefault();
        performNameSearch();
    });
    
    // Load builders for dropdown
    async function loadBuilders() {
        try {
            const response = await fetch('/api/projects/builders');
            const builders = await response.json();
            
            // Populate residential builder dropdown
            const resBuilderSelect = $('#res-builder');
            builders.forEach(builder => {
                resBuilderSelect.append(`<option value="${builder}">${builder}</option>`);
            });
            
            // Populate commercial builder dropdown
            const comBuilderSelect = $('#com-builder');
            builders.forEach(builder => {
                comBuilderSelect.append(`<option value="${builder}">${builder}</option>`);
            });
        } catch (error) {
            console.error('Error loading builders:', error);
        }
    }
    
    // Perform search
    async function performSearch() {
        const type = $('#search-type').val();
        const location = $('#search-location').val();
        let searchParams = {
            includeUsers: 'true'
        };
        
        if (type && type !== 'all') {
            searchParams.projectType = type;
        }
        
        if (location) {
            searchParams.location = location;
        }
        
        try {
            // Build query string
            const queryString = new URLSearchParams(searchParams).toString();
            const response = await fetch(`/api/projects/search?${queryString}`);
            const projects = await response.json();
            
            // Display results
            displaySearchResults(projects);
            
            // Scroll to results
            $('html, body').animate({
                scrollTop: $('#search-results-section').offset().top - 100
            }, 500);
            
        } catch (error) {
            console.error('Error searching projects:', error);
            showToaster('Error searching properties. Please try again.', 'error');
        }
    }
    
    // Perform search by location (flexible, case-insensitive)
    async function performLocationSearch() {
        const type = $('#search-type').val();
        const location = $('#search-location').val().trim();
        let searchParams = {
            includeUsers: 'true'
        };
        
        if (type && type !== 'all') {
            searchParams.projectType = type;
        }
        
        if (location) {
            // Use searchTerm so that partial matches like "Sector 150", "150" etc. work against the location fields
            searchParams.searchTerm = location;
        }
        
        try {
            // Build query string
            const queryString = new URLSearchParams(searchParams).toString();
            const response = await fetch(`/api/projects/search?${queryString}`);
            const projects = await response.json();
            
            // Display results
            displaySearchResults(projects);
            
            // Scroll to results
            $('html, body').animate({
                scrollTop: $('#search-results-section').offset().top - 100
            }, 500);
            
        } catch (error) {
            console.error('Error searching projects by location:', error);
            showToaster('Error searching properties. Please try again.', 'error');
        }
    }

    // Perform search by project name (case-insensitive, matches project_name only)
    async function performNameSearch() {
        const type = $('#search-type-name').val();
        const name = $('#search-name').val().trim();
        let searchParams = {
            includeUsers: 'true'
        };

        if (type && type !== 'all') {
            searchParams.projectType = type;
        }

        if (name) {
            searchParams.searchTerm = name;
        }

        try {
            const queryString = new URLSearchParams(searchParams).toString();
            const response = await fetch(`/api/projects/search?${queryString}`);
            let projects = await response.json();

            // Ensure we only keep projects whose name matches the search term, case-insensitively
            if (name) {
                const nameLower = name.toLowerCase();
                projects = projects.filter(project => {
                    const projectName = (project.project_name || '').toLowerCase();
                    return projectName.includes(nameLower);
                });
            }

            displaySearchResults(projects);

            $('html, body').animate({
                scrollTop: $('#search-results-section').offset().top - 100
            }, 500);
        } catch (error) {
            console.error('Error searching projects by name:', error);
            showToaster('Error searching properties. Please try again.', 'error');
        }
    }
    
    // Display search results
    function displaySearchResults(projects) {
        const resultsSection = $('#search-results-section');
        const resultsContainer = $('#search-results');
        const resultsCount = $('#search-results-count');
        
        // Clear previous results
        resultsContainer.empty();
        
        if (projects.length === 0) {
            resultsSection.show();
            resultsCount.text('No properties found matching your criteria.');
            resultsContainer.html(`
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                    <p style="color: #666;">No properties found. Try adjusting your search criteria.</p>
                </div>
            `);
            return;
        }
        
        // Show results section
        resultsSection.show();
        resultsCount.text(`Found ${projects.length} ${projects.length === 1 ? 'property' : 'properties'}`);
        
        // Display each project using projects page card layout
        projects.forEach(project => {
            const type = (project.project_type || '').toLowerCase();
            const photos = Array.isArray(project.photos) && project.photos.length ? project.photos.slice(0, 3) : [];
            const fallbackImage = 'images/property-1.jpg';
            const imageSlides = photos.length ? photos : [fallbackImage];
            const badge = project.status_possession || project.project_type || '';
            const bhk = project.bhk || '';
            const size = project.size_sqft || '';
            const price = project.min_price && project.max_price ? `${project.min_price} - ${project.max_price}` : (project.min_price || project.max_price || '');
            const slidesHtml = imageSlides.map((url, index) => `
                  <div class="project-image-slide${index === 0 ? ' active' : ''}" style="background-image: url('${url}')"></div>
                `).join('');
            // Determine badge class based on status
            let badgeClass = 'project-badge';
            if (badge.toLowerCase().includes('ready to move')) {
                badgeClass += ' ready-to-move';
            } else if (badge.toLowerCase().includes('new launch')) {
                badgeClass += ' new-launch';
            } else if (badge.toLowerCase().includes('under construction') || badge.toLowerCase().includes('under-construction')) {
                badgeClass += ' under-construction';
            }

            const card = `
              <div class="project-card" data-category="${type}">
                <div class="project-image">
                  <div class="project-image-inner">
                    ${slidesHtml}
                  </div>
                  <div class="${badgeClass}">${badge}</div>
                </div>
                <div class="project-content">
                  <h3 class="project-title">${project.project_name || ''}</h3>
                  <div class="project-location">
                    <i class="fa-solid fa-user-tie"></i>
                    ${project.builder_name || ''}
                  </div>
                  <div class="project-location">
                    <i class="fa-solid fa-location-dot"></i>
                    ${project.location || ''}
                  </div>
                  <div class="project-features">
                    ${bhk ? `<span class=\"feature\">${bhk}</span>` : ''}
                    ${size ? `<span class=\"feature\">Size:${size}</span>` : ''}
                    ${project.project_type ? `<span class=\"feature\">Type:${project.project_type}</span>` : ''}
                    ${project.rera_number ? `<span class=\"feature\">RERA: ${project.rera_number}</span>` : ''}
                    ${project.possession_date ? `<span class=\"feature\">Possession: ${project.possession_date}</span>` : ''}
                  </div>
                  <div class="project-price">${price ? `₹ ${price}` : ''}</div>
                  <button class="project-btn search-enquiry-btn" data-project-name="${project.project_name || ''}" data-builder-name="${project.builder_name || ''}" data-location="${project.location || ''}" data-project-type="${project.project_type || ''}">Request Call Back</button>
                </div>
              </div>
            `;
            resultsContainer.append(card);
        });

        // Simple image slider rotation similar to projects page
        $('.project-image').each(function() {
            const container = $(this);
            const slides = container.find('.project-image-slide');
            if (slides.length <= 1) {
              return;
            }
            let index = 0;
            setInterval(function() {
              slides.eq(index).removeClass('active');
              index = (index + 1) % slides.length;
              slides.eq(index).addClass('active');
            }, 3000);
        });
    }
});

$(document).on('click', '.search-enquiry-btn', function() {
    const btn = $(this);
    const projectName = btn.data('project-name') || '';
    const builderName = btn.data('builder-name') || '';
    const location = btn.data('location') || '';
    const projectType = btn.data('project-type') || '';

    $('#search-enquiry-project').text(projectName);
    $('#search-enquiry-builder').text(builderName);
    $('#search-enquiry-project-input').val(projectName);
    $('#search-enquiry-builder-input').val(builderName);
    $('#search-enquiry-location').val(location);
    $('#search-enquiry-type').val(projectType);

    const popup = $('#search-box-enquiry-popup');
    popup.attr('aria-hidden', 'false').css('display', 'flex');
    $('body').css('overflow', 'hidden');
});

function closeSearchBoxEnquiryPopup() {
    const popup = $('#search-box-enquiry-popup');
    popup.attr('aria-hidden', 'true').hide();
    $('body').css('overflow', '');
}

$('#search-box-enquiry-close').on('click', function() {
    closeSearchBoxEnquiryPopup();
});

$('#search-box-enquiry-popup').on('click', function(e) {
    if (e.target === this) {
        closeSearchBoxEnquiryPopup();
    }
});

$('#search-box-call-form').on('submit', async function(e) {
    e.preventDefault();
    const form = $('#search-box-call-form');
    const name = form.find('input[name="name"]').val().trim();
    const email = form.find('input[name="email"]').val().trim();
    const phone = form.find('input[name="phone"]').val().trim();
    const location = form.find('input[name="location"]').val().trim();
    const propertyType = form.find('input[name="property_type"]').val().trim();
    const projectName = form.find('input[name="project_name"]').val().trim();
    const builderName = form.find('input[name="builder_name"]').val().trim();

    if (!name || name.length < 2) {
        showToaster('Please enter a valid name.', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showToaster('Please enter a valid email address.', 'error');
        return;
    }

    const phoneClean = phone.replace(/[^0-9]/g, '');
    if (!phoneClean || phoneClean.length !== 10 || !/^[6-9]\d{9}$/.test(phoneClean)) {
        showToaster('Please enter a valid 10-digit mobile number.', 'error');
        return;
    }

    const payload = {
        name: name,
        email: email,
        phone: phoneClean,
        location: location,
        property_type: propertyType,
        project_name: projectName,
        builder_name: builderName
    };

    const submitBtn = form.find('button[type="submit"]');
    const prevHtml = submitBtn.html();
    submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Submitting...');

    try {
        const response = await fetch('/api/search-box-enquiries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            const msg = data && data.error ? data.error : 'Failed to submit enquiry.';
            showToaster(msg, 'error');
        } else {
            showToaster(data.message || 'Enquiry submitted successfully.', 'success');
            form[0].reset();
            closeSearchBoxEnquiryPopup();
        }
    } catch (err) {
        showToaster('Network error. Please try again.', 'error');
    } finally {
        submitBtn.prop('disabled', false).html(prevHtml);
    }
});
