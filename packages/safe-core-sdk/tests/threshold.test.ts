import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import Safe, { CallTransactionOptionalProps, ContractNetworksConfig } from '../src'
import {
  getFactory,
  getMultiSend,
  getSafeSingleton,
  getSafeWithOwners
} from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('Safe Threshold', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks: ContractNetworksConfig = {
      [chainId]: {
        multiSendAddress: (await getMultiSend()).address,
        safeMasterCopyAddress: (await getSafeSingleton()).address,
        safeProxyFactoryAddress: (await getFactory()).address
      }
    }
    return {
      safe: await getSafeWithOwners([accounts[0].address]),
      accounts,
      contractNetworks
    }
  })

  describe('getThreshold', async () => {
    it('should return the Safe threshold', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(await safeSdk.getThreshold()).to.be.eq(1)
    })
  })

  describe('getChangeThresholdTx', async () => {
    it('should fail if the threshold is bigger than the number of owners', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const newThreshold = 2
      const numOwners = (await safeSdk.getOwners()).length
      chai.expect(newThreshold).to.be.gt(numOwners)
      await chai
        .expect(safeSdk.getChangeThresholdTx(newThreshold))
        .to.be.rejectedWith('Threshold cannot exceed owner count')
    })

    it('should fail if the threshold is not bigger than 0', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const newThreshold = 0
      await chai
        .expect(safeSdk.getChangeThresholdTx(newThreshold))
        .to.be.rejectedWith('Threshold needs to be greater than 0')
    })

    it('should build the transaction with the optional props', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address], 1)
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const newThreshold = 2
      chai.expect(await safeSdk.getThreshold()).to.be.not.eq(newThreshold)
      const options: CallTransactionOptionalProps = {
        baseGas: 111,
        gasPrice: 222,
        gasToken: '0x333',
        refundReceiver: '0x444',
        nonce: 555,
        safeTxGas: 666
      }
      const tx = await safeSdk.getChangeThresholdTx(newThreshold, options)
      chai.expect(tx.data.baseGas).to.be.eq(111)
      chai.expect(tx.data.gasPrice).to.be.eq(222)
      chai.expect(tx.data.gasToken).to.be.eq('0x333')
      chai.expect(tx.data.refundReceiver).to.be.eq('0x444')
      chai.expect(tx.data.nonce).to.be.eq(555)
      chai.expect(tx.data.safeTxGas).to.be.eq(666)
    })

    it('should change the threshold', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address], 1)
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const newThreshold = 2
      chai.expect(await safeSdk.getThreshold()).to.be.not.eq(newThreshold)
      const tx = await safeSdk.getChangeThresholdTx(newThreshold)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk.getThreshold()).to.be.eq(newThreshold)
    })
  })
})
