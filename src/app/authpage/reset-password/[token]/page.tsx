'use client'
import { use } from 'react'
import AuthForm from '@/app/authpage/AuthForm'

export default function ResetPasswordPage({ params }:{ params:{ token:string } }){
	// `params` can be a Promise in Next.js client components — unwrap it with `use`.
	// cast to any to satisfy TS for the `use` helper.
	const resolvedParams = use(params as any) as { token: string }

	return <AuthForm mode="reset-password" token={resolvedParams.token} />
}