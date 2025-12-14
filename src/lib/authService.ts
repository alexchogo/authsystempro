"use client";

export type SignupPayload = { email:string; password:string; fullName:string; username:string; phone:string }
export type SigninPayload = { email:string; password:string }
export type ForgotPayload = { email:string }
export type VerifyOtpPayload = { userId?:string; code:string }

async function post<TReq, TRes>(path: string, body: TReq) {
	const res = await fetch(path, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify(body),
	});

	// Read body once safely; handle non-JSON or empty responses gracefully
	const text = await res.text().catch(() => "");
	let data: unknown = null;
	if (text) {
		try {
			data = JSON.parse(text);
		} catch {
			// Non-JSON response; keep raw text in error path below
		}
	}

	if (!res.ok) {
		const message = (typeof data === 'object' && data && 'message' in (data as Record<string, unknown>))
			? String((data as Record<string, unknown>).message)
			: (text || `Request failed with status ${res.status}`);
		throw new Error(message);
	}

	return data as TRes;
}


export function signup(payload:SignupPayload){ return post<SignupPayload, {ok: boolean; userId: string}>('/api/auth/signup', payload) }
export function signin(payload:SigninPayload){ return post<SigninPayload, {ok: boolean; userId: string}>('/api/auth/signin', payload) }
export function verifyOtp(payload:VerifyOtpPayload){ return post<VerifyOtpPayload, {ok: boolean; token: string}>('/api/auth/verify-otp', payload) }
export function resendOtp(payload:{ userId:string }){ return post('/api/auth/resend-otp', payload) }
export function resendVerification(payload:{ email:string }){ return post('/api/auth/resend-verification', payload) }
export function requestPasswordReset(payload:ForgotPayload){ return post('/api/auth/forgot-password', payload) }
export function validateResetToken(payload:{ token:string }){ return post('/api/auth/validate-reset-token', payload) }
export function resetPassword(payload:{ token:string; password:string }){ return post('/api/auth/reset-password', payload) }
export function logout(payload:{ token?:string }){ return post('/api/logout', payload) }