require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

// Builder name normalization function
function normalizeBuilderName(builderName) {
  if (!builderName) return builderName;
  
  const builderNameLower = builderName.toLowerCase().trim();
  
  // Builder name mappings
  const builderMappings = {
    'ace group': 'Ace Group',
    'acegroup': 'Ace Group',
    'homecraft group': 'ATS Homekraft',
    'homecraft': 'ATS Homekraft',
    'home kraft': 'ATS Homekraft',
    'homekraft': 'ATS Homekraft',
    'bhutani group': 'Bhutani',
    'bhutani': 'Bhutani',
    'crc group': 'CRC',
    'crc': 'CRC',
    'eldeco group': 'Eldeco',
    'eldeco': 'Eldeco',
    'exotica group': 'Exotica',
    'exotica': 'Exotica',
    'experion group': 'Experion',
    'experion': 'Experion',
    'fairfox group': 'Fairfox',
    'fairfox': 'Fairfox',
    'godrej properties': 'Godrej',
    'godrej': 'Godrej',
    'group 108': 'Group 108',
    'group108': 'Group 108',
    'gulshan group': 'Gulshan',
    'gulshan': 'Gulshan',
    'kalpataru group': 'Kalpataru',
    'kalpataru': 'Kalpataru',
    'kalptaru': 'Kalpataru',
    'kalpatru': 'Kalpataru',
    'max estates': 'Max Estates',
    'max estate': 'Max Estates',
    'maxestates': 'Max Estates',
    'prestige group': 'Prestige',
    'prestige': 'Prestige',
    'sobha': 'Sobha',
    'sobha group': 'Sobha',
    'stellar group': 'Stellar',
    'stellar': 'Stellar',
    'tata housing': 'Tata',
    'tata': 'Tata',
    'ats group': 'ATS Greens',
    'ats green': 'ATS Greens',
    'ats greens': 'ATS Greens',
    'ats homekraft': 'ATS Homekraft',
    'ats homecraft': 'ATS Homekraft',
    ' homecraft': 'ATS Homekraft',
    'ats': 'ATS Greens',
    'l&t realty': 'L&T Realty',
    'l&t': 'L&T Realty',
    'l & t': 'L&T Realty',
    'l and t': 'L&T Realty',
    'lt realty': 'L&T Realty',
    'm3m group': 'M3M',
    'm3m india': 'M3M',
    'm3m': 'M3M'
  };
  
  // Check if the builder name contains any of the mapped keywords
  for (const [key, value] of Object.entries(builderMappings)) {
    if (builderNameLower.includes(key)) {
      return value;
    }
  }
  
  // Return original name if no mapping found
  return builderName;
}

// Location normalization function
function normalizeLocation(location) {
  if (!location) return location;
  
  const locationLower = location.toLowerCase().trim();
  
  // Location mappings - check for partial matches first
  const locationMappings = {
    'graeter noida': 'Greater Noida',
    'graeter': 'Greater Noida',
    'greater': 'Greater Noida',
    'greater noida': 'Greater Noida',
    'g noida': 'Greater Noida',
    'gtnoida': 'Greater Noida',
    'greater noida west': 'Greater Noida West',
    'noida': 'Noida',
    'noida extension': 'Noida Extension',
    'noida ext': 'Noida Extension',
    'noidaext': 'Noida Extension',
    'ext': 'Noida Extension',
    'ghaziabad': 'Ghaziabad',
    'dhulera': 'Dhulera',
    'yamuna': 'Yamuna Expressway',
    'yamuna expressway': 'Yamuna Expressway',
    'yamuna exp': 'Yamuna Expressway',
    'yamuna express': 'Yamuna Expressway',
    'yamunaexp': 'Yamuna Expressway',
    'delhi': 'Delhi',
    'new delhi': 'Delhi',
    'ncr': 'NCR',
    'national capital region': 'NCR'
  };
  
  // Check if the location contains any of the mapped keywords
  for (const [key, value] of Object.entries(locationMappings)) {
    if (locationLower.includes(key)) {
      return value;
    }
  }
  
  // Return original location if no mapping found
  return location.trim();
}
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { connectDB, mongoose } = require('./mongodb');
const mailer = require('./mailer');

// Import all models
const Admin = require('./models/Admin');
const Inquiry = require('./models/Inquiry');
const NewsletterSubscription = require('./models/NewsletterSubscription');
const CareerSubmission = require('./models/CareerSubmission');
const RealEstateProject = require('./models/RealEstateProject');
const BuilderInquiry = require('./models/BuilderInquiry');
const LocationInquiry = require('./models/LocationInquiry');
const UserProperty = require('./models/UserProperty');
const ProjectCallback = require('./models/ProjectCallback');
const UserProjectCallback = require('./models/UserProjectCallback');
const SerchBoxForm = require('./models/SerchBoxForm');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
connectDB();
ensureDefaultAdmins();

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Add CORS headers for API routes only
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        res.header('Content-Type', 'application/json');
    }
    next();
});

// Serve static files with proper paths
const publicPath = path.join(__dirname, '..', 'public');
const adminPath = path.join(__dirname, '..', 'admin');

const resumesUploadDir = path.join(__dirname, 'uploads', 'resumes');
if (!fs.existsSync(resumesUploadDir)) {
    fs.mkdirSync(resumesUploadDir, { recursive: true });
}

const resumesStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, resumesUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '';
        cb(null, 'resume-' + uniqueSuffix + ext);
    }
});

app.post('/api/project-callback', async (req, res) => {
    const { name, email, phone, project_name, builder_name } = req.body;

    if (!name || !email || !phone || !project_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }

    try {
        // Normalize builder name
        const normalizedBuilderName = normalizeBuilderName(builder_name);
        
        const callback = new ProjectCallback({
            name,
            email,
            phone,
            project_name,
            builder_name: normalizedBuilderName
        });

        await callback.save();

        try {
            const emailData = {
                name,
                email,
                phone,
                builder_name: builder_name || 'Project Inquiry',
                project: project_name,
                message: 'Project callback request from projects page',
                source: 'Projects Page Callback',
                urgent: true
            };
            await mailer.sendFormEmails('builder', emailData);
        } catch (emailErr) {
            console.error('Error sending project callback emails:', emailErr);
        }

        res.status(201).json({ success: true, message: 'Request submitted successfully', id: callback._id });
    } catch (err) {
        console.error('Error saving project callback:', err);
        res.status(500).json({ error: 'Failed to submit request' });
    }
});

// User Project Callback (for user-posted properties)
app.post('/api/user-project-callback', async (req, res) => {
    const { name, email, phone, project_name, builder_name, user_property_id } = req.body;

    if (!name || !email || !phone || !project_name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }

    try {
        // Normalize builder name
        const normalizedBuilderName = normalizeBuilderName(builder_name);
        
        const callback = new UserProjectCallback({
            name,
            email,
            phone,
            project_name,
            builder_name: normalizedBuilderName,
            user_property_id
        });

        await callback.save();

        res.status(201).json({
            success: true,
            message: 'Request submitted successfully',
            id: callback._id
        });
    } catch (err) {
        console.error('Error saving user project callback:', err);
        res.status(500).json({ error: 'Failed to submit request' });
    }
});

const uploadResume = multer({ storage: resumesStorage });
const uploadPropertyPhotos = multer({ storage: multer.memoryStorage() });

app.use(express.static(publicPath));
app.use('/admin', express.static(adminPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Explicitly handle admin routes
app.get('/admin/login.html', (req, res) => {
    res.sendFile(path.join(adminPath, 'login.html'));
});

app.get('/admin/dashboard.html', (req, res) => {
    res.sendFile(path.join(adminPath, 'dashboard.html'));
});

// Serve admin CSS and JS files
app.use('/admin/css', express.static(path.join(adminPath, 'css')));
app.use('/admin/js', express.static(path.join(adminPath, 'js')));

// Redirect /admin to /admin/login.html
app.get('/admin', (req, res) => {
    res.redirect('/admin/login.html');
});

app.get('/admin/', (req, res) => {
    res.redirect('/admin/login.html');
});

// Middleware to protect admin routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function ensureDefaultAdmins() {
    try {
        const admins = [
            {
                email: (process.env.ADMIN_EMAIL || 'bluecrumbsinfra@gmail.com').trim().toLowerCase(),
                password: 'Bluecrumbs@56789'
            },
            {
                email: 'ashutosh@admin.com',
                password: 'Admin@7516'
            }
        ];

        for (const data of admins) {
            const existing = await Admin.findOne({ email: data.email });
            if (!existing) {
                const admin = new Admin(data);
                await admin.save();
            }
        }
    } catch (err) {
        console.error('Error ensuring default admins:', err);
    }
}

// =========================================================================
// ADMIN AUTHENTICATION ENDPOINTS
// =========================================================================

// Admin Login
app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const normalizedEmail = email.trim().toLowerCase();
        let user = await Admin.findOne({ email: normalizedEmail });

        if (!user) {
            const adminEmail = (process.env.ADMIN_EMAIL || 'bluecrumbsinfra@gmail.com').trim().toLowerCase();
            if (normalizedEmail === adminEmail) {
                const admin = new Admin({
                    email: adminEmail,
                    password: 'Bluecrumbs@56789'
                });
                await admin.save();
                user = admin;
            } else {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }

        if (!user.password) {
            return res.status(401).json({ error: 'Password not set. Please reset your password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (isMatch) {
            const accessToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token: accessToken, message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Login (API route)
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const normalizedEmail = email.trim().toLowerCase();
        let user = await Admin.findOne({ email: normalizedEmail });

        if (!user) {
            const adminEmail = (process.env.ADMIN_EMAIL || 'bluecrumbsinfra@gmail.com').trim().toLowerCase();
            if (normalizedEmail === adminEmail) {
                const admin = new Admin({
                    email: adminEmail,
                    password: 'Bluecrumbs@56789'
                });
                await admin.save();
                user = admin;
            } else {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }

        if (!user.password) {
            return res.status(401).json({ error: 'Password not set. Please reset your password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (isMatch) {
            const accessToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token: accessToken, message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Password Reset
app.post('/api/admin/request-reset-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const admin = await Admin.findOne({ email: normalizedEmail });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const otp = generateOtp();
        admin.resetOtp = otp;
        admin.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await admin.save();

        const subject = 'Admin password reset OTP';
        const text = 'Your OTP for admin password reset is ' + otp + '. It is valid for 10 minutes.';
        const html = '<p>Your OTP for admin password reset is <strong>' + otp + '</strong>. It is valid for 10 minutes.</p>';
        await mailer.sendMail(admin.email, subject, text, html);

        res.json({ success: true, message: 'OTP sent to your email' });
    } catch (err) {
        console.error('Request reset OTP error:', err);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

app.post('/api/admin/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP and new password are required' });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const admin = await Admin.findOne({ email: normalizedEmail });
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        if (!admin.resetOtp || !admin.resetOtpExpires) {
            return res.status(400).json({ error: 'OTP not requested' });
        }

        if (admin.resetOtp !== otp || admin.resetOtpExpires < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        admin.password = newPassword;
        admin.resetOtp = undefined;
        admin.resetOtpExpires = undefined;
        await admin.save();

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        console.error('Password reset error:', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// =========================================================================
// NEWSLETTER SUBSCRIPTION ENDPOINTS
// =========================================================================

app.post('/api/newsletter', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const existing = await NewsletterSubscription.findOne({ email });
        
        if (existing) {
            return res.status(409).json({ error: 'This email is already subscribed to our newsletter' });
        }
        
        const subscription = new NewsletterSubscription({ email });
        await subscription.save();
        
        try {
            const emailResults = await mailer.sendFormEmails('newsletter', {
                email: email,
                name: 'Newsletter Subscriber'
            });
            console.log('Newsletter subscription emails sent:', emailResults);
        } catch (emailErr) {
            console.error('Newsletter email failed:', emailErr);
        }
        
        res.status(201).json({ success: true, message: 'Successfully subscribed to newsletter!' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'This email is already subscribed' });
        }
        console.error('Database error in /api/newsletter:', err);
        res.status(500).json({ error: 'Failed to process subscription' });
    }
});

// =========================================================================
// CAREER SUBMISSION ENDPOINTS
// =========================================================================

app.post('/api/career', uploadResume.single('resume'), async (req, res) => {
    const { name, email, phone, position, experience, cover_letter, message } = req.body;
    
    if (!name || !email || !phone || !position) {
        return res.status(400).json({ error: 'Required fields missing' });
    }
    
    try {
        // Check for existing application for the same position
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const existingApplication = await CareerSubmission.findOne({
            email: email.toLowerCase(),
            position: position,
            createdAt: { $gte: oneMonthAgo }
        });

        if (existingApplication) {
            return res.status(409).json({ 
                error: `You have already applied for the position of ${position} recently. We will review your application and contact you soon.` 
            });
        }
        
        // Check for any recent application (within 24 hours)
        const oneDayAgoCheck = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingSubmission = await CareerSubmission.findOne({
            email,
            submitted_at: { $gte: oneDayAgoCheck }
        });
        
        if (existingSubmission) {
            return res.status(409).json({ error: 'You have already submitted an application recently. We will review it soon.' });
        }
        
        let fileWebPath = null;
        if (req.file && req.file.filename) {
            fileWebPath = '/uploads/resumes/' + req.file.filename;
        }

        const submission = new CareerSubmission({
            name,
            email,
            phone,
            position,
            experience: experience || null,
            resume_url: fileWebPath,
            cover_letter: cover_letter || message || null,
            status: 'pending'
        });
        
        await submission.save();
        
        try {
            const emailResults = await mailer.sendFormEmails('career', {
                name: name,
                email: email,
                phone: phone,
                position: position,
                experience: experience,
                resume_path: fileWebPath,
                message: message || `Applied for: ${position}`,
                urgent: false
            });
            console.log('Career application emails sent:', emailResults);
        } catch (emailErr) {
            console.error('Email error:', emailErr);
        }
        
        res.status(201).json({ success: true, message: 'Application submitted successfully', id: submission._id });
    } catch (err) {
        console.error('Career submission error:', err);
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

// =========================================================================
// REAL ESTATE PROJECTS ENDPOINTS
// =========================================================================

app.get('/api/projects/search', async (req, res) => {
    try {
        const { 
            location, 
            bhk, 
            builder,
            minPrice,
            maxPrice,
            status,
            projectType,
            searchTerm,
            includeUsers
        } = req.query;
        
        let query = {};
        
        if (location && location !== 'all') {
            const normalizedLocation = normalizeLocation(location);
            query.base_location = normalizedLocation;
        }
        
        if (bhk && bhk !== 'all') {
            query.bhk = new RegExp(bhk, 'i');
        }
        
        if (builder && builder !== 'all') {
            const normalizedBuilder = normalizeBuilderName(builder);
            query.builder_name = new RegExp(normalizedBuilder, 'i');
        }
        
        if (status && status !== 'all') {
            query.status_possession = status;
        }
        
        if (projectType && projectType !== 'all') {
            query.project_type = projectType;
        }
        
        if (searchTerm) {
            const normalizedSearchLocation = normalizeLocation(searchTerm);
            query.$or = [
                { project_name: new RegExp(searchTerm, 'i') },
                { builder_name: new RegExp(searchTerm, 'i') },
                { location: new RegExp(searchTerm, 'i') },
                { base_location: new RegExp(normalizedSearchLocation, 'i') }
            ];
        }

        const includeUserProperties = includeUsers === 'true' || includeUsers === '1';

        if (includeUserProperties) {
            const [projects, userProperties] = await Promise.all([
                RealEstateProject.find(query).sort({ project_name: 1 }),
                UserProperty.find(query).sort({ project_name: 1 })
            ]);
            const combined = projects.concat(userProperties);
            res.json(combined);
            return;
        }
        
        const results = await RealEstateProject.find(query).sort({ project_name: 1 });
        res.json(results);
        
    } catch (err) {
        console.error('Error searching projects:', err);
        res.status(500).json({ error: 'Failed to search projects' });
    }
});

app.get('/api/projects/locations', async (req, res) => {
    try {
        const locations = await RealEstateProject.distinct('location');
        res.json(locations.filter(loc => loc).sort());
    } catch (err) {
        console.error('Error fetching locations:', err);
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

app.get('/api/projects/builders', async (req, res) => {
    try {
        const builders = await RealEstateProject.distinct('builder_name');
        res.json(builders.filter(builder => builder).sort());
    } catch (err) {
        console.error('Error fetching builders:', err);
        res.status(500).json({ error: 'Failed to fetch builders' });
    }
});

app.post('/api/user-properties', uploadPropertyPhotos.array('photos', 3), async (req, res) => {
    const {
        project_name,
        builder_name,
        project_type,
        min_price,
        max_price,
        size_sqft,
        bhk,
        status_possession,
        location,
        rera_number,
        possession_date,
        owner_name,
        owner_email,
        owner_phone
    } = req.body;

    if (!project_name || !builder_name || !project_type || !min_price || !max_price || !size_sqft || !bhk || !status_possession || !location || !owner_name || !owner_email || !owner_phone) {
        return res.status(400).json({ error: 'Required fields are missing' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(owner_email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(owner_phone)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }

    try {
        // Normalize builder name and location
        const normalizedBuilderName = normalizeBuilderName(builder_name);
        const normalizedLocation = normalizeLocation(location);
        
        // Handle photo uploads
        let photos = [];
        if (req.files && req.files.length) {
            const uploadPromises = req.files.map(file => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream({ folder: 'user-properties' }, (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url || result.url);
                    });
                    stream.end(file.buffer);
                });
            });
            photos = await Promise.all(uploadPromises);
        }

        const property = new UserProperty({
            project_name,
            builder_name: normalizedBuilderName,
            project_type,
            min_price,
            max_price,
            size_sqft,
            bhk,
            status_possession,
            location: location.trim(),
            base_location: normalizedLocation,
            rera_number,
            possession_date,
            photos,
            owner_name,
            owner_email,
            owner_phone
        });

        await property.save();

        res.status(201).json({
            success: true,
            message: 'Property submitted successfully',
            id: property._id
        });
    } catch (err) {
        console.error('Error saving user property:', err);
        res.status(500).json({ error: 'Failed to submit property' });
    }
});

app.get('/api/user-properties', async (req, res) => {
    try {
        const properties = await UserProperty.find().sort({ createdAt: -1 });
        res.json(properties);
    } catch (err) {
        console.error('Error fetching user properties:', err);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

// =========================================================================
// LOCATION INQUIRY ENDPOINTS
// =========================================================================

app.post('/api/location-inquiry', async (req, res) => {
    const { name, email, phone, location_name, property_type, budget, message } = req.body;
    
    if (!name || !email || !phone || !location_name) {
        return res.status(400).json({ error: 'Required fields missing' });
    }
    
    try {
        // Check for existing inquiry with same email/phone for this location (last 30 days)
        const existingInquiry = await LocationInquiry.findOne({
            $and: [
                { location_name },
                { $or: [
                    { email: email.toLowerCase() },
                    { phone: phone.replace(/\D/g, '') }
                ]}
            ],
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        if (existingInquiry) {
            return res.status(409).json({ 
                error: 'You have already submitted an inquiry for this location. Our team will contact you soon.' 
            });
        }
        
        // Check for any recent inquiry from this user (last 24 hours)
        const oneDayAgoCheck = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingInquiryCheck = await LocationInquiry.findOne({
            $or: [{ email }, { phone }],
            createdAt: { $gte: oneDayAgoCheck }
        });
        
        if (existingInquiryCheck) {
            return res.status(409).json({ error: 'You have already submitted an inquiry recently. We will contact you soon.' });
        }
        
        const inquiry = new LocationInquiry({
            name,
            email,
            phone,
            location_name,
            property_type: property_type || 'Any',
            budget: budget || 'Not specified',
            message: message || 'Interested in properties in ' + location_name
        });
        
        await inquiry.save();
        
        try {
            const emailResults = await mailer.sendFormEmails('location', {
                name: name,
                email: email,
                phone: phone,
                location_name: location_name,
                property_type: property_type,
                budget: budget,
                message: message || 'Location inquiry',
                urgent: false
            });
            console.log('Location inquiry emails sent:', emailResults);
        } catch (emailErr) {
            console.error('Email error:', emailErr);
        }
        
        res.status(201).json({ success: true, message: 'Thank you for your interest! Our team will contact you soon.' });
    } catch (err) {
        console.error('Location inquiry error:', err);
        res.status(500).json({ error: 'Failed to submit inquiry' });
    }
});

// =========================================================================
// BUILDER INQUIRY ENDPOINTS
// =========================================================================

app.post('/api/builder-inquiry', async (req, res) => {
    const { builder_name, name, email, phone, message } = req.body;
    
    if (!name || !email || !phone || !builder_name) {
        return res.status(400).json({ error: 'Name, email, phone, and builder name are required' });
    }
    
    try {
        // Normalize builder name
        const normalizedBuilderName = normalizeBuilderName(builder_name);
        
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existing = await BuilderInquiry.findOne({
            $or: [{ email }, { phone }],
            createdAt: { $gte: oneDayAgo }
        });
        
        if (existing) {
            return res.status(409).json({ error: 'You have already submitted an inquiry recently. We will contact you soon.' });
        }
        
        const inquiry = new BuilderInquiry({
            builder_name: normalizedBuilderName,
            name,
            email,
            phone,
            message: message || 'General inquiry about projects'
        });
        
        await inquiry.save();
        
        try {
            const emailResults = await mailer.sendFormEmails('builder', {
                name: name,
                email: email,
                phone: phone,
                message: message || 'General inquiry about projects',
                builder_name: builder_name,
                urgent: false
            });
            console.log('Builder inquiry emails sent:', emailResults);
        } catch (emailErr) {
            console.error('Email sending failed:', emailErr);
        }
        
        res.status(201).json({ success: true, message: 'Builder inquiry submitted successfully', id: inquiry._id });
    } catch (err) {
        console.error('Database error in /api/builder-inquiry:', err);
        res.status(500).json({ error: 'Failed to submit builder inquiry' });
    }
});

app.post('/api/search-box-enquiries', async (req, res) => {
    const { name, email, phone, location, property_type, project_name, builder_name } = req.body;
    
    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    try {
        // Normalize builder name
        const normalizedBuilderName = normalizeBuilderName(builder_name);
        
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const duplicateFilter = {
            email,
            phone: cleanPhone,
            createdAt: { $gte: oneDayAgo }
        };
        if (project_name) {
            duplicateFilter.project_name = project_name;
        }
        if (location) {
            duplicateFilter.location = location;
        }

        const existing = await SerchBoxForm.findOne(duplicateFilter);
        if (existing) {
            return res.status(409).json({ error: 'You have already submitted a similar enquiry recently' });
        }

        const enquiry = new SerchBoxForm({
            name,
            email,
            phone: cleanPhone,
            location: location || '',
            property_type: property_type || '',
            project_name: project_name || '',
            builder_name: normalizedBuilderName || ''
        });

        await enquiry.save();

        res.status(201).json({ success: true, message: 'Enquiry submitted successfully', id: enquiry._id });
    } catch (err) {
        console.error('Search box enquiry error:', err);
        res.status(500).json({ error: 'Failed to submit enquiry' });
    }
});

// =========================================================================
// GENERAL INQUIRY ENDPOINT
// =========================================================================

app.post('/inquiry', async (req, res) => {
    const { name, email, phone, message, source } = req.body;
    
    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existing = await Inquiry.findOne({
            email,
            phone,
            received_at: { $gte: oneDayAgo }
        });
        
        if (existing) {
            return res.status(409).json({ error: 'You have already submitted an inquiry recently' });
        }
        
        const inquiry = new Inquiry({
            name,
            email,
            phone,
            message: message || '',
            source: source || 'Website Form'
        });
        
        await inquiry.save();
        
        try {
            const emailResults = await mailer.sendFormEmails('contact', {
                name: name,
                email: email,
                phone: phone,
                message: message || 'General inquiry',
                source: source || 'Website Form',
                urgent: false
            });
            console.log('Contact form emails sent:', emailResults);
        } catch (emailErr) {
            console.error('Email sending failed:', emailErr);
        }
        
        res.status(201).json({ success: true, message: 'Inquiry submitted successfully', id: inquiry._id });
    } catch (err) {
        console.error('Database error in /inquiry:', err);
        res.status(500).json({ error: 'Failed to submit inquiry' });
    }
});

// =========================================================================
// ADMIN API: Inquiry Management
// =========================================================================

app.get('/admin/inquiries', authenticateToken, async (req, res) => {
    try {
        const { search, startDate, endDate } = req.query;
        let filter = {};

        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') },
                { phone: new RegExp(search, 'i') }
            ];
        }

        if (startDate) {
            filter.received_at = filter.received_at || {};
            filter.received_at.$gte = new Date(startDate);
        }

        if (endDate) {
            filter.received_at = filter.received_at || {};
            const nextDay = new Date(endDate);
            nextDay.setDate(nextDay.getDate() + 1);
            filter.received_at.$lt = nextDay;
        }
        
        const inquiries = await Inquiry.find(filter).sort({ received_at: -1 });
        res.json(inquiries);
    } catch (err) {
        console.error('Error fetching inquiries:', err);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

app.put('/admin/inquiries/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, message, source } = req.body;
    try {
        const inquiry = await Inquiry.findByIdAndUpdate(
            id,
            { name, email, phone, message: message || null, source: source || 'Unknown' },
            { new: true }
        );
        
        if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
        res.json({ success: true, message: 'Inquiry updated successfully' });
    } catch (err) {
        console.error('Error updating inquiry:', err);
        res.status(500).json({ error: 'Failed to update inquiry' });
    }
});

app.delete('/admin/inquiries/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const inquiry = await Inquiry.findByIdAndDelete(id);
        if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting inquiry:', err);
        res.status(500).json({ error: 'Failed to delete inquiry' });
    }
});

app.get('/api/admin/serch-box-enquiries', authenticateToken, async (req, res) => {
    try {
        const enquiries = await SerchBoxForm.find().sort({ createdAt: -1 });
        res.json(enquiries);
    } catch (err) {
        console.error('Error fetching search box enquiries:', err);
        res.status(500).json({ error: 'Failed to fetch enquiries' });
    }
});

app.delete('/api/admin/serch-box-enquiries/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const enquiry = await SerchBoxForm.findByIdAndDelete(id);
        if (!enquiry) {
            return res.status(404).json({ error: 'Enquiry not found' });
        }
        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting search box enquiry:', err);
        res.status(500).json({ error: 'Failed to delete enquiry' });
    }
});

app.get('/api/admin/project-callbacks', authenticateToken, async (req, res) => {
    try {
        const callbacks = await ProjectCallback.find().sort({ createdAt: -1 });
        res.json(callbacks);
    } catch (err) {
        console.error('Error fetching project callbacks:', err);
        res.status(500).json({ error: 'Failed to fetch project callbacks' });
    }
});

app.delete('/api/admin/project-callbacks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const callback = await ProjectCallback.findByIdAndDelete(id);
        if (!callback) {
            return res.status(404).json({ error: 'Callback not found' });
        }
        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting project callback:', err);
        res.status(500).json({ error: 'Failed to delete callback' });
    }
});

app.get('/api/admin/user-project-callbacks', authenticateToken, async (req, res) => {
    try {
        const callbacks = await UserProjectCallback.find().sort({ createdAt: -1 });
        res.json(callbacks);
    } catch (err) {
        console.error('Error fetching user project callbacks:', err);
        res.status(500).json({ error: 'Failed to fetch user project callbacks' });
    }
});

app.delete('/api/admin/user-project-callbacks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const callback = await UserProjectCallback.findByIdAndDelete(id);
        if (!callback) {
            return res.status(404).json({ error: 'Callback not found' });
        }
        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting user project callback:', err);
        res.status(500).json({ error: 'Failed to delete callback' });
    }
});

// API routes with /api/admin prefix
app.get('/api/admin/inquiries', authenticateToken, async (req, res) => {
    try {
        const { search, startDate, endDate } = req.query;
        let filter = {};

        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') },
                { phone: new RegExp(search, 'i') }
            ];
        }

        if (startDate) {
            filter.createdAt = filter.createdAt || {};
            filter.createdAt.$gte = new Date(startDate);
        }

        if (endDate) {
            filter.createdAt = filter.createdAt || {};
            const nextDay = new Date(endDate);
            nextDay.setDate(nextDay.getDate() + 1);
            filter.createdAt.$lt = nextDay;
        }
        
        const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (err) {
        console.error('Error fetching inquiries:', err);
        res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
});

app.put('/api/admin/inquiries/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, message, source } = req.body;
    try {
        const inquiry = await Inquiry.findByIdAndUpdate(
            id,
            { name, email, phone, message: message || null, source: source || 'Unknown' },
            { new: true }
        );
        
        if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
        res.json({ success: true, message: 'Inquiry updated successfully' });
    } catch (err) {
        console.error('Error updating inquiry:', err);
        res.status(500).json({ error: 'Failed to update inquiry' });
    }
});

app.delete('/api/admin/inquiries/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const inquiry = await Inquiry.findByIdAndDelete(id);
        if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting inquiry:', err);
        res.status(500).json({ error: 'Failed to delete inquiry' });
    }
});

// =========================================================================
// ADMIN API: Property Management
// =========================================================================

app.post('/api/admin/properties', authenticateToken, uploadPropertyPhotos.array('photos', 3), async (req, res) => {
    const { 
        project_name, 
        builder_name, 
        project_type, 
        min_price, 
        max_price, 
        size_sqft, 
        bhk, 
        status_possession, 
        location,
        rera_number,
        possession_date
    } = req.body;
    
    if (!project_name || !builder_name || !project_type || !min_price || !max_price || !size_sqft || !bhk || !status_possession || !location) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        // Normalize builder name and location
        const normalizedBuilderName = normalizeBuilderName(builder_name);
        const normalizedLocation = normalizeLocation(location);
        
        const existing = await RealEstateProject.findOne({
            project_name
        });
        
        if (existing) {
            return res.status(409).json({ 
                error: 'Property already exists with the same name',
                duplicate: true 
            });
        }
        
        let photos = [];
        if (req.files && req.files.length) {
            const uploadPromises = req.files.map(file => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream({ folder: 'properties' }, (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url || result.url);
                    });
                    stream.end(file.buffer);
                });
            });
            photos = await Promise.all(uploadPromises);
        }

        const property = new RealEstateProject({
            project_name,
            builder_name: normalizedBuilderName,
            project_type,
            min_price,
            max_price,
            size_sqft,
            bhk,
            status_possession,
            location: location.trim(),
            base_location: normalizedLocation,
            rera_number,
            possession_date,
            photos
        });
        
        await property.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Property added successfully', 
            id: property._id 
        });
    } catch (err) {
        console.error('Error adding property:', err);
        if (err && err.code === 11000) {
            return res.status(409).json({
                error: 'Property already exists with the same name',
                duplicate: true
            });
        }
        res.status(500).json({ error: 'Failed to add property' });
    }
});

app.put('/api/admin/properties/:id', authenticateToken, async (req, res) => {
    const {
        project_name,
        builder_name,
        project_type,
        min_price,
        max_price,
        size_sqft,
        bhk,
        status_possession,
        location,
        rera_number,
        possession_date
    } = req.body;

    if (!project_name || !builder_name || !project_type || !min_price || !max_price || !size_sqft || !bhk || !status_possession || !location) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        // Normalize builder name and location
        const normalizedBuilderName = normalizeBuilderName(builder_name);
        const normalizedLocation = normalizeLocation(location);
        
        const updateData = {
            project_name,
            builder_name: normalizedBuilderName,
            project_type,
            min_price,
            max_price,
            size_sqft,
            bhk,
            status_possession,
            location,
            base_location: normalizedLocation,
            rera_number,
            possession_date
        };

        const property = await RealEstateProject.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json({ success: true, message: 'Property updated', property });
    } catch (err) {
        console.error('Error updating property:', err);
        res.status(500).json({ error: 'Failed to update property' });
    }
});

app.delete('/api/admin/properties/:id', authenticateToken, async (req, res) => {
    try {
        const property = await RealEstateProject.findByIdAndDelete(req.params.id);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        res.json({ success: true, message: 'Property deleted' });
    } catch (err) {
        console.error('Error deleting property:', err);
        res.status(500).json({ error: 'Failed to delete property' });
    }
});

app.get('/api/properties/location/:location', async (req, res) => {
    try {
        const { location } = req.params;
        const normalizedLocation = normalizeLocation(location);

        const baseQuery = { base_location: normalizedLocation };

        let projectQuery = { ...baseQuery };
        let userQuery = { ...baseQuery };

        if (location === 'Noida Extension') {
            projectQuery.location = { $regex: /^Noida Extension$/i };
            userQuery.location = { $regex: /^Noida Extension$/i };
        }

        const [properties, userProperties] = await Promise.all([
            RealEstateProject.find(projectQuery).sort({ createdAt: -1 }),
            UserProperty.find(userQuery).sort({ createdAt: -1 })
        ]);

        const allProperties = [...properties, ...userProperties];
        res.json(allProperties);
    } catch (err) {
        console.error('Error fetching properties by location:', err);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

app.get('/api/properties/builder/:builder', async (req, res) => {
    try {
        const { builder } = req.params;
        const rawBuilder = (builder || '').toString().trim();

        if (!rawBuilder) {
            return res.json([]);
        }

        const firstLetter = rawBuilder.charAt(0);
        const regex = new RegExp('^' + firstLetter, 'i');
        
        const properties = await RealEstateProject.find({ 
            builder_name: { $regex: regex } 
        }).sort({ createdAt: -1 });
        
        const userProperties = await UserProperty.find({ 
            builder_name: { $regex: regex } 
        }).sort({ createdAt: -1 });
        
        const allProperties = [...properties, ...userProperties];
        res.json(allProperties);
    } catch (err) {
        console.error('Error fetching properties by builder:', err);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

app.get('/api/admin/user-properties', authenticateToken, async (req, res) => {
    try {
        const properties = await UserProperty.find().sort({ createdAt: -1 });
        res.json(properties);
    } catch (err) {
        console.error('Error fetching user properties (admin):', err);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

app.put('/api/admin/user-properties/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        project_name,
        builder_name,
        project_type,
        min_price,
        max_price,
        size_sqft,
        bhk,
        status_possession,
        location,
        rera_number,
        possession_date,
        owner_name,
        owner_email,
        owner_phone
    } = req.body;

    if (!project_name || !builder_name || !project_type || !min_price || !max_price || !size_sqft || !bhk || !status_possession || !location) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Normalize builder name and location
        const normalizedBuilderName = normalizeBuilderName(builder_name);
        const normalizedLocation = normalizeLocation(location);
        
        const property = await UserProperty.findByIdAndUpdate(
            id,
            {
                project_name,
                builder_name: normalizedBuilderName,
                project_type,
                min_price,
                max_price,
                size_sqft,
                bhk,
                status_possession,
                location,
                base_location: normalizedLocation,
                rera_number,
                possession_date,
                owner_name,
                owner_email,
                owner_phone
            },
            { new: true, runValidators: true }
        );

        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        res.json({ success: true, message: 'Property updated successfully', property });
    } catch (err) {
        console.error('Error updating user property (admin):', err);
        res.status(500).json({ error: 'Failed to update property' });
    }
});

app.delete('/api/admin/user-properties/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const property = await UserProperty.findByIdAndDelete(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ success: true, message: 'Property deleted' });
  } catch (err) {
    console.error('Error deleting user property (admin):', err);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// =========================================================================
// ADMIN API: Newsletter Management
// =========================================================================

app.get('/api/admin/newsletter-subscriptions', authenticateToken, async (req, res) => {
    try {
        const subscriptions = await NewsletterSubscription.find().sort({ subscribed_at: -1 });
        res.json(subscriptions);
    } catch (err) {
        console.error('Error fetching subscriptions:', err);
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});

app.delete('/api/admin/newsletter-subscriptions/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const subscription = await NewsletterSubscription.findByIdAndDelete(id);
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }
        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting subscription:', err);
        res.status(500).json({ error: 'Failed to delete subscription' });
    }
});

// =========================================================================
// ADMIN API: Builder Inquiries Management
// =========================================================================

app.get('/api/admin/builder-inquiries', authenticateToken, async (req, res) => {
    try {
        const inquiries = await BuilderInquiry.find().sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (err) {
        console.error('Error fetching builder inquiries:', err);
        res.status(500).json({ error: 'Failed to fetch builder inquiries' });
    }
});

app.delete('/api/admin/builder-inquiries/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const inquiry = await BuilderInquiry.findByIdAndDelete(id);
        if (!inquiry) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }
        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting inquiry:', err);
        res.status(500).json({ error: 'Failed to delete inquiry' });
    }
});

// =========================================================================
// ADMIN API: Location Inquiries Management
// =========================================================================

app.get('/api/admin/location-inquiries', authenticateToken, async (req, res) => {
    try {
        const inquiries = await LocationInquiry.find().sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (err) {
        console.error('Error fetching location inquiries:', err);
        res.status(500).json({ error: 'Failed to fetch location inquiries' });
    }
});

app.delete('/api/admin/location-inquiries/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const inquiry = await LocationInquiry.findByIdAndDelete(id);
        if (!inquiry) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }
        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting location inquiry:', err);
        res.status(500).json({ error: 'Failed to delete inquiry' });
    }
});

app.put('/api/admin/location-inquiries/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const inquiry = await LocationInquiry.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        
        if (!inquiry) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }
        
        res.json(inquiry);
    } catch (err) {
        console.error('Error updating location inquiry:', err);
        res.status(500).json({ error: 'Failed to update inquiry' });
    }
});

// =========================================================================
// ADMIN API: Career Submissions Management
// =========================================================================

app.get('/api/admin/career-submissions', authenticateToken, async (req, res) => {
    try {
        const submissions = await CareerSubmission.find().sort({ createdAt: -1 });
        res.json(submissions);
    } catch (err) {
        console.error('Error fetching career submissions:', err);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

app.put('/api/admin/career-submissions/:id', authenticateToken, async (req, res) => {
    const { status } = req.body;
    try {
        const submission = await CareerSubmission.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating submission:', err);
        res.status(500).json({ error: 'Failed to update submission' });
    }
});

app.delete('/api/admin/career-submissions/:id', authenticateToken, async (req, res) => {
    try {
        const submission = await CareerSubmission.findByIdAndDelete(req.params.id);
        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting submission:', err);
        res.status(500).json({ error: 'Failed to delete submission' });
    }
});

app.get('/api/admin/career-submissions/:id/resume', authenticateToken, async (req, res) => {
    try {
        const submission = await CareerSubmission.findById(req.params.id);
        if (!submission || !submission.resume_url) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        if (!/^https?:\/\//i.test(submission.resume_url)) {
            return res.status(400).json({ error: 'Resume URL is invalid' });
        }
        res.redirect(submission.resume_url);
    } catch (err) {
        console.error('Error fetching resume:', err);
        res.status(500).json({ error: 'Failed to fetch resume' });
    }
});

// =========================================================================
// SERVER STARTUP
// =========================================================================

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📁 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`🔗 API endpoints ready`);
});

module.exports = app;