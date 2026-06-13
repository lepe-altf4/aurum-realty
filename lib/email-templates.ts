import 'server-only'

// Templates HTML branded (Unnique / paleta tierra) para emails transaccionales.
// Se renderizan inline (email no soporta CSS externo).

function shell(opts: { eyebrow: string; title: string; bodyHtml: string; ctaText: string; ctaUrl: string; footerNote: string }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5EFE5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#241911;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5EFE5;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E5DDD0;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(36,25,17,0.08);">
        <tr><td style="background:#241911;padding:28px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;"><span style="display:inline-block;width:36px;height:36px;border-radius:10px;background:#B8924A;color:#241911;font-weight:800;font-size:18px;text-align:center;line-height:36px;letter-spacing:0.04em;">U</span></td>
            <td style="vertical-align:middle;padding-left:14px;">
              <div style="color:#F5EFE5;font-size:15px;font-weight:700;letter-spacing:0.02em;">Unnique Negocios Inmobiliarios</div>
              <div style="color:#B8924A;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;margin-top:2px;">CRM</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:44px 44px 8px 44px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#B8924A;">${opts.eyebrow}</div>
          <h1 style="margin:14px 0 0 0;font-size:26px;line-height:1.25;font-weight:700;color:#241911;letter-spacing:-0.01em;">${opts.title}</h1>
        </td></tr>
        <tr><td style="padding:20px 44px 8px 44px;font-size:15px;line-height:1.65;color:#4A3527;">${opts.bodyHtml}</td></tr>
        <tr><td style="padding:28px 44px 8px 44px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="border-radius:10px;background:#241911;">
              <a href="${opts.ctaUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;letter-spacing:0.02em;color:#FFFFFF;text-decoration:none;border-radius:10px;">${opts.ctaText} →</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:24px 44px 8px 44px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8B7355;">¿No funciona el botón? Copiá y pegá este link:</p>
          <p style="margin:6px 0 0 0;font-size:12px;line-height:1.5;color:#B8924A;word-break:break-all;">${opts.ctaUrl}</p>
        </td></tr>
        <tr><td style="padding:32px 44px 0 44px;"><div style="height:1px;background:#E5DDD0;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
        <tr><td style="padding:20px 44px 36px 44px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8B7355;">${opts.footerNote}</p>
          <p style="margin:14px 0 0 0;font-size:11px;line-height:1.5;color:#B8A07A;letter-spacing:0.04em;">Unnique Negocios Inmobiliarios · Diagonal 9 de Julio 43, Piso 4 Of. B, Neuquén Capital</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export function inviteEmailHtml(opts: { name: string; role: string; link: string }) {
  return shell({
    eyebrow: 'Invitación',
    title: 'Te sumamos al equipo',
    bodyHtml: `<p style="margin:0 0 14px 0;">Hola <strong style="color:#241911;">${opts.name}</strong>,</p>
      <p style="margin:0 0 14px 0;">Te invitamos al CRM de <strong style="color:#241911;">Unnique</strong> con el rol de <strong style="color:#241911;">${opts.role}</strong>. Desde acá vas a gestionar leads, propiedades y el pipeline de ventas.</p>
      <p style="margin:0;">Hacé click para definir tu contraseña y entrar.</p>`,
    ctaText: 'Aceptar invitación',
    ctaUrl: opts.link,
    footerNote: 'Si no esperabas esta invitación, ignorá este mensaje — no se creará ninguna cuenta hasta que confirmes el link.',
  })
}

export function resetEmailHtml(opts: { name: string; link: string }) {
  return shell({
    eyebrow: 'Restablecer acceso',
    title: 'Restablecé tu contraseña',
    bodyHtml: `<p style="margin:0 0 14px 0;">Hola${opts.name ? ` <strong style="color:#241911;">${opts.name}</strong>` : ''},</p>
      <p style="margin:0 0 14px 0;">Recibimos un pedido para restablecer tu contraseña del CRM de <strong style="color:#241911;">Unnique</strong>.</p>
      <p style="margin:0;">Hacé click para elegir una nueva. El link vence en 1 hora.</p>`,
    ctaText: 'Crear contraseña nueva',
    ctaUrl: opts.link,
    footerNote: 'Si no pediste esto, ignorá este mensaje: tu contraseña actual sigue funcionando.',
  })
}
