import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { connectDB, disconnectDB } from '../config/db.js';
import { Admin } from '../models/Admin.js';
import { Warden } from '../models/Warden.js';
import { Student } from '../models/Student.js';
import { Hostel } from '../models/Hostel.js';
import { HostelBed } from '../models/HostelBed.js';
import { Transport } from '../models/Transport.js';
import { Fee } from '../models/Fee.js';
import { Fine } from '../models/Fine.js';
import { Attendance } from '../models/Attendance.js';
import { Payment } from '../models/Payment.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { BusStop } from '../models/BusStop.js';
import { PaymentSetting } from '../models/PaymentSetting.js';

/**
 * Initialize system administrator accounts if unpopulated.
 * Does NOT create fake demo students, mock payments, or test records.
 * The system starts with an empty student database so real users are created through the application.
 */
export const seedInitialData = async () => {
  console.log('🏛️ Initializing JB Institute of Technology institutional administration...');

  // Remove any legacy demo administrators
  await Admin.deleteMany({
    email: { $in: ['admin@college.edu', 'demo@college.edu', 'demo.admin@college.edu'] }
  });

  const salt = await bcrypt.genSalt(10);
  const adminEmail = (process.env.ADMIN_EMAIL || 'jbinstitute.erp@gmail.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'jbit@123';
  const adminPasswordHash = await bcrypt.hash(adminPassword, salt);

  // Ensure Main Institutional Administrator exists with hashed credentials
  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await Admin.create({
      name: 'JB Institute of Technology Administration',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'ADMIN'
    });
  } else {
    existingAdmin.name = 'JB Institute of Technology Administration';
    existingAdmin.passwordHash = adminPasswordHash;
    await existingAdmin.save();
  }

  // 3. Seed Default Master Fee Structures if unpopulated
  const feeStructureCount = await FeeStructure.countDocuments();
  if (feeStructureCount === 0) {
    await FeeStructure.create([
      {
        course: 'B.Tech Computer Science & Engineering',
        branch: 'Computer Science & Engineering',
        semester: '1',
        academicYear: '2024-2025',
        tuitionFee: 45000,
        examinationFee: 5000,
        registrationFee: 2500,
        libraryFee: 2500,
        laboratoryFee: 5000,
        hostelFee: 0,
        transportFee: 0,
        otherCharges: 2500,
        lateFineRule: {
          type: 'PER_DAY',
          amount: 50,
          graceDays: 5
        },
        installments: [
          {
            installmentNumber: 1,
            title: 'Term 1 Admission & Academic Fee',
            percentage: 60,
            dueDate: new Date(Date.now() + 30 * 86400000)
          },
          {
            installmentNumber: 2,
            title: 'Term 2 Examination & Lab Charges',
            percentage: 40,
            dueDate: new Date(Date.now() + 90 * 86400000)
          }
        ]
      },
      {
        course: 'B.Tech Information Technology',
        branch: 'Information Technology',
        semester: '1',
        academicYear: '2024-2025',
        tuitionFee: 42000,
        examinationFee: 5000,
        registrationFee: 2500,
        libraryFee: 2500,
        laboratoryFee: 5000,
        hostelFee: 0,
        transportFee: 0,
        otherCharges: 2500,
        lateFineRule: {
          type: 'PER_DAY',
          amount: 50,
          graceDays: 5
        },
        installments: [
          {
            installmentNumber: 1,
            title: 'Term 1 Fee',
            percentage: 60,
            dueDate: new Date(Date.now() + 30 * 86400000)
          },
          {
            installmentNumber: 2,
            title: 'Term 2 Fee',
            percentage: 40,
            dueDate: new Date(Date.now() + 90 * 86400000)
          }
        ]
      }
    ]);
    console.log('✅ Default institutional fee structures configured.');
  }

  // 4. Seed Verified Chief Warden if unpopulated
  const wardenCount = await Warden.countDocuments();
  if (wardenCount === 0) {
    const wardenPassHash = await bcrypt.hash('Warden@123', salt);
    await Warden.create({
      fullName: 'Dr. S. K. Verma',
      employeeId: 'WRD-101',
      email: 'warden@jbit.edu.in',
      mobile: '+91 9876543210',
      dateOfBirth: '1980-05-15',
      gender: 'Male',
      qualification: 'Ph.D. / M.Tech in Structural Engineering',
      designation: 'Chief Hostel Warden & Professor',
      hostelAssigned: 'Mandakini Boys Hostel',
      address: 'Staff Quarters, JB Institute of Technology Campus, Dehradun',
      passwordHash: wardenPassHash,
      emailVerified: true,
      status: 'active',
      role: 'WARDEN'
    });
    console.log('✅ Default Verified Chief Hostel Warden created (warden@jbit.edu.in)');
  }

  // 5. Seed Campus Hostels and Beds if unpopulated
  const hostelCount = await Hostel.countDocuments();
  if (hostelCount === 0) {
    const boysHostel = await Hostel.create({
      hostelName: 'Mandakini Boys Hostel',
      hostelType: 'BOYS',
      building: 'West Campus Wing',
      wardenName: 'Dr. S. K. Verma',
      wardenContact: '+91 9876543210',
      hostelFee: 45000,
      feeBreakdown: {
        admissionFee: 5000,
        roomFee: 20000,
        messFee: 15000,
        securityDeposit: 5000,
        otherCharges: 0
      },
      blocks: ['Block A', 'Block B'],
      floors: ['1st Floor', '2nd Floor'],
      facilities: ['High-speed Wi-Fi', 'Hygienic Mess', '24x7 Power Backup', 'RO Purified Water', 'Gymnasium', 'Table Tennis'],
      description: 'Main residential wing for boys with spacious, ventilated rooms and 24x7 security.',
      status: 'ACTIVE'
    });

    const girlsHostel = await Hostel.create({
      hostelName: 'Bhagirathi Girls Hostel',
      hostelType: 'GIRLS',
      building: 'East Campus Wing',
      wardenName: 'Dr. Anita Sharma',
      wardenContact: '+91 9876543211',
      hostelFee: 45000,
      feeBreakdown: {
        admissionFee: 5000,
        roomFee: 20000,
        messFee: 15000,
        securityDeposit: 5000,
        otherCharges: 0
      },
      blocks: ['Block C', 'Block D'],
      floors: ['1st Floor', '2nd Floor'],
      facilities: ['High-speed Wi-Fi', 'Nutritious Mess', '24x7 CCTV & Security', 'RO Purified Water', 'Common Room', 'Badminton Court'],
      description: 'Safe and comfortable on-campus residential facility for female students.',
      status: 'ACTIVE'
    });

    // Seed Beds for Boys Hostel (Block A, Rooms 101, 102, 103, 104 with Beds A & B)
    const bedsToCreate = [];
    const rooms = ['101', '102', '103', '104'];
    rooms.forEach((rm) => {
      ['A', 'B'].forEach((bed) => {
        bedsToCreate.push({
          hostelId: boysHostel._id,
          hostelName: boysHostel.hostelName,
          building: boysHostel.building,
          block: 'Block A',
          floor: '1st Floor',
          roomNumber: rm,
          roomCapacity: 2,
          roomType: 'Standard Double',
          bedNumber: `Bed ${rm}-${bed}`,
          bedIdentifier: `MANDAKINI-A-${rm}-${bed}`,
          status: 'AVAILABLE',
          fee: 45000,
          wardenName: boysHostel.wardenName,
          wardenContact: boysHostel.wardenContact
        });
      });
    });

    // Seed Beds for Girls Hostel (Block C, Rooms 201, 202, 203 with Beds A & B)
    ['201', '202', '203'].forEach((rm) => {
      ['A', 'B'].forEach((bed) => {
        bedsToCreate.push({
          hostelId: girlsHostel._id,
          hostelName: girlsHostel.hostelName,
          building: girlsHostel.building,
          block: 'Block C',
          floor: '2nd Floor',
          roomNumber: rm,
          roomCapacity: 2,
          roomType: 'Standard Double',
          bedNumber: `Bed ${rm}-${bed}`,
          bedIdentifier: `BHAGIRATHI-C-${rm}-${bed}`,
          status: 'AVAILABLE',
          fee: 45000,
          wardenName: girlsHostel.wardenName,
          wardenContact: girlsHostel.wardenContact
        });
      });
    });

    await HostelBed.insertMany(bedsToCreate);
    console.log(`✅ Default Campus Hostels & ${bedsToCreate.length} individual Beds initialized.`);
  }

  // 6. Seed Campus Transport Buses if unpopulated
  const busCount = await Transport.countDocuments();
  if (busCount === 0) {
    await Transport.create([
      {
        busNumber: 'UK-07-PA-1001',
        routeName: 'Clock Tower to JBIT Campus',
        driverName: 'Ramesh Chand',
        driverContact: '+91 9897001122',
        totalSeats: 40,
        occupiedSeats: 0,
        availableSeats: 40,
        transportFee: 18000,
        academicYear: '2024-2025',
        status: 'ACTIVE',
        stops: [
          { stopName: 'Clock Tower Dehradun', pickupTime: '07:15 AM', dropTime: '05:45 PM', stopFee: 18000 },
          { stopName: 'Ballupur Chowk', pickupTime: '07:30 AM', dropTime: '05:30 PM', stopFee: 18000 },
          { stopName: 'Prem Nagar Market', pickupTime: '07:45 AM', dropTime: '05:15 PM', stopFee: 18000 },
          { stopName: 'JBIT Campus Main Gate', pickupTime: '08:15 AM', dropTime: '04:45 PM', stopFee: 18000 }
        ]
      },
      {
        busNumber: 'UK-07-PA-1002',
        routeName: 'ISBT to JBIT Campus',
        driverName: 'Mahesh Kumar',
        driverContact: '+91 9897003344',
        totalSeats: 35,
        occupiedSeats: 0,
        availableSeats: 35,
        transportFee: 18000,
        academicYear: '2024-2025',
        status: 'ACTIVE',
        stops: [
          { stopName: 'ISBT Dehradun', pickupTime: '07:10 AM', dropTime: '05:50 PM', stopFee: 18000 },
          { stopName: 'Shimla Bypass Chowk', pickupTime: '07:25 AM', dropTime: '05:35 PM', stopFee: 18000 },
          { stopName: 'Selakui Industrial Area', pickupTime: '07:50 AM', dropTime: '05:10 PM', stopFee: 18000 },
          { stopName: 'JBIT Campus Main Gate', pickupTime: '08:15 AM', dropTime: '04:45 PM', stopFee: 18000 }
        ]
      }
    ]);
    console.log('✅ Default Campus Transport Bus fleet initialized.');
  }

  // 7. Seed Configurable Dehradun Bus Stops if unpopulated
  const stopCount = await BusStop.countDocuments();
  if (stopCount === 0) {
    await BusStop.insertMany(DEHRADUN_BUS_STOPS);
    console.log(`✅ Default ${DEHRADUN_BUS_STOPS.length} configurable Dehradun transport stops initialized.`);
  }

  // 8. Seed Default College Payment QR Settings if unpopulated
  const paymentSettingCount = await PaymentSetting.countDocuments();
  if (paymentSettingCount === 0) {
    const upiUri = 'upi://pay?pa=jbitdehradun@upi&pn=JB%20Institute%20of%20Technology&cu=INR';
    const defaultQrDataUrl = await QRCode.toDataURL(upiUri, { width: 360, margin: 2 });
    await PaymentSetting.create({
      key: 'DEFAULT',
      qrCode: defaultQrDataUrl,
      upiId: 'jbitdehradun@upi',
      paymentName: 'JB Institute of Technology',
      paymentInstructions: '1. Scan this QR code using Google Pay, PhonePe, Paytm or BHIM.\n2. Verify beneficiary: JB Institute of Technology.\n3. Complete the payment and note down your 12-digit UTR/Txn Number.\n4. Upload the screenshot of your payment receipt for administrative verification.',
      updatedBy: 'System Auto-Config'
    });
    console.log('✅ Default Institutional Payment QR and UPI Settings initialized.');
  }

  console.log('✅ System administrator and facility accounts ready. Student database is clean.');
};

export const DEHRADUN_BUS_STOPS = [
  { stopName: 'JB Institute of Technology (JBIT)', landmark: '23 Milestone, NH-07, Chakrata Rd, Shankarpur, Uttarakhand 248197', isCampus: true, pickupTime: '08:15 AM', dropTime: '04:45 PM', estimatedFee: 18000 },
  { stopName: 'Shankarpur', landmark: 'Chakrata Road', isCampus: false, pickupTime: '08:10 AM', dropTime: '04:50 PM', estimatedFee: 18000 },
  { stopName: 'Chakrata Road', landmark: 'NH-07 Highway', isCampus: false, pickupTime: '08:05 AM', dropTime: '04:55 PM', estimatedFee: 18000 },
  { stopName: 'Prem Nagar', landmark: 'Prem Nagar Chowk / Market', isCampus: false, pickupTime: '07:45 AM', dropTime: '05:15 PM', estimatedFee: 18000 },
  { stopName: 'Sudhowala', landmark: 'Sudhowala Chowk', isCampus: false, pickupTime: '07:55 AM', dropTime: '05:05 PM', estimatedFee: 18000 },
  { stopName: 'Bidholi', landmark: 'Bidholi Junction', isCampus: false, pickupTime: '07:35 AM', dropTime: '05:25 PM', estimatedFee: 18000 },
  { stopName: 'Selaqui', landmark: 'Selaqui Industrial Hub', isCampus: false, pickupTime: '08:00 AM', dropTime: '05:00 PM', estimatedFee: 18000 },
  { stopName: 'Clement Town', landmark: 'Subhash Nagar / Graphic Era Turn', isCampus: false, pickupTime: '07:15 AM', dropTime: '05:45 PM', estimatedFee: 18000 },
  { stopName: 'ISBT Dehradun', landmark: 'Main Inter State Bus Terminal', isCampus: false, pickupTime: '07:10 AM', dropTime: '05:50 PM', estimatedFee: 18000 },
  { stopName: 'Patel Nagar', landmark: 'Saharanpur Road', isCampus: false, pickupTime: '07:20 AM', dropTime: '05:40 PM', estimatedFee: 18000 },
  { stopName: 'Ballupur', landmark: 'Ballupur Chowk Flyover', isCampus: false, pickupTime: '07:30 AM', dropTime: '05:30 PM', estimatedFee: 18000 },
  { stopName: 'Balliwala', landmark: 'Balliwala Flyover Chowk', isCampus: false, pickupTime: '07:25 AM', dropTime: '05:35 PM', estimatedFee: 18000 },
  { stopName: 'Saharanpur Chowk', landmark: 'City Center Crossing', isCampus: false, pickupTime: '07:15 AM', dropTime: '05:45 PM', estimatedFee: 18000 },
  { stopName: 'Ghanta Ghar', landmark: 'Clock Tower Heart of Dehradun', isCampus: false, pickupTime: '07:15 AM', dropTime: '05:45 PM', estimatedFee: 18000 },
  { stopName: 'Clock Tower', landmark: 'Main Circle', isCampus: false, pickupTime: '07:15 AM', dropTime: '05:45 PM', estimatedFee: 18000 },
  { stopName: 'Rajpur Road', landmark: 'Dilaram / Ashley Hall Crossing', isCampus: false, pickupTime: '07:05 AM', dropTime: '05:55 PM', estimatedFee: 18000 },
  { stopName: 'Jakhan', landmark: 'Rajpur Road Jakhan Chowk', isCampus: false, pickupTime: '06:55 AM', dropTime: '06:05 PM', estimatedFee: 18000 },
  { stopName: 'Pacific Mall', landmark: 'Jakhan Main Entrance', isCampus: false, pickupTime: '06:50 AM', dropTime: '06:10 PM', estimatedFee: 18000 },
  { stopName: 'Dilaram Chowk', landmark: 'Rajpur Road Crossing', isCampus: false, pickupTime: '07:05 AM', dropTime: '05:55 PM', estimatedFee: 18000 },
  { stopName: 'Parade Ground', landmark: 'Sports Complex / Survey Chowk', isCampus: false, pickupTime: '07:10 AM', dropTime: '05:50 PM', estimatedFee: 18000 },
  { stopName: 'Race Course', landmark: 'Police Line Crossing', isCampus: false, pickupTime: '07:15 AM', dropTime: '05:45 PM', estimatedFee: 18000 },
  { stopName: 'Dharampur', landmark: 'Dharampur Chowk', isCampus: false, pickupTime: '07:15 AM', dropTime: '05:45 PM', estimatedFee: 18000 },
  { stopName: 'Nehru Colony', landmark: 'Fountain Chowk', isCampus: false, pickupTime: '07:10 AM', dropTime: '05:50 PM', estimatedFee: 18000 },
  { stopName: 'Rispana', landmark: 'Rispana Bridge / Vidhan Sabha', isCampus: false, pickupTime: '07:05 AM', dropTime: '05:55 PM', estimatedFee: 18000 },
  { stopName: 'Jogiwala', landmark: 'Haridwar Bypass Chowk', isCampus: false, pickupTime: '07:00 AM', dropTime: '06:00 PM', estimatedFee: 18000 },
  { stopName: 'Mothrowala', landmark: 'Mothrowala Crossing', isCampus: false, pickupTime: '07:05 AM', dropTime: '05:55 PM', estimatedFee: 18000 },
  { stopName: 'Kargi Chowk', landmark: 'Kargi Grant Crossing', isCampus: false, pickupTime: '07:15 AM', dropTime: '05:45 PM', estimatedFee: 18000 },
  { stopName: 'Turner Road', landmark: 'Clement Town Gate', isCampus: false, pickupTime: '07:20 AM', dropTime: '05:40 PM', estimatedFee: 18000 },
  { stopName: 'Majra', landmark: 'Saharanpur Road Majra', isCampus: false, pickupTime: '07:20 AM', dropTime: '05:40 PM', estimatedFee: 18000 },
  { stopName: 'Niranjanpur', landmark: 'Mandi Gate / Saharanpur Road', isCampus: false, pickupTime: '07:20 AM', dropTime: '05:40 PM', estimatedFee: 18000 },
  { stopName: 'Subhash Nagar', landmark: 'Delhi-Dehradun Highway', isCampus: false, pickupTime: '07:15 AM', dropTime: '05:45 PM', estimatedFee: 18000 },
  { stopName: 'Mohabbewala', landmark: 'Industrial Area Mohabbewala', isCampus: false, pickupTime: '07:10 AM', dropTime: '05:50 PM', estimatedFee: 18000 },
  { stopName: 'Transport Nagar', landmark: 'RTO Office Area', isCampus: false, pickupTime: '07:15 AM', dropTime: '05:45 PM', estimatedFee: 18000 },
  { stopName: 'Shimla Bypass', landmark: 'Chowk Crossing', isCampus: false, pickupTime: '07:25 AM', dropTime: '05:35 PM', estimatedFee: 18000 },
  { stopName: 'ISBT Road', landmark: 'Haridwar-Delhi Bypass', isCampus: false, pickupTime: '07:12 AM', dropTime: '05:48 PM', estimatedFee: 18000 },
  { stopName: 'Nirankari Chowk', landmark: 'Prem Nagar Road', isCampus: false, pickupTime: '07:40 AM', dropTime: '05:20 PM', estimatedFee: 18000 }
];

export const seedInitialDataIfEmpty = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'jbinstitute.erp@gmail.com').trim().toLowerCase();
  const mainAdmin = await Admin.findOne({ email: adminEmail });
  if (!mainAdmin) {
    console.log('🔍 Institutional administrator not found. Setting up admin account...');
    await seedInitialData();
  } else {
    // Check if stops or payment setting need seeding on existing DB
    const stopCount = await BusStop.countDocuments();
    if (stopCount === 0) {
      await BusStop.insertMany(DEHRADUN_BUS_STOPS);
      console.log(`✅ Default ${DEHRADUN_BUS_STOPS.length} configurable Dehradun transport stops initialized.`);
    }

    const paymentSettingCount = await PaymentSetting.countDocuments();
    if (paymentSettingCount === 0) {
      const upiUri = 'upi://pay?pa=jbitdehradun@upi&pn=JB%20Institute%20of%20Technology&cu=INR';
      const defaultQrDataUrl = await QRCode.toDataURL(upiUri, { width: 360, margin: 2 });
      await PaymentSetting.create({
        key: 'DEFAULT',
        qrCode: defaultQrDataUrl,
        upiId: 'jbitdehradun@upi',
        paymentName: 'JB Institute of Technology',
        paymentInstructions: '1. Scan this QR code using Google Pay, PhonePe, Paytm or BHIM.\n2. Verify beneficiary: JB Institute of Technology.\n3. Complete the payment and note down your 12-digit UTR/Txn Number.\n4. Upload the screenshot of your payment receipt for administrative verification.',
        updatedBy: 'System Auto-Config'
      });
      console.log('✅ Default Institutional Payment QR and UPI Settings initialized.');
    }
  }
};

// If run directly: `node src/seed/seedData.js`
if (process.argv[1]?.includes('seedData.js')) {
  (async () => {
    try {
      await connectDB();
      await seedInitialData();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('Seed execution error:', err);
      process.exit(1);
    }
  })();
}
