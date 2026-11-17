import { Hostel } from '../models/Hostel.js';
import { HostelBed } from '../models/HostelBed.js';
import { HostelApplication } from '../models/HostelApplication.js';
import { HostelAllocation } from '../models/HostelAllocation.js';
import { HostelComplaint } from '../models/HostelComplaint.js';
import { HostelLeaveRequest } from '../models/HostelLeaveRequest.js';
import { HostelNotice } from '../models/HostelNotice.js';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';
import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * 1. Warden Dashboard Overview - Real Database Stats
 * GET /api/warden/dashboard
 */
export const getWardenDashboardStats = async (req, res, next) => {
  try {
    const warden = req.user;
    let hostelFilter = {};

    // If warden is assigned to a specific hostel, scope or show campus-wide if all
    if (warden.hostelAssigned && warden.hostelAssigned !== 'All Hostels' && warden.hostelAssigned !== 'Campus Wide') {
      const assignedHostel = await Hostel.findOne({ hostelName: new RegExp(`^${warden.hostelAssigned}$`, 'i') });
      if (assignedHostel) {
        hostelFilter = { hostelId: assignedHostel._id };
      }
    }

    const [
      totalHostels,
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      reservedBeds,
      pendingApps,
      approvedApps,
      rejectedApps,
      waitlistedApps,
      openComplaints,
      pendingOutings,
      recentApplications,
      recentAllocations,
      recentComplaints,
      recentOutings
    ] = await Promise.all([
      Hostel.countDocuments({ status: { $ne: 'INACTIVE' } }),
      HostelBed.countDocuments(hostelFilter),
      HostelBed.countDocuments({ ...hostelFilter, status: 'OCCUPIED' }),
      HostelBed.countDocuments({ ...hostelFilter, status: 'AVAILABLE' }),
      HostelBed.countDocuments({ ...hostelFilter, status: 'MAINTENANCE' }),
      HostelBed.countDocuments({ ...hostelFilter, status: 'RESERVED' }),
      HostelApplication.countDocuments({ status: { $in: ['PENDING_PAYMENT', 'PENDING_ALLOCATION'] } }),
      HostelApplication.countDocuments({ status: 'ALLOCATED' }),
      HostelApplication.countDocuments({ status: 'REJECTED' }),
      HostelApplication.countDocuments({ status: 'WAITLISTED' }),
      HostelComplaint.countDocuments({ status: { $in: ['OPEN', 'PROCESSING'] } }),
      HostelLeaveRequest.countDocuments({ status: 'PENDING' }),
      HostelApplication.find().sort({ createdAt: -1 }).limit(6).lean(),
      HostelAllocation.find({ status: 'ACTIVE' }).sort({ createdAt: -1 }).limit(6).lean(),
      HostelComplaint.find().sort({ createdAt: -1 }).limit(6).lean(),
      HostelLeaveRequest.find().sort({ createdAt: -1 }).limit(6).lean()
    ]);

    // Distinct rooms count
    const distinctRooms = await HostelBed.distinct('roomNumber', hostelFilter);
    const totalRooms = distinctRooms.length;

    // Occupancy Rate calculation
    const occupancyPercentage = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    // Recent Payments
    const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5).populate('studentId', 'fullName universityRollNumber').lean();

    return sendSuccess(res, 'Warden dashboard statistics retrieved successfully', {
      metrics: {
        totalHostels,
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        reservedBeds,
        occupancyPercentage,
        applications: {
          pending: pendingApps,
          approved: approvedApps,
          rejected: rejectedApps,
          waitlisted: waitlistedApps,
          total: pendingApps + approvedApps + rejectedApps + waitlistedApps
        },
        openComplaints,
        pendingOutings
      },
      recentApplications,
      recentAllocations,
      recentPayments,
      recentComplaints,
      recentOutings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Hostels List & Management
 * GET /api/warden/hostels
 */
export const getHostels = async (req, res, next) => {
  try {
    const hostels = await Hostel.find().sort({ hostelName: 1 }).lean();

    // Dynamically calculate bed counters for each hostel
    const enrichedHostels = await Promise.all(
      hostels.map(async (h) => {
        const [totalBeds, occupied, available, maintenance] = await Promise.all([
          HostelBed.countDocuments({ hostelId: h._id }),
          HostelBed.countDocuments({ hostelId: h._id, status: 'OCCUPIED' }),
          HostelBed.countDocuments({ hostelId: h._id, status: 'AVAILABLE' }),
          HostelBed.countDocuments({ hostelId: h._id, status: 'MAINTENANCE' })
        ]);
        const rooms = await HostelBed.distinct('roomNumber', { hostelId: h._id });
        return {
          ...h,
          totalRooms: rooms.length,
          totalBeds,
          occupiedBeds: occupied,
          availableBeds: available,
          maintenanceBeds: maintenance,
          occupancyPercentage: totalBeds > 0 ? Number(((occupied / totalBeds) * 100).toFixed(1)) : 0
        };
      })
    );

    return sendSuccess(res, 'Hostels list fetched', enrichedHostels);
  } catch (error) {
    next(error);
  }
};

/**
 * Create or Update Hostel
 * POST /api/warden/hostels
 */
export const createOrUpdateHostel = async (req, res, next) => {
  try {
    const {
      id,
      hostelName,
      hostelType,
      building,
      wardenName,
      wardenContact,
      hostelFee,
      feeBreakdown,
      blocks,
      floors,
      facilities,
      description,
      status
    } = req.body;

    if (!hostelName) {
      return sendError(res, 'Hostel Name is required', 400);
    }

    let hostel;
    if (id) {
      hostel = await Hostel.findById(id);
      if (!hostel) return sendError(res, 'Hostel not found', 404);
      if (hostelName) hostel.hostelName = hostelName.trim();
      if (hostelType) hostel.hostelType = hostelType;
      if (building) hostel.building = building.trim();
      if (wardenName) hostel.wardenName = wardenName.trim();
      if (wardenContact) hostel.wardenContact = wardenContact.trim();
      if (hostelFee !== undefined) hostel.hostelFee = Number(hostelFee);
      if (feeBreakdown) hostel.feeBreakdown = feeBreakdown;
      if (blocks) hostel.blocks = Array.isArray(blocks) ? blocks : blocks.split(',').map((s) => s.trim());
      if (floors) hostel.floors = Array.isArray(floors) ? floors : floors.split(',').map((s) => s.trim());
      if (facilities) hostel.facilities = Array.isArray(facilities) ? facilities : facilities.split(',').map((s) => s.trim());
      if (description) hostel.description = description.trim();
      if (status) hostel.status = status;
      await hostel.save();
    } else {
      hostel = await Hostel.create({
        hostelName: hostelName.trim(),
        hostelType: hostelType || 'BOYS',
        building: building ? building.trim() : 'Main Campus Wing',
        wardenName: wardenName ? wardenName.trim() : req.user.fullName,
        wardenContact: wardenContact ? wardenContact.trim() : req.user.mobile,
        hostelFee: Number(hostelFee) || 45000,
        feeBreakdown: feeBreakdown || {
          admissionFee: 5000,
          roomFee: 20000,
          messFee: 15000,
          securityDeposit: 5000,
          otherCharges: 0
        },
        blocks: Array.isArray(blocks) ? blocks : ['Block A', 'Block B'],
        floors: Array.isArray(floors) ? floors : ['Ground Floor', '1st Floor', '2nd Floor'],
        facilities: Array.isArray(facilities) ? facilities : ['Wi-Fi Campus', 'Nutritious Mess', '24x7 Security', 'Power Backup'],
        description: description ? description.trim() : '',
        status: status || 'ACTIVE'
      });
    }

    return sendSuccess(res, `Hostel ${id ? 'updated' : 'created'} successfully`, hostel);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Bed Management
 * GET /api/warden/beds
 */
export const getBeds = async (req, res, next) => {
  try {
    const { hostelId, block, floor, roomNumber, status, search } = req.query;
    const filter = {};

    if (hostelId) filter.hostelId = hostelId;
    if (block) filter.block = block;
    if (floor) filter.floor = floor;
    if (roomNumber) filter.roomNumber = roomNumber;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { bedIdentifier: new RegExp(search.trim(), 'i') },
        { bedNumber: new RegExp(search.trim(), 'i') },
        { roomNumber: new RegExp(search.trim(), 'i') }
      ];
    }

    const beds = await HostelBed.find(filter)
      .populate('occupantStudentId', 'fullName universityRollNumber mobile course semester profilePhoto')
      .populate('allocationId')
      .sort({ block: 1, roomNumber: 1, bedNumber: 1 })
      .lean();

    return sendSuccess(res, 'Hostel beds fetched successfully', beds);
  } catch (error) {
    next(error);
  }
};

/**
 * Add / Create Hostel Bed
 * POST /api/warden/beds
 */
export const createBed = async (req, res, next) => {
  try {
    const {
      hostelId,
      block,
      floor,
      roomNumber,
      roomCapacity = 2,
      roomType = 'Standard Double',
      bedNumber,
      fee = 45000
    } = req.body;

    if (!hostelId || !block || !roomNumber || !bedNumber) {
      return sendError(res, 'Hostel ID, Block, Room Number, and Bed Number are required', 400);
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return sendError(res, 'Target Hostel building not found', 404);

    const cleanBlock = block.trim();
    const cleanRoom = roomNumber.trim();
    const cleanBed = bedNumber.trim();
    const cleanFloor = floor ? floor.trim() : '1st Floor';

    // Unique Identifier e.g. "MANDAKINI-A-101-BED-A"
    const bedIdentifier = `${hostel.hostelName.toUpperCase().replace(/\s+/g, '_')}-${cleanBlock.replace(/\s+/g, '')}-${cleanRoom}-${cleanBed.replace(/\s+/g, '')}`;

    const existing = await HostelBed.findOne({
      $or: [
        { bedIdentifier },
        { hostelId: hostel._id, block: cleanBlock, roomNumber: cleanRoom, bedNumber: cleanBed }
      ]
    });

    if (existing) {
      return sendError(res, `Bed ${cleanBed} in Room ${cleanRoom} (${cleanBlock}) already exists.`, 400);
    }

    const newBed = await HostelBed.create({
      hostelId: hostel._id,
      hostelName: hostel.hostelName,
      building: hostel.building,
      block: cleanBlock,
      floor: cleanFloor,
      roomNumber: cleanRoom,
      roomCapacity: Number(roomCapacity) || 2,
      roomType,
      bedNumber: cleanBed,
      bedIdentifier,
      status: 'AVAILABLE',
      fee: Number(fee) || hostel.hostelFee || 45000,
      wardenName: hostel.wardenName,
      wardenContact: hostel.wardenContact
    });

    return sendSuccess(res, 'Hostel bed entry created successfully', newBed, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Bed Status (AVAILABLE, MAINTENANCE, RESERVED)
 * PUT /api/warden/beds/:id/status
 */
export const updateBedStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['AVAILABLE', 'MAINTENANCE', 'RESERVED'].includes(status)) {
      return sendError(res, 'Invalid status. Status can be AVAILABLE, MAINTENANCE, or RESERVED', 400);
    }

    const bed = await HostelBed.findById(id);
    if (!bed) return sendError(res, 'Bed not found', 404);

    if (bed.status === 'OCCUPIED' && status !== 'OCCUPIED') {
      return sendError(res, 'This bed currently has an active student allocated. Please vacate the student first before changing status.', 400);
    }

    bed.status = status;
    await bed.save();

    return sendSuccess(res, `Bed status updated to ${status}`, bed);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Bed Entry
 * DELETE /api/warden/beds/:id
 */
export const deleteBed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bed = await HostelBed.findById(id);
    if (!bed) return sendError(res, 'Bed not found', 404);

    if (bed.status === 'OCCUPIED' || bed.occupantStudentId) {
      return sendError(res, 'Cannot delete an occupied bed. Please vacate the student first.', 400);
    }

    await HostelBed.findByIdAndDelete(id);
    return sendSuccess(res, 'Bed entry deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Hostel Applications List
 * GET /api/warden/applications
 */
export const getApplications = async (req, res, next) => {
  try {
    const { status, hostelId, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (hostelId) filter.hostelId = hostelId;
    if (search) {
      filter.$or = [
        { studentName: new RegExp(search.trim(), 'i') },
        { studentRoll: new RegExp(search.trim(), 'i') },
        { studentEmail: new RegExp(search.trim(), 'i') }
      ];
    }

    const applications = await HostelApplication.find(filter)
      .populate('studentId', 'fullName universityRollNumber mobile course semester profilePhoto')
      .populate('paymentId')
      .populate('allocatedBedId')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Hostel applications retrieved', applications);
  } catch (error) {
    next(error);
  }
};

/**
 * Process Application (Manual Approval / Rejection / Bed Assign)
 * POST /api/warden/applications/:id/process
 */
export const processApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, bedId, remarks } = req.body; // action: 'ALLOCATE', 'REJECT', 'WAITLIST'

    const application = await HostelApplication.findById(id);
    if (!application) return sendError(res, 'Application not found', 404);

    if (action === 'REJECT') {
      application.status = 'REJECTED';
      application.rejectionReason = remarks || 'Application declined by warden.';
      await application.save();

      await Notification.create({
        recipientId: application.studentId,
        recipientRole: 'STUDENT',
        title: 'Hostel Application Declined',
        message: `Your application for ${application.hostelName} has been declined: ${application.rejectionReason}`,
        type: 'HOSTEL_APPLICATION'
      });

      return sendSuccess(res, 'Application marked as REJECTED', application);
    }

    if (action === 'WAITLIST') {
      application.status = 'WAITLISTED';
      application.remarks = remarks || 'Placed on waitlist by warden.';
      await application.save();
      return sendSuccess(res, 'Application marked as WAITLISTED', application);
    }

    if (action === 'ALLOCATE') {
      let targetBed = null;
      if (bedId) {
        targetBed = await HostelBed.findOne({ _id: bedId, status: 'AVAILABLE' });
        if (!targetBed) return sendError(res, 'Selected bed is not available', 400);
      } else {
        // Find next available bed in the requested hostel
        targetBed = await HostelBed.findOne({ hostelId: application.hostelId, status: 'AVAILABLE' });
        if (!targetBed) return sendError(res, 'No available beds found in this hostel', 400);
      }

      // Atomically occupy bed
      targetBed.status = 'OCCUPIED';
      targetBed.occupantStudentId = application.studentId;

      // Create Allocation record
      const allocation = await HostelAllocation.create({
        studentId: application.studentId,
        studentName: application.studentName,
        rollNumber: application.studentRoll,
        hostelId: targetBed.hostelId,
        bedId: targetBed._id,
        applicationId: application._id,
        hostelName: targetBed.hostelName,
        block: targetBed.block,
        floor: targetBed.floor,
        roomNumber: targetBed.roomNumber,
        bedNumber: targetBed.bedNumber,
        allocationDate: new Date(),
        academicYear: application.academicYear || '2024-2025',
        paymentReference: application.transactionId || 'MANUAL_ALLOCATION',
        receiptNumber: application.receiptNumber || 'RCP_MANUAL',
        status: 'ACTIVE'
      });

      targetBed.allocationId = allocation._id;
      await targetBed.save();

      // Update Application
      application.status = 'ALLOCATED';
      application.allocatedBedId = targetBed._id;
      application.allocationDetails = {
        hostelName: targetBed.hostelName,
        block: targetBed.block,
        floor: targetBed.floor,
        roomNumber: targetBed.roomNumber,
        bedNumber: targetBed.bedNumber,
        allocatedAt: new Date()
      };
      await application.save();

      // Update Student record
      await Student.findByIdAndUpdate(application.studentId, {
        hostel: {
          hostelName: targetBed.hostelName,
          roomNumber: targetBed.roomNumber,
          bedNumber: targetBed.bedNumber,
          status: 'Allocated'
        }
      });

      // Notification
      await Notification.create({
        recipientId: application.studentId,
        recipientRole: 'STUDENT',
        title: 'Hostel Bed Allocated!',
        message: `You have been allocated Room ${targetBed.roomNumber}, Bed ${targetBed.bedNumber} in ${targetBed.hostelName}. Download your allocation card from the portal.`,
        type: 'HOSTEL_ALLOCATION',
        link: '/hostel'
      });

      return sendSuccess(res, 'Student allocated to bed successfully', { application, allocation, bed: targetBed });
    }

    return sendError(res, 'Invalid action specified', 400);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Active & Historical Allocations
 * GET /api/warden/allocations
 */
export const getAllocations = async (req, res, next) => {
  try {
    const { status = 'ACTIVE', hostelId, search } = req.query;
    const filter = {};

    if (status && status !== 'ALL') filter.status = status;
    if (hostelId) filter.hostelId = hostelId;

    if (search) {
      filter.$or = [
        { studentName: new RegExp(search.trim(), 'i') },
        { rollNumber: new RegExp(search.trim(), 'i') },
        { roomNumber: new RegExp(search.trim(), 'i') },
        { bedNumber: new RegExp(search.trim(), 'i') }
      ];
    }

    const allocations = await HostelAllocation.find(filter)
      .populate('studentId', 'fullName universityRollNumber mobile email course semester profilePhoto')
      .populate('bedId')
      .sort({ allocationDate: -1 })
      .lean();

    return sendSuccess(res, 'Allocations retrieved successfully', allocations);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Vacate Student from Hostel ("HOSTEL VACATED")
 * POST /api/warden/allocations/:id/vacate
 */
export const vacateStudentAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vacateReason } = req.body;

    const allocation = await HostelAllocation.findById(id);
    if (!allocation) return sendError(res, 'Allocation record not found', 404);

    if (allocation.status === 'VACATED') {
      return sendError(res, 'This allocation is already marked as VACATED', 400);
    }

    // 1. Mark allocation as VACATED (preserve history)
    allocation.status = 'VACATED';
    allocation.vacatedDate = new Date();
    allocation.vacateReason = vacateReason ? vacateReason.trim() : 'Course completion or normal departure';
    allocation.vacatedBy = req.user.fullName || 'Hostel Warden';
    await allocation.save();

    // 2. Automatically make the bed AVAILABLE again
    const bed = await HostelBed.findById(allocation.bedId);
    if (bed) {
      bed.status = 'AVAILABLE';
      bed.occupantStudentId = null;
      bed.allocationId = null;
      await bed.save();
    }

    // 3. Update student hostel status
    await Student.findByIdAndUpdate(allocation.studentId, {
      'hostel.status': 'Vacated',
      'hostel.roomNumber': '',
      'hostel.bedNumber': ''
    });

    // 4. Update application status
    if (allocation.applicationId) {
      await HostelApplication.findByIdAndUpdate(allocation.applicationId, {
        status: 'COMPLETED'
      });
    }

    // 5. Send notification to student
    await Notification.create({
      recipientId: allocation.studentId,
      recipientRole: 'STUDENT',
      title: 'Hostel Vacated Notice',
      message: `Your room allocation for ${allocation.hostelName} (Room ${allocation.roomNumber}, Bed ${allocation.bedNumber}) has been formally marked as Vacated. Dues ledger preserved.`,
      type: 'HOSTEL_VACATED'
    });

    return sendSuccess(res, `Student successfully vacated. Bed ${allocation.bedNumber} is now AVAILABLE.`, {
      allocation,
      bedStatus: 'AVAILABLE'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Hostel Fee Payments
 * GET /api/warden/payments
 */
export const getHostelPayments = async (req, res, next) => {
  try {
    const applicationsWithPayment = await HostelApplication.find({
      paymentStatus: { $in: ['SUCCESS', 'PAID'] }
    })
      .populate('studentId', 'fullName universityRollNumber course semester mobile email')
      .populate('paymentId')
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Hostel payments ledger retrieved', applicationsWithPayment);
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Hostel Complaints
 * GET /api/warden/complaints
 */
export const getComplaints = async (req, res, next) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { studentName: new RegExp(search.trim(), 'i') },
        { rollNumber: new RegExp(search.trim(), 'i') },
        { subject: new RegExp(search.trim(), 'i') },
        { roomNumber: new RegExp(search.trim(), 'i') }
      ];
    }

    const complaints = await HostelComplaint.find(filter)
      .populate('studentId', 'fullName universityRollNumber mobile profilePhoto')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Hostel complaints fetched', complaints);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Complaint Status & Reply
 * PUT /api/warden/complaints/:id
 */
export const updateComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, wardenRemarks } = req.body;

    const complaint = await HostelComplaint.findById(id);
    if (!complaint) return sendError(res, 'Complaint record not found', 404);

    if (status) complaint.status = status;
    if (wardenRemarks !== undefined) complaint.wardenRemarks = wardenRemarks.trim();
    if (status === 'RESOLVED' || status === 'CLOSED') {
      complaint.resolvedAt = new Date();
    }
    complaint.assignedWarden = req.user.fullName || 'Hostel Warden';

    await complaint.save();

    // Notify student
    await Notification.create({
      recipientId: complaint.studentId,
      recipientRole: 'STUDENT',
      title: `Hostel Complaint Update: ${complaint.status}`,
      message: `Your complaint regarding "${complaint.subject}" has been updated by warden: ${complaint.wardenRemarks || complaint.status}`,
      type: 'HOSTEL_COMPLAINT'
    });

    return sendSuccess(res, 'Complaint updated successfully', complaint);
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Outing / Leave Requests
 * GET /api/warden/outings
 */
export const getOutings = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { studentName: new RegExp(search.trim(), 'i') },
        { rollNumber: new RegExp(search.trim(), 'i') },
        { roomNumber: new RegExp(search.trim(), 'i') }
      ];
    }

    const outings = await HostelLeaveRequest.find(filter)
      .populate('studentId', 'fullName universityRollNumber mobile profilePhoto')
      .sort({ departureDate: -1, createdAt: -1 })
      .lean();

    return sendSuccess(res, 'Outing requests fetched', outings);
  } catch (error) {
    next(error);
  }
};

/**
 * Approve or Reject Outing
 * PUT /api/warden/outings/:id
 */
export const updateOuting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, wardenRemarks } = req.body;

    if (!['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return sendError(res, 'Status must be APPROVED, REJECTED, or COMPLETED', 400);
    }

    const outing = await HostelLeaveRequest.findById(id);
    if (!outing) return sendError(res, 'Outing request not found', 404);

    outing.status = status;
    if (wardenRemarks !== undefined) outing.wardenRemarks = wardenRemarks.trim();
    outing.reviewedBy = req.user.fullName || 'Hostel Warden';
    outing.reviewedAt = new Date();

    if (status === 'COMPLETED') {
      outing.actualReturnDate = new Date();
    }

    await outing.save();

    // Notify student
    await Notification.create({
      recipientId: outing.studentId,
      recipientRole: 'STUDENT',
      title: `Gate Pass / Outing Request ${status}`,
      message: `Your gate pass request for ${new Date(outing.departureDate).toLocaleDateString('en-IN')} has been ${status}. Remarks: ${outing.wardenRemarks || 'None'}`,
      type: 'HOSTEL_OUTING'
    });

    return sendSuccess(res, `Outing request marked as ${status}`, outing);
  } catch (error) {
    next(error);
  }
};

/**
 * 10. Hostel Notices
 * GET /api/warden/notices
 */
export const getNotices = async (req, res, next) => {
  try {
    const notices = await HostelNotice.find().sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 'Hostel notices fetched', notices);
  } catch (error) {
    next(error);
  }
};

/**
 * Publish Hostel Notice
 * POST /api/warden/notices
 */
export const createNotice = async (req, res, next) => {
  try {
    const { title, description, targetAudience, hostelId, targetBlock, targetRoom, category, priority } = req.body;

    if (!title || !description) {
      return sendError(res, 'Notice title and description are required', 400);
    }

    let hostelName = '';
    if (hostelId) {
      const h = await Hostel.findById(hostelId);
      if (h) hostelName = h.hostelName;
    }

    const notice = await HostelNotice.create({
      title: title.trim(),
      description: description.trim(),
      targetAudience: targetAudience || 'ALL_HOSTELS',
      hostelId: hostelId || null,
      hostelName,
      targetBlock: targetBlock ? targetBlock.trim() : '',
      targetRoom: targetRoom ? targetRoom.trim() : '',
      category: category || 'ANNOUNCEMENT',
      priority: priority || 'NORMAL',
      postedBy: {
        name: req.user.fullName || 'Hostel Warden',
        role: 'WARDEN',
        wardenId: req.user._id
      }
    });

    return sendSuccess(res, 'Hostel notice published successfully', notice, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Hostel Notice
 * DELETE /api/warden/notices/:id
 */
export const deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    await HostelNotice.findByIdAndDelete(id);
    return sendSuccess(res, 'Notice deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 11. Occupancy Analytics Report
 * GET /api/warden/reports/occupancy
 */
export const getOccupancyReport = async (req, res, next) => {
  try {
    const { hostelId, block, floor } = req.query;
    const filter = {};

    if (hostelId) filter.hostelId = hostelId;
    if (block) filter.block = block;
    if (floor) filter.floor = floor;

    const [totalBeds, occupied, available, reserved, maintenance] = await Promise.all([
      HostelBed.countDocuments(filter),
      HostelBed.countDocuments({ ...filter, status: 'OCCUPIED' }),
      HostelBed.countDocuments({ ...filter, status: 'AVAILABLE' }),
      HostelBed.countDocuments({ ...filter, status: 'RESERVED' }),
      HostelBed.countDocuments({ ...filter, status: 'MAINTENANCE' })
    ]);

    const occupancyRate = totalBeds > 0 ? Number(((occupied / totalBeds) * 100).toFixed(1)) : 0;

    // Grouping by room
    const beds = await HostelBed.find(filter)
      .populate('occupantStudentId', 'fullName universityRollNumber course semester mobile')
      .sort({ block: 1, floor: 1, roomNumber: 1, bedNumber: 1 })
      .lean();

    const roomMap = {};
    beds.forEach((bed) => {
      const key = `${bed.hostelName} - ${bed.block} - Room ${bed.roomNumber}`;
      if (!roomMap[key]) {
        roomMap[key] = {
          hostelName: bed.hostelName,
          block: bed.block,
          floor: bed.floor,
          roomNumber: bed.roomNumber,
          capacity: bed.roomCapacity || 2,
          roomType: bed.roomType || 'Standard Double',
          totalBeds: 0,
          occupiedBeds: 0,
          availableBeds: 0,
          beds: []
        };
      }
      roomMap[key].totalBeds += 1;
      if (bed.status === 'OCCUPIED') roomMap[key].occupiedBeds += 1;
      if (bed.status === 'AVAILABLE') roomMap[key].availableBeds += 1;
      roomMap[key].beds.push(bed);
    });

    return sendSuccess(res, 'Occupancy report compiled successfully', {
      summary: {
        totalCapacity: totalBeds,
        occupied,
        available,
        reserved,
        maintenance,
        occupancyRate
      },
      roomBreakdown: Object.values(roomMap)
    });
  } catch (error) {
    next(error);
  }
};
