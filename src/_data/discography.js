// Canonical discography, sourced from the published @tyleretters/discography
// package (the same feed nor.the-rn.info consumes). Exposed to templates as
// `discography`: an array of Release objects. ZOOT reads the FORGOTTEN
// INDUSTRIES mixtape's track URL from here; see src/zoot.njk.
import discography from '@tyleretters/discography'

export default discography
