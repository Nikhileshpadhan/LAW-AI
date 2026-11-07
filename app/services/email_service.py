import logging
from typing import Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

    @classmethod
    async def send_verification_email(cls, to_email: str, full_name: str, raw_token: str) -> bool:
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"
        subject = "Verify your LAW AI Chamber Account"
        html_content = f"""
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 25px; background: #0a0a0a; color: #ffffff; border: 1px solid #27272a; border-radius: 12px;">
            <div style="border-bottom: 1px solid #27272a; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin: 0; font-size: 20px;">LAW AI</h2>
                <p style="color: #a1a1aa; font-size: 12px; margin: 4px 0 0 0;">Supreme Court Precedent Analyzer & Legal Intelligence</p>
            </div>
            <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6;">Welcome Counsel {full_name},</p>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                Please verify your email address to access your confidential case chamber, authentic apex precedents, and strategy generator.
            </p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="{verification_url}" style="background: #ffffff; color: #000000; padding: 12px 28px; text-decoration: none; font-weight: bold; font-size: 13px; border-radius: 6px; display: inline-block;">
                    Verify Counsel Credentials
                </a>
            </div>
            <p style="color: #71717a; font-size: 12px; line-height: 1.5;">
                Or copy and paste this verification link into your browser:<br/>
                <a href="{verification_url}" style="color: #d4d4d8;">{verification_url}</a>
            </p>
            <div style="margin-top: 30px; border-top: 1px solid #27272a; padding-top: 15px; color: #52525b; font-size: 11px;">
                This link expires in 24 hours. If you did not create this account, please disregard this email.
            </div>
        </div>
        """
        return await cls._send_email(to_email, full_name, subject, html_content)

    @classmethod
    async def send_password_reset_email(cls, to_email: str, full_name: str, raw_token: str) -> bool:
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        subject = "Reset your LAW AI Chamber Password"
        html_content = f"""
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 25px; background: #0a0a0a; color: #ffffff; border: 1px solid #27272a; border-radius: 12px;">
            <div style="border-bottom: 1px solid #27272a; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin: 0; font-size: 20px;">LAW AI</h2>
                <p style="color: #a1a1aa; font-size: 12px; margin: 4px 0 0 0;">Supreme Court Precedent Analyzer & Legal Intelligence</p>
            </div>
            <p style="color: #e4e4e7; font-size: 14px; line-height: 1.6;">Counsel {full_name},</p>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                A password reset request was received for your LAW AI Chamber account.
            </p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="{reset_url}" style="background: #ffffff; color: #000000; padding: 12px 28px; text-decoration: none; font-weight: bold; font-size: 13px; border-radius: 6px; display: inline-block;">
                    Reset Chamber Password
                </a>
            </div>
            <p style="color: #71717a; font-size: 12px; line-height: 1.5;">
                Or copy and paste this link into your browser:<br/>
                <a href="{reset_url}" style="color: #d4d4d8;">{reset_url}</a>
            </p>
            <div style="margin-top: 30px; border-top: 1px solid #27272a; padding-top: 15px; color: #52525b; font-size: 11px;">
                This link expires in 30 minutes. If you did not initiate this request, no action is required.
            </div>
        </div>
        """
        return await cls._send_email(to_email, full_name, subject, html_content)

    @classmethod
    async def _send_email(cls, to_email: str, full_name: str, subject: str, html_content: str) -> bool:
        if not settings.BREVO_API_KEY:
            logger.warning(
                f"[EMAIL CONSOLE FALLBACK] BREVO_API_KEY not configured.\n"
                f"To: {to_email} ({full_name})\n"
                f"Subject: {subject}\n"
                f"HTML Content:\n{html_content}\n"
            )
            return True

        headers = {
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json"
        }
        payload = {
            "sender": {
                "name": settings.BREVO_SENDER_NAME,
                "email": settings.BREVO_SENDER_EMAIL
            },
            "to": [{"email": to_email, "name": full_name}],
            "subject": subject,
            "htmlContent": html_content
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(cls.BREVO_API_URL, headers=headers, json=payload)
                if res.status_code in (200, 201, 202):
                    logger.info(f"Transactional email '{subject}' sent to {to_email} via Brevo.")
                    return True
                else:
                    logger.error(f"Brevo email sending failed ({res.status_code}): {res.text}")
                    return False
        except Exception as e:
            logger.exception(f"Exception sending email to {to_email} via Brevo: {e}")
            return False
