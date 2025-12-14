import 'dotenv/config'
import { sendOtpEmail } from '../src/lib/send'

async function main() {
  const to = process.env.TEST_EMAIL_TO || process.env.SMTP_USER
  if (!to) {
    console.error('No recipient found. Set TEST_EMAIL_TO or SMTP_USER env var.')
    process.exit(1)
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  console.log(`[Test] Sending OTP test email to ${to}...`)
  try {
    await sendOtpEmail(to, code)
    console.log('[Test] Email sent successfully.')
    process.exit(0)
  } catch (err) {
    console.error('[Test] Email send failed:', err)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('[Test] Unexpected error:', e)
  process.exit(1)
})
