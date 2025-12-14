import nodemailer from 'nodemailer'
import { logAuditEvent } from './auditLog'


const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || `"AuthSystemPro" <${process.env.SMTP_USER}>`;
const resendKey = process.env.RESEND_API_KEY


const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false,
  requireTLS: true,
  auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  debug: process.env.NODE_ENV !== 'production',
  logger: process.env.NODE_ENV !== 'production'
})


async function sendViaSMTP(to:string, subject:string, html:string){
  if (!smtpUser) throw new Error('SMTP not configured')
  console.log(`[SMTP] Sending email to ${to} with subject "${subject}"...`)
  try {
    const info = await transporter.sendMail({ from: fromEmail, to, subject, html })
    console.log(`[SMTP] Email sent successfully:`, info.messageId)
    return info
  } catch (error) {
    console.error(`[SMTP] Failed to send email to ${to}:`, error)
    await logAuditEvent('EMAIL_DELIVERY_FAILED', undefined, { channel: 'smtp', to, subject, error: error instanceof Error ? error.message : 'unknown' })
    throw error
  }
}


async function sendViaResend(to:string, subject:string, html:string){
  if (!resendKey) throw new Error('Resend API key not configured')
  console.log(`[Resend] Sending email to ${to} with subject "${subject}"...`)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ from: fromEmail, to: [to], subject, html })
  })
  const data = await res.json()
  if (!res.ok) {
    console.error(`[Resend] Failed to send email:`, data)
    await logAuditEvent('EMAIL_DELIVERY_FAILED', undefined, { channel: 'resend', to, subject, error: data?.message || 'unknown' })
    throw new Error(data.message || 'Resend API failed')
  }
  console.log(`[Resend] Email sent successfully:`, data.id)
  return data
}


export async function sendVerificationEmail(email:string, token:string){
const url = `${process.env.NEXT_PUBLIC_APP_URL}/authpage/verify-email/${token}`
const html = `<p>Click <a href="${url}">here</a> to verify your email.</p>`
try{ await sendViaSMTP(email, 'Verify your email', html) }catch{
try{ await sendViaResend(email, 'Verify your email', html) }catch(err){ console.error('send email failed', err); throw err }
}
}


export async function sendOtpEmail(email:string, code:string){
  const html = `<p>Your OTP code is <strong>${code}</strong>. It expires in 10 minutes.</p>`
  console.log(`[Email] Attempting to send OTP to ${email}...`)
  try {
    await sendViaSMTP(email, 'Your OTP code', html)
    console.log(`[Email] OTP sent successfully via SMTP to ${email}`)
  } catch (smtpError) {
    console.error(`[Email] SMTP failed, trying Resend fallback:`, smtpError)
    try {
      await sendViaResend(email, 'Your OTP code', html)
      console.log(`[Email] OTP sent successfully via Resend to ${email}`)
    } catch (resendError) {
      console.error(`[Email] All email delivery methods failed for ${email}:`, resendError)
      throw new Error('Failed to send OTP email')
    }
  }
}


export async function sendResetEmail(email:string, token:string){
const url = `${process.env.NEXT_PUBLIC_APP_URL}/authpage/reset-password/${token}`
const html = `<p>Reset your password: <a href="${url}">Reset password</a></p>`
try{ await sendViaSMTP(email, 'Reset your password', html) }catch{ try{ await sendViaResend(email, 'Reset your password', html) }catch(err){ console.error('send reset failed', err) } }
}