import { redirect } from 'next/navigation'

// El alta de usuarios es SOLO por invitación (Admin Settings → Equipo).
// La ruta pública de registro queda deshabilitada: cualquier acceso va a login.
export default function RegisterPage() {
  redirect('/login')
}
