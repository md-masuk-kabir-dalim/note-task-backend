import nodemailer from "nodemailer";
import config from "../../config";
import ApiError from "../../errors/ApiErrors";

const emailSender = async (subject: string, email: string, html: string) => {
  // Never hit real SMTP outside production — avoids spamming real inboxes
  // and rate limits while developing/testing locally.
  if (config.env !== "production") {
    console.log(`[DEV EMAIL SKIPPED] To: ${email} | Subject: ${subject}`);
    return;
  }

  const emailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.emailSender.email,
      pass: config.emailSender.app_pass,
    },
  });

  const mailOptions = {
    from: `"GoFast" <${config.emailSender.email}>`,
    to: email,
    subject,
    html,
  };

  // Send the email
  try {
    await emailTransport.sendMail(mailOptions);
  } catch (error: any) {
    if (error.responseCode === 550) {
      throw new ApiError(400, "Invalid email address or blocked sender");
    }

    if (error.responseCode === 421) {
      throw new ApiError(500, "Service temporarily unavailable");
    }
    throw new ApiError(500, "Error sending email");
  }
};

export default emailSender;
