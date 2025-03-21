import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import SafeServiceClient, { SafeCollectibleResponse } from '../src'
import config from './config'

chai.use(chaiAsPromised)

describe('getCollectibles', () => {
  const serviceSdk = new SafeServiceClient(config.baseUrl)

  it('should fail if Safe address is empty', async () => {
    const safeAddress = ''
    await chai
      .expect(serviceSdk.getCollectibles(safeAddress))
      .to.be.rejectedWith('Invalid Safe address')
  })

  it('should fail if Safe address is not checksummed', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'.toLowerCase()
    await chai
      .expect(serviceSdk.getCollectibles(safeAddress))
      .to.be.rejectedWith('Checksum address validation failed')
  })

  it('should return the list of collectibles', async () => {
    const safeAddress = '0xf9A2FAa4E3b140ad42AAE8Cac4958cFf38Ab08fD'
    const safeCollectibleResponse: SafeCollectibleResponse[] = await serviceSdk.getCollectibles(
      safeAddress
    )
    chai.expect(safeCollectibleResponse.length).to.be.equal(2)
    safeCollectibleResponse.map((safeCollectible: SafeCollectibleResponse) => {
      chai.expect(safeCollectible.address).to.be.equal('0x9cf1A34D70261f0594823EFCCeed53C8c639c464')
      chai.expect(safeCollectible.tokenName).to.be.equal('Safe NFTs')
      chai.expect(safeCollectible.metadata.type).to.be.equal('ERC721')
    })
  })
})
