'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function VerifyEmailPage({ params }:{ params:{ token:string } }){
const router = useRouter()
const [status, setStatus] = useState('Verifying your email...')

useEffect(()=>{
(async()=>{
try{
const res = await fetch('/api/auth/verify-email',{method:'POST', body: JSON.stringify({ token: params.token }), headers:{'Content-Type':'application/json'}})
if (res.ok) {
setStatus('Email verified successfully! Redirecting...')
toast.success('Email verified successfully!')
setTimeout(() => router.push('/authpage/signin'), 2000)
} else {
const error = await res.json()
setStatus('Verification failed')
toast.error(error.message || 'Verification failed')
setTimeout(() => router.push('/authpage/signin?verify_failed=1'), 2000)
}
}catch(err){
setStatus('Verification failed')
toast.error('Verification failed')
setTimeout(() => router.push('/authpage/signin?verify_failed=1'), 2000)
}
})()
},[params.token, router])

return <div className="flex items-center justify-center min-h-screen"><div className="p-8 text-center"><div className="text-lg">{status}</div></div></div>
}