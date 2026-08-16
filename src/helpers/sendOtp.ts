import generateOtp from "./generateOtp";
import { jwtHelpers } from "../utils/jwtHelpers";
import { OtpModel, OtpType } from "../app/modules/Auth/otp.model";
import emailSender from "./emailSender/emailSender";
import { otpEmail } from "../emails/otpEmail";
import config from "../config";
import ApiError from "../errors/ApiErrors";

interface SendOtpOptions {
  // Only the explicit "resend" button should hard-fail while the cooldown is
  // active. Register/login/forgot-password must never be blocked by it — they
  // silently reuse the still-active code instead of sending another email.
  throwOnCooldown?: boolean;
}

const sendOtp = async (
  email: string,
  type: OtpType,
  fullName: string,
  userId: string,
  access_secret: string,
  access_expires_in: string,
  subject: string,
  options: SendOtpOptions = {}
) => {
  const cooldownSeconds = config.jwt.otp_resend_cooldown_seconds;
  const { throwOnCooldown = false } = options;

  const existingOtp = await OtpModel.findOne({ identifier: email });

  let retryAfterSeconds = 0;
  if (existingOtp) {
    const elapsedSeconds =
      (Date.now() - existingOtp.updatedAt.getTime()) / 1000;
    if (elapsedSeconds < cooldownSeconds) {
      retryAfterSeconds = Math.ceil(cooldownSeconds - elapsedSeconds);
    }
  }

  const withinCooldown = retryAfterSeconds > 0;

  if (withinCooldown && throwOnCooldown) {
    throw new ApiError(429, "Please wait before requesting another OTP", {
      retryAfterSeconds,
    });
  }

  let otp: string;
  let expiry: Date;

  if (withinCooldown && existingOtp) {
    // Still within cooldown but not a hard-fail path (register/login/forgot-
    // password) — reuse the already-sent code instead of emailing another one.
    otp = existingOtp.otpCode;
    expiry = existingOtp.expiresAt;
  } else {
    ({ otp, expiry } = generateOtp());

    await OtpModel.findOneAndUpdate(
      { identifier: email },
      { otpCode: otp, expiresAt: expiry, type, userId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    emailSender(subject, email, otpEmail(fullName, otp));
  }

  // Always visible in dev regardless of which branch ran above — otherwise a
  // reused-within-cooldown code (no new email sent) would never get printed.
  if (config.env !== "production") {
    console.log(`[DEV OTP] ${type} code for ${email}: ${otp}`);
  }

  // Always issue a fresh token/cookie regardless of cooldown state — cheap to
  // regenerate, and guarantees the caller never ends up with a stale cookie.
  const otpToken = jwtHelpers.generateToken(
    { id: userId, email },
    access_secret,
    access_expires_in
  );

  return {
    otpToken,
    cooldownSeconds,
    retryAfterSeconds,
  };
};

export default sendOtp;
