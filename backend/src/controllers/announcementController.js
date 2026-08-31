const announcementService = require('../services/announcementService');
const auditLogModel = require('../models/auditLogModel');
const { ok, created } = require('../utils/apiResponse');

async function createAnnouncement(req, res, next) {
  try {
    const announcement = await announcementService.createAnnouncement(req.companyId, req.user.id, req.body);
    await auditLogModel.record({
      companyId: req.companyId, userId: req.user.id, action: 'announcement.created',
      resource: 'announcements', resourceId: announcement.id, ipAddress: req.ip, newValue: { title: announcement.title },
    });
    return created(res, { announcement }, 'Announcement published');
  } catch (err) {
    return next(err);
  }
}

async function listAnnouncements(req, res, next) {
  try {
    const announcements = await announcementService.listAnnouncements(req.companyId);
    return ok(res, { announcements });
  } catch (err) {
    return next(err);
  }
}

async function getAnnouncement(req, res, next) {
  try {
    const announcement = await announcementService.getAnnouncement(req.companyId, req.params.id);
    return ok(res, { announcement });
  } catch (err) {
    return next(err);
  }
}

async function updateAnnouncement(req, res, next) {
  try {
    const announcement = await announcementService.updateAnnouncement(req.companyId, req.params.id, req.body);
    return ok(res, { announcement }, 'Announcement updated');
  } catch (err) {
    return next(err);
  }
}

async function deleteAnnouncement(req, res, next) {
  try {
    await announcementService.deleteAnnouncement(req.companyId, req.params.id);
    return ok(res, null, 'Announcement removed');
  } catch (err) {
    return next(err);
  }
}

module.exports = { createAnnouncement, listAnnouncements, getAnnouncement, updateAnnouncement, deleteAnnouncement };
