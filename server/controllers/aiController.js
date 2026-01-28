// ========================================
// FILE: server/controllers/aiController.js
// ========================================
const axios = require("axios");
const Event = require("../models/Event");
const Registration = require("../models/Registration");

const GEMINI_MODEL = "gemini-2.5-flash-lite";

const chatWithAssistant = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key missing in backend.",
      });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const userMessage = req.body.message || "";
    const user = req.user || {};

    // ============================
    // 1) BUILD SYSTEM PROMPT
    // ============================
    const systemPrompt = `
You are an AI assistant for a College Event Management System built with MERN.
You help students, coordinators, and HOD with:
- Event information and registration flow
- QR based check-in
- Auditorium (audi) booking and HOD approval
- Roles and responsibilities of Student / Coordinator / HOD

IMPORTANT RULES:
- If the user asks for "my events" or "my registrations", use the data given below in the context.
- If the user asks for "upcoming events", use the events list from the context.
- If something is not in the context (no matching event in database), say you don't see that event in the system instead of guessing.
- Keep replies friendly, short, and simple.

Current user:
- Role: ${user.role || "Guest"}
- Department: ${user.department || "None"}
`;

    // ============================
    // 2) FETCH LIVE DATA FROM DB
    // ============================
    const now = new Date();
    let contextParts = [];

    try {
      // ---- A) Global upcoming events (max 5) ----
      const upcomingEvents = await Event.find({
        date: { $gte: now },
      })
        .sort({ date: 1 })
        .limit(5)
        .select("title date venue department startTime endTime");

      if (upcomingEvents.length > 0) {
        const upcomingText = upcomingEvents
          .map(
            (e) =>
              `• ${e.title} on ${e.date.toDateString()} at ${e.venue} (${e.department}) ` +
              `from ${e.startTime} to ${e.endTime}`
          )
          .join("\n");

        contextParts.push(
          `Upcoming events in the system (max 5):\n${upcomingText}`
        );
      } else {
        contextParts.push("There are currently no upcoming events in the system.");
      }

      // ---- B) Role-specific context ----
      const userId = user._id || user.id; // depending on your protect middleware

      if (user.role === "STUDENT" && userId) {
        // Student's own registrations
        const regs = await Registration.find({ student: userId })
          .populate("event")
          .sort({ registeredAt: -1 });

        const upcomingRegs = regs.filter(
          (r) => r.event && new Date(r.event.date) >= now
        );

        if (upcomingRegs.length > 0) {
          const studentUpcoming = upcomingRegs
            .map(
              (r) =>
                `• ${r.event.title} on ${r.event.date.toDateString()} at ${r.event.venue}`
            )
            .join("\n");

          contextParts.push(
            `This student's upcoming registered events:\n${studentUpcoming}`
          );
        } else {
          contextParts.push(
            "This student has no upcoming registered events in the system."
          );
        }
      }

      if (user.role === "COORDINATOR" && userId) {
        // Coordinator's own upcoming events
        const myEvents = await Event.find({
          createdBy: userId,
          date: { $gte: now },
        })
          .sort({ date: 1 })
          .limit(5);

        if (myEvents.length > 0) {
          const coordEvents = myEvents
            .map(
              (e) =>
                `• ${e.title} on ${e.date.toDateString()} at ${e.venue} (${e.department})`
            )
            .join("\n");

          contextParts.push(
            `Upcoming events created by this coordinator:\n${coordEvents}`
          );
        } else {
          contextParts.push(
            "This coordinator has no upcoming events created in the system."
          );
        }
      }

      // For HOD (or others), we are just using global upcoming events above.
    } catch (dbErr) {
      console.error("AI chat DB context error:", dbErr.message);
      contextParts.push(
        "Note: There was an error fetching some live data from the database, so event list might be incomplete."
      );
    }

    const dbContextText = contextParts.join("\n\n");

    // ============================
    // 3) BUILD GEMINI PAYLOAD
    // ============================
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}

Here is live data from the system (events, registrations, etc.):
${dbContextText}

User question: ${userMessage}
`,
            },
          ],
        },
      ],
    };

    const url = API_URL;

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const aiReply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't understand that.";

    return res.json({
      success: true,
      reply: aiReply,
    });
  } catch (error) {
    console.error("AI chat error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong talking to AI.",
    });
  }
};

module.exports = { chatWithAssistant };
