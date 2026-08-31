const announcementModel = require('../models/announcementModel');
const notificationService = require('./notificationService');
const { ApiError } = require('../utils/apiResponse');

async function createAnnouncement(companyId, authorId, payload) {
  const announcement = await announcementModel.create(companyId, { ...payload, authorId });
  await notificationService.notifyAllCompanyUsers(companyId, {
    type: 'announcement',
    title: `New announcement: ${announcement.title}`,
    message: announcement.description.slice(0, 200),
    link: '/dashboard/announcements',
  });
  return announcement;
}

async function listAnnouncements(companyId) {
  return announcementModel.listByCompany(companyId);
}

async function getAnnouncement(companyId, id) {
  const announcement = await announcementModel.findByIdAndCompany(id, companyId);
  if (!announcement) throw new ApiError(404, 'Announcement not found');
  return announcement;
}

async function updateAnnouncement(companyId, id, fields) {
  await getAnnouncement(companyId, id);
  return announcementModel.update(id, companyId, fields);
}

async function deleteAnnouncement(companyId, id) {
  await getAnnouncement(companyId, id);
  await announcementModel.softDelete(id, companyId);
}

module.exports = { createAnnouncement, listAnnouncements, getAnnouncement, updateAnnouncement, deleteAnnouncement };
