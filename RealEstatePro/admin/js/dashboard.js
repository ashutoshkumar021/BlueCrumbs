document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login.html';
        return;
    }
    
    async function fetchUserProperties() {
        try {
            const properties = await api.getUserProperties();
            userProperties = properties || [];
            const tbody = document.getElementById('user-properties-table-body');
            if (!tbody) return;
            if (!userProperties.length) {
                tbody.innerHTML = '<tr><td colspan="13">No user properties found.</td></tr>';
                return;
            }
            tbody.innerHTML = userProperties.map(prop => {
                const id = prop._id || prop.id;
                const created = prop.createdAt ? new Date(prop.createdAt).toLocaleDateString() : '';
                return `
                    <tr>
                        <td>${prop.project_name || ''}</td>
                        <td>${prop.builder_name || ''}</td>
                        <td>${prop.project_type || ''}</td>
                        <td>${prop.min_price || ''}</td>
                        <td>${prop.max_price || ''}</td>
                        <td>${prop.size_sqft || ''}</td>
                        <td>${prop.bhk || ''}</td>
                        <td>${prop.status_possession || ''}</td>
                        <td>${prop.location || ''}</td>
                        <td>${prop.owner_name || ''}</td>
                        <td>${prop.owner_phone || ''}</td>
                        <td>${created}</td>
                        <td>
                            <button class="btn-action edit" onclick="editUserProperty('${id}')" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-action delete" onclick="deleteUserProperty('${id}')" title="Delete"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            const tbody = document.getElementById('user-properties-table-body');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="13">Error loading user properties.</td></tr>';
            }
            showToaster('Error loading user properties', 'error');
        }
    }

    async function fetchUserProjectCallbacks() {
        try {
            const callbacks = await api.getUserProjectCallbacks();
            const tbody = document.getElementById('user-project-callbacks-table-body');
            if (!tbody) return;
            if (!callbacks || !callbacks.length) {
                tbody.innerHTML = '<tr><td colspan="7">No callbacks found for user posted properties.</td></tr>';
                return;
            }
            tbody.innerHTML = callbacks.map(cb => {
                const created = cb.createdAt ? new Date(cb.createdAt).toLocaleDateString() : '';
                return `
                    <tr>
                        <td>${cb.name || ''}</td>
                        <td>${cb.email || ''}</td>
                        <td>${cb.phone || ''}</td>
                        <td>${cb.project_name || ''}</td>
                        <td>${cb.builder_name || ''}</td>
                        <td>${created}</td>
                        <td>
                            <button class="btn-action delete" onclick="deleteUserProjectCallback('${cb._id || cb.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            const tbody = document.getElementById('user-project-callbacks-table-body');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7">Error loading callbacks.</td></tr>';
            }
            showToaster('Error loading callbacks', 'error');
        }
    }

    window.editUserProperty = async function(id) {
        const prop = userProperties.find(p => (p._id || p.id) === id);
        if (!prop) return;

        const newMinPrice = prompt('Update minimum price', prop.min_price || '');
        if (newMinPrice === null) return;

        const newMaxPrice = prompt('Update maximum price', prop.max_price || '');
        if (newMaxPrice === null) return;

        const newStatus = prompt('Update status', prop.status_possession || '');
        if (newStatus === null) return;

        const newLocation = prompt('Update location', prop.location || '');
        if (newLocation === null) return;

        const payload = {
            project_name: prop.project_name,
            builder_name: prop.builder_name,
            project_type: prop.project_type,
            min_price: newMinPrice,
            max_price: newMaxPrice,
            size_sqft: prop.size_sqft,
            bhk: prop.bhk,
            status_possession: newStatus,
            location: newLocation,
            rera_number: prop.rera_number,
            possession_date: prop.possession_date,
            owner_name: prop.owner_name,
            owner_email: prop.owner_email,
            owner_phone: prop.owner_phone
        };

        try {
            await api.updateUserProperty(id, payload);
            showToaster('Property updated', 'success');
            fetchUserProperties();
        } catch (error) {
            showToaster(error.message || 'Error updating property', 'error');
        }
    };

    window.deleteUserProperty = async function(id) {
        if (!confirm('Delete this property?')) return;
        try {
            await api.deleteUserProperty(id);
            showToaster('Property deleted', 'success');
            fetchUserProperties();
        } catch (error) {
            showToaster(error.message || 'Error deleting property', 'error');
        }
    };

    const logoutButton = document.getElementById('logout-button');
    const tableBody = document.getElementById('inquiries-table-body');
    const searchInput = document.getElementById('search-input');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const filterButton = document.getElementById('filter-button');
    const clearFilterButton = document.getElementById('clear-filter-button');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const deleteModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteButton = document.getElementById('confirm-delete-button');
    const addPropertyModal = document.getElementById('add-property-modal');
    const openAddPropertyBtn = document.getElementById('open-add-property');

    let userProperties = [];
    let adminProjects = [];

    document.querySelectorAll('.cancel-modal-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const overlay = btn.closest('.modal-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        });
    });

    if (openAddPropertyBtn && addPropertyModal) {
        openAddPropertyBtn.addEventListener('click', () => {
            addPropertyModal.style.display = 'flex';
        });
    }

    const adminProjectsTableBody = document.getElementById('admin-projects-table-body');
    if (adminProjectsTableBody) {
        adminProjectsTableBody.addEventListener('click', (event) => {
            const btn = event.target.closest('.btn-action');
            if (!btn) return;
            const id = btn.dataset.id;
            const project = adminProjects.find(p => (p._id || p.id) === id);
            if (btn.classList.contains('edit')) {
                if (project) editAdminProject(project);
            } else if (btn.classList.contains('delete')) {
                deleteAdminProject(id);
            } else if (btn.classList.contains('view')) {
                if (project) viewAdminProjectImage(project);
            }
        });
    }

    // --- Tab Navigation ---
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const topbarTitle = document.querySelector('.topbar-title h2');
    const topbarDesc = document.querySelector('.topbar-title p');
    
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Mobile navigation
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.dataset.tab;
            switchTab(tabName);
            // Close mobile menu
            document.querySelector('.mobile-nav').classList.remove('active');
            document.querySelector('.mobile-nav-overlay').classList.remove('active');
        });
    });
    
    function switchTab(tabName) {
        // Update active menu item
        menuItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Hide all tabs
        tabContents.forEach(tab => tab.style.display = 'none');
        
        // Show selected tab
        document.getElementById(`${tabName}-tab`).style.display = 'block';
        
        // Update title
        const titles = {
            'inquiries': { title: 'Inquiries Dashboard', desc: 'View and manage recent property inquiries.' },
            'newsletter': { title: 'Newsletter Subscribers', desc: 'Manage newsletter subscriptions.' },
            'builder': { title: 'Builder Inquiries', desc: 'View builder-specific inquiries.' },
            'project-callbacks': { title: 'Project Callbacks', desc: 'View callback requests from project pages.' },
            'location': { title: 'Location Inquiries', desc: 'View location-specific property inquiries.' },
            'career': { title: 'Career Submissions', desc: 'Manage job applications.' },
            'user-properties': { title: 'User Properties', desc: 'View and manage properties posted by users.' },
            'user-property-callbacks': { title: 'User Property Callbacks', desc: 'View callback requests for user-posted properties.' },
            'search-box-enquiries': { title: 'SearchBox Enquiries', desc: 'View enquiries submitted from homepage search.' },
            'projects': { title: 'Properties', desc: 'View all properties and add new projects.' }
        };
        
        topbarTitle.textContent = titles[tabName].title;
        topbarDesc.textContent = titles[tabName].desc;
        
        // Load data for the tab
        switch(tabName) {
            case 'inquiries':
                fetchInquiries();
                break;
            case 'newsletter':
                fetchNewsletterSubscribers();
                break;
            case 'builder':
                fetchBuilderInquiries();
                break;
            case 'project-callbacks':
                fetchProjectCallbacks();
                break;
            case 'location':
                fetchLocationInquiries();
                break;
            case 'career':
                fetchCareerSubmissions();
                break;
            case 'user-properties':
                fetchUserProperties();
                break;
            case 'user-property-callbacks':
                fetchUserProjectCallbacks();
                break;
            case 'search-box-enquiries':
                fetchSearchBoxEnquiries();
                break;
            case 'projects':
                fetchAdminProjects();
                break;
        }
    }

    // --- Initial Data Fetch ---
    fetchInquiries();

    // --- Event Listeners ---
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
    });

    filterButton.addEventListener('click', () => fetchInquiries());
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') fetchInquiries();
    });

    clearFilterButton.addEventListener('click', () => {
        searchInput.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
        fetchInquiries();
    });

    // Event delegation for Edit, Delete, and View buttons in the table
    tableBody.addEventListener('click', (event) => {
        const actionButton = event.target.closest('.btn-action');
        if (!actionButton) return;

        const inquiryId = actionButton.dataset.id;
        const row = actionButton.closest('tr');
        
        if (actionButton.classList.contains('edit')) {
            handleEdit(inquiryId, row);
        } else if (actionButton.classList.contains('delete')) {
            openDeleteConfirmation(inquiryId);
        } else if (actionButton.classList.contains('view')) {
            handleView(row);
        }
    });
    
    // Edit Form submission
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('edit-inquiry-id').value;
        const updatedInquiry = {
            name: document.getElementById('edit-name').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value,
        };
        await updateInquiry(id, updatedInquiry);
    });

    // --- Main Functions ---

    async function fetchInquiries() {
        const spinner = document.getElementById('loading-spinner');
        spinner.style.display = 'block';
        tableBody.innerHTML = '';
        
        const filters = {
            search: searchInput.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value
        };

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) delete filters[key];
        });

        try {
            const inquiries = await api.getInquiries(filters);
            renderTable(inquiries);
            updateInquiryStats(inquiries);
        } catch (error) {
            console.error(error);
            showToaster(`Error: ${error.message}`, 'error');
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">${error.message}</td></tr>`;
        } finally {
            spinner.style.display = 'none';
        }
    }
    
    function updateInquiryStats(inquiries) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        let todayCount = 0;
        let weekCount = 0;
        let monthCount = 0;
        
        inquiries.forEach(inquiry => {
            const date = new Date(inquiry.received_at || inquiry.created_at);
            if (date >= today) todayCount++;
            if (date >= weekAgo) weekCount++;
            if (date >= monthAgo) monthCount++;
        });
        
        document.getElementById('total-inquiries').textContent = inquiries.length;
        document.getElementById('today-inquiries').textContent = todayCount;
        document.getElementById('week-inquiries').textContent = weekCount;
        document.getElementById('month-inquiries').textContent = monthCount;
    }

    function renderTable(inquiries) {
        if (inquiries.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No inquiries found.</td></tr>';
            return;
        }
        tableBody.innerHTML = inquiries.map(inquiry => `
            <tr class="${inquiry.urgent ? 'urgent-row' : ''}">
                <td data-label="Name">
                    ${inquiry.name}
                    ${inquiry.urgent ? '<span class="urgent-badge">URGENT</span>' : ''}
                </td>
                <td data-label="Email">${inquiry.email}</td>
                <td data-label="Phone">${inquiry.phone}</td>
                <td data-label="Source">${inquiry.source || 'General'}</td>
                <td data-label="Message">${inquiry.message ? inquiry.message.substring(0, 50) + (inquiry.message.length > 50 ? '...' : '') : 'General enquiry'}</td>
                <td data-label="Date">${new Date(inquiry.received_at || inquiry.timestamp || inquiry.created_at).toLocaleString()}</td>
                <td data-label="Actions" class="actions-cell">
                    <button class="btn-action view" data-id="${inquiry._id || inquiry.id}" title="View Details"><i class="fas fa-eye"></i></button>
                    <button class="btn-action edit" data-id="${inquiry._id || inquiry.id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-action delete" data-id="${inquiry._id || inquiry.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `).join('');
    }

    async function fetchSearchBoxEnquiries() {
        try {
            const enquiries = await api.getSearchBoxEnquiries();
            const tbody = document.getElementById('search-box-enquiries-table-body');
            if (!tbody) return;
            if (!enquiries || !enquiries.length) {
                tbody.innerHTML = '<tr><td colspan="9">No enquiries found.</td></tr>';
                return;
            }
            tbody.innerHTML = enquiries.map(enq => {
                const created = enq.createdAt ? new Date(enq.createdAt).toLocaleString() : '';
                return `
                    <tr>
                        <td>${enq.name || ''}</td>
                        <td>${enq.email || ''}</td>
                        <td>${enq.phone || ''}</td>
                        <td>${enq.location || ''}</td>
                        <td>${enq.property_type || ''}</td>
                        <td>${enq.project_name || ''}</td>
                        <td>${enq.builder_name || ''}</td>
                        <td>${created}</td>
                        <td>
                            <button class="btn-action delete" onclick="deleteSearchBoxEnquiry('${enq._id || enq.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            const tbody = document.getElementById('search-box-enquiries-table-body');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="9">Error loading enquiries.</td></tr>';
            }
            showToaster('Error loading enquiries', 'error');
        }
    }

    window.deleteSearchBoxEnquiry = async function(id) {
        if (!confirm('Delete this enquiry?')) return;
        try {
            await api.deleteSearchBoxEnquiry(id);
            showToaster('Enquiry deleted', 'success');
            fetchSearchBoxEnquiries();
        } catch (error) {
            showToaster(error.message || 'Error deleting enquiry', 'error');
        }
    };

    function openDeleteConfirmation(id) {
        confirmDeleteButton.dataset.id = id;
        deleteModal.style.display = 'flex';
        
        // Remove previous listeners before adding a new one
        confirmDeleteButton.removeEventListener('click', performDelete);
        confirmDeleteButton.addEventListener('click', performDelete);
    }

    async function performDelete() {
        const id = confirmDeleteButton.dataset.id;
        try {
            // Use api.js for delete
            const result = await api.deleteInquiry(id);
            
            showToaster(result.message || 'Inquiry deleted successfully.', 'success');
            fetchInquiries();
        } catch (error) {
            showToaster(error.message, 'error');
        } finally {
            deleteModal.style.display = 'none';
        }
    }
    
    function handleView(tableRow) {
        const name = tableRow.cells[0].innerText.replace('URGENT', '').trim();
        const email = tableRow.cells[1].innerText;
        const phone = tableRow.cells[2].innerText;
        const source = tableRow.cells[3].innerText;
        const message = tableRow.cells[4].innerText;
        const date = tableRow.cells[5].innerText;
        
        // Create a modal to show full details
        const viewModal = document.getElementById('view-modal') || createViewModal();
        const viewContent = document.getElementById('view-content');
        
        viewContent.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #0d2c54;">Inquiry Details</h3>
            <div style="margin-bottom: 15px;">
                <strong>Name:</strong> ${name}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Email:</strong> ${email}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Phone:</strong> ${phone}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Source:</strong> ${source}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Message:</strong> ${message}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Date:</strong> ${date}
            </div>
        `;
        
        viewModal.style.display = 'flex';
    }
    
    function createViewModal() {
        const modal = document.createElement('div');
        modal.id = 'view-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="document.getElementById('view-modal').style.display='none'">&times;</span>
                <div id="view-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
    
    function handleEdit(id, tableRow) {
        const name = tableRow.cells[0].innerText.replace('URGENT', '').trim(); // Clean up badge text
        const email = tableRow.cells[1].innerText;
        const phone = tableRow.cells[2].innerText;
        document.getElementById('edit-inquiry-id').value = id;
        document.getElementById('edit-name').value = name;
        document.getElementById('edit-email').value = email;
        document.getElementById('edit-phone').value = phone;
        editModal.style.display = 'flex';
    }

    async function updateInquiry(id, data) {
        try {
            // Use api.js for update
            const result = await api.updateInquiry(id, data);
            
            showToaster(result.message || 'Inquiry updated successfully.', 'success');
            editModal.style.display = 'none';
            fetchInquiries();
        } catch (error) {
            showToaster(error.message, 'error');
        }
    }

    function showToaster(message, type = 'success') {
        const toaster = document.getElementById('toaster');
        toaster.textContent = message;
        toaster.className = `show ${type}`;
        setTimeout(() => { toaster.className = toaster.className.replace('show', ''); }, 2000);
    }
    
    async function fetchAdminProjects() {
        try {
            const response = await fetch('/api/projects/search');
            const projects = await response.json();
            adminProjects = Array.isArray(projects) ? projects : [];
            const tbody = document.getElementById('admin-projects-table-body');
            if (!tbody) return;
            if (!adminProjects.length) {
                tbody.innerHTML = '<tr><td colspan="12">No properties found.</td></tr>';
                return;
            }
            tbody.innerHTML = adminProjects.map(p => {
                const id = p._id || p.id;
                const photo = Array.isArray(p.photos) && p.photos.length ? p.photos[0] : '';
                return `
                <tr>
                    <td>${p.project_name || ''}</td>
                    <td>${p.builder_name || ''}</td>
                    <td>${p.project_type || ''}</td>
                    <td>${p.min_price || ''}</td>
                    <td>${p.max_price || ''}</td>
                    <td>${p.size_sqft || ''}</td>
                    <td>${p.bhk || ''}</td>
                    <td>${p.status_possession || ''}</td>
                    <td>${p.location || ''}</td>
                    <td>${p.rera_number || ''}</td>
                    <td>${p.possession_date || ''}</td>
                    <td>
                        <button class="btn-action view" data-id="${id}" data-photo="${photo}"><i class="fas fa-image"></i></button>
                        <button class="btn-action edit" data-id="${id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-action delete" data-id="${id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
                `;
            }).join('');
        } catch (error) {
            const tbody = document.getElementById('admin-projects-table-body');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="12">Error loading properties.</td></tr>';
            }
            showToaster('Error loading properties', 'error');
        }
    }

    function viewAdminProjectImage(project) {
        const photos = Array.isArray(project.photos) ? project.photos : [];
        const url = photos.length ? photos[0] : '';
        if (!url) {
            showToaster('No images for this property', 'error');
            return;
        }
        window.open(url, '_blank');
    }

    async function editAdminProject(project) {
        const id = project._id || project.id;
        if (!id) return;
        const newMinPrice = prompt('Update min price', project.min_price || '');
        if (newMinPrice === null) return;
        const newMaxPrice = prompt('Update max price', project.max_price || '');
        if (newMaxPrice === null) return;
        const newStatus = prompt('Update status', project.status_possession || '');
        if (newStatus === null) return;
        const newLocation = prompt('Update location', project.location || '');
        if (newLocation === null) return;
        const newRera = prompt('Update RERA number', project.rera_number || '');
        if (newRera === null) return;
        const newPossession = prompt('Update possession date', project.possession_date || '');
        if (newPossession === null) return;

        const payload = {
            project_name: project.project_name,
            builder_name: project.builder_name,
            project_type: project.project_type,
            min_price: newMinPrice,
            max_price: newMaxPrice,
            size_sqft: project.size_sqft,
            bhk: project.bhk,
            status_possession: newStatus,
            location: newLocation,
            rera_number: newRera,
            possession_date: newPossession
        };

        try {
            const response = await fetch(`/api/admin/properties/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) {
                showToaster(result.error || 'Failed to update property', 'error');
                return;
            }
            showToaster('Property updated', 'success');
            fetchAdminProjects();
        } catch (error) {
            showToaster(error.message || 'Error updating property', 'error');
        }
    }

    async function deleteAdminProject(id) {
        if (!confirm('Delete this property?')) return;
        try {
            const response = await fetch(`/api/admin/properties/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (!response.ok) {
                showToaster(result.error || 'Failed to delete property', 'error');
                return;
            }
            showToaster('Property deleted', 'success');
            fetchAdminProjects();
        } catch (error) {
            showToaster(error.message || 'Error deleting property', 'error');
        }
    }

    // --- Newsletter Functions ---
    async function fetchNewsletterSubscribers() {
        try {
            const response = await fetch('/api/admin/newsletter-subscriptions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const subscribers = await response.json();
            
            const tbody = document.getElementById('newsletter-table-body');
            if (subscribers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3">No subscribers yet.</td></tr>';
                return;
            }
            
            tbody.innerHTML = subscribers.map(sub => `
                <tr>
                    <td>${sub.email}</td>
                    <td>${new Date(sub.subscribed_at || sub.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-action delete" onclick="deleteSubscriber('${sub._id || sub.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            showToaster('Error loading subscribers', 'error');
        }
    }
    
    // Copy all emails function
    document.getElementById('copy-all-emails').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/admin/newsletter-subscriptions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const subscribers = await response.json();
            const emails = subscribers.map(s => s.email).join(', ');
            
            navigator.clipboard.writeText(emails);
            showToaster(`Copied ${subscribers.length} email(s) to clipboard!`, 'success');
        } catch (error) {
            showToaster('Error copying emails', 'error');
        }
    });
    
    window.deleteSubscriber = async function(id) {
        if (!confirm('Delete this subscriber?')) return;
        
        try {
            await fetch(`/api/admin/newsletter-subscriptions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToaster('Subscriber deleted', 'success');
            fetchNewsletterSubscribers();
        } catch (error) {
            showToaster('Error deleting subscriber', 'error');
        }
    }
    
    async function fetchProjectCallbacks() {
        try {
            const response = await fetch('/api/admin/project-callbacks', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const callbacks = await response.json();
            const tbody = document.getElementById('project-callbacks-table-body');
            if (!tbody) return;
            if (!callbacks.length) {
                tbody.innerHTML = '<tr><td colspan="7">No project callbacks yet.</td></tr>';
                return;
            }
            tbody.innerHTML = callbacks.map(cb => `
                <tr>
                    <td>${cb.name}</td>
                    <td>${cb.email}</td>
                    <td>${cb.phone}</td>
                    <td>${cb.project_name}</td>
                    <td>${cb.builder_name || ''}</td>
                    <td>${cb.createdAt ? new Date(cb.createdAt).toLocaleDateString() : ''}</td>
                    <td>
                        <button class="btn-action delete" onclick="deleteProjectCallback('${cb._id || cb.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            showToaster('Error loading project callbacks', 'error');
        }
    }

    window.deleteProjectCallback = async function(id) {
        if (!confirm('Delete this callback?')) return;
        try {
            await fetch(`/api/admin/project-callbacks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToaster('Callback deleted', 'success');
            fetchProjectCallbacks();
        } catch (error) {
            showToaster('Error deleting callback', 'error');
        }
    }

    window.deleteUserProjectCallback = async function(id) {
        if (!confirm('Delete this callback?')) return;
        try {
            await api.deleteUserProjectCallback(id);
            showToaster('Callback deleted', 'success');
            fetchUserProjectCallbacks();
        } catch (error) {
            showToaster(error.message || 'Error deleting callback', 'error');
        }
    }

    // --- Builder Inquiries Functions ---
    async function fetchBuilderInquiries() {
        try {
            const response = await fetch('/api/admin/builder-inquiries', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const inquiries = await response.json();
            
            const tbody = document.getElementById('builder-table-body');
            if (inquiries.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">No builder inquiries yet.</td></tr>';
                return;
            }
            
            tbody.innerHTML = inquiries.map(inq => `
                <tr>
                    <td>${inq.name}</td>
                    <td>${inq.email}</td>
                    <td>${inq.phone}</td>
                    <td>${inq.builder_name}</td>
                    <td>${inq.project || 'All'}</td>
                    <td>${new Date(inq.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-action delete" onclick="deleteBuilderInquiry('${inq._id || inq.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            showToaster('Error loading builder inquiries', 'error');
        }
    }
    
    window.deleteBuilderInquiry = async function(id) {
        if (!confirm('Delete this inquiry?')) return;
        
        try {
            await fetch(`/api/admin/builder-inquiries/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToaster('Inquiry deleted', 'success');
            fetchBuilderInquiries();
        } catch (error) {
            showToaster('Error deleting inquiry', 'error');
        }
    }
    
    // --- Location Inquiries Functions ---
    async function fetchLocationInquiries() {
        try {
            const response = await fetch('/api/admin/location-inquiries', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const inquiries = await response.json();
            
            const tbody = document.getElementById('location-table-body');
            if (inquiries.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9">No location inquiries yet.</td></tr>';
                return;
            }
            
            tbody.innerHTML = inquiries.map(inq => `
                <tr>
                    <td>${inq.name}</td>
                    <td>${inq.email}</td>
                    <td>${inq.phone}</td>
                    <td>${inq.location_name}</td>
                    <td>${inq.property_type || 'Any'}</td>
                    <td>${inq.budget || 'Not specified'}</td>
                    <td>
                        <select onchange="updateLocationStatus('${inq._id || inq.id}', this.value)">
                            <option value="pending" ${inq.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="contacted" ${inq.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                            <option value="converted" ${inq.status === 'converted' ? 'selected' : ''}>Converted</option>
                            <option value="not_interested" ${inq.status === 'not_interested' ? 'selected' : ''}>Not Interested</option>
                        </select>
                    </td>
                    <td>${new Date(inq.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-action delete" onclick="deleteLocationInquiry('${inq._id || inq.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            showToaster('Error loading location inquiries', 'error');
        }
    }
    
    window.updateLocationStatus = async function(id, status) {
        try {
            await fetch(`/api/admin/location-inquiries/${id}/status`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            showToaster('Status updated', 'success');
        } catch (error) {
            showToaster('Error updating status', 'error');
        }
    }
    
    window.deleteLocationInquiry = async function(id) {
        if (!confirm('Delete this location inquiry?')) return;
        
        try {
            await fetch(`/api/admin/location-inquiries/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToaster('Inquiry deleted', 'success');
            fetchLocationInquiries();
        } catch (error) {
            showToaster('Error deleting inquiry', 'error');
        }
    }
    
    // --- Career Submissions Functions ---
    async function fetchCareerSubmissions() {
        try {
            const response = await fetch('/api/admin/career-submissions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const submissions = await response.json();
            
            const tbody = document.getElementById('career-table-body');
            if (submissions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8">No career submissions yet.</td></tr>';
                return;
            }
            
            tbody.innerHTML = submissions.map(sub => `
                <tr>
                    <td>${sub.name}</td>
                    <td>${sub.email}</td>
                    <td>${sub.phone}</td>
                    <td>${sub.position}</td>
                    <td>${sub.experience || 'N/A'}</td>
                    <td>
                        <select onchange="updateCareerStatus('${sub._id || sub.id}', this.value)">
                            <option value="pending" ${sub.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="reviewed" ${sub.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                            <option value="rejected" ${sub.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </td>
                    <td>${new Date(sub.submitted_at || sub.created_at).toLocaleDateString()}</td>
                    <td>
                        ${sub.resume_url && (/^https?:\/\//.test(sub.resume_url) || sub.resume_url.startsWith('/uploads/')) ? `<a href="${sub.resume_url}" target="_blank" class="btn-action view" title="Open Resume"><i class="fas fa-download"></i></a>` : ''}
                        <button class="btn-action delete" onclick="deleteCareerSubmission('${sub._id || sub.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            showToaster('Error loading career submissions', 'error');
        }
    }
    
    window.updateCareerStatus = async function(id, status) {
        try {
            await fetch(`/api/admin/career-submissions/${id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            showToaster('Status updated', 'success');
        } catch (error) {
            showToaster('Error updating status', 'error');
        }
    }
    
    window.updateCareerStatus = async function(id, status) {
        try {
            await fetch(`/api/admin/career-submissions/${id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            showToaster('Status updated', 'success');
        } catch (error) {
            showToaster('Error updating status', 'error');
        }
    }
    
    const addPropertyForm = document.getElementById('add-property-form');
    if (addPropertyForm) {
        addPropertyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = addPropertyForm.querySelector('button[type="submit"], input[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
            }
            try {
                const fd = new FormData(addPropertyForm);
                const response = await fetch('/api/admin/properties', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: fd
                });
                const result = await response.json();
                if (response.ok) {
                    showToaster('Property added successfully!', 'success');
                    addPropertyForm.reset();
                    if (addPropertyModal) {
                        addPropertyModal.style.display = 'none';
                    }
                    fetchAdminProjects();
                } else if (response.status === 409) {
                    const message = result && result.error ? result.error : 'This property already exists with the same name';
                    showToaster(message, 'warning');
                    addPropertyForm.project_name.style.borderColor = '#ffc107';
                    setTimeout(() => {
                        addPropertyForm.project_name.style.borderColor = '';
                    }, 3000);
                } else {
                    showToaster(result.error || 'Failed to add property', 'error');
                }
            } catch (error) {
                showToaster('Error adding property: ' + error.message, 'error');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        });
    }
    
    window.deleteCareerSubmission = async function(id) {
        if (!confirm('Delete this submission?')) return;
        
        try {
            await fetch(`/api/admin/career-submissions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showToaster('Submission deleted', 'success');
            fetchCareerSubmissions();
        } catch (error) {
            showToaster('Error deleting submission', 'error');
        }
    }
    
    // --- Add Property Form --- (Removed duplicate event listener)
});