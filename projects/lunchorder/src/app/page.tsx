import { redirect } from 'next/navigation'

// Root page — redirect to dashboard or login
export default function RootPage() {
  redirect('/dashboard')
}
