const express = require('express');
const authRoutes = require('./authRoutes');
const companyRoutes = require('./companyRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/users', require('./userRoutes'));
router.use('/roles', require('./roleRoutes'));
router.use('/permissions', require('./permissionRoutes'));
router.use('/platform', require('./platformRoutes'));
router.use('/departments', require('./departmentRoutes'));
router.use('/positions', require('./positionRoutes'));
router.use('/employees', require('./employeeRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/leave', require('./leaveRoutes'));
router.use('/payroll', require('./payrollRoutes'));
router.use('/recruitment', require('./recruitmentRoutes'));
router.use('/performance', require('./performanceRoutes'));
router.use('/documents', require('./documentRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/announcements', require('./announcementRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/audit-logs', require('./auditLogRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

router.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

module.exports = router;
