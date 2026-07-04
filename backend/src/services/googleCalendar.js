const { google } = require('googleapis');

// Extract env variables
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : null;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

let calendarAPI = null;

const getCalendar = () => {
  if (!calendarAPI) {
    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL) {
      console.warn("Google Calendar credentials not found in env. Calendar sync is disabled.");
      return null;
    }
    const jwtClient = new google.auth.JWT(
      GOOGLE_CLIENT_EMAIL,
      null,
      GOOGLE_PRIVATE_KEY,
      SCOPES
    );
    calendarAPI = google.calendar({
      version: 'v3',
      auth: jwtClient
    });
  }
  return calendarAPI;
};

/**
 * Inserts a new event into Google Calendar.
 * @param {Object} eventDetails 
 * @param {string} eventDetails.summary - Title of the match
 * @param {string} eventDetails.description - Description
 * @param {string} eventDetails.location - Match location
 * @param {Date} eventDetails.start - Start Date object
 * @param {Date} eventDetails.end - End Date object
 * @returns {Promise<string|null>} Returns the google_event_id, or null if disabled/failed
 */
const insertEvent = async ({ summary, description, location, start, end }) => {
  const calendar = getCalendar();
  if (!calendar || !GOOGLE_CALENDAR_ID) return null;

  try {
    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: start.toISOString(),
      },
      end: {
        dateTime: end.toISOString(),
      },
    };

    const res = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      resource: event,
    });
    return res.data.id;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return null;
  }
};

/**
 * Deletes an event from Google Calendar.
 * @param {string} eventId 
 */
const deleteEvent = async (eventId) => {
  const calendar = getCalendar();
  if (!calendar || !GOOGLE_CALENDAR_ID || !eventId) return;

  try {
    await calendar.events.delete({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: eventId,
    });
  } catch (error) {
    console.error(`Error deleting Google Calendar event ${eventId}:`, error);
  }
};

module.exports = {
  insertEvent,
  deleteEvent
};
