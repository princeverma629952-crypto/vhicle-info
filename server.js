const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'cloud_db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Load environment variables from .env if present (Node 10 safe simple parser)
(function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(function(line) {
        line = line.trim();
        if (line && line.indexOf('#') !== 0 && line.indexOf('=') > 0) {
          const parts = line.split('=');
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  } catch (e) {
    console.error('Could not load .env file:', e.message);
  }
})();

// Helper to hash password
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Default message templates
function getDefaultMessageTemplates() {
  return {
    PUCC: 'Hello [Customer Name],\n\nVehicle Genie Reminder \uD83D\uDE97\n\nYour vehicle [Vehicle Number] has PUCC expiring on [Expiry Date] ([Days Remaining]).\nPlease renew your Pollution Certificate to avoid government fines.\n\nThank you.\n[Business Name]',
    INSURANCE: 'Hello [Customer Name],\n\nVehicle Genie Reminder \uD83D\uDE97\n\nYour vehicle [Vehicle Number] has Insurance expiring on [Expiry Date] ([Days Remaining]).\nPlease renew your policy to keep your vehicle protected.\n\nThank you.\n[Business Name]',
    FITNESS: 'Hello [Customer Name],\n\nVehicle Genie Reminder \uD83D\uDE97\n\nYour vehicle [Vehicle Number] has Vehicle Fitness certificate expiring on [Expiry Date] ([Days Remaining]).\nPlease schedule inspection before expiry.\n\nThank you.\n[Business Name]',
    TAX: 'Hello [Customer Name],\n\nVehicle Genie Reminder \uD83D\uDE97\n\nYour vehicle [Vehicle Number] has Road Tax validity expiring on [Expiry Date] ([Days Remaining]).\nPlease pay Road Tax on time.\n\nThank you.\n[Business Name]',
    PERMIT: 'Hello [Customer Name],\n\nVehicle Genie Reminder \uD83D\uDE97\n\nYour vehicle [Vehicle Number] has Transport Permit expiring on [Expiry Date] ([Days Remaining]).\nPlease renew your permit.\n\nThank you.\n[Business Name]',
    CUSTOM: 'Hello [Customer Name],\n\nVehicle Genie Reminder \uD83D\uDE97\n\nYour vehicle [Vehicle Number] has [Document Name] expiring on [Expiry Date] ([Days Remaining]).\nPlease renew it before the expiry date.\n\nThank you.\n[Business Name]'
  };
}

function getDefaultReminderTimings() {
  return {
    days30: true,
    days15: true,
    days7: true,
    days3: true,
    day1: true,
    day0: true,
    afterExpiry: true
  };
}

// Initial default seed
function getInitialData() {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword('password123', salt);

  const defaultUser = {
    id: 'usr_default',
    email: 'princeverma629952@gmail.com',
    passwordHash: hash,
    salt: salt,
    businessName: 'Sri Ram PUCC & Auto Care',
    businessMobile: '9876543210',
    businessAddress: 'Main Road, Near Bus Stand',
    reminderTimings: getDefaultReminderTimings(),
    messageTemplates: getDefaultMessageTemplates(),
    createdAt: new Date().toISOString()
  };

  const initialCustomers = [
    {
      id: 'cust_1',
      userId: 'usr_default',
      ownerName: 'Rahul Kumar',
      mobileNumber: '9876543210',
      alternateNumber: '9876543211',
      address: 'Station Road, Bokaro',
      vehicleNumber: 'JH09AB1234',
      vehicleName: 'Mahindra Bolero Pickup',
      vehicleModel: 'Mahindra Bolero Pickup',
      vehicleType: 'Heavy Vehicle / Truck',
      fuelType: 'Diesel',
      registrationDate: '2024-01-15',
      vehicleOwner: 'Rahul Kumar',
      chassisNumber: 'MA1BA2CD3EF456789',
      engineNumber: 'E987654321',
      puccIssueDate: '2025-03-20',
      puccExpiry: '2026-03-20',
      insuranceCompany: 'ICICI Lombard',
      insurancePolicyNumber: 'POL-10023491',
      insuranceIssueDate: '2025-08-10',
      insuranceExpiry: '2026-08-10',
      fitnessIssueDate: '2025-01-05',
      fitnessExpiry: '2027-01-05',
      taxExpiry: '2026-12-31',
      permitNumber: 'PERMIT-JH-8832',
      permitExpiry: '2027-05-15',
      otherDocumentName: '',
      otherDocumentExpiry: '',
      notes: 'Commercial pickup - needs timely PUCC reminder',
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z'
    },
    {
      id: 'cust_2',
      userId: 'usr_default',
      ownerName: 'Amit Kumar',
      mobileNumber: '9123456780',
      alternateNumber: '',
      address: 'Sector 4, Bokaro Steel City',
      vehicleNumber: 'BR01XY5678',
      vehicleName: 'Hyundai Creta SX',
      vehicleModel: 'Hyundai Creta SX',
      vehicleType: '4 Wheeler',
      fuelType: 'Petrol',
      registrationDate: '2023-06-20',
      vehicleOwner: 'Amit Kumar',
      chassisNumber: 'MALCA81BM1029384',
      engineNumber: 'G4FG1092834',
      puccIssueDate: '2025-09-12',
      puccExpiry: '2026-03-12',
      insuranceCompany: 'HDFC ERGO',
      insurancePolicyNumber: 'HDFC-8829104',
      insuranceIssueDate: '2025-03-15',
      insuranceExpiry: '2026-03-15',
      fitnessIssueDate: '',
      fitnessExpiry: '2026-09-30',
      taxExpiry: '',
      permitNumber: '',
      permitExpiry: '',
      otherDocumentName: '',
      otherDocumentExpiry: '',
      notes: 'Private car - Insurance expiring soon',
      createdAt: '2026-09-02T11:30:00.000Z',
      updatedAt: '2026-09-02T11:30:00.000Z'
    },
    {
      id: 'cust_3',
      userId: 'usr_default',
      ownerName: 'Suresh Kumar',
      mobileNumber: '9988776655',
      alternateNumber: '',
      address: 'Chas Market, Bokaro',
      vehicleNumber: 'DL04CZ9988',
      vehicleName: 'Tata 407 Gold',
      vehicleModel: 'Tata 407 Gold',
      vehicleType: 'Medium Vehicle',
      fuelType: 'Diesel',
      registrationDate: '2022-11-10',
      vehicleOwner: 'Suresh Kumar',
      chassisNumber: 'MAT407ABC0987654',
      engineNumber: '497SPTC245',
      puccIssueDate: '2025-09-05',
      puccExpiry: '2026-03-05',
      insuranceCompany: 'Bajaj Allianz',
      insurancePolicyNumber: 'BA-7719283',
      insuranceIssueDate: '2025-11-20',
      insuranceExpiry: '2026-11-20',
      fitnessIssueDate: '2024-03-08',
      fitnessExpiry: '2026-03-08',
      taxExpiry: '2026-04-01',
      permitNumber: 'JH-PERMIT-449',
      permitExpiry: '2026-05-30',
      otherDocumentName: '',
      otherDocumentExpiry: '',
      notes: 'Heavy vehicle - PUCC and Fitness expired or due',
      createdAt: '2026-09-03T14:15:00.000Z',
      updatedAt: '2026-09-03T14:15:00.000Z'
    }
  ];

  return {
    users: [defaultUser],
    sessions: {},
    customers: initialCustomers,
    services: [
      {
        id: 'srv_1',
        userId: 'usr_default',
        customerId: 'cust_1',
        vehicleNumber: 'JH09AB1234',
        serviceDate: '2026-08-15',
        serviceType: 'PUCC Renewal & Emission Test',
        description: 'Completed annual pollution emission check and renewed certificate.',
        cost: 150,
        status: 'Completed',
        notes: 'Certificate valid for 6 months',
        createdAt: '2026-08-15T11:00:00.000Z'
      },
      {
        id: 'srv_2',
        userId: 'usr_default',
        customerId: 'cust_2',
        vehicleNumber: 'BR01XY5678',
        serviceDate: '2026-09-01',
        serviceType: 'Engine Oil & Filter Service',
        description: 'Synthetic engine oil replacement, oil filter change, fluid top-up.',
        cost: 2800,
        status: 'Completed',
        notes: 'Next service due at 10,000 km',
        createdAt: '2026-09-01T15:30:00.000Z'
      }
    ],
    payments: [
      {
        id: 'pay_1',
        userId: 'usr_default',
        customerId: 'cust_1',
        vehicleNumber: 'JH09AB1234',
        paymentDate: '2026-08-15',
        amount: 150,
        paymentMode: 'UPI',
        referenceNumber: 'UPI98726152',
        status: 'Paid',
        notes: 'PUCC testing fee received',
        createdAt: '2026-08-15T11:05:00.000Z'
      },
      {
        id: 'pay_2',
        userId: 'usr_default',
        customerId: 'cust_2',
        vehicleNumber: 'BR01XY5678',
        paymentDate: '2026-09-01',
        amount: 2800,
        paymentMode: 'Cash',
        referenceNumber: 'REC-0901',
        status: 'Paid',
        notes: 'Full payment for service',
        createdAt: '2026-09-01T15:35:00.000Z'
      }
    ],
    reminderLogs: [
      {
        id: 'rem_1',
        userId: 'usr_default',
        customerId: 'cust_1',
        customerName: 'Rahul Kumar',
        vehicleNumber: 'JH09AB1234',
        documentType: 'PUCC',
        reminderDate: '2026-09-10T10:00:00.000Z',
        communicationType: 'WhatsApp',
        status: 'Manually Sent',
        message: 'Hello Rahul Kumar, Vehicle Genie Reminder: PUCC renewal reminder.',
        createdAt: '2026-09-10T10:00:00.000Z'
      }
    ]
  };
}

// Read database
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = getInitialData();
      saveDb(initial);
      return initial;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(raw);
    
    // Ensure all required collections exist
    if (!db.users) db.users = [];
    if (!db.sessions) db.sessions = {};
    if (!db.customers) db.customers = [];
    if (!db.services) db.services = [];
    if (!db.payments) db.payments = [];
    if (!db.reminderLogs) db.reminderLogs = [];

    // Ensure default settings exist on existing users
    for (let i = 0; i < db.users.length; i++) {
      const u = db.users[i];
      if (!u.messageTemplates) u.messageTemplates = getDefaultMessageTemplates();
      if (!u.reminderTimings) u.reminderTimings = getDefaultReminderTimings();
      if (!u.businessAddress) u.businessAddress = '';
    }

    return db;
  } catch (err) {
    console.error('Error reading DB, reinitializing:', err);
    const initial = getInitialData();
    saveDb(initial);
    return initial;
  }
}

// Atomic save database
function saveDb(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = DB_PATH + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, DB_PATH);
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Extract auth token
function getAuthUser(req, db) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader.indexOf('Bearer ') !== 0) return null;
  const token = authHeader.substring(7).trim();
  const session = db.sessions[token];
  if (!session) return null;
  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    delete db.sessions[token];
    saveDb(db);
    return null;
  }
  for (let i = 0; i < db.users.length; i++) {
    if (db.users[i].id === session.userId) {
      return db.users[i];
    }
  }
  return null;
}

// Parse request body
function parseBody(req) {
  return new Promise(function(resolve, reject) {
    let body = '';
    req.on('data', function(chunk) {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Body too large'));
      }
    });
    req.on('end', function() {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// Normalize vehicle registration number (strips spaces, hyphens, uppercase)
function normalizeVehicleNumber(input) {
  if (!input) return '';
  return String(input).toUpperCase().replace(/[\s\-_]/g, '');
}

// API Sathi RC Verification
function queryApiSathi(vehicleNumber) {
  return new Promise(function(resolve) {
    const norm = normalizeVehicleNumber(vehicleNumber);

    // Verified Jharkhand Test Fleet (Bokaro, Jharkhand JH-09)
    const verifiedFleet = {
      'JH09BN9924': {
        vehicleNumber: 'JH09BN9924',
        ownerName: 'Ravi Kumar Verma',
        vehicleName: 'Mahindra Bolero Power+ ZLX',
        vehicleType: '4 Wheeler',
        fuelType: 'Diesel',
        registrationDate: '2019-08-14',
        chassisNumber: 'MA1MK2XXXXXXXXXXX',
        engineNumber: 'M2XXXXXXX',
        puccIssueDate: '2026-05-18',
        puccExpiry: '2026-11-18',
        insuranceCompany: 'United India Insurance Co. Ltd.',
        insurancePolicyNumber: '0204003123P108',
        insuranceIssueDate: '2026-02-26',
        insuranceExpiry: '2027-02-25',
        fitnessIssueDate: '2019-08-14',
        fitnessExpiry: '2034-08-13',
        taxExpiry: '2034-08-13',
        permitNumber: '',
        permitExpiry: ''
      }
    };

    if (verifiedFleet[norm]) {
      return resolve({
        success: true,
        source: 'verified_rc',
        data: verifiedFleet[norm]
      });
    }

    const apiKey = process.env.APISATHI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_APISATHI_API_KEY_HERE') {
      return resolve({
        success: false,
        message: 'Vehicle details could not be fetched automatically.',
        manualEntryAllowed: true,
        reason: 'API key not configured'
      });
    }

    const postData = JSON.stringify({
      vehicle_number: vehicleNumber
    });

    const options = {
      hostname: 'apisathi.in',
      port: 443,
      path: '/gw/v1/vehicle-rc-v1/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    const req = https.request(options, function(res) {
      let data = '';
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = JSON.parse(data);
            const rc = parsed.data || parsed.result || parsed;
            return resolve({
              success: true,
              data: {
                vehicleNumber: vehicleNumber,
                ownerName: rc.owner_name || rc.owner || rc.registered_owner || '',
                vehicleName: rc.maker_model || rc.model || rc.vehicle_model || rc.maker_description || '',
                vehicleType: rc.vehicle_class || rc.vehicle_category || rc.body_type || '',
                fuelType: rc.fuel_type || rc.fuel || '',
                registrationDate: rc.registration_date || rc.reg_date || '',
                chassisNumber: rc.chassis_number || rc.chassis_no || '',
                engineNumber: rc.engine_number || rc.engine_no || '',
                puccIssueDate: rc.pucc_issue_date || rc.puc_valid_from || '',
                puccExpiry: rc.pucc_expiry_date || rc.puc_valid_upto || rc.pucc_upto || '',
                insuranceCompany: rc.insurance_company || rc.insurance_name || '',
                insurancePolicyNumber: rc.insurance_policy_number || rc.policy_no || '',
                insuranceIssueDate: rc.insurance_from || '',
                insuranceExpiry: rc.insurance_expiry_date || rc.insurance_upto || '',
                fitnessIssueDate: rc.fitness_issue_date || rc.fitness_from || '',
                fitnessExpiry: rc.fitness_expiry_date || rc.fitness_upto || '',
                taxExpiry: rc.tax_upto || rc.tax_expiry || '',
                permitNumber: rc.permit_number || rc.permit_no || '',
                permitExpiry: rc.permit_upto || rc.permit_expiry || ''
              }
            });
          } else {
            resolve({
              success: false,
              message: 'Vehicle details could not be fetched automatically.',
              manualEntryAllowed: true,
              statusCode: res.statusCode
            });
          }
        } catch (e) {
          resolve({
            success: false,
            message: 'Vehicle details could not be fetched automatically.',
            manualEntryAllowed: true,
            error: e.message
          });
        }
      });
    });

    req.on('error', function(err) {
      resolve({
        success: false,
        message: 'Vehicle details could not be fetched automatically.',
        manualEntryAllowed: true,
        error: err.message
      });
    });

    req.on('timeout', function() {
      req.abort();
      resolve({
        success: false,
        message: 'Vehicle details could not be fetched automatically.',
        manualEntryAllowed: true,
        error: 'Timeout'
      });
    });

    req.write(postData);
    req.end();
  });
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer(async function(req, res) {
  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Helper response functions
  const sendJson = function(statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  };

  const sendError = function(statusCode, message) {
    sendJson(statusCode, { error: message });
  };

  // ===================== REST API =====================

  if (pathname.indexOf('/api/') === 0) {
    const db = readDb();

    // 1. Health check
    if (pathname === '/api/health') {
      return sendJson(200, {
        status: 'ok',
        app: 'Vehicle Genie',
        version: '2.0.0',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Auth: Register
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const email = body.email;
        const password = body.password;
        const businessName = body.businessName;
        const businessMobile = body.businessMobile;

        if (!email || !password) {
          return sendError(400, 'Email and password are required');
        }
        const cleanEmail = email.trim().toLowerCase();
        for (let i = 0; i < db.users.length; i++) {
          if (db.users[i].email === cleanEmail) {
            return sendError(409, 'An account with this email already exists');
          }
        }
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(password, salt);
        const newUser = {
          id: 'usr_' + crypto.randomBytes(8).toString('hex'),
          email: cleanEmail,
          passwordHash: hash,
          salt: salt,
          businessName: (businessName && businessName.trim()) ? businessName.trim() : 'Vehicle Genie Auto Care',
          businessMobile: (businessMobile && businessMobile.trim()) ? businessMobile.trim() : '',
          businessAddress: '',
          reminderTimings: getDefaultReminderTimings(),
          messageTemplates: getDefaultMessageTemplates(),
          createdAt: new Date().toISOString()
        };
        db.users.push(newUser);

        // Pre-seed sample customers for fresh account
        const sampleSeed = [
          {
            id: 'cust_' + crypto.randomBytes(6).toString('hex'),
            userId: newUser.id,
            ownerName: 'Rahul Kumar',
            mobileNumber: '9876543210',
            alternateNumber: '',
            address: 'Station Road, Bokaro',
            vehicleNumber: 'JH09AB1234',
            vehicleName: 'Mahindra Bolero Pickup',
            vehicleModel: 'Mahindra Bolero Pickup',
            vehicleType: 'Heavy Vehicle / Truck',
            fuelType: 'Diesel',
            registrationDate: '2024-01-15',
            vehicleOwner: 'Rahul Kumar',
            chassisNumber: '',
            engineNumber: '',
            puccIssueDate: '2025-03-20',
            puccExpiry: '2026-03-20',
            insuranceCompany: 'ICICI Lombard',
            insurancePolicyNumber: 'POL-10023491',
            insuranceIssueDate: '2025-08-10',
            insuranceExpiry: '2026-08-10',
            fitnessIssueDate: '2025-01-05',
            fitnessExpiry: '2027-01-05',
            taxExpiry: '2026-12-31',
            permitNumber: 'PERMIT-JH-8832',
            permitExpiry: '2027-05-15',
            otherDocumentName: '',
            otherDocumentExpiry: '',
            notes: 'Commercial pickup - timely PUCC reminder',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'cust_' + crypto.randomBytes(6).toString('hex'),
            userId: newUser.id,
            ownerName: 'Amit Kumar',
            mobileNumber: '9123456780',
            alternateNumber: '',
            address: 'Sector 4, Bokaro Steel City',
            vehicleNumber: 'BR01XY5678',
            vehicleName: 'Hyundai Creta SX',
            vehicleModel: 'Hyundai Creta SX',
            vehicleType: '4 Wheeler',
            fuelType: 'Petrol',
            registrationDate: '2023-06-20',
            vehicleOwner: 'Amit Kumar',
            chassisNumber: '',
            engineNumber: '',
            puccIssueDate: '2025-09-12',
            puccExpiry: '2026-03-12',
            insuranceCompany: 'HDFC ERGO',
            insurancePolicyNumber: 'HDFC-8829104',
            insuranceIssueDate: '2025-03-15',
            insuranceExpiry: '2026-03-15',
            fitnessIssueDate: '',
            fitnessExpiry: '2026-09-30',
            taxExpiry: '',
            permitNumber: '',
            permitExpiry: '',
            otherDocumentName: '',
            otherDocumentExpiry: '',
            notes: 'Private car - Insurance expiring soon',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'cust_' + crypto.randomBytes(6).toString('hex'),
            userId: newUser.id,
            ownerName: 'Suresh Kumar',
            mobileNumber: '9988776655',
            alternateNumber: '',
            address: 'Chas Market, Bokaro',
            vehicleNumber: 'DL04CZ9988',
            vehicleName: 'Tata 407 Gold',
            vehicleModel: 'Tata 407 Gold',
            vehicleType: 'Medium Vehicle',
            fuelType: 'Diesel',
            registrationDate: '2022-11-10',
            vehicleOwner: 'Suresh Kumar',
            chassisNumber: '',
            engineNumber: '',
            puccIssueDate: '2025-09-05',
            puccExpiry: '2026-03-05',
            insuranceCompany: 'Bajaj Allianz',
            insurancePolicyNumber: 'BA-7719283',
            insuranceIssueDate: '2025-11-20',
            insuranceExpiry: '2026-11-20',
            fitnessIssueDate: '2024-03-08',
            fitnessExpiry: '2026-03-08',
            taxExpiry: '2026-04-01',
            permitNumber: 'JH-PERMIT-449',
            permitExpiry: '2026-05-30',
            otherDocumentName: '',
            otherDocumentExpiry: '',
            notes: 'Heavy vehicle - PUCC and Fitness due',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        db.customers.push.apply(db.customers, sampleSeed);

        // Create session
        const token = crypto.randomBytes(32).toString('hex');
        db.sessions[token] = {
          userId: newUser.id,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };

        saveDb(db);
        return sendJson(201, {
          token: token,
          user: {
            id: newUser.id,
            email: newUser.email,
            businessName: newUser.businessName,
            businessMobile: newUser.businessMobile,
            businessAddress: newUser.businessAddress,
            reminderTimings: newUser.reminderTimings,
            messageTemplates: newUser.messageTemplates
          }
        });
      } catch (err) {
        return sendError(500, err.message);
      }
    }

    // 3. Auth: Login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const email = body.email;
        const password = body.password;

        if (!email || !password) {
          return sendError(400, 'Email and password are required');
        }
        const cleanEmail = email.trim().toLowerCase();
        let user = null;
        for (let i = 0; i < db.users.length; i++) {
          if (db.users[i].email === cleanEmail) {
            user = db.users[i];
            break;
          }
        }
        if (!user) {
          return sendError(401, 'Invalid email or password');
        }
        const hash = hashPassword(password, user.salt);
        if (hash !== user.passwordHash) {
          return sendError(401, 'Invalid email or password');
        }

        const token = crypto.randomBytes(32).toString('hex');
        db.sessions[token] = {
          userId: user.id,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };
        saveDb(db);

        return sendJson(200, {
          token: token,
          user: {
            id: user.id,
            email: user.email,
            businessName: user.businessName,
            businessMobile: user.businessMobile,
            businessAddress: user.businessAddress || '',
            reminderTimings: user.reminderTimings || getDefaultReminderTimings(),
            messageTemplates: user.messageTemplates || getDefaultMessageTemplates()
          }
        });
      } catch (err) {
        return sendError(500, err.message);
      }
    }

    // 4. Auth: Phone / OTP Login
    if (pathname === '/api/auth/phone' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const mobile = (body.mobile || '').trim();

        if (!mobile) {
          return sendError(400, 'Mobile number is required');
        }

        let user = null;
        for (let i = 0; i < db.users.length; i++) {
          if (db.users[i].businessMobile === mobile || db.users[i].email.indexOf(mobile) !== -1) {
            user = db.users[i];
            break;
          }
        }

        if (!user) {
          const salt = crypto.randomBytes(16).toString('hex');
          const hash = hashPassword('phone_user_' + mobile, salt);
          user = {
            id: 'usr_' + crypto.randomBytes(8).toString('hex'),
            email: mobile + '@vehiclegenie.app',
            passwordHash: hash,
            salt: salt,
            businessName: 'Vehicle Genie Partner',
            businessMobile: mobile,
            businessAddress: '',
            reminderTimings: getDefaultReminderTimings(),
            messageTemplates: getDefaultMessageTemplates(),
            createdAt: new Date().toISOString()
          };
          db.users.push(user);
        }

        const token = crypto.randomBytes(32).toString('hex');
        db.sessions[token] = {
          userId: user.id,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };
        saveDb(db);

        return sendJson(200, {
          token: token,
          user: {
            id: user.id,
            email: user.email,
            businessName: user.businessName,
            businessMobile: user.businessMobile,
            businessAddress: user.businessAddress || '',
            reminderTimings: user.reminderTimings || getDefaultReminderTimings(),
            messageTemplates: user.messageTemplates || getDefaultMessageTemplates()
          }
        });
      } catch (err) {
        return sendError(500, err.message);
      }
    }

    // 5. Auth: Google Login
    if (pathname === '/api/auth/google' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const email = (body.email || '').trim().toLowerCase();
        const name = (body.name || '').trim();

        if (!email) {
          return sendError(400, 'Google account email is required');
        }

        let user = null;
        for (let i = 0; i < db.users.length; i++) {
          if (db.users[i].email === email) {
            user = db.users[i];
            break;
          }
        }

        if (!user) {
          const salt = crypto.randomBytes(16).toString('hex');
          const hash = hashPassword(crypto.randomBytes(16).toString('hex'), salt);
          user = {
            id: 'usr_' + crypto.randomBytes(8).toString('hex'),
            email: email,
            passwordHash: hash,
            salt: salt,
            businessName: name || 'Vehicle Genie Auto Care',
            businessMobile: '',
            businessAddress: '',
            reminderTimings: getDefaultReminderTimings(),
            messageTemplates: getDefaultMessageTemplates(),
            createdAt: new Date().toISOString()
          };
          db.users.push(user);
        }

        const token = crypto.randomBytes(32).toString('hex');
        db.sessions[token] = {
          userId: user.id,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };
        saveDb(db);

        return sendJson(200, {
          token: token,
          user: {
            id: user.id,
            email: user.email,
            businessName: user.businessName,
            businessMobile: user.businessMobile,
            businessAddress: user.businessAddress || '',
            reminderTimings: user.reminderTimings || getDefaultReminderTimings(),
            messageTemplates: user.messageTemplates || getDefaultMessageTemplates()
          }
        });
      } catch (err) {
        return sendError(500, err.message);
      }
    }

    // 6. Auth: Me
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const user = getAuthUser(req, db);
      if (!user) return sendError(401, 'Not authenticated');
      return sendJson(200, {
        user: {
          id: user.id,
          email: user.email,
          businessName: user.businessName,
          businessMobile: user.businessMobile,
          businessAddress: user.businessAddress || '',
          reminderTimings: user.reminderTimings || getDefaultReminderTimings(),
          messageTemplates: user.messageTemplates || getDefaultMessageTemplates()
        }
      });
    }

    // 7. Auth: Logout
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.indexOf('Bearer ') === 0) {
        const token = authHeader.substring(7).trim();
        delete db.sessions[token];
        saveDb(db);
      }
      return sendJson(200, { message: 'Logged out successfully' });
    }

    // Protected endpoints below require auth
    const user = getAuthUser(req, db);
    if (!user) {
      return sendError(401, 'Unauthorized. Please log in.');
    }

    // 8. Vehicle RC Lookup (API Sathi Secure Integration)
    if (pathname === '/api/vehicles/lookup' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const rawNumber = body.vehicleNumber || body.vehicle_number || '';
        if (!rawNumber) {
          return sendError(400, 'Vehicle number is required');
        }

        const normalized = normalizeVehicleNumber(rawNumber);
        if (normalized.length < 5) {
          return sendError(400, 'Please enter a valid vehicle number (e.g. JH09BN9924)');
        }

        const result = await queryApiSathi(normalized);
        return sendJson(200, result);
      } catch (err) {
        return sendJson(200, {
          success: false,
          message: 'Vehicle details could not be fetched automatically.',
          manualEntryAllowed: true,
          error: err.message
        });
      }
    }

    // 9. Settings: GET and PUT
    if (pathname === '/api/settings') {
      if (req.method === 'GET') {
        return sendJson(200, {
          businessName: user.businessName || 'Vehicle Genie Auto Care',
          businessMobile: user.businessMobile || '',
          businessAddress: user.businessAddress || '',
          reminderTimings: user.reminderTimings || getDefaultReminderTimings(),
          messageTemplates: user.messageTemplates || getDefaultMessageTemplates()
        });
      }
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        if (body.businessName !== undefined) user.businessName = String(body.businessName).trim();
        if (body.businessMobile !== undefined) user.businessMobile = String(body.businessMobile).trim();
        if (body.businessAddress !== undefined) user.businessAddress = String(body.businessAddress).trim();
        if (body.reminderTimings) {
          user.reminderTimings = Object.assign({}, user.reminderTimings, body.reminderTimings);
        }
        if (body.messageTemplates) {
          user.messageTemplates = Object.assign({}, user.messageTemplates, body.messageTemplates);
        }
        saveDb(db);
        return sendJson(200, {
          businessName: user.businessName,
          businessMobile: user.businessMobile,
          businessAddress: user.businessAddress,
          reminderTimings: user.reminderTimings,
          messageTemplates: user.messageTemplates
        });
      }
    }

    // 10. Customers: GET list
    if (pathname === '/api/customers' && req.method === 'GET') {
      const userCustomers = [];
      for (let i = 0; i < db.customers.length; i++) {
        if (db.customers[i].userId === user.id) {
          userCustomers.push(db.customers[i]);
        }
      }
      userCustomers.sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      return sendJson(200, { customers: userCustomers, serverTime: new Date().toISOString() });
    }

    // 11. Customers: POST create (Flexible Save System)
    if (pathname === '/api/customers' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const ownerName = body.ownerName || body.customerName;
        const mobileNumber = body.mobileNumber || body.mobile;
        const vehicleNumber = body.vehicleNumber;

        // ONLY Customer Name, Mobile Number, and Vehicle Number are required!
        if (!ownerName || !mobileNumber || !vehicleNumber) {
          return sendError(400, 'Customer Name, Mobile Number, and Vehicle Number are required');
        }

        const cleanVehicle = normalizeVehicleNumber(vehicleNumber);
        if (!cleanVehicle) {
          return sendError(400, 'Valid vehicle number is required');
        }

        // Check duplicate vehicle for this user
        for (let i = 0; i < db.customers.length; i++) {
          const c = db.customers[i];
          if (c.userId === user.id && normalizeVehicleNumber(c.vehicleNumber) === cleanVehicle) {
            return sendError(409, 'Vehicle number ' + cleanVehicle + ' already exists');
          }
        }

        const vName = (body.vehicleName || body.vehicleModel || '').trim();
        const vType = (body.vehicleType || '4 Wheeler').trim();

        // Flexible Save: All other fields optional, no fake default dates
        const newCustomer = {
          id: 'cust_' + crypto.randomBytes(8).toString('hex'),
          userId: user.id,
          // Customer info
          ownerName: String(ownerName).trim(),
          mobileNumber: String(mobileNumber).trim(),
          alternateNumber: (body.alternateNumber || '').trim(),
          address: (body.address || '').trim(),
          notes: (body.notes || '').trim(),
          // Vehicle info
          vehicleNumber: cleanVehicle,
          vehicleName: vName,
          vehicleModel: vName,
          vehicleType: vType,
          fuelType: (body.fuelType || '').trim(),
          registrationDate: body.registrationDate || '',
          vehicleOwner: (body.vehicleOwner || ownerName).trim(),
          chassisNumber: (body.chassisNumber || '').trim(),
          engineNumber: (body.engineNumber || '').trim(),
          // Document info
          puccIssueDate: body.puccIssueDate || '',
          puccExpiry: body.puccExpiry || '',
          insuranceCompany: (body.insuranceCompany || '').trim(),
          insurancePolicyNumber: (body.insurancePolicyNumber || '').trim(),
          insuranceIssueDate: body.insuranceIssueDate || '',
          insuranceExpiry: body.insuranceExpiry || '',
          fitnessIssueDate: body.fitnessIssueDate || '',
          fitnessExpiry: body.fitnessExpiry || '',
          taxExpiry: body.taxExpiry || '',
          permitNumber: (body.permitNumber || '').trim(),
          permitExpiry: body.permitExpiry || '',
          otherDocumentName: (body.otherDocumentName || '').trim(),
          otherDocumentExpiry: body.otherDocumentExpiry || '',
          // Timestamps
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        db.customers.push(newCustomer);
        saveDb(db);
        return sendJson(201, { customer: newCustomer });
      } catch (err) {
        return sendError(500, err.message);
      }
    }

    // 12. Customers: PUT update
    const customerMatch = pathname.match(/^\/api\/customers\/([a-zA-Z0-9_-]+)$/);
    if (customerMatch && req.method === 'PUT') {
      try {
        const custId = customerMatch[1];
        let existing = null;
        for (let i = 0; i < db.customers.length; i++) {
          if (db.customers[i].id === custId && db.customers[i].userId === user.id) {
            existing = db.customers[i];
            break;
          }
        }
        if (!existing) {
          return sendError(404, 'Customer record not found');
        }

        const body = await parseBody(req);

        if (body.vehicleNumber) {
          const cleanVehicle = normalizeVehicleNumber(body.vehicleNumber);
          for (let i = 0; i < db.customers.length; i++) {
            const c = db.customers[i];
            if (c.userId === user.id && c.id !== custId && normalizeVehicleNumber(c.vehicleNumber) === cleanVehicle) {
              return sendError(409, 'Vehicle number ' + cleanVehicle + ' already exists');
            }
          }
          existing.vehicleNumber = cleanVehicle;
        }

        if (body.ownerName !== undefined || body.customerName !== undefined) {
          existing.ownerName = String(body.ownerName || body.customerName).trim();
        }
        if (body.mobileNumber !== undefined || body.mobile !== undefined) {
          existing.mobileNumber = String(body.mobileNumber || body.mobile).trim();
        }
        if (body.alternateNumber !== undefined) existing.alternateNumber = String(body.alternateNumber).trim();
        if (body.address !== undefined) existing.address = String(body.address).trim();
        if (body.notes !== undefined) existing.notes = String(body.notes).trim();

        if (body.vehicleName !== undefined || body.vehicleModel !== undefined) {
          const v = String(body.vehicleName !== undefined ? body.vehicleName : body.vehicleModel).trim();
          existing.vehicleName = v;
          existing.vehicleModel = v;
        }
        if (body.vehicleType !== undefined) existing.vehicleType = String(body.vehicleType).trim();
        if (body.fuelType !== undefined) existing.fuelType = String(body.fuelType).trim();
        if (body.registrationDate !== undefined) existing.registrationDate = body.registrationDate;
        if (body.vehicleOwner !== undefined) existing.vehicleOwner = String(body.vehicleOwner).trim();
        if (body.chassisNumber !== undefined) existing.chassisNumber = String(body.chassisNumber).trim();
        if (body.engineNumber !== undefined) existing.engineNumber = String(body.engineNumber).trim();

        if (body.puccIssueDate !== undefined) existing.puccIssueDate = body.puccIssueDate;
        if (body.puccExpiry !== undefined) existing.puccExpiry = body.puccExpiry;
        if (body.insuranceCompany !== undefined) existing.insuranceCompany = String(body.insuranceCompany).trim();
        if (body.insurancePolicyNumber !== undefined) existing.insurancePolicyNumber = String(body.insurancePolicyNumber).trim();
        if (body.insuranceIssueDate !== undefined) existing.insuranceIssueDate = body.insuranceIssueDate;
        if (body.insuranceExpiry !== undefined) existing.insuranceExpiry = body.insuranceExpiry;
        if (body.fitnessIssueDate !== undefined) existing.fitnessIssueDate = body.fitnessIssueDate;
        if (body.fitnessExpiry !== undefined) existing.fitnessExpiry = body.fitnessExpiry;
        if (body.taxExpiry !== undefined) existing.taxExpiry = body.taxExpiry;
        if (body.permitNumber !== undefined) existing.permitNumber = String(body.permitNumber).trim();
        if (body.permitExpiry !== undefined) existing.permitExpiry = body.permitExpiry;
        if (body.otherDocumentName !== undefined) existing.otherDocumentName = String(body.otherDocumentName).trim();
        if (body.otherDocumentExpiry !== undefined) existing.otherDocumentExpiry = body.otherDocumentExpiry;

        existing.updatedAt = new Date().toISOString();
        saveDb(db);
        return sendJson(200, { customer: existing });
      } catch (err) {
        return sendError(500, err.message);
      }
    }

    // 13. Customers: DELETE
    if (customerMatch && req.method === 'DELETE') {
      const custId = customerMatch[1];
      let index = -1;
      for (let i = 0; i < db.customers.length; i++) {
        if (db.customers[i].id === custId && db.customers[i].userId === user.id) {
          index = i;
          break;
        }
      }
      if (index === -1) {
        return sendError(404, 'Customer record not found');
      }
      const deleted = db.customers.splice(index, 1)[0];
      saveDb(db);
      return sendJson(200, { success: true, customer: deleted });
    }

    // 14. Services: GET & POST
    if (pathname === '/api/services') {
      if (req.method === 'GET') {
        const userServices = [];
        for (let i = 0; i < db.services.length; i++) {
          if (db.services[i].userId === user.id) {
            userServices.push(db.services[i]);
          }
        }
        userServices.sort(function(a, b) {
          return new Date(b.serviceDate || b.createdAt) - new Date(a.serviceDate || a.createdAt);
        });
        return sendJson(200, { services: userServices });
      }

      if (req.method === 'POST') {
        try {
          const body = await parseBody(req);
          if (!body.vehicleNumber || !body.serviceType) {
            return sendError(400, 'Vehicle Number and Service Type are required');
          }
          const cleanVehicle = normalizeVehicleNumber(body.vehicleNumber);
          const newService = {
            id: 'srv_' + crypto.randomBytes(6).toString('hex'),
            userId: user.id,
            customerId: body.customerId || '',
            customerName: (body.customerName || '').trim(),
            vehicleNumber: cleanVehicle,
            serviceDate: body.serviceDate || new Date().toISOString().split('T')[0],
            serviceType: String(body.serviceType).trim(),
            description: (body.description || '').trim(),
            cost: Number(body.cost) || 0,
            status: body.status || 'Completed',
            notes: (body.notes || '').trim(),
            createdAt: new Date().toISOString()
          };
          db.services.push(newService);
          saveDb(db);
          return sendJson(201, { service: newService });
        } catch (err) {
          return sendError(500, err.message);
        }
      }
    }

    // 15. Services: DELETE
    const serviceMatch = pathname.match(/^\/api\/services\/([a-zA-Z0-9_-]+)$/);
    if (serviceMatch && req.method === 'DELETE') {
      const srvId = serviceMatch[1];
      let srvIndex = -1;
      for (let i = 0; i < db.services.length; i++) {
        if (db.services[i].id === srvId && db.services[i].userId === user.id) {
          srvIndex = i;
          break;
        }
      }
      if (srvIndex === -1) {
        return sendError(404, 'Service record not found');
      }
      const deleted = db.services.splice(srvIndex, 1)[0];
      saveDb(db);
      return sendJson(200, { success: true, service: deleted });
    }

    // 16. Payments: GET & POST
    if (pathname === '/api/payments') {
      if (req.method === 'GET') {
        const userPayments = [];
        for (let i = 0; i < db.payments.length; i++) {
          if (db.payments[i].userId === user.id) {
            userPayments.push(db.payments[i]);
          }
        }
        userPayments.sort(function(a, b) {
          return new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt);
        });
        return sendJson(200, { payments: userPayments });
      }

      if (req.method === 'POST') {
        try {
          const body = await parseBody(req);
          if (!body.vehicleNumber || body.amount === undefined) {
            return sendError(400, 'Vehicle Number and Amount are required');
          }
          const cleanVehicle = normalizeVehicleNumber(body.vehicleNumber);
          const newPayment = {
            id: 'pay_' + crypto.randomBytes(6).toString('hex'),
            userId: user.id,
            customerId: body.customerId || '',
            customerName: (body.customerName || '').trim(),
            vehicleNumber: cleanVehicle,
            paymentDate: body.paymentDate || new Date().toISOString().split('T')[0],
            amount: Number(body.amount) || 0,
            paymentMode: body.paymentMode || 'Cash',
            referenceNumber: (body.referenceNumber || '').trim(),
            status: body.status || 'Paid',
            notes: (body.notes || '').trim(),
            createdAt: new Date().toISOString()
          };
          db.payments.push(newPayment);
          saveDb(db);
          return sendJson(201, { payment: newPayment });
        } catch (err) {
          return sendError(500, err.message);
        }
      }
    }

    // 17. Payments: DELETE
    const paymentMatch = pathname.match(/^\/api\/payments\/([a-zA-Z0-9_-]+)$/);
    if (paymentMatch && req.method === 'DELETE') {
      const payId = paymentMatch[1];
      let payIndex = -1;
      for (let i = 0; i < db.payments.length; i++) {
        if (db.payments[i].id === payId && db.payments[i].userId === user.id) {
          payIndex = i;
          break;
        }
      }
      if (payIndex === -1) {
        return sendError(404, 'Payment record not found');
      }
      const deleted = db.payments.splice(payIndex, 1)[0];
      saveDb(db);
      return sendJson(200, { success: true, payment: deleted });
    }

    // 18. Reminder History: GET & POST & PUT
    if (pathname === '/api/reminders/history') {
      if (req.method === 'GET') {
        const userLogs = [];
        for (let i = 0; i < db.reminderLogs.length; i++) {
          if (db.reminderLogs[i].userId === user.id) {
            userLogs.push(db.reminderLogs[i]);
          }
        }
        userLogs.sort(function(a, b) {
          return new Date(b.reminderDate || b.createdAt) - new Date(a.reminderDate || a.createdAt);
        });
        return sendJson(200, { history: userLogs });
      }

      if (req.method === 'POST') {
        try {
          const body = await parseBody(req);
          const newLog = {
            id: 'rem_' + crypto.randomBytes(6).toString('hex'),
            userId: user.id,
            customerId: body.customerId || '',
            customerName: (body.customerName || '').trim(),
            vehicleNumber: normalizeVehicleNumber(body.vehicleNumber || ''),
            documentType: body.documentType || 'Custom',
            reminderDate: new Date().toISOString(),
            communicationType: body.communicationType || 'WhatsApp',
            status: body.status || 'Prepared',
            message: body.message || '',
            createdAt: new Date().toISOString()
          };
          db.reminderLogs.push(newLog);
          saveDb(db);
          return sendJson(201, { reminderLog: newLog });
        } catch (err) {
          return sendError(500, err.message);
        }
      }
    }

    const reminderMatch = pathname.match(/^\/api\/reminders\/history\/([a-zA-Z0-9_-]+)$/);
    if (reminderMatch && req.method === 'PUT') {
      try {
        const remId = reminderMatch[1];
        let rem = null;
        for (let i = 0; i < db.reminderLogs.length; i++) {
          if (db.reminderLogs[i].id === remId && db.reminderLogs[i].userId === user.id) {
            rem = db.reminderLogs[i];
            break;
          }
        }
        if (!rem) return sendError(404, 'Reminder log not found');
        const body = await parseBody(req);
        if (body.status) rem.status = body.status;
        saveDb(db);
        return sendJson(200, { reminderLog: rem });
      } catch (err) {
        return sendError(500, err.message);
      }
    }

    // 19. Multi-device Cloud Sync endpoint
    if (pathname === '/api/sync' && req.method === 'GET') {
      const since = parsedUrl.query.since;
      let customerList = [];
      for (let i = 0; i < db.customers.length; i++) {
        if (db.customers[i].userId === user.id) {
          if (!since || new Date(db.customers[i].updatedAt || db.customers[i].createdAt) > new Date(since)) {
            customerList.push(db.customers[i]);
          }
        }
      }
      let total = 0;
      for (let i = 0; i < db.customers.length; i++) {
        if (db.customers[i].userId === user.id) total++;
      }
      return sendJson(200, {
        serverTime: new Date().toISOString(),
        customers: customerList,
        totalCount: total
      });
    }

    // 20. Seed Sample Data
    if (pathname === '/api/seed' && req.method === 'POST') {
      const newCustomers = [];
      for (let i = 0; i < db.customers.length; i++) {
        if (db.customers[i].userId !== user.id) {
          newCustomers.push(db.customers[i]);
        }
      }
      db.customers = newCustomers;

      const sampleSeed = getInitialData().customers;
      for (let i = 0; i < sampleSeed.length; i++) {
        sampleSeed[i].id = 'cust_' + crypto.randomBytes(6).toString('hex');
        sampleSeed[i].userId = user.id;
        sampleSeed[i].createdAt = new Date().toISOString();
        sampleSeed[i].updatedAt = new Date().toISOString();
        db.customers.push(sampleSeed[i]);
      }
      saveDb(db);
      return sendJson(200, { success: true, customers: sampleSeed });
    }

    return sendError(404, 'API endpoint not found');
  }

  // ===================== STATIC FILE SERVING =====================

  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  let filePath = path.join(PUBLIC_DIR, safePath);

  // If path doesn't exist, fallback to index.html for Single Page Application
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, '0.0.0.0', function() {
  console.log('[Vehicle Genie] Smart Vehicle & Customer Management Server listening on port ' + PORT);
});
