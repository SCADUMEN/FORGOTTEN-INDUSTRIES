// Host-header guard for the local-only preview servers (L'Archive private
// preview, inventory-os). They bind to loopback, but a DNS-rebinding page can
// still reach a loopback port under a foreign hostname, so each request's Host
// must name loopback itself. Userinfo in the authority is rejected outright.
function isAllowedHost(hostHeader) {
  if (!hostHeader) return false

  try {
    const authority = new URL(`http://${hostHeader}`)
    return (
      !authority.username &&
      !authority.password &&
      (authority.hostname === '127.0.0.1' || authority.hostname === 'localhost')
    )
  } catch {
    return false
  }
}

module.exports = { isAllowedHost }
