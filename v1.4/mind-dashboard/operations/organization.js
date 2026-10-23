import { mountOperationsOrganization } from '../operations-organization.js'
const legacy=window.opsOrganizationLegacy
mountOperationsOrganization({anchor:document.querySelector('#operatorMultiFilter'),names:legacy.operatorNames(),state:legacy.state,render:legacy.render})
legacy.render()
