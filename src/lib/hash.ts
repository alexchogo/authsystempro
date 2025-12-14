import bcrypt from 'bcryptjs'
export async function hashPassword(p:string){ return bcrypt.hash(p, 12) }
export async function verifyPassword(p:string, h:string){ return bcrypt.compare(p, h) }