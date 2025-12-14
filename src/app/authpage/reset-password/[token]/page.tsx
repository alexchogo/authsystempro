'use client'
import AuthForm from '@/app/authpage/AuthForm'
export default function ResetPasswordPage({ params }:{ params:{ token:string } }){
return <AuthForm mode="reset-password" token={params.token} />
}