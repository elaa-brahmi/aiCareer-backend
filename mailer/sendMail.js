const nodemailer = require("nodemailer");
const planExpiredTemplate = require("./emailTemplates/planExpiredTemplate");

const sendPlanExpiredEmail = async (email, firstName, planName) => {
  try {
    const user = process.env.USERMAIL;
    const pass = process.env.APP_PASSWORD;

    const mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const htmlContent = planExpiredTemplate(firstName, planName);

    const mailDetails = {
      from: `"AI Career" <${user}>`,
      to: email,
      subject: "Your Subscription Has Expired",
      html: htmlContent,
    };

    const result = await mailTransporter.sendMail(mailDetails);
    console.log(`Expiration email sent to ${email}`);
    return result;
  } catch (error) {
    console.error("Error sending expiration email:", error.message);
    throw error;
  }
};

module.exports = {
  sendPlanExpiredEmail,
};
