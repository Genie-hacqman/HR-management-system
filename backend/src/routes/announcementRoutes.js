const express = require('express');
const announcementController = require('../controllers/announcementController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const companyMiddleware = require('../middleware/companyMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createAnnouncementValidator, updateAnnouncementValidator } = require('../validators/announcementValidators');

const router = express.Router();

router.use(authMiddleware, companyMiddleware);

router.get('/', announcementController.listAnnouncements);
router.get('/:id', announcementController.getAnnouncement);

const canManage = [roleMiddleware('company_admin', 'manager'), permissionMiddleware('announcements:manage')];

router.post('/', canManage, createAnnouncementValidator, validate, announcementController.createAnnouncement);
router.put('/:id', canManage, updateAnnouncementValidator, validate, announcementController.updateAnnouncement);
router.delete('/:id', canManage, announcementController.deleteAnnouncement);

module.exports = router;
