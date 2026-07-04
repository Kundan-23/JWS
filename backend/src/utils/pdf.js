const fs = require('fs');
const path = require('path');

/**
 * Helper to convert local file to base64 data URI
 */
function getLocalImageBase64(filename) {
  try {
    const filePath = path.join(__dirname, '../../assets', filename);
    const buffer = fs.readFileSync(filePath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error(`Missing asset ${filename}:`, err.message);
    return '';
  }
}

/**
 * Build structured data for ID card PDF generation (done on the frontend via jsPDF).
 *
 * @param {Object} player - Full player row from DB
 * @param {String} signatureUrl - Optional Authorized Signature URL from Admin Config
 * @returns {Object} - Structured data for frontend PDF generation
 */
async function buildIdCardData(player, signatureUrl = null) {
  const name       = `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'GICL Player';
  const giclId     = player.gicl_id || 'N/A';
  const bloodGroup = player.blood_group || 'N/A';
  
  let age = 'N/A';
  if (player.dob) {
    const birthDate = new Date(player.dob);
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff); 
    age = Math.abs(ageDate.getUTCFullYear() - 1970) + ' yrs';
  }

  const emergency  = player.emergency_contact || 'N/A';
  const parentName = player.parent_name || 'N/A';
  const photoUrl   = player.profile_photo_url || '';

  const frontBg = getLocalImageBase64('id_card_front.png');
  const backBg  = getLocalImageBase64('id_card_back.png');

  return {
    frontBg,
    backBg,
    photoUrl,
    signatureUrl: signatureUrl || '',
    name,
    giclId,
    bloodGroup,
    age,
    emergency,
    parentName,
    address: player.address || '',
  };
}

module.exports = { buildIdCardData };
