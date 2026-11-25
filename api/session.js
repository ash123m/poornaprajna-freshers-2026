'use strict';

const {
  STUDENT_COOKIE,
  parseCookies,
  verifyToken,
  sendJson
} = require('./_lib/auth');
const { findByRollNo } = require('./_lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const cookies = parseCookies(req);
    const token = cookies[STUDENT_COOKIE];
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'fresher' || !payload.rollNo) {
      return sendJson(res, 200, { checkedIn: false });
    }

    const record = await findByRollNo(payload.rollNo);
    if (!record) {
      return sendJson(res, 200, { checkedIn: false });
    }

    return sendJson(res, 200, {
      checkedIn: true,
      name: record.full_name,
      firstName: record.first_name
    });
  } catch (err) {
    console.error('Session error:', err);
    return sendJson(res, 500, { ok: false, error: 'Server configuration error.' });
  }
};
