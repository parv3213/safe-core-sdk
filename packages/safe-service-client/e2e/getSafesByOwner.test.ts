import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { OwnerResponse } from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getSafesByOwner', () => {
  const serviceSdk = new SafeServiceClient(config.baseUrl)

  it('should fail if owner address is empty', async () => {
    const ownerAddress = ''
    await chai
      .expect(serviceSdk.getSafesByOwner(ownerAddress))
      .to.be.rejectedWith('Invalid owner address')
  })

  it('should fail if owner address is not checksummed', async () => {
    const ownerAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'.toLowerCase()
    await chai
      .expect(serviceSdk.getSafesByOwner(ownerAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return an empty array if there are no owned Safes', async () => {
    const ownerAddress = '0x0000000000000000000000000000000000000001'
    const ownerResponse: OwnerResponse = await serviceSdk.getSafesByOwner(ownerAddress)
    const { safes } = ownerResponse
    chai.expect(safes.length).to.be.equal(0)
  })

  it('should return the array of owned Safes', async () => {
    const ownerAddress = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
    const ownerResponse: OwnerResponse = await serviceSdk.getSafesByOwner(ownerAddress)
    const { safes } = ownerResponse
    chai.expect(safes.length).to.be.greaterThan(1)
  })
})
